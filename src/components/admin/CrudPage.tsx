import { Fragment, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UFS, slugify, type Field, type TableConfig } from "@/lib/admin-config";
import { FileMeta, KvEditor, MapPicker } from "./fields";
import { MenuTree } from "./MenuTree";
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
import { GripVertical, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
    case "richtext": return <RichText value={(v as string) ?? ""} onChange={(x) => set(col, x)} bucket={bucket ?? "banners"} />;
    case "number": return <Input type="number" step="any" value={v == null ? "" : String(v)} onChange={(e) => set(col, e.target.value === "" ? null : Number(e.target.value))} />;
    case "bool": return <Switch checked={!!v} onCheckedChange={(c) => set(col, c)} />;
    case "image": case "file": return <UploadField bucket={bucket ?? "banners"} image={field.type === "image"} value={(v as string) ?? ""} onChange={(x) => set(col, x)} />;
    case "json": return <Textarea className="font-mono text-xs" rows={5} value={typeof v === "string" ? v : JSON.stringify(v ?? {}, null, 2)} onChange={(e) => set(col, e.target.value)} />;
    case "select": return (
      <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={(v as string) ?? ""} onChange={(e) => set(col, e.target.value)}>
        {field.options!.map((o) => <option key={o}>{o}</option>)}
      </select>
    );
    case "kv": return <KvEditor value={v} onChange={(x) => set(col, x)} />;
    case "uf": return (
      <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={(v as string) ?? ""} onChange={(e) => set(col, e.target.value || null)}>
        <option value="">— selecione —</option>
        {UFS.map((u) => <option key={u}>{u}</option>)}
      </select>
    );
    case "map": return <MapPicker lat={(form["lat"] as number) ?? null} lng={(form["lng"] as number) ?? null} onChange={(la, ln) => { set("lat", la); set("lng", ln); }} />;
    case "fk": return <FkSelect field={field} value={v as string} onChange={(x) => set(col, x)} />;
    case "datetime": return <Input type="datetime-local" value={v ? String(v).slice(0, 16) : ""} onChange={(e) => set(col, e.target.value ? new Date(e.target.value).toISOString() : null)} />;
    default: return <Input value={(v as string) ?? ""} onChange={(e) => set(col, e.target.value)} />;
  }
}

const COL_LABEL: Record<string, string> = { nome_pt: "Nome", titulo_pt: "Título", pergunta_pt: "Pergunta", label_pt: "Rótulo", categoria_id: "Categoria", arquivo_url: "Arquivo", capa_url: "Capa", publicado_em: "Data", atualizado_em: "Atualizado", codigo: "Código", valor_pt: "Valor" };

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

  const [flt, setFlt] = useState<Record<string, string>>({});
  const cols = [...config.listCols.filter((c) => c === "ordem"), ...config.listCols.filter((c) => c !== "ordem")];
  const firstCol = cols.find((c) => c !== "ordem");
  const colW = (c: string) => c === "ordem" ? "w-16 whitespace-nowrap text-center" : (c === "ativo" || c === "publicado" || c === "destaque") ? "w-px whitespace-nowrap" : "";
  const fkCol = config.fields.find((f) => f.type === "fk" && config.listCols.includes(f.name));
  const { data: fkRows = [] } = useQuery({
    queryKey: ["fk", fkCol?.fk?.table ?? "none"],
    enabled: !!fkCol,
    queryFn: async () => (await db.from(fkCol!.fk!.table).select(`id, ${fkCol!.fk!.label}`).order(fkCol!.fk!.label)).data as Row[],
  });
  const fkName = (id: unknown) => { const r = fkRows.find((x) => x["id"] === id); return r ? String(r[fkCol!.fk!.label]) : "—"; };

  // Miniaturas da galeria (ex.: produtos): primeira imagem de cada registro
  const { data: thumbs = {} } = useQuery({
    queryKey: ["crud-thumbs", config.table],
    enabled: !!config.gallery,
    queryFn: async () => {
      const { data } = await db.from("produto_imagens").select("produto_id, url").order("ordem", { ascending: true, nullsFirst: false });
      const m: Record<string, string> = {};
      for (const r of (data ?? []) as Row[]) { const k = String(r["produto_id"]); if (!m[k]) m[k] = String(r["url"]); }
      return m;
    },
  });
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = rows.filter((r) => Object.entries(flt).every(([c, v]) => !v || (v === "true" ? r[c] === true : v === "false" ? r[c] === false : String(r[c] ?? "") === v)));
    if (s) out = out.filter((r) => config.searchCols.some((c) => String(r[c] ?? "").toLowerCase().includes(s)));
    if (config.groupBy) {
      const g = config.groupBy;
      out = [...out].sort((a, b) => String(a[g] ?? "").localeCompare(String(b[g] ?? "")) || Number(a["ordem"] ?? 0) - Number(b["ordem"] ?? 0));
    }
    return out;
  }, [rows, q, flt, config.searchCols, config.groupBy]);
  const canDrag = !!config.reorder && !q && Object.values(flt).every((v) => !v);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const reorder = async (from: string, to: string) => {
    if (from === to) return;
    const src = filtered.find((r) => String(r[pk]) === from)!;
    const dst = filtered.find((r) => String(r[pk]) === to)!;
    const g = config.groupBy;
    if (g && (src[g] ?? "") !== (dst[g] ?? "")) { toast.error("Só é possível reordenar dentro do mesmo grupo"); return; }
    const list = filtered.filter((r) => !g || (r[g] ?? "") === (src[g] ?? "")).filter((r) => r !== src);
    list.splice(list.indexOf(dst) + (filtered.indexOf(src) < filtered.indexOf(dst) ? 1 : 0), 0, src);
    const res = await Promise.all(list.map((r, i) => (r["ordem"] === i ? null : db.from(config.table).update({ ordem: i }).eq(pk, r[pk]))).filter(Boolean));
    const err = res.find((x: { error: { message: string } | null }) => x?.error);
    if (err) toast.error(err.error.message); else toast.success("Ordem atualizada");
    qc.invalidateQueries({ queryKey: ["crud", config.table] });
  };

  const shared = config.fields.filter((f) => !f.i18n);
  const i18n = config.fields.filter((f) => f.i18n);
  const [slugTouched, setSlugTouched] = useState(false);
  const set = (k: string, v: unknown) => {
    if (k === "slug") setSlugTouched(true);
    setEditing((p) => {
      const n = { ...p!, [k]: v };
      if (config.slugFrom && k === `${config.slugFrom}_pt` && !slugTouched && isNew) n["slug"] = slugify(String(v ?? ""));
      return n;
    });
  };

  const openNew = (extra?: Row) => {
    const init: Row = {};
    setSlugTouched(false);
    config.fields.forEach((f) => { if (f.type === "bool") init[f.name] = true; if (f.name === "destaque") init[f.name] = false; if (f.type === "select") init[f.name] = f.options![0]; });
    if (config.fields.some((f) => f.name === "publicado")) init["publicado"] = false;
    if (config.fields.some((f) => f.name === "ordem")) init["ordem"] = rows.length;
    Object.assign(init, extra ?? {});
    setIsNew(true); setEditing(init);
  };

  const save = async (): Promise<void> => {
    if (!editing) return;
    for (const f of config.fields) {
      if (f.name.startsWith("_")) continue;
      const col = f.i18n ? `${f.name}_pt` : f.name;
      if (f.required && (editing[col] == null || editing[col] === "")) { toast.error(`Preencha: ${f.label}`); return; }
    }
    const payload: Row = {};
    for (const f of config.fields) {
      if (f.name.startsWith("_")) continue;
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
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
            <Button onClick={() => openNew()} className="h-10"><Plus className="h-4 w-4" />Novo</Button>
          </>
        }
      />
      </div>
      {config.filters && (
        <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
          {config.filters.map((fl) => (
            <label key={fl.col} className="flex items-center gap-2 text-sm text-muted-foreground">
              {fl.label}
              <select className="h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground" value={flt[fl.col] ?? ""} onChange={(e) => { setFlt({ ...flt, [fl.col]: e.target.value }); setPage(0); }}>
                <option value="">Todos</option>
                {fl.kind === "bool" && <><option value="true">Sim</option><option value="false">Não</option></>}
                {fl.kind === "uf" && UFS.map((u) => <option key={u}>{u}</option>)}
                {fl.kind === "fk" && fkRows.map((r) => <option key={String(r["id"])} value={String(r["id"])}>{String(r[fl.fk!.label])}</option>)}
              </select>
            </label>
          ))}
          {Object.values(flt).some(Boolean) && <Button size="sm" variant="ghost" onClick={() => setFlt({})}>Limpar filtros</Button>}
        </div>
      )}
      {config.reorder && !config.groupBy && config.table !== "menus" && filtered.length > 1 && (
        <p className="mb-2 text-xs text-muted-foreground">{canDrag ? "Arraste as linhas pelo ícone ⋮⋮ para reordenar." : "Limpe a busca e os filtros para reordenar."}</p>
      )}
      {config.table === "menus" ? (
        <Panel className="min-h-0 flex-1 overflow-auto">
          <MenuTree
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rows={filtered as any}
            onEdit={(r) => { setIsNew(false); setEditing(r); }}
            onDelete={(r) => setToDelete(r)}
            onNew={(init) => openNew(init)}
            onChanged={() => qc.invalidateQueries({ queryKey: ["crud", "menus"] })}
          />
        </Panel>
      ) : (
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {!isLoading && filtered.length === 0 ? (
          <EmptyState text={q ? "Nada encontrado para essa busca." : `Nenhum item em ${config.label} ainda.`} onAdd={q ? undefined : () => openNew()} />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {config.reorder && <TableHead className="sticky top-0 z-10 w-8 bg-muted" />}
                  {config.gallery && <TableHead className="sticky top-0 z-10 w-14 bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[inset_0_-1px_0_0_hsl(var(--border))]">Foto</TableHead>}
                  {cols.map((c) => <TableHead key={c} className={`${colW(c)} sticky top-0 z-10 h-11 bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[inset_0_-1px_0_0_hsl(var(--border))]`}>{COL_LABEL[c] ?? c.replace(/_pt$/, "").replace(/_/g, " ")}</TableHead>)}
                  <TableHead className="sticky top-0 z-10 w-px whitespace-nowrap bg-muted text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[inset_0_-1px_0_0_hsl(var(--border))]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
                {visible.map((r, idx) => {
                  const g = config.groupBy;
                  const newGroup = g && (idx === 0 || (visible[idx - 1]![g] ?? "") !== (r[g] ?? ""));
                  const id = String(r[pk]);
                  return (<Fragment key={id}>
                  {newGroup && (
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableCell colSpan={config.listCols.length + 2} className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {config.groupLabels?.[String(r[g!])] ?? (String(r[g!] ?? "") || "Sem categoria")}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow
                    draggable={canDrag}
                    onDragStart={() => setDragId(id)}
                    onDragEnd={() => { setDragId(null); setOverId(null); }}
                    onDragOver={(e) => { if (canDrag) { e.preventDefault(); setOverId(id); } }}
                    onDrop={(e) => { e.preventDefault(); if (dragId) reorder(dragId, id); setOverId(null); }}
                    className={`hover:bg-brand-accent-soft ${dragId === id ? "opacity-40" : ""} ${overId === id && dragId !== id ? "border-t-2 border-t-brand-accent" : ""}`}>
                    {config.reorder && <TableCell className="w-8 pr-0">{canDrag && <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />}</TableCell>}
                    {config.gallery && (
                      <TableCell className="w-14 py-2">
                        {thumbs[id] ? (
                          <button type="button" onClick={() => setLightbox(thumbs[id]!)} className="block cursor-zoom-in rounded-lg border border-border transition hover:ring-2 hover:ring-brand-accent" aria-label="Ampliar imagem" title="Ampliar imagem">
                            <img src={thumbs[id]} alt="" className="h-11 w-11 rounded-lg object-cover" loading="lazy" />
                          </button>
                        ) : (
                          <div className="grid h-11 w-11 place-items-center rounded-lg bg-muted"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                      </TableCell>
                    )}
                    {cols.map((c) => { const i = c === firstCol ? 0 : 1; return (
                      <TableCell key={c} className={`py-3 ${colW(c)}`}>
                        {boolCols.has(c) || typeof r[c] === "boolean" ? badge(c, r[c]) : c === fkCol?.name ? <span className="text-muted-foreground">{fkName(r[c])}</span> : c === "arquivo_url" ? <FileMeta url={(r[c] as string) ?? null} /> : c === imgField?.name ? (
                          r[c] ? <img src={String(r[c])} alt="" className="h-10 w-16 rounded-md border border-border object-cover" /> : <div className="grid h-10 w-16 place-items-center rounded-md bg-muted"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                        ) : i === 0 && imgField ? (
                          <div className="flex items-center gap-3">
                            {r[imgField.name] ? <img src={String(r[imgField.name])} alt="" className="h-9 w-9 rounded-lg border border-border object-cover" /> : <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>}
                            <span className="font-medium">{fmt(r[c])}</span>
                          </div>
                        ) : <span className={i === 0 ? "font-medium" : "text-muted-foreground"}>{fmt(r[c])}</span>}
                      </TableCell>
                    ); })}
                    <TableCell className="w-px whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Editar" title="Editar" onClick={() => { setIsNew(false); setEditing(r); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Excluir" title="Excluir" onClick={() => setToDelete(r)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  </Fragment>);
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {filtered.length > PER && (
          <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
            <span>{cur * PER + 1}–{Math.min(filtered.length, cur * PER + PER)} de {filtered.length}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={cur === 0} onClick={() => setPage(cur - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span>Página {cur + 1} de {pages}</span>
              <Button size="sm" variant="outline" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Panel>
      )}

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none [&>button]:text-white">
          {lightbox && <img src={lightbox} alt="Imagem ampliada" className="mx-auto max-h-[85vh] w-auto rounded-xl bg-white object-contain" />}
        </DialogContent>
      </Dialog>

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
                        <div key={f.name} className={["richtext", "textarea", "json", "image", "file", "kv", "map"].includes(f.type) ? "sm:col-span-2" : ""}>
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
