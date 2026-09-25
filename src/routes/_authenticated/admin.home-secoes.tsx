import { createFileRoute, Link } from "@tanstack/react-router";
import { UploadField } from "@/components/admin/UploadField";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HOME_DEFAULTS, HOME_SECTIONS, type Item, type SectionData, type SectionDef } from "@/lib/home-sections";
import { PageHeader, Panel } from "@/components/admin/kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/home-secoes")({ component: Page });

type Row = { secao: string; conteudo_pt: SectionData; conteudo_es: SectionData };

function Page() {
  const { can } = useAuth();
  const q = useQuery({
    queryKey: ["admin-secoes-home"],
    queryFn: async () => {
      const { data, error } = await supabase.from("secoes_home" as never).select("secao,conteudo_pt,conteudo_es");
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });
  if (!can("home_secoes")) return <p className="text-muted-foreground">Você não tem acesso a esta área.</p>;
  return (
    <div className="-mx-1 h-full space-y-6 overflow-y-auto px-1 pb-8">
      <PageHeader title="Home (seções)" crumbs={["Conteúdo", "Home (seções)"]}
        description="Edite os textos de cada bloco da página inicial. Campo vazio usa o texto padrão, para a página nunca ficar em branco." />
      {q.isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
        HOME_SECTIONS.map((def) => <SectionEditor key={def.id} def={def} row={q.data?.find((r) => r.secao === def.id)} />)}
    </div>
  );
}

function SectionEditor({ def, row }: { def: SectionDef; row: Row | undefined }) {
  const { can } = useAuth();
  const qc = useQueryClient();
  const init = (lang: "pt" | "es") => {
    const v = (row?.[`conteudo_${lang}`] ?? {}) as SectionData;
    return Object.keys(v).length || row ? v : (HOME_DEFAULTS[lang][def.id] ?? {});
  };
  const [pt, setPt] = useState<SectionData>(() => init("pt"));
  const [es, setEs] = useState<SectionData>(() => init("es"));
  const [saving, setSaving] = useState(false);
  useEffect(() => { setPt(init("pt")); setEs(init("es")); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [row]);

  const itemsPt = (Array.isArray(pt["itens"]) ? pt["itens"] : []) as Item[];
  const itemsEs = (Array.isArray(es["itens"]) ? es["itens"] : []) as Item[];
  const setItems = (a: Item[], b: Item[]) => { setPt({ ...pt, itens: a }); setEs({ ...es, itens: b }); };
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= itemsPt.length) return;
    const a = [...itemsPt], b = [...itemsEs];
    [a[i], a[j]] = [a[j]!, a[i]!]; [b[i], b[j]] = [b[j] ?? {}, b[i] ?? {}];
    setItems(a, b);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("secoes_home" as never)
      .upsert({ secao: def.id, ordem: HOME_SECTIONS.indexOf(def), conteudo_pt: pt, conteudo_es: es } as never, { onConflict: "secao" });
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar: " + error.message); return; }
    toast.success(`Seção "${def.label}" salva`);
    qc.invalidateQueries({ queryKey: ["admin-secoes-home"] });
    qc.invalidateQueries({ queryKey: ["site-home"] });
  };

  const renderLang = (lang: "pt" | "es") => {
    const data = lang === "pt" ? pt : es;
    const set = lang === "pt" ? setPt : setEs;
    const items = lang === "pt" ? itemsPt : itemsEs;
    const fields = def.fields.filter((f) => lang === "pt" || f.lang !== false);
    return (
      <div className="space-y-4">
        {lang === "es" && <p className="text-xs text-muted-foreground">Campos vazios em espanhol mostram o texto em português. Links e valores são definidos na aba PT.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.long ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}>
              <Label>{f.label}</Label>
              {f.image
                ? <UploadField image bucket="banners" value={(data[f.key] as string) ?? ""} onChange={(v) => set({ ...data, [f.key]: v })} />
                : f.long
                ? <Textarea rows={3} value={(data[f.key] as string) ?? ""} onChange={(e) => set({ ...data, [f.key]: e.target.value })} />
                : <Input value={(data[f.key] as string) ?? ""} onChange={(e) => set({ ...data, [f.key]: e.target.value })} />}
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}
        </div>
        {def.items && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{def.items.label}s ({itemsPt.length})</h4>
              {lang === "pt" && <Button type="button" variant="outline" size="sm" onClick={() => setItems([...itemsPt, {}], [...itemsEs, {}])}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>}
            </div>
            {itemsPt.map((_, i) => {
              const it = items[i] ?? {};
              const upd = (k: string, v: string) => {
                const arr = [...items]; while (arr.length <= i) arr.push({});
                arr[i] = { ...arr[i], [k]: v };
                set({ ...data, itens: arr });
              };
              const auto = itemsPt[i]?.["auto"] ?? "";
              return (
                <div key={i} className="rounded-lg border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{def.items!.label} {String(i + 1).padStart(2, "0")}</span>
                    {lang === "pt" && (
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Subir" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Descer" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Remover"
                          onClick={() => { if (confirm("Remover este item?")) setItems(itemsPt.filter((_, j) => j !== i), itemsEs.filter((_, j) => j !== i)); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                  {def.items!.auto && lang === "pt" && (
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                      <Switch checked={!!auto} onCheckedChange={(c) => upd("auto", c ? "produtos" : "")} />
                      <span>Automático (contado do banco)</span>
                      {auto && (
                        <select className="h-8 rounded-md border bg-background px-2 text-sm" value={auto} onChange={(e) => upd("auto", e.target.value)}>
                          <option value="produtos">Total de produtos ativos</option>
                          <option value="categorias">Total de categorias ativas</option>
                        </select>
                      )}
                    </div>
                  )}
                  {def.items!.auto && lang === "pt" && !auto && (
                    <p className="mb-3 text-xs text-muted-foreground">{"Marcar \u201cAutom\u00e1tico\u201d conta o valor do banco (produtos ou categorias). Desmarcado, digite um valor livre \u2014 ex.: \u201c+25\u201d, \u201cISO\u201d."}</p>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    {def.items!.fields.filter((f) => (lang === "pt" || f.lang !== false) && !(f.key === "valor" && auto)).map((f) => (
                      <div key={f.key} className={f.long ? "md:col-span-2 space-y-1" : "space-y-1"}>
                        <Label className="text-xs">{f.label}</Label>
                        {f.long
                          ? <Textarea rows={2} value={it[f.key] ?? ""} onChange={(e) => upd(f.key, e.target.value)} />
                          : <Input value={it[f.key] ?? ""} onChange={(e) => upd(f.key, e.target.value)} />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Panel className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-base font-semibold">{def.label}</h3><p className="text-sm text-muted-foreground">{def.description}</p>
          {def.id === "hero" && (
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to="/admin/conteudo/$tabela" params={{ tabela: "banners" }}><ExternalLink className="mr-1 h-4 w-4" />Gerenciar banners</Link>
            </Button>
          )}</div>
        <Button onClick={save} disabled={saving || !can("home_secoes", "editar")}>{saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}Salvar seção</Button>
      </div>
      <Tabs defaultValue="pt">
        <TabsList><TabsTrigger value="pt">Português</TabsTrigger><TabsTrigger value="es">Español</TabsTrigger></TabsList>
        <TabsContent value="pt" className="pt-4">{renderLang("pt")}</TabsContent>
        <TabsContent value="es" className="pt-4">{renderLang("es")}</TabsContent>
      </Tabs>
    </Panel>
  );
}
