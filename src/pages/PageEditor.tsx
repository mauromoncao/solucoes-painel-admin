import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  Save, ArrowLeft, Globe, Video, Search, ChevronDown, ChevronUp,
  Plus, Trash2, Eye, CheckCircle, Link2, Image as ImageIcon
} from "lucide-react";

const NAVY = "#19385C";
const GOLD = "#E8B84B";

const SOLUTION_KEYS = [
  { key: "planejamento-tributario",    label: "Planejamento Tributário" },
  { key: "recuperacao-tributaria",     label: "Recuperação Tributária" },
  { key: "transacao-tributaria",       label: "Transação Tributária" },
  { key: "defesa-fiscal",              label: "Defesa Fiscal" },
  { key: "clinicas-lucro-presumido",   label: "Clínicas Lucro Presumido" },
  { key: "irpf-autismo",               label: "IRPF Autismo" },
  { key: "recuperacao-previdenciaria", label: "Recuperação Previdenciária" },
  { key: "direito-previdenciario",     label: "Direito Previdenciário" },
  { key: "direito-bancario",           label: "Direito Bancário" },
  { key: "institucional",              label: "Consultoria Empresarial" },
  { key: "dr-ben",                     label: "Dr. Ben — Assistente IA" },
  { key: "custom",                     label: "Personalizada" },
];

const VIDEO_POS_LABELS: Record<string, string> = {
  hero:        "No topo (Hero Section)",
  after_hero:  "Abaixo da abertura",
  middle:      "No meio da página",
  before_cta:  "Antes do CTA principal",
  before_form: "Antes do formulário",
  custom:      "Posição personalizada",
};

type Tab = "conteudo" | "video" | "ctas" | "seo" | "blocos";

function TabBtn({ tab, active, label, onClick }: { tab: Tab; active: Tab; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
        active === tab
          ? "text-white shadow-sm"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
      style={active === tab ? { background: NAVY } : {}}>
      {label}
    </button>
  );
}

export default function PageEditor() {
  const { id } = useParams<{ id: string }>();
  const [, nav] = useLocation();
  const isNew = id === "novo";
  const numId = isNew ? undefined : Number(id);
  const [tab, setTab] = useState<Tab>("conteudo");

  // Form state
  const [form, setForm] = useState({
    slug: "", title: "", subtitle: "", description: "",
    coverImage: "", solutionKey: "", status: "draft" as "draft"|"published"|"archived",
    metaTitle: "", metaDescription: "", metaKeywords: "", ogImage: "", canonicalUrl: "",
    videoId: null as number | null,
  });
  const [blocks, setBlocks] = useState<any[]>([
    { id: "hero",      type: "hero",      active: true, order: 0,  data: { title: "", subtitle: "", bg: "" } },
    { id: "video",     type: "video",     active: false,order: 1,  data: {} },
    { id: "text",      type: "text",      active: true, order: 2,  data: { content: "" } },
    { id: "benefits",  type: "benefits",  active: true, order: 3,  data: { items: [] } },
    { id: "faq",       type: "faq",       active: false,order: 4,  data: { items: [] } },
    { id: "authority", type: "authority", active: false,order: 5,  data: {} },
    { id: "form",      type: "form",      active: true, order: 6,  data: {} },
    { id: "cta",       type: "cta",       active: true, order: 7,  data: { text: "", url: "" } },
  ]);
  const [ctas, setCtas] = useState<any[]>([]);
  const [newCta, setNewCta] = useState({ label: "", url: "", style: "primary" });

  // Load existing
  const { data: existing } = trpc.pages.byId.useQuery(numId!, { enabled: !!numId });
  const { data: videos = [] } = trpc.videos.list.useQuery();
  const { data: pageCtas = [] } = trpc.ctas.byPage.useQuery(numId!, { enabled: !!numId });

  useEffect(() => {
    if (existing) {
      setForm({
        slug: existing.slug, title: existing.title, subtitle: existing.subtitle ?? "",
        description: existing.description ?? "", coverImage: existing.coverImage ?? "",
        solutionKey: existing.solutionKey ?? "", status: existing.status,
        metaTitle: existing.metaTitle ?? "", metaDescription: existing.metaDescription ?? "",
        metaKeywords: existing.metaKeywords ?? "", ogImage: existing.ogImage ?? "",
        canonicalUrl: existing.canonicalUrl ?? "", videoId: existing.videoId ?? null,
      });
      if (existing.blocks && Array.isArray(existing.blocks)) setBlocks(existing.blocks as any[]);
    }
  }, [existing]);
  useEffect(() => { if (pageCtas) setCtas(pageCtas); }, [pageCtas]);

  const utils = trpc.useUtils();
  const saveMut     = trpc.pages.save.useMutation({
    onSuccess: (p: any) => {
      toast.success("Página salva!");
      if (isNew) nav(`/paginas/${p.id}`);
      utils.pages.list.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });
  const linkMut     = trpc.pages.linkVideo.useMutation({ onSuccess: () => { toast.success("Vídeo vinculado!"); utils.pages.byId.invalidate(numId); } });
  const saveCta     = trpc.ctas.save.useMutation({ onSuccess: () => { toast.success("CTA salvo"); utils.ctas.byPage.invalidate(numId); } });
  const deleteCta   = trpc.ctas.delete.useMutation({ onSuccess: () => { utils.ctas.byPage.invalidate(numId); } });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    saveMut.mutate({ ...(numId ? { id: numId } : {}), ...form, blocks } as any);
  };

  const handleLinkVideo = (videoId: number | null) => {
    set("videoId", videoId);
    if (numId) linkMut.mutate({ pageId: numId, videoId });
  };

  const toggleBlock = (idx: number) => {
    setBlocks(b => b.map((bl, i) => i === idx ? { ...bl, active: !bl.active } : bl));
  };
  const moveBlock = (idx: number, dir: -1 | 1) => {
    const next = [...blocks];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setBlocks(next.map((b, i) => ({ ...b, order: i })));
  };

  const selectedVideo = videos.find((v: any) => v.id === form.videoId);

  const BLOCK_LABELS: Record<string, string> = {
    hero: "Hero Section (abertura)",
    video: "Vídeo principal",
    text: "Texto institucional",
    benefits: "Benefícios / Diferenciais",
    faq: "Perguntas Frequentes (FAQ)",
    authority: "Provas de autoridade",
    form: "Formulário de contato",
    cta: "Botão CTA final",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => nav("/paginas")} className="btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-xl font-bold" style={{ color: NAVY }}>
            {isNew ? "Nova Página" : form.title || "Editar Página"}
          </h1>
          {!isNew && <p className="text-slate-400 text-xs font-mono mt-0.5">/{form.slug}</p>}
        </div>
        <div className="flex gap-2">
          <span className={`badge ${form.status === "published" ? "badge-published" : form.status === "draft" ? "badge-draft" : "badge-archived"}`}>
            {form.status === "published" ? "Publicada" : form.status === "draft" ? "Rascunho" : "Arquivada"}
          </span>
          <button onClick={handleSave} disabled={saveMut.isPending} className="btn btn-gold">
            <Save className="w-4 h-4" />
            {saveMut.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-1 flex-wrap">
        {(["conteudo","video","ctas","seo","blocos"] as Tab[]).map(t => (
          <TabBtn key={t} tab={t} active={tab} onClick={() => setTab(t)}
            label={{ conteudo: "📝 Conteúdo", video: "🎬 Vídeo", ctas: "🔘 CTAs", seo: "🔍 SEO", blocos: "🧱 Blocos" }[t]} />
        ))}
      </div>

      {/* ── CONTEÚDO ── */}
      {tab === "conteudo" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider border-b pb-3">Dados da Página</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="form-group md:col-span-2">
              <label className="form-label">Título principal *</label>
              <input className="form-input" placeholder="ex: Planejamento Tributário para Empresas"
                value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Subtítulo</label>
              <input className="form-input" placeholder="Frase de apoio ao título"
                value={form.subtitle} onChange={e => set("subtitle", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Slug / URL amigável *</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">/</span>
                <input className="form-input flex-1" placeholder="planejamento-tributario"
                  value={form.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))} />
              </div>
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Descrição curta</label>
              <textarea className="form-input form-textarea" placeholder="Resumo da página para uso interno"
                value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Solução vinculada</label>
              <select className="form-input form-select" value={form.solutionKey} onChange={e => set("solutionKey", e.target.value)}>
                <option value="">Selecione...</option>
                {SOLUTION_KEYS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input form-select" value={form.status} onChange={e => set("status", e.target.value as any)}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicada</option>
                <option value="archived">Arquivada</option>
              </select>
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Imagem de capa (URL)</label>
              <input className="form-input" placeholder="https://... ou /uploads/..."
                value={form.coverImage} onChange={e => set("coverImage", e.target.value)} />
              {form.coverImage && (
                <img src={form.coverImage} alt="Capa" className="mt-2 h-24 w-auto rounded-lg object-cover border border-slate-200" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── VÍDEO ── */}
      {tab === "video" && (
        <div className="space-y-5">
          {/* Vídeo atual */}
          {selectedVideo && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Vídeo Vinculado</h2>
                <button onClick={() => handleLinkVideo(null)} className="btn btn-danger btn-sm">
                  <Trash2 className="w-3.5 h-3.5" /> Desvincular
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <VideoEmbed video={selectedVideo} />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-800">{selectedVideo.title}</p>
                  <p className="text-sm text-slate-500">{selectedVideo.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge" style={{ background: "#ede9fe", color: "#7c3aed" }}>{selectedVideo.source}</span>
                    <span className="badge" style={{ background: "#e0f2fe", color: "#0891b2" }}>{VIDEO_POS_LABELS[selectedVideo.position] ?? selectedVideo.position}</span>
                  </div>
                  {selectedVideo.ctaText && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm">
                      <strong>CTA do vídeo:</strong> {selectedVideo.ctaText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Biblioteca de vídeos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Biblioteca de Vídeos</h2>
              <a href="/videos" className="btn btn-outline btn-sm">
                <Plus className="w-3.5 h-3.5" /> Cadastrar novo vídeo
              </a>
            </div>
            {(videos as any[]).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Video className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p>Nenhum vídeo cadastrado ainda.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(videos as any[]).map((v: any) => (
                  <div key={v.id}
                    className={`rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                      form.videoId === v.id
                        ? "border-amber-400 bg-amber-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => handleLinkVideo(form.videoId === v.id ? null : v.id)}>
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt={v.title} className="w-full h-28 object-cover rounded-lg mb-3" />
                    ) : (
                      <div className="w-full h-28 rounded-lg mb-3 flex items-center justify-center" style={{ background: NAVY }}>
                        <Video className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                    <p className="font-semibold text-sm text-slate-800 truncate">{v.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-400">{v.source} · {VIDEO_POS_LABELS[v.position]}</span>
                      {form.videoId === v.id && <CheckCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CTAs ── */}
      {tab === "ctas" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider border-b pb-3">Botões de Ação (CTAs)</h2>
          {/* Existing */}
          {(ctas as any[]).length > 0 && (
            <div className="space-y-2">
              {(ctas as any[]).map((cta: any) => (
                <div key={cta.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className={`badge ${cta.style === "primary" ? "badge-published" : "badge-draft"}`}>{cta.style}</span>
                  <span className="font-medium text-sm text-slate-800 flex-1">{cta.label}</span>
                  <a href={cta.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-blue-500 truncate max-w-[140px]">{cta.url}</a>
                  <button onClick={() => deleteCta.mutate(cta.id)} className="btn-icon text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Add new */}
          {numId && (
            <div className="grid sm:grid-cols-4 gap-3 border-t pt-4">
              <input className="form-input" placeholder='Texto do botão, ex: "Solicitar análise"'
                value={newCta.label} onChange={e => setNewCta(c => ({ ...c, label: e.target.value }))} />
              <input className="form-input" placeholder="Link de destino"
                value={newCta.url} onChange={e => setNewCta(c => ({ ...c, url: e.target.value }))} />
              <select className="form-input form-select" value={newCta.style} onChange={e => setNewCta(c => ({ ...c, style: e.target.value }))}>
                <option value="primary">Primário</option>
                <option value="secondary">Secundário</option>
                <option value="outline">Outline</option>
              </select>
              <button className="btn btn-gold" onClick={() => {
                if (!newCta.label || !newCta.url) return toast.error("Preencha o texto e o link");
                saveCta.mutate({ pageId: numId, ...newCta });
                setNewCta({ label: "", url: "", style: "primary" });
              }}>
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          )}
          {!numId && <p className="text-sm text-slate-400">Salve a página primeiro para adicionar CTAs.</p>}

          {/* Exemplos sugeridos */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Exemplos de CTAs</p>
            <div className="flex flex-wrap gap-2">
              {["Solicitar análise gratuita","Fale com o especialista","Preencher formulário","Falar com Dr. Ben","Agendar consulta","Saiba mais"].map(l => (
                <button key={l} onClick={() => setNewCta(c => ({ ...c, label: l }))}
                  className="px-3 py-1.5 rounded-full text-xs border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all">
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SEO ── */}
      {tab === "seo" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider border-b pb-3">SEO e Metadados</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="form-group md:col-span-2">
              <label className="form-label">Meta Title</label>
              <input className="form-input" placeholder="Título para o Google (60 caracteres recomendado)"
                value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} />
              <span className="text-xs text-slate-400">{form.metaTitle.length}/60 caracteres</span>
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Meta Description</label>
              <textarea className="form-input form-textarea" placeholder="Descrição para o Google (160 caracteres recomendado)"
                value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)} />
              <span className="text-xs text-slate-400">{form.metaDescription.length}/160 caracteres</span>
            </div>
            <div className="form-group">
              <label className="form-label">Palavras-chave</label>
              <input className="form-input" placeholder="tributário, planejamento, empresa..."
                value={form.metaKeywords} onChange={e => set("metaKeywords", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">URL Canônica</label>
              <input className="form-input" placeholder="https://solucoesjuridicas.mauromoncao.adv.br/..."
                value={form.canonicalUrl} onChange={e => set("canonicalUrl", e.target.value)} />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label">Imagem OG (compartilhamento social)</label>
              <input className="form-input" placeholder="https://... URL da imagem (1200x630px recomendado)"
                value={form.ogImage} onChange={e => set("ogImage", e.target.value)} />
            </div>
          </div>
          {/* Preview Google */}
          {(form.metaTitle || form.title) && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <p className="text-xs text-slate-400 mb-2 font-semibold">Prévia no Google</p>
              <p className="text-blue-700 text-sm font-medium">{form.metaTitle || form.title}</p>
              <p className="text-green-700 text-xs">{form.canonicalUrl || `https://solucoesjuridicas.mauromoncao.adv.br/${form.slug}`}</p>
              <p className="text-slate-500 text-xs mt-1">{form.metaDescription || form.description || "Sem descrição"}</p>
            </div>
          )}
        </div>
      )}

      {/* ── BLOCOS ── */}
      {tab === "blocos" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="border-b pb-3 mb-2">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Blocos da Página</h2>
            <p className="text-xs text-slate-400 mt-1">Ative/desative e reordene os blocos da landing page</p>
          </div>
          {blocks.map((block, idx) => (
            <div key={block.id}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                block.active ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
              }`}>
              <div className="flex flex-col gap-1">
                <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="btn-icon p-0.5 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1} className="btn-icon p-0.5 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
              </div>
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-black text-slate-400 bg-white border border-slate-200">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-800">{BLOCK_LABELS[block.type] ?? block.type}</p>
                <p className="text-xs text-slate-400">{block.active ? "✅ Ativo" : "⬜ Inativo"}</p>
              </div>
              <button onClick={() => toggleBlock(idx)}
                className={`btn btn-sm ${block.active ? "btn-outline" : "btn-gold"}`}>
                {block.active ? "Desativar" : "Ativar"}
              </button>
            </div>
          ))}
          <p className="text-xs text-slate-400 pt-2">Clique em "Salvar" para aplicar a ordem dos blocos.</p>
        </div>
      )}
    </div>
  );
}

// ── Video Embed Helper ────────────────────────────────────────
function VideoEmbed({ video }: { video: any }) {
  const getEmbedUrl = (v: any): string | null => {
    if (v.source === "youtube") {
      const match = v.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&\s?]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    }
    if (v.source === "vimeo") {
      const match = v.url.match(/vimeo\.com\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : null;
    }
    if (v.source === "embed" && v.embedCode) return null;
    return v.url;
  };

  if (video.source === "embed" && video.embedCode) {
    return <div className="video-embed-wrapper" dangerouslySetInnerHTML={{ __html: video.embedCode }} />;
  }
  const embedUrl = getEmbedUrl(video);
  if (!embedUrl) return <div className="video-embed-wrapper flex items-center justify-center text-white/30 text-sm">URL inválida</div>;
  return (
    <div className="video-embed-wrapper">
      <iframe src={embedUrl} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>
  );
}
