import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useAuth } from "../contexts/AuthContext";
import { Scale, Eye, EyeOff, AlertCircle } from "lucide-react";

const NAVY = "#19385C";
const GOLD = "#E8B84B";

export default function LoginPage() {
  const [, nav] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pwd, setPwd]     = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr]     = useState("");

  const loginMut = trpc.auth.login.useMutation({
    onSuccess: (d: any) => { login(d.token, d.user); nav("/"); },
    onError:   (e: any) => setErr(e.message ?? "Credenciais inválidas"),
  });

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setErr("");
    if (!email || !pwd) return setErr("Preencha e-mail e senha");
    loginMut.mutate({ email, password: pwd });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg,#07182e,${NAVY})` }}>
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

        {/* Form */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {err && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {err}
            </div>
          )}
          <form onSubmit={submit} className="space-y-5">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input type="email" className="form-input" placeholder="admin@mauromoncao.adv.br"
                value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} className="form-input pr-10"
                  placeholder="••••••••" value={pwd} onChange={e => setPwd(e.target.value)} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loginMut.isPending}
              className="btn btn-gold w-full justify-center text-base py-3">
              {loginMut.isPending ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
        <p className="text-center text-white/30 text-xs mt-6">
          Mauro Monção Advogados Associados · Acesso exclusivo para administradores
        </p>
      </div>
    </div>
  );
}
