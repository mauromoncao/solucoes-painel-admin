import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";
const NAVY = "#19385C", GOLD = "#E8B84B";
const KEYS = [
  { key: "site_name",       label: "Nome do site",        placeholder: "Soluções Jurídicas — Mauro Monção" },
  { key: "wa_number",       label: "WhatsApp",             placeholder: "5586994820054" },
  { key: "phone_office",    label: "Telefone escritório",  placeholder: "(86) 99519-8919" },
  { key: "email",           label: "E-mail de contato",   placeholder: "contato@mauromoncao.adv.br" },
  { key: "address",         label: "Endereço",             placeholder: "Parnaíba – PI | Fortaleza – CE" },
  { key: "instagram_url",   label: "Instagram URL",        placeholder: "https://instagram.com/mauromoncao.adv" },
  { key: "public_base_url", label: "URL base do site",     placeholder: "https://solucoesjuridicas.mauromoncao.adv.br" },
];
export default function SettingsAdmin() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const { data: settings = [] } = trpc.settings.all.useQuery();
  const setMut = trpc.settings.set.useMutation({ onSuccess: () => toast.success("Configuração salva!") });
  useEffect(() => {
    const m: Record<string, string> = {};
    (settings as any[]).forEach((s: any) => { m[s.settingKey] = s.settingValue ?? ""; });
    setVals(m);
  }, [settings]);
  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="font-serif text-2xl font-bold" style={{ color: NAVY }}>Configurações</h1><p className="text-slate-500 text-sm mt-1">Dados gerais do painel e do site</p></div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        {KEYS.map(({ key, label, placeholder }) => (
          <div key={key} className="form-group">
            <label className="form-label">{label}</label>
            <div className="flex gap-2">
              <input className="form-input flex-1" placeholder={placeholder} value={vals[key] ?? ""} onChange={e => setVals(v => ({ ...v, [key]: e.target.value }))} />
              <button className="btn btn-gold btn-sm shrink-0" onClick={() => setMut.mutate({ key, value: vals[key] ?? "" })}><Save className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
