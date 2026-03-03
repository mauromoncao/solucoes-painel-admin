import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

// Busca o usuário atual pelo token no localStorage (fetch direto, sem tRPC)
async function fetchMe(): Promise<{ user: AuthUser | null; token: string | null }> {
  const token = localStorage.getItem("sp_token");
  if (!token) return { user: null, token: null };
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (!res.ok) return { user: null, token: null };
    const json = await res.json();
    // Suporta dois formatos: {id,name,...} ou {result:{data:{json:{...}}}}
    const data = json?.result?.data?.json ?? json;
    if (data?.id) return { user: data as AuthUser, token };
    return { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe().then(({ user: u, token: t }) => {
      setUser(u);
      setToken(t);
      setLoading(false);
    });
  }, []);

  const login = (t: string, u: AuthUser) => {
    localStorage.setItem("sp_token", t);
    setToken(t);
    setUser(u);
  };

  const logout = async () => {
    try {
      const t = localStorage.getItem("sp_token");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        credentials: "include",
      });
    } catch {
      // ignora
    }
    localStorage.removeItem("sp_token");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return <Ctx.Provider value={{ user, token, login, logout, loading }}>{children}</Ctx.Provider>;
}
