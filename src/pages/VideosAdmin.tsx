import { useState } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Video, Youtube, ExternalLink, X, Save, CheckCircle } from "lucide-react";

const NAVY = "#19385C";
const GOLD = "#E8B84B";

const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  youtube:  { label: "YouTube",  color: "#dc2626", bg: "#fee2e2" },
  vimeo:    { label: "Vimeo",    color: "#1a56db", bg: "#e1effe" },
  external: { label: "Externo",  color: "#0891b2", bg: "#e0f2fe" },
  embed:    { label: "Embed",    color: "#7c3aed", bg: "#ede9fe" },
};

const POS_LABELS: Record<string, string> = {
  hero:        "Topo / Hero",
  after_hero:  "Após Hero",
  middle:      "Meio",
  before_cta:  "Antes do CTA",
  before_form: "Antes do Formulário",
  custom:      "Personalizado",
};

const EMPTY_FORM = {
  title: "", description: "", source: "youtube" as "youtube"|"vimeo"|"external"|"embed",
  url: "", embedCode: "", thumbnail: "", duration: "",
  position: "after_hero" as any, ctaText: "", ctaUrl: "", supportText: "", isActive: true,
};

function getEmbedUrl(source: string, url: string): string | null {
  if (source === "youtube") {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&\s?]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  }
  if (source === "vimeo") {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  return url || null;
}

export default function VideosAdmin() {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | undefined>();
  const [preview, setPreview] = useState<any | null>(null);
  const utils = trpc.useUtils();

  const { data: videos = [], isLoading } = trpc.videos.list.useQuery();
  const saveMut   = trpc.videos.save.useMutation({
    onSuccess: () => { toast.success("Vídeo salvo!"); utils.videos.list.invalidate(); setModal(false); setForm(EMPTY_FORM); setEditId(undefined); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.videos.delete.useMutation({
    onSuccess: () => { toast.success("Vídeo excluído"); utils.videos.list.invalidate(); },
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const openNew  = () => { setForm(EMPTY_FORM); setEditId(undefined); setModal(true); };
  const openEdit = (v: any) => {
    setForm({ title: v.title, description: v.description ?? "", source: v.source, url: v.url,
      embedCode: v.embedCode ?? "", thumbnail: v.thumbnail ?? "", duration: v.duration ?? "",
      position: v.position, ctaText: v.ctaText ?? "", ctaUrl: v.ctaUrl ?? "",
      supportText: v.supportText ?? "", isActive: v.isActive });
    setEditId(v.id);
    setModal(true);
  };

  const handleSave = () => {
    if (!form.title || !form.url) return toast.error("Título e URL são obrigatórios");
    saveMut.mutate({ ...(editId ? { id: editId } : {}), ...form } as any);
  };

  const embedUrl = form.source !== "embed" ? getEmbedUrl(form.source, form.url) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: NAVY }}>Vídeos</h1>
          <p className="text-slate-500 text-sm mt-1">Cadastre e gerencie vídeos para vincular às páginas de soluções</p>
        </div>
        <button onClick={openNew} className="btn btn-gold">
          <Plus className="w-4 h-4" /> Novo Vídeo
        </button>
      </div>

      {/* Suporte */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-wrap gap-4 text-sm">
        <span className="font-semibold text-purple-800">Plataformas suportadas:</span>
        {["YouTube","Vimeo","Link externo","Embed (código HTML)"].map(p => (
          <span key={p} className="flex items-center gap-1 text-purple-700"><CheckCircle className="w-3.5 h-3.5" />{p}</span>
        ))}
      </div>

      {/* Grid de vídeos */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-slate-400">Carregando...</div>
      ) : (videos as any[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-16">
          <Video className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum vídeo cadastrado</p>
          <p className="text-slate-400 text-sm mb-4">Adicione vídeos do YouTube, Vimeo ou externos</p>
          <button onClick={openNew} className="btn btn-gold btn-sm"><Plus className="w-4 h-4" /> Cadastrar vídeo</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(videos as any[]).map((v: any) => {
            const src = SOURCE_LABELS[v.source] ?? { label: v.source, color: "#64748b", bg: "#f1f5f9" };
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                {/* Thumbnail */}
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt={v.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: NAVY }} onClick={() => setPreview(v)}>
                    <Video className="w-10 h-10 text-white/25" />
                    <span className="text-white/50 text-xs ml-2">Ver prévia</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{v.title}</p>
                    <span className="badge shrink-0" style={{ background: src.bg, color: src.color }}>{src.label}</span>
                  </div>
                  {v.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{v.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <span>📍 {POS_LABELS[v.position] ?? v.position}</span>
                    {v.duration && <span>· ⏱ {v.duration}</span>}
                  </div>
                  {v.ctaText && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-3">
                      CTA: <strong>{v.ctaText}</strong>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => setPreview(v)} className="btn btn-outline btn-sm flex-1 justify-center">
                      <ExternalLink className="w-3.5 h-3.5" /> Prévia
                    </button>
                    <button onClick={() => openEdit(v)} className="btn btn-sm btn-primary flex-1 justify-center">
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => { if (confirm(`Excluir "${v.title}"?`)) deleteMut.mutate(v.id); }}
                      className="btn-icon text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal — Cadastro/Edição */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-serif text-lg font-bold" style={{ color: NAVY }}>
                {editId ? "Editar Vídeo" : "Cadastrar Novo Vídeo"}
              </h3>
              <button onClick={() => { setModal(false); setForm(EMPTY_FORM); }} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">

              {/* Fonte */}
              <div className="form-group">
                <label className="form-label">Plataforma / Fonte do vídeo *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["youtube","vimeo","external","embed"] as const).map(s => {
                    const sl = SOURCE_LABELS[s];
                    return (
                      <button key={s} onClick={() => set("source", s)}
                        className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                          form.source === s ? "border-amber-400 text-amber-700 bg-amber-50" : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}>
                        {sl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Título do vídeo *</label>
                <input className="form-input" placeholder="Ex: Apresentação — Planejamento Tributário"
                  value={form.title} onChange={e => set("title", e.target.value)} />
              </div>

              {form.source !== "embed" ? (
                <div className="form-group">
                  <label className="form-label">
                    URL do vídeo * {form.source === "youtube" && "(ex: https://www.youtube.com/watch?v=...)"}
                    {form.source === "vimeo" && "(ex: https://vimeo.com/123456789)"}
                  </label>
                  <input className="form-input" placeholder={
                    form.source === "youtube" ? "https://www.youtube.com/watch?v=xxxxxxxxxxx" :
                    form.source === "vimeo"   ? "https://vimeo.com/123456789" : "https://..."
                  } value={form.url} onChange={e => set("url", e.target.value)} />
                  {form.url && embedUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%", position: "relative", height: 0 }}>
                      <iframe src={embedUrl} title="Preview" allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Código de incorporação (iframe/embed) *</label>
                  <textarea className="form-input form-textarea font-mono text-xs" placeholder='<iframe src="..." ...></iframe>'
                    value={form.embedCode} onChange={e => { set("embedCode", e.target.value); set("url", "embed"); }} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Thumbnail (URL da capa)</label>
                  <input className="form-input" placeholder="https://... URL da imagem"
                    value={form.thumbnail} onChange={e => set("thumbnail", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duração</label>
                  <input className="form-input" placeholder="ex: 3:45"
                    value={form.duration} onChange={e => set("duration", e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Posição na página</label>
                <select className="form-input form-select" value={form.position} onChange={e => set("position", e.target.value)}>
                  {Object.entries(POS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-input form-textarea" placeholder="Contexto ou descrição interna do vídeo"
                  value={form.description} onChange={e => set("description", e.target.value)} />
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CTA abaixo do vídeo (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Texto do CTA</label>
                    <input className="form-input" placeholder='ex: "Solicitar análise"'
                      value={form.ctaText} onChange={e => set("ctaText", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Link do CTA</label>
                    <input className="form-input" placeholder="https://wa.me/... ou /contato"
                      value={form.ctaUrl} onChange={e => set("ctaUrl", e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Texto de apoio ao vídeo</label>
                  <input className="form-input" placeholder="Frase exibida ao lado ou abaixo do vídeo"
                    value={form.supportText} onChange={e => set("supportText", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => { setModal(false); setForm(EMPTY_FORM); }} className="btn btn-outline">Cancelar</button>
              <button onClick={handleSave} disabled={saveMut.isPending} className="btn btn-gold">
                <Save className="w-4 h-4" /> {saveMut.isPending ? "Salvando..." : "Salvar vídeo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal prévia */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-white font-semibold">{preview.title}</p>
              <button onClick={() => setPreview(null)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {preview.source === "embed" && preview.embedCode ? (
              <div className="video-embed-wrapper" dangerouslySetInnerHTML={{ __html: preview.embedCode }} />
            ) : (
              <div className="video-embed-wrapper">
                {getEmbedUrl(preview.source, preview.url) && (
                  <iframe src={getEmbedUrl(preview.source, preview.url)!} title={preview.title} allowFullScreen />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
