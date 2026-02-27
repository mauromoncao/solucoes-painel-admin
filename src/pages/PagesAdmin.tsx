import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "../lib/trpc";
import { Plus, Search, Edit, Eye, Copy, Archive, Trash2, Video, CheckCircle, Clock, Globe } from "lucide-react";
import { toast } from "sonner";

const NAVY = "#19385C";
const GOLD = "#E8B84B";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  published: { label: "Publicada",  cls: "badge-published" },
  draft:     { label: "Rascunho",   cls: "badge-draft"     },
  archived:  { label: "Arquivada",  cls: "badge-archived"  },
};

export default function PagesAdmin() {
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");
  const [hasVideo, setHasVideo] = useState<boolean | undefined>();
  const utils = trpc.useUtils();

  const { data: pages = [], isLoading } = trpc.pages.list.useQuery({ search: search || undefined, status: status || undefined, hasVideo });

  const publishMut   = trpc.pages.publish.useMutation({   onSuccess: () => { utils.pages.list.invalidate(); toast.success("Publicada!"); } });
  const unpubMut     = trpc.pages.unpublish.useMutation({ onSuccess: () => { utils.pages.list.invalidate(); toast.success("Despublicada"); } });
  const archiveMut   = trpc.pages.archive.useMutation({   onSuccess: () => { utils.pages.list.invalidate(); toast.success("Arquivada"); } });
  const dupMut       = trpc.pages.duplicate.useMutation({ onSuccess: () => { utils.pages.list.invalidate(); toast.success("Duplicada com sucesso!"); } });
  const deleteMut    = trpc.pages.delete.useMutation({    onSuccess: () => { utils.pages.list.invalidate(); toast.success("Excluída"); } });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: NAVY }}>Páginas de Soluções</h1>
          <p className="text-slate-500 text-sm mt-1">{pages.length} página{pages.length !== 1 ? "s" : ""} cadastrada{pages.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/paginas/novo" className="btn btn-gold">
          <Plus className="w-4 h-4" /> Nova Página
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="form-input pl-9" placeholder="Buscar por título ou slug..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input form-select w-44" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="published">Publicadas</option>
          <option value="draft">Rascunhos</option>
          <option value="archived">Arquivadas</option>
        </select>
        <select className="form-input form-select w-52" value={hasVideo === undefined ? "" : String(hasVideo)}
          onChange={e => setHasVideo(e.target.value === "" ? undefined : e.target.value === "true")}>
          <option value="">Com e sem vídeo</option>
          <option value="true">Com vídeo vinculado</option>
          <option value="false">Sem vídeo</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Carregando...</div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma página encontrada</p>
            <p className="text-slate-400 text-sm mb-4">Crie sua primeira landing page de solução jurídica</p>
            <Link href="/paginas/novo" className="btn btn-gold btn-sm">
              <Plus className="w-4 h-4" /> Nova Página
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Título / Slug</th>
                  <th>Status</th>
                  <th>Vídeo</th>
                  <th>Atualizado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page: any) => {
                  const s = STATUS_LABELS[page.status] ?? { label: page.status, cls: "badge-archived" };
                  return (
                    <tr key={page.id}>
                      <td>
                        <p className="font-semibold text-slate-800">{page.title}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">/{page.slug}</p>
                      </td>
                      <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                      <td>
                        {page.videoId
                          ? <span className="flex items-center gap-1 text-xs text-purple-600 font-semibold"><Video className="w-3.5 h-3.5" /> Vinculado</span>
                          : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="text-slate-500 text-xs">{new Date(page.updatedAt).toLocaleDateString("pt-BR")}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link href={`/paginas/${page.id}`} className="btn-icon" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button className="btn-icon" title="Duplicar" onClick={() => dupMut.mutate(page.id)}>
                            <Copy className="w-4 h-4" />
                          </button>
                          {page.status !== "published"
                            ? <button className="btn-icon text-green-600" title="Publicar" onClick={() => publishMut.mutate(page.id)}>
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            : <button className="btn-icon text-yellow-600" title="Despublicar" onClick={() => unpubMut.mutate(page.id)}>
                                <Clock className="w-4 h-4" />
                              </button>}
                          <button className="btn-icon text-slate-400" title="Arquivar" onClick={() => archiveMut.mutate(page.id)}>
                            <Archive className="w-4 h-4" />
                          </button>
                          <button className="btn-icon text-red-400" title="Excluir"
                            onClick={() => { if (confirm(`Excluir "${page.title}"?`)) deleteMut.mutate(page.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
