import { useState, useRef } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Upload, Trash2, Copy, Image as ImageIcon, X } from "lucide-react";
const NAVY = "#19385C", GOLD = "#E8B84B";
export default function MediaAdmin() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const { data: media = [] } = trpc.media.list.useQuery();
  const deleteMut = trpc.media.delete.useMutation({ onSuccess: () => { utils.media.list.invalidate(); toast.success("Excluído"); } });
  const uploadFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd, headers: { Authorization: `Bearer ${localStorage.getItem("sp_token")}` } });
      if (!r.ok) throw new Error("Erro no upload");
      utils.media.list.invalidate(); toast.success("Upload realizado!");
    } catch { toast.error("Erro no upload"); }
    setUploading(false);
  };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); };
  const copyUrl = (url: string) => { navigator.clipboard.writeText(window.location.origin + url); toast.success("URL copiada!"); };
  return (
    <div className="space-y-6">
      <div><h1 className="font-serif text-2xl font-bold" style={{ color: NAVY }}>Biblioteca de Mídia</h1><p className="text-slate-500 text-sm mt-1">Imagens, banners e thumbnails</p></div>
      <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${dragging ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-slate-300"}`}
        onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="font-semibold text-slate-600">{uploading ? "Enviando..." : "Clique ou arraste arquivos aqui"}</p>
        <p className="text-slate-400 text-sm mt-1">PNG, JPG, SVG, WebP — até 10MB</p>
        <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
      </div>
      {(media as any[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-12"><ImageIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400">Nenhum arquivo enviado ainda</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {(media as any[]).map((m: any) => (
            <div key={m.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden group hover:shadow-md transition-all">
              <div className="relative h-28 bg-slate-100">
                <img src={m.url} alt={m.alt ?? m.filename} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='m21 15-5-5L5 21'/%3E%3C/svg%3E"; }} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(m.url)} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-all"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (confirm("Excluir?")) deleteMut.mutate(m.id); }} className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="p-2"><p className="text-xs text-slate-500 truncate">{m.filename}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
