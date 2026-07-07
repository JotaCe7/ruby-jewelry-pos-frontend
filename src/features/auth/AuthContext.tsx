import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { apiClient, tokenStorage } from "../../api/client";

interface CurrentUser {
  username: string;
  isAdmin: boolean;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!tokenStorage.getAccess());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      return;
    }
    apiClient
      .get("/auth/me/")
      .then(({ data }) => setCurrentUser({ username: data.username, isAdmin: data.is_admin }))
      .catch(() => setCurrentUser(null));
  }, [isAuthenticated]);

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
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
