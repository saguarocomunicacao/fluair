import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel } from "@/components/admin/kit";
import { useAuth } from "@/hooks/useAuth";
import { canContent } from "@/lib/admin-config";

export const Route = createFileRoute("/_authenticated/admin/importar")({
  component: Importar,
});

type Map = { codigo: string; nome: string; categoria: string; especificacoes: string[] };
const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Importar() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [map, setMap] = useState<Map>({ codigo: "", nome: "", categoria: "", especificacoes: [] });
  const [busy, setBusy] = useState(false);
  const [rep, setRep] = useState<{ novos: string[]; atualizados: string[]; ignorados: string[]; semCat: string[] } | null>(null);
  const { roles } = useAuth();

  const onFile = (f: File) => {
    Papa.parse<Record<string, string>>(f, {
      header: true, skipEmptyLines: true,
      complete: (r) => {
        const c = r.meta.fields ?? [];
        setRows(r.data); setCols(c); setRep(null);
        const guess = (n: string) => c.find((x) => x.toLowerCase().includes(n)) ?? "";
        setMap({ codigo: guess("cod"), nome: guess("nome"), categoria: guess("categ"), especificacoes: [] });
      },
    });
  };

  const importar = async () => {
    if (!map.codigo || !map.nome) { toast.error("Mapeie código e nome"); return; }
    setBusy(true);
    const { data: cats } = await supabase.from("categorias").select("id, nome_pt, slug");
    const catId = (v: string) => {
      if (!v) return null;
      const s = slugify(v);
      return cats?.find((c) => c.slug === s || slugify(c.nome_pt) === s)?.id ?? null;
    };
    const semCat = new Set<string>();
    const ignorados: string[] = [];
    const seen = new Set<string>();
    const valid = rows.filter((r, i) => {
      const c = r[map.codigo]?.trim();
      if (!c) { ignorados.push(`Linha ${i + 2}: sem código`); return false; }
      if (seen.has(c)) { ignorados.push(`Linha ${i + 2}: código ${c} duplicado no arquivo`); return false; }
      seen.add(c); return true;
    });
    const { data: exist } = await supabase.from("produtos").select("codigo").in("codigo", [...seen]);
    const existSet = new Set((exist ?? []).map((e) => e.codigo));
    const payload = valid.map((r) => {
      const esp: Record<string, string> = {};
      for (const c of map.especificacoes) { const v = r[c]?.trim(); if (v) esp[c] = v; }
      const cat = map.categoria ? r[map.categoria]?.trim() ?? "" : "";
      const id = catId(cat);
      if (cat && !id) semCat.add(cat);
      const cod = (r[map.codigo] ?? "").trim();
      return { codigo: cod, nome_pt: r[map.nome]?.trim() || cod, categoria_id: id, especificacoes: esp };
    });
    let ok = 0;
    for (let i = 0; i < payload.length; i += 100) {
      const { error } = await supabase.from("produtos").upsert(payload.slice(i, i + 100), { onConflict: "codigo" });
      if (error) { toast.error(error.message); setBusy(false); return; }
      ok += payload.slice(i, i + 100).length;
    }
    setBusy(false);
    void ok;
    const cods = payload.map((p) => p.codigo);
    setRep({ novos: cods.filter((c) => !existSet.has(c)), atualizados: cods.filter((c) => existSet.has(c)), ignorados, semCat: [...semCat] });
    toast.success("Importação concluída");
  };

  const Sel = ({ k }: { k: "codigo" | "nome" | "categoria" }) => (
    <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={map[k]} onChange={(e) => setMap({ ...map, [k]: e.target.value })}>
      <option value="">— ignorar —</option>
      {cols.map((c) => <option key={c}>{c}</option>)}
    </select>
  );

  if (!canContent(roles)) return <p className="text-muted-foreground">Você não tem acesso a esta área.</p>;
  return (
    <div className="space-y-5">
      <PageHeader title="Importar produtos" crumbs={["Conteúdo", "Importar CSV"]} description="Envie um CSV com cabeçalho. Produtos com o mesmo código são atualizados; a categoria é associada pelo nome ou slug." />
      <Panel className="p-5"><Input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></Panel>
      {cols.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">Pré-visualização (primeiras 8 de {rows.length} linhas)</div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted"><tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{c}</th>)}</tr></thead>
              <tbody>{rows.slice(0, 8).map((r, i) => <tr key={i} className="border-t border-border">{cols.map((c) => <td key={c} className="whitespace-nowrap px-3 py-1.5">{r[c]}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </Panel>
      )}
      {cols.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-semibold">Mapeamento de colunas</h3>
          <p className="text-sm">{rows.length} linhas encontradas.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Código *</Label><Sel k="codigo" /></div>
            <div><Label>Nome *</Label><Sel k="nome" /></div>
            <div><Label>Categoria</Label><Sel k="categoria" /></div>
          </div>
          <div>
            <Label>Colunas que viram especificações</Label>
            <div className="mt-1 flex flex-wrap gap-3">
              {cols.filter((c) => ![map.codigo, map.nome, map.categoria].includes(c)).map((c) => (
                <label key={c} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={map.especificacoes.includes(c)} onChange={(e) => setMap({ ...map, especificacoes: e.target.checked ? [...map.especificacoes, c] : map.especificacoes.filter((x) => x !== c) })} />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <Button onClick={importar} disabled={busy}>{busy ? "Importando…" : "Importar"}</Button>
          {rep && (
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {([["Criados", rep.novos, "text-success"], ["Atualizados", rep.atualizados, "text-brand-accent"], ["Ignorados", rep.ignorados, "text-warning"]] as const).map(([t, l, c]) => (
                <div key={t} className="rounded-lg border border-border p-4">
                  <div className={`text-2xl font-semibold ${c}`}>{l.length}</div>
                  <div className="text-sm font-medium">{t}</div>
                  {l.length > 0 && <div className="mt-2 max-h-32 overflow-auto text-xs text-muted-foreground">{l.join(", ")}</div>}
                </div>
              ))}
              {rep.semCat.length > 0 && <p className="text-sm text-warning sm:col-span-3">Categorias não encontradas (produtos ficaram sem categoria): {rep.semCat.join(", ")}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
