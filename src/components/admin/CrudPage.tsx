import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Field, TableConfig } from "@/lib/admin-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RichText } from "./RichText";
import { UploadField } from "./UploadField";
import { Gallery } from "./Gallery";

type Row = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function FkSelect({ field, value, onChange }: { field: Field; value: string; onChange: (v: string | null) => void }) {
  const { data } = useQuery({
    queryKey: ["fk", field.fk!.table],
    queryFn: async () => (await db.from(field.fk!.table).select(`id, ${field.fk!.label}`).order(field.fk!.label)).data as Row[],
  });
  return (
    <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">— nenhum —</option>
      {(data ?? []).map((r) => <option key={String(r.id)} value={String(r.id)}>{String(r[field.fk!.label])}</option>)}
    </select>
  );
}

function FieldInput({ field, col, form, set, bucket }: { field: Field; col: string; form: Row; set: (k: string, v: unknown) => void; bucket?: string }) {
  const v = form[col];
  switch (field.type) {
    case "textarea": return <Textarea value={(v as string) ?? ""} onChange={(e) => set(col, e.target.value)} />;
    case "richtext": return <RichText value={(v as string) ?? ""} onChange={(x) => set(col, x)} />;
    case "number": return <Input type="number" step="any" value={v == null ? "" : String(v)} onChange={(e) => set(col, e.target.value === "" ? null : Number(e.target.value))} />;
    case "bool": return <Switch checked={!!v} onCheckedChange={(c) => set(col, c)} />;
    case "image": case "file": return <UploadField bucket={bucket ?? "banners"} image={field.type === "image"} value={(v as string) ?? ""} onChange={(x) => set(col, x)} />;
    case "json": return <Textarea className="font-mono text-xs" rows={5} value={typeof v === "string" ? v : JSON.stringify(v ?? {}, null, 2)} onChange={(e) => set(col, e.target.value)} />;
    case "select": return (
      <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={(v as string) ?? ""} onChange={(e) => set(col, e.target.value)}>
        {field.options!.map((o) => <option key={o}>{o}</option>)}
      </select>
    );
    case "fk": return <FkSelect field={field} value={v as string} onChange={(x) => set(col, x)} />;
    case "datetime": return <Input type="datetime-local" value={v ? String(v).slice(0, 16) : ""} onChange={(e) => set(col, e.target.value ? new Date(e.target.value).toISOString() : null)} />;
    default: return <Input value={(v as string) ?? ""} onChange={(e) => set(col, e.target.value)} />;
  }
}

function fmt(v: unknown) {
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (v == null) return "—";
  const s = String(v);
  if (/^\d{4}-\d\d-\d\dT/.test(s)) return new Date(s).toLocaleString("pt-BR");
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

export function CrudPage({ config }: { config: TableConfig }) {
  const pk = config.pk ?? "id";
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["crud", config.table],
    queryFn: async () => {
      const { data, error } = await db.from(config.table).select("*").order(config.orderBy ?? pk, { ascending: !!config.orderAsc, nullsFirst: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => config.searchCols.some((c) => String(r[c] ?? "").toLowerCase().includes(s)));
  }, [rows, q, config.searchCols]);

  const shared = config.fields.filter((f) => !f.i18n);
  const i18n = config.fields.filter((f) => f.i18n);
  const set = (k: string, v: unknown) => setEditing((p) => ({ ...p!, [k]: v }));

  const openNew = () => {
    const init: Row = {};
    config.fields.forEach((f) => { if (f.type === "bool") init[f.name] = true; if (f.name === "destaque") init[f.name] = false; if (f.type === "select") init[f.name] = f.options![0]; });
    if (config.fields.some((f) => f.name === "publicado")) init.publicado = false;
    setIsNew(true); setEditing(init);
  };

  const save = async () => {
    if (!editing) return;
    for (const f of config.fields) {
      const col = f.i18n ? `${f.name}_pt` : f.name;
      if (f.required && (editing[col] == null || editing[col] === "")) return toast.error(`Preencha: ${f.label}`);
    }
    const payload: Row = {};
    for (const f of config.fields) {
      const cols = f.i18n ? [`${f.name}_pt`, `${f.name}_es`] : [f.name];
      for (const c of cols) {
        let v = editing[c];
        if (f.type === "json" && typeof v === "string") {
          try { v = v.trim() ? JSON.parse(v) : {}; } catch { return toast.error("JSON inválido em " + f.label); }
        }
        if (v !== undefined) payload[c] = v === "" && f.type !== "text" ? null : v;
      }
    }
    setSaving(true);
    const res = isNew ? await db.from(config.table).insert(payload).select().single() : await db.from(config.table).update(payload).eq(pk, editing[pk]).select().single();
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["crud", config.table] });
    qc.invalidateQueries({ queryKey: ["fk", config.table] });
    if (isNew && config.gallery) { setIsNew(false); setEditing(res.data); } else setEditing(null);
  };

  const remove = async (r: Row) => {
    if (!confirm("Excluir este registro?")) return;
    const { error } = await db.from(config.table).delete().eq(pk, r[pk]);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["crud", config.table] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{config.label}</h1>
        <div className="flex gap-2">
          <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="w-60" />
          <Button onClick={openNew}>Novo</Button>
        </div>
      </div>
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {config.listCols.map((c) => <TableHead key={c}>{c.replace(/_pt$/, "").replace(/_/g, " ")}</TableHead>)}
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9}>Carregando…</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-muted-foreground">Nenhum registro.</TableCell></TableRow>}
            {filtered.map((r) => (
              <TableRow key={String(r[pk])}>
                {config.listCols.map((c) => <TableCell key={c}>{fmt(r[c])}</TableCell>)}
                <TableCell className="space-x-1 text-right">
                  <Button size="sm" variant="outline" onClick={() => { setIsNew(false); setEditing(r); }}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(r)}>Excluir</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{isNew ? "Novo" : "Editar"} — {config.label}</DialogTitle></DialogHeader>
          {editing && (
            <div key={String(editing[pk] ?? "new")} className="space-y-4">
              {shared.map((f) => (
                <div key={f.name} className="space-y-1">
                  <Label>{f.label}{f.required && " *"}</Label>
                  <FieldInput field={f} col={f.name} form={editing} set={set} bucket={config.bucket} />
                </div>
              ))}
              {i18n.length > 0 && (
                <Tabs defaultValue="pt">
                  <TabsList><TabsTrigger value="pt">Português</TabsTrigger><TabsTrigger value="es">Español</TabsTrigger></TabsList>
                  {(["pt", "es"] as const).map((lang) => (
                    <TabsContent key={lang} value={lang} className="space-y-4">
                      {i18n.map((f) => (
                        <div key={f.name} className="space-y-1">
                          <Label>{f.label}{f.required && lang === "pt" && " *"}</Label>
                          <FieldInput field={f} col={`${f.name}_${lang}`} form={editing} set={set} bucket={config.bucket} />
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              {config.gallery && !isNew && typeof editing.id === "string" && <Gallery produtoId={editing.id} />}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
