import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FileText, Video, Image, MousePointerClick,
  Settings, LogOut, Menu, X, Users, ChevronRight, Play
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const NAVY = "#19385C";
const GOLD = "#E8B84B";

const nav = [
  { href: "/",           icon: LayoutDashboard, label: "Dashboard" },
  { href: "/paginas",    icon: FileText,         label: "Páginas de Soluções" },
  { href: "/videos",     icon: Video,            label: "Vídeos" },
  { href: "/midia",      icon: Image,            label: "Mídia" },
  { href: "/leads",      icon: Users,            label: "Leads" },
  { href: "/configuracoes", icon: Settings,      label: "Configurações" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loc] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* Overlay mobile */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GOLD }}>
              <Play className="w-4 h-4" style={{ color: NAVY }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Soluções Jurídicas</p>
              <p className="text-white/50 text-xs">Painel Administrativo</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? loc === "/" : loc.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`sidebar-link ${active ? "active" : ""}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: GOLD, color: NAVY }}>
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-white/45 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="btn-icon text-white/40 hover:text-red-400">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content flex-1">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-6 h-14">
          <button className="md:hidden btn-icon" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold" style={{ color: NAVY }}>Soluções Jurídicas</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{nav.find(n => n.href === "/" ? loc === "/" : loc.startsWith(n.href))?.label ?? "Painel"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-slate-500">Olá, <strong style={{ color: NAVY }}>{user?.name}</strong></span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
