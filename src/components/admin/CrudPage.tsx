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
import { EmptyState, PageHeader, Panel, StatusBadge } from "./kit";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
      {(data ?? []).map((r) => <option key={String(r["id"])} value={String(r["id"])}>{String(r[field.fk!.label])}</option>)}
    </select>
  );
}

function FieldInput({ field, col, form, set, bucket }: { field: Field; col: string; form: Row; set: (k: string, v: unknown) => void; bucket?: string | undefined }) {
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
    if (config.fields.some((f) => f.name === "publicado")) init["publicado"] = false;
    setIsNew(true); setEditing(init);
  };

  const save = async (): Promise<void> => {
    if (!editing) return;
    for (const f of config.fields) {
      const col = f.i18n ? `${f.name}_pt` : f.name;
      if (f.required && (editing[col] == null || editing[col] === "")) { toast.error(`Preencha: ${f.label}`); return; }
    }
    const payload: Row = {};
    for (const f of config.fields) {
      const cols = f.i18n ? [`${f.name}_pt`, `${f.name}_es`] : [f.name];
      for (const c of cols) {
        let v = editing[c];
        if (f.type === "json" && typeof v === "string") {
          try { v = v.trim() ? JSON.parse(v) : {}; } catch { toast.error("JSON inválido em " + f.label); return; }
        }
        if (v !== undefined) payload[c] = v === "" && f.type !== "text" ? null : v;
      }
    }
    setSaving(true);
    const res = isNew ? await db.from(config.table).insert(payload).select().single() : await db.from(config.table).update(payload).eq(pk, editing[pk]).select().single();
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["crud", config.table] });
    qc.invalidateQueries({ queryKey: ["fk", config.table] });
    if (isNew && config.gallery) { setIsNew(false); setEditing(res.data); } else setEditing(null);
  };

  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [page, setPage] = useState(0);
  const PER = 15;
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pages - 1);
  const visible = filtered.slice(cur * PER, cur * PER + PER);
  const imgField = config.fields.find((f) => f.type === "image");
  const boolCols = new Set(config.fields.filter((f) => f.type === "bool").map((f) => f.name));

  const remove = async (r: Row): Promise<void> => {
    const { error } = await db.from(config.table).delete().eq(pk, r[pk]);
    setToDelete(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["crud", config.table] });
  };

  const badge = (c: string, v: unknown) => {
    if (c === "publicado") return <StatusBadge tone={v ? "success" : "neutral"}>{v ? "Publicado" : "Rascunho"}</StatusBadge>;
    if (c === "ativo") return <StatusBadge tone={v ? "success" : "neutral"}>{v ? "Ativo" : "Inativo"}</StatusBadge>;
    return <StatusBadge tone={v ? "info" : "neutral"}>{v ? "Sim" : "Não"}</StatusBadge>;
  };

  const renderField = (f: Field, col: string, req: boolean) => (
    <div key={col} className={f.type === "bool" ? "flex items-center justify-between rounded-lg border border-border px-4 py-3" : "space-y-2"}>
      <Label className="text-sm font-medium">{f.label}{req && <span className="text-destructive"> *</span>}</Label>
      <FieldInput field={f} col={col} form={editing!} set={set} bucket={config.bucket} />
    </div>
  );

  return (
    <div>
      <PageHeader
        title={config.label}
        crumbs={["Conteúdo", config.label]}
        description={`${rows.length} ${rows.length === 1 ? "registro" : "registros"}`}
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="h-10 w-64 bg-card pl-9" />
            </div>
            <Button onClick={openNew} className="h-10"><Plus className="h-4 w-4" />Novo</Button>
          </>
        }
      />
      <Panel className="overflow-hidden">
        {!isLoading && filtered.length === 0 ? (
          <EmptyState text={q ? "Nada encontrado para essa busca." : `Nenhum item em ${config.label} ainda.`} onAdd={q ? undefined : openNew} />
        ) : (
          <div className="max-h-[calc(100vh-280px)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <TableRow className="hover:bg-transparent">
                  {config.listCols.map((c) => <TableHead key={c} className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.replace(/_pt$/, "").replace(/_/g, " ")}</TableHead>)}
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
                {visible.map((r) => (
                  <TableRow key={String(r[pk])} className="even:bg-muted/30 hover:bg-brand-accent-soft">
                    {config.listCols.map((c, i) => (
                      <TableCell key={c} className="py-3">
                        {boolCols.has(c) || typeof r[c] === "boolean" ? badge(c, r[c]) : i === 0 && imgField ? (
                          <div className="flex items-center gap-3">
                            {r[imgField.name] ? <img src={String(r[imgField.name])} alt="" className="h-9 w-9 rounded-lg border border-border object-cover" /> : <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>}
                            <span className="font-medium">{fmt(r[c])}</span>
                          </div>
                        ) : <span className={i === 0 ? "font-medium" : "text-muted-foreground"}>{fmt(r[c])}</span>}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Ações"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setIsNew(false); setEditing(r); }}><Pencil className="h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToDelete(r)} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {filtered.length > PER && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
            <span>{cur * PER + 1}–{Math.min(filtered.length, cur * PER + PER)} de {filtered.length}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={cur === 0} onClick={() => setPage(cur - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span>Página {cur + 1} de {pages}</span>
              <Button size="sm" variant="outline" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Panel>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este registro?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => toDelete && remove(toDelete)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="text-lg font-semibold">{isNew ? "Novo" : "Editar"} · {config.label}</DialogTitle>
          </DialogHeader>
          {editing && (
            <>
              <div key={String(editing[pk] ?? "new")} className="flex-1 space-y-6 overflow-y-auto bg-background px-6 py-6">
                {i18n.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-5">
                    <Tabs defaultValue="pt">
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Conteúdo traduzível</h3>
                        <TabsList><TabsTrigger value="pt">Português</TabsTrigger><TabsTrigger value="es">Español</TabsTrigger></TabsList>
                      </div>
                      {(["pt", "es"] as const).map((lang) => (
                        <TabsContent key={lang} value={lang} className="mt-0 space-y-5">
                          {i18n.map((f) => renderField(f, `${f.name}_${lang}`, !!f.required && lang === "pt"))}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </section>
                )}
                {shared.length > 0 && (
                  <section className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-5 text-sm font-semibold">Informações gerais</h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {shared.map((f) => (
                        <div key={f.name} className={["richtext", "textarea", "json", "image", "file"].includes(f.type) ? "sm:col-span-2" : ""}>
                          {renderField(f, f.name, !!f.required)}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {config.gallery && !isNew && typeof editing["id"] === "string" && (
                  <section className="rounded-xl border border-border bg-card p-5"><Gallery produtoId={editing["id"]} /></section>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-border bg-card px-6 py-4">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={save} disabled={saving} className="min-w-28">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando…</> : "Salvar"}</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
