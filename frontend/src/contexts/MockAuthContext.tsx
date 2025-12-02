import { createContext, useContext, useState } from "react";

interface MockUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: MockUser | null;
  session: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user] = useState<MockUser>({ 
    id: "mock-user-id", 
    email: "demo@crowdpay.me" 
  });
  const [loading] = useState(false);

  const signOut = async () => {
    // Mock sign out
  };

  return (
    <AuthContext.Provider value={{ user, session: {}, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return { user: { id: "mock-user-id", email: "demo@crowdpay.me" }, session: {}, loading: false, signOut: async () => {} };
  }
  return context;
};
