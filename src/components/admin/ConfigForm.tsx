import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel } from "./kit";

const SHARED = [
  { k: "telefone", l: "Telefone" }, { k: "whatsapp", l: "WhatsApp" }, { k: "email", l: "E-mail" },
  { k: "instagram", l: "Instagram" }, { k: "facebook", l: "Facebook" }, { k: "youtube", l: "YouTube" },
];
const I18N = [{ k: "endereco", l: "Endereço" }, { k: "horario", l: "Horário de atendimento" }, { k: "tagline", l: "Tagline" }];

type Vals = Record<string, { pt: string; es: string }>;

export function ConfigForm() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["crud", "configuracoes"],
    queryFn: async () => (await supabase.from("configuracoes").select("*")).data ?? [],
  });
  const [v, setV] = useState<Vals>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!data) return;
    const o: Vals = {};
    data.forEach((r) => { o[r.chave] = { pt: r.valor_pt ?? "", es: r.valor_es ?? "" }; });
    setV(o);
  }, [data]);
  const get = (k: string, l: "pt" | "es") => v[k]?.[l] ?? "";
  const set = (k: string, l: "pt" | "es", x: string) => setV((p) => ({ ...p, [k]: { pt: p[k]?.pt ?? "", es: p[k]?.es ?? "", [l]: x } }));

  const save = async () => {
    setSaving(true);
    const rows = [
      ...SHARED.map(({ k }) => ({ chave: k, valor_pt: get(k, "pt"), valor_es: get(k, "pt") })),
      ...I18N.map(({ k }) => ({ chave: k, valor_pt: get(k, "pt"), valor_es: get(k, "es") })),
    ];
    const { error } = await supabase.from("configuracoes").upsert(rows, { onConflict: "chave" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Configurações salvas");
    qc.invalidateQueries({ queryKey: ["crud", "configuracoes"] });
  };

  return (
    <div>
      <PageHeader title="Configurações" crumbs={["Conteúdo", "Configurações"]} description="Dados de contato e redes sociais exibidos no site." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <h3 className="mb-5 text-sm font-semibold">Contato e redes sociais</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {SHARED.map(({ k, l }) => (
              <div key={k} className="space-y-2"><Label>{l}</Label><Input value={get(k, "pt")} onChange={(e) => set(k, "pt", e.target.value)} /></div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <Tabs defaultValue="pt">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Textos traduzíveis</h3>
              <TabsList><TabsTrigger value="pt">Português</TabsTrigger><TabsTrigger value="es">Español</TabsTrigger></TabsList>
            </div>
            {(["pt", "es"] as const).map((lang) => (
              <TabsContent key={lang} value={lang} className="mt-0 space-y-5">
                {I18N.map(({ k, l }) => (
                  <div key={k} className="space-y-2"><Label>{l}</Label><Input value={get(k, lang)} onChange={(e) => set(k, lang, e.target.value)} /></div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </Panel>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["crud", "configuracoes"] }).then(() => toast("Alterações descartadas"))}>Cancelar</Button>
        <Button onClick={save} disabled={saving} className="min-w-32">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando…</> : "Salvar tudo"}</Button>
      </div>
    </div>
  );
}
