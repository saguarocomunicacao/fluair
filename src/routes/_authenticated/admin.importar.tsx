import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [log, setLog] = useState("");

  const onFile = (f: File) => {
    Papa.parse<Record<string, string>>(f, {
      header: true, skipEmptyLines: true,
      complete: (r) => {
        const c = r.meta.fields ?? [];
        setRows(r.data); setCols(c);
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
    const payload = rows.filter((r) => r[map.codigo]?.trim()).map((r) => {
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
    setLog(`${ok} produtos importados/atualizados.${semCat.size ? ` Categorias não encontradas: ${[...semCat].join(", ")}` : ""}`);
    toast.success("Importação concluída");
  };

  const Sel = ({ k }: { k: "codigo" | "nome" | "categoria" }) => (
    <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={map[k]} onChange={(e) => setMap({ ...map, [k]: e.target.value })}>
      <option value="">— ignorar —</option>
      {cols.map((c) => <option key={c}>{c}</option>)}
    </select>
  );

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Importar produtos (CSV)</h1>
      <p className="text-sm text-muted-foreground">Envie um CSV com cabeçalho. Produtos com o mesmo código são atualizados. A categoria é associada pelo nome ou slug.</p>
      <Input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {cols.length > 0 && (
        <div className="space-y-3 rounded-md border border-border bg-card p-4">
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
          {log && <p className="text-sm">{log}</p>}
        </div>
      )}
    </div>
  );
}
