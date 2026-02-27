import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Users, Mail, Phone, MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";
const NAVY = "#19385C";
const STATUS_COLORS: Record<string, string> = { new: "badge-published", contacted: "badge-draft", converted: "bg-purple-100 text-purple-700", archived: "badge-archived" };
const STATUS_LABELS: Record<string, string> = { new: "Novo", contacted: "Contactado", converted: "Convertido", archived: "Arquivado" };
export default function LeadsAdmin() {
  const utils = trpc.useUtils();
  const { data: leads = [], isLoading } = trpc.leads.list.useQuery();
  const updateMut = trpc.leads.updateStatus.useMutation({ onSuccess: () => { utils.leads.list.invalidate(); toast.success("Status atualizado"); } });
  if (isLoading) return <div className="flex items-center justify-center h-32 text-slate-400">Carregando...</div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-serif text-2xl font-bold" style={{ color: NAVY }}>Leads captados</h1><p className="text-slate-500 text-sm mt-1">{(leads as any[]).length} lead{(leads as any[]).length !== 1 ? "s" : ""}</p></div>
      </div>
      {(leads as any[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-16"><Users className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400">Nenhum lead ainda</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead><tr><th>Nome</th><th>Contato</th><th>Página</th><th>Mensagem</th><th>Status</th><th>Data</th></tr></thead>
              <tbody>
                {(leads as any[]).map((l: any) => (
                  <tr key={l.id}>
                    <td className="font-semibold text-slate-800">{l.name}</td>
                    <td>
                      {l.email && <p className="flex items-center gap-1 text-xs text-slate-600"><Mail className="w-3 h-3" />{l.email}</p>}
                      {l.phone && <p className="flex items-center gap-1 text-xs text-slate-600 mt-0.5"><Phone className="w-3 h-3" />{l.phone}</p>}
                    </td>
                    <td className="text-xs text-slate-400 font-mono">{l.pageSlug ?? "—"}</td>
                    <td className="text-xs text-slate-500 max-w-xs truncate">{l.message ?? "—"}</td>
                    <td>
                      <select className={`badge cursor-pointer border-0 outline-none ${STATUS_COLORS[l.status] ?? "badge-archived"}`}
                        value={l.status} onChange={e => updateMut.mutate({ id: l.id, status: e.target.value })}>
                        {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td className="text-xs text-slate-400">{new Date(l.createdAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
