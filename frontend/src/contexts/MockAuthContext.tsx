import { createContext, useContext, useState, useEffect } from "react";

interface WalletData {
  lightningAddress: string;
  onchainAddress: string;
  walletType: "blink" | "external" | null;
  btcBalance: number;
}

interface MockUser {
  id: string;
  email: string;
  username?: string;
}

interface AuthContextType {
  user: MockUser | null;
  session: any;
  loading: boolean;
  wallet: WalletData;
  setWallet: (wallet: WalletData) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultWallet: WalletData = {
  lightningAddress: "demo@crowdpay.me",
  onchainAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  walletType: "blink",
  btcBalance: 0.0234,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWalletState] = useState<WalletData>(defaultWallet);

  // Check localStorage for existing session and wallet on mount
  useEffect(() => {
    try {
      // Restore user session
      const storedUser = localStorage.getItem("crowdpay_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }

      // Restore wallet data
      const storedWallet = localStorage.getItem("crowdpay_wallet");
      if (storedWallet) {
        const parsedWallet = JSON.parse(storedWallet);
        setWalletState(parsedWallet);
      } else {
        // If no stored wallet, save default wallet
        localStorage.setItem("crowdpay_wallet", JSON.stringify(defaultWallet));
      }
    } catch (error) {
      console.error("Error restoring session:", error);
      // Clear corrupted data
      localStorage.removeItem("crowdpay_user");
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
    const mockUser = { 
      id: "mock-user-id", 
      email,
      username: email.split("@")[0]
    };
    setUser(mockUser);
    try {
      localStorage.setItem("crowdpay_user", JSON.stringify(mockUser));
      // Also save session timestamp for future use
      localStorage.setItem("crowdpay_session_timestamp", Date.now().toString());
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const mockUser = { 
      id: "mock-user-id", 
      email,
      username
    };
    setUser(mockUser);
    try {
      localStorage.setItem("crowdpay_user", JSON.stringify(mockUser));
      localStorage.setItem("crowdpay_session_timestamp", Date.now().toString());
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const signOut = async () => {
    setUser(null);
    try {
      localStorage.removeItem("crowdpay_user");
      localStorage.removeItem("crowdpay_session_timestamp");
      // Optionally clear wallet on sign out, or keep it
      // localStorage.removeItem("crowdpay_wallet");
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: user ? {} : null, 
      loading, 
      wallet, 
      setWallet, 
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a MockAuthProvider");
  }
  return context;
};
