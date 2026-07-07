import { createContext, useContext, useState, type ReactNode } from "react";

import { apiClient, tokenStorage } from "../../api/client";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!tokenStorage.getAccess());

  async function login(username: string, password: string) {
    const { data } = await apiClient.post("/auth/token/", { username, password });
    tokenStorage.set(data.access, data.refresh);
    setIsAuthenticated(true);
  }

  function logout() {
    tokenStorage.clear();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
