import { createContext, useContext, useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface WalletData {
  lightningAddress: string;
  onchainAddress: string;
  walletType: "blink" | "external" | null;
  btcBalance: number;
}

interface User {
  id: string;
  email: string;
  username?: string;
}

interface Session {
  access_token: string;
  refresh_token?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  wallet: WalletData | null;
  setWallet: (wallet: WalletData) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
}

const defaultWallet: WalletData = {
  lightningAddress: "",
  onchainAddress: "",
  walletType: null,
  btcBalance: 0,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWalletState] = useState<WalletData | null>(null);

  // ── Token refresh helper ──
  const tryRefreshToken = async (refreshToken: string): Promise<Session | null> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      const newSession: Session = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
      localStorage.setItem("crowdpay_session", JSON.stringify(newSession));
      if (data.session.expires_at) {
        localStorage.setItem("crowdpay_session_expires_at", String(data.session.expires_at));
      }
      return newSession;
    } catch {
      return null;
    }
  };

  // Exposed refresh — can be called from any component before protected API calls
  const refreshSession = async (): Promise<Session | null> => {
    const stored = localStorage.getItem("crowdpay_session");
    if (!stored) return null;
    const parsed: Session = JSON.parse(stored);
    if (!parsed.refresh_token) return null;
    const refreshed = await tryRefreshToken(parsed.refresh_token);
    if (refreshed) setSession(refreshed);
    return refreshed;
  };

  // Check localStorage for existing session and wallet on mount
  useEffect(() => {
    const restore = async () => {
      try {
        const storedUser = localStorage.getItem("crowdpay_user");
        const storedSession = localStorage.getItem("crowdpay_session");

        if (storedUser && storedSession) {
          const parsedUser: User = JSON.parse(storedUser);
          let parsedSession: Session = JSON.parse(storedSession);

          // Refresh if token is expired or within 5 minutes of expiry
          const expiresAt = localStorage.getItem("crowdpay_session_expires_at");
          const nowSeconds = Math.floor(Date.now() / 1000);
          const isExpiredOrSoon = expiresAt && Number(expiresAt) - nowSeconds < 300;

          if (isExpiredOrSoon && parsedSession.refresh_token) {
            const refreshed = await tryRefreshToken(parsedSession.refresh_token);
            if (refreshed) parsedSession = refreshed;
          }

          setUser(parsedUser);
          setSession(parsedSession);
        }

        const storedWallet = localStorage.getItem("crowdpay_wallet");
        if (storedWallet) {
          setWalletState(JSON.parse(storedWallet));
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        localStorage.removeItem("crowdpay_user");
        localStorage.removeItem("crowdpay_session");
        localStorage.removeItem("crowdpay_session_expires_at");
        localStorage.removeItem("crowdpay_wallet");
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  const setWallet = (newWallet: WalletData) => {
    setWalletState(newWallet);
    try {
      localStorage.setItem("crowdpay_wallet", JSON.stringify(newWallet));
    } catch (error) {
      console.error("Error saving wallet:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Sign in failed");
    }

    const userData: User = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.username || email.split("@")[0],
    };

    const sessionData: Session = {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    };

    setUser(userData);
    setSession(sessionData);

    localStorage.setItem("crowdpay_user", JSON.stringify(userData));
    localStorage.setItem("crowdpay_session", JSON.stringify(sessionData));
    localStorage.setItem("crowdpay_session_timestamp", Date.now().toString());
    if (data.session?.expires_at) {
      localStorage.setItem("crowdpay_session_expires_at", String(data.session.expires_at));
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        username,
        password_confirmation: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Sign up failed");
    }

    if (data.session?.access_token) {
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username || username,
      };

      const sessionData: Session = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };

      setUser(userData);
      setSession(sessionData);

      localStorage.setItem("crowdpay_user", JSON.stringify(userData));
      localStorage.setItem("crowdpay_session", JSON.stringify(sessionData));
      localStorage.setItem("crowdpay_session_timestamp", Date.now().toString());
      if (data.session?.expires_at) {
        localStorage.setItem("crowdpay_session_expires_at", String(data.session.expires_at));
      }
    } else {
      await signIn(email, password);
    }
  };

  const signOut = async () => {
    try {
      if (session?.access_token) {
        await fetch(`${API_URL}/api/auth/signout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
      setSession(null);
      setWalletState(defaultWallet);
      localStorage.removeItem("crowdpay_user");
      localStorage.removeItem("crowdpay_session");
      localStorage.removeItem("crowdpay_session_timestamp");
      localStorage.removeItem("crowdpay_session_expires_at");
      localStorage.removeItem("crowdpay_wallet");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        wallet,
        setWallet,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Keep backward-compatible export
export const MockAuthProvider = AuthProvider;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
