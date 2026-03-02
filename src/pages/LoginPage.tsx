import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";
import { Scale, Eye, EyeOff, AlertCircle } from "lucide-react";

const NAVY = "#19385C";
const GOLD = "#E8B84B";

// ── Emails autorizados (whitelist) ─────────────────────────
const ALLOWED_EMAILS = [
  "mauromoncaoestudos@gmail.com",
  "mauromoncaoadv.escritorio@gmail.com",
];

export default function LoginPage() {
  const [, nav] = useLocation();
  const { login } = useAuth();
  const [email, setEmail]     = useState("");
  const [pwd, setPwd]         = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr]         = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Capturar token Google OAuth vindo da URL ───────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Token JWT retornado pelo callback Google
    const gtoken = params.get("gtoken");
    const gname  = params.get("gname");
    const gemail = params.get("gemail");
    const gid    = params.get("gid");

    if (gtoken && gemail) {
      login(gtoken, {
        id:    Number(gid) || 0,
        name:  gname  || gemail.split("@")[0],
        email: gemail,
        role:  "admin",
      });
      window.history.replaceState({}, "", "/");
      nav("/");
      return;
    }

    // Erros OAuth
    const oauthErr = params.get("error");
    const errorMessages: Record<string, string> = {
      email_not_authorized:  "⛔ E-mail não autorizado. Somente administradores cadastrados.",
      google_denied:         "Login com Google cancelado.",
      google_not_configured: "Google OAuth não configurado no servidor.",
      account_inactive:      "Conta inativa. Contate o administrador.",
      google_token_failed:   "Falha na autenticação Google. Tente novamente.",
      google_internal_error: "Erro interno. Tente novamente.",
    };
    if (oauthErr && errorMessages[oauthErr]) {
      setErr(errorMessages[oauthErr]);
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const loginMut = trpc.auth.login.useMutation({
    onSuccess: (d: any) => { login(d.token, d.user); nav("/"); },
    onError:   (e: any) => setErr(e.message ?? "Credenciais inválidas"),
  });

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setErr("");

    // Validar whitelist antes de tentar login
    if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
      setErr("⛔ Acesso não autorizado para este e-mail.");
      return;
    }

    if (!email || !pwd) return setErr("Preencha e-mail e senha");
    loginMut.mutate({ email, password: pwd });
  };

  // ── Google OAuth ──────────────────────────────────────────
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    window.location.href = "/api/auth/google";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg,#07182e,${NAVY})` }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: GOLD }}>
              <Scale className="w-6 h-6" style={{ color: NAVY }} />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-lg leading-tight">Soluções Jurídicas</p>
              <p className="text-white/50 text-sm">Painel Administrativo</p>
            </div>
          </div>
          <h1 className="font-serif text-2xl font-bold text-white mb-1">Acesso restrito</h1>
          <p className="text-white/55 text-sm">Entre com suas credenciais para continuar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl space-y-5">

          {/* Erro */}
          {err && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {err}
            </div>
          )}

          {/* ── Botão Google ──────────────────────────────── */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold text-gray-700 shadow-sm disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? "Redirecionando…" : "Entrar com Google"}
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">ou com e-mail e senha</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ── Formulário e-mail/senha ───────────────────── */}
          <form onSubmit={submit} className="space-y-5">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@mauromoncao.adv.br"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className="form-input pr-10"
                  placeholder="••••••••"
                  value={pwd}
                  onChange={e => setPwd(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loginMut.isPending}
              className="btn btn-gold w-full justify-center text-base py-3"
            >
              {loginMut.isPending ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Mauro Monção Advogados Associados · Acesso exclusivo para administradores
        </p>
        <p className="text-center text-white/20 text-xs mt-1">
          Login Google disponível somente para e-mails cadastrados
        </p>
      </div>
    </div>
  );
}
