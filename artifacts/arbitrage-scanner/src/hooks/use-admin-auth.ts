import { useState, useCallback } from "react";

const TOKEN_KEY = "arbitrage_admin_token";

export function useAdminAuth() {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const saveToken = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setTokenState(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
  }, []);

  const authHeader = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return { token, isAuthenticated: !!token, saveToken, logout, authHeader };
}
