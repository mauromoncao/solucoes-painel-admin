import { Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { trpc, createTRPCClient } from "./lib/trpc";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AdminLayout from "./pages/AdminLayout";
import LoginPage    from "./pages/LoginPage";
import Dashboard    from "./pages/Dashboard";
import PagesAdmin   from "./pages/PagesAdmin";
import PageEditor   from "./pages/PageEditor";
import VideosAdmin  from "./pages/VideosAdmin";
import MediaAdmin   from "./pages/MediaAdmin";
import LeadsAdmin   from "./pages/LeadsAdmin";
import SettingsAdmin from "./pages/SettingsAdmin";

function SetupPage() {
  const [, nav] = (window as any).__wouter ?? [null, (p: string) => { window.location.href = p; }];
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const setupMut = trpc.auth.setup.useMutation({
    onSuccess: (d: any) => { login(d.token, d.user); window.location.href = "/"; },
    onError: (e: any) => setErr(e.message),
  });
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (form.password !== form.confirm) return setErr("Senhas não coincidem");
    setupMut.mutate({ name: form.name, email: form.email, password: form.password });
  };
  const NAVY = "#19385C", GOLD = "#E8B84B";
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg,#07182e,${NAVY})` }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl font-bold text-white mb-2">Configuração inicial</h1>
          <p className="text-white/55 text-sm">Crie o primeiro administrador do painel</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {err && <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-5 text-sm text-red-700">{err}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div className="form-group"><label className="form-label">Nome completo</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">E-mail</label><input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Senha</label><input type="password" className="form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Confirmar senha</label><input type="password" className="form-input" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} /></div>
            <button type="submit" disabled={setupMut.isPending} className="btn btn-gold w-full justify-center py-3">
              {setupMut.isPending ? "Criando..." : "Criar administrador"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "#E8B84B", borderTopColor: "transparent" }} />
    </div>
  );
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { data: setup } = trpc.auth.needsSetup.useQuery();
  if (setup?.needsSetup) return <SetupPage />;
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <ProtectedRoute>
          <AdminLayout>
            <Switch>
              <Route path="/"                  component={Dashboard} />
              <Route path="/paginas"           component={PagesAdmin} />
              <Route path="/paginas/:id"       component={PageEditor} />
              <Route path="/videos"            component={VideosAdmin} />
              <Route path="/midia"             component={MediaAdmin} />
              <Route path="/leads"             component={LeadsAdmin} />
              <Route path="/configuracoes"     component={SettingsAdmin} />
              <Route><Redirect to="/" /></Route>
            </Switch>
          </AdminLayout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
  const [trpcClient]  = useState(() => createTRPCClient());
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
