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
  email_verified?: boolean;
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
  confirmEmail: (tokenHash: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
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

  // Check localStorage for existing session and wallet on mount
  useEffect(() => {
    try {
      // Restore user session
      const storedUser = localStorage.getItem("crowdpay_user");
      const storedSession = localStorage.getItem("crowdpay_session");

      if (storedUser && storedSession) {
        const parsedUser = JSON.parse(storedUser);
        const parsedSession = JSON.parse(storedSession);
        setUser(parsedUser);
        setSession(parsedSession);
      }

      // Restore wallet data
      const storedWallet = localStorage.getItem("crowdpay_wallet");
      if (storedWallet) {
        const parsedWallet = JSON.parse(storedWallet);
        setWalletState(parsedWallet);
      }
    } catch (error) {
      console.error("Error restoring session:", error);
      // Clear corrupted data
      localStorage.removeItem("crowdpay_user");
      localStorage.removeItem("crowdpay_session");
      localStorage.removeItem("crowdpay_wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  // Custom setWallet that also persists to localStorage
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

    // If signup returned a session directly (no email confirmation required), use it
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
    } else {
      // Email confirmation required - sign in after signup
      await signIn(email, password);
    }
  };

  // Allow the user to sign in before confirming their email, but mark them as unconfirmed
  const confirmEmail = async (tokenHash: string) => {
    const response = await fetch(`${API_URL}/api/auth/confirm-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token_hash: tokenHash }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Email confirmation failed");
    }

    // Update user's email_verified status if logged in
    if (user) {
      const updatedUser = { ...user, email_verified: true };
      setUser(updatedUser);
      localStorage.setItem("crowdpay_user", JSON.stringify(updatedUser));
    }
  };

  //  REsend verification email
  const resendVerificationEmail = async (email: string) => {
    const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to resend verification email");
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
        confirmEmail,
        resendVerificationEmail,
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
