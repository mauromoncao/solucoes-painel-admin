import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "../lib/trpc";

interface AuthUser { id: number; name: string; email: string; role: string; }
interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("sp_token"));
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
    onSuccess: (u: any) => { setUser(u); setLoading(false); },
    onError: ()  => { logout(); setLoading(false); },
  });

  useEffect(() => { if (!token) setLoading(false); }, [token]);

  const login = (t: string, u: AuthUser) => {
    localStorage.setItem("sp_token", t);
    setToken(t);
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("sp_token");
    setToken(null);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, token, login, logout, loading }}>{children}</Ctx.Provider>;
}
