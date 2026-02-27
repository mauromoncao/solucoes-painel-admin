import { Link } from "wouter";
import { trpc } from "../lib/trpc";
import { FileText, Video, Image, Users, TrendingUp, Plus, ArrowRight, CheckCircle, Clock, Archive } from "lucide-react";

const NAVY = "#19385C";
const GOLD = "#E8B84B";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const cards = [
    { label: "Total de Páginas",   value: stats?.totalPages,  icon: FileText,   color: NAVY,    bg: "#e8f0fa" },
    { label: "Publicadas",         value: stats?.published,   icon: CheckCircle,color: "#16a34a",bg: "#dcfce7" },
    { label: "Rascunhos",          value: stats?.draft,       icon: Clock,      color: "#d97706",bg: "#fef3c7" },
    { label: "Arquivadas",         value: stats?.archived,    icon: Archive,    color: "#64748b",bg: "#f1f5f9" },
    { label: "Vídeos cadastrados", value: stats?.totalVideos, icon: Video,      color: "#7c3aed",bg: "#ede9fe" },
    { label: "Arquivos de mídia",  value: stats?.totalMedia,  icon: Image,      color: "#0891b2",bg: "#e0f2fe" },
    { label: "Leads captados",     value: stats?.totalLeads,  icon: Users,      color: NAVY,    bg: "#e8f0fa" },
    { label: "Leads novos",        value: stats?.newLeads,    icon: TrendingUp, color: "#16a34a",bg: "#dcfce7" },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD, borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: NAVY }}>Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Visão geral das Soluções Jurídicas</p>
        </div>
        <Link href="/paginas/novo" className="btn btn-gold">
          <Plus className="w-4 h-4" /> Nova Página
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{value ?? 0}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 className="font-semibold text-sm text-slate-700 mb-4 uppercase tracking-wider">Ações rápidas</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { href: "/paginas/novo",  label: "Criar nova página",        icon: FileText, desc: "Landing page de solução jurídica" },
            { href: "/videos",        label: "Gerenciar vídeos",         icon: Video,    desc: "Vincular vídeos às páginas" },
            { href: "/paginas",       label: "Ver todas as páginas",     icon: ArrowRight, desc: "Editar, publicar ou arquivar" },
          ].map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e8f0fa" }}>
                <Icon className="w-5 h-5" style={{ color: NAVY }} />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800 group-hover:text-blue-700">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
