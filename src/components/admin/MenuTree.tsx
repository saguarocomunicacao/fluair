import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, StatusBadge } from "./kit";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown> & { id: string; parent_id: string | null; local: string; ordem: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function MenuTree({ rows, onEdit, onDelete, onNew, onChanged, perms = { criar: true, editar: true, excluir: true } }: {
  perms?: { criar: boolean; editar: boolean; excluir: boolean };
  rows: Row[]; onEdit: (r: Row) => void; onDelete: (r: Row) => void; onNew: (init: Record<string, unknown>) => void; onChanged: () => void;
}) {
  const [local, setLocal] = useState("header");
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; mode: "before" | "inside" } | null>(null);
  const items = rows.filter((r) => r.local === local);
  const children = (pid: string | null) => items.filter((r) => (r.parent_id ?? null) === pid).sort((a, b) => a.ordem - b.ordem);
  const isDesc = (id: string, anc: string): boolean => {
    const r = rows.find((x) => x.id === id);
    if (!r?.parent_id) return false;
    return r.parent_id === anc || isDesc(r.parent_id, anc);
  };

  const move = async (dragId: string, target: string | null, mode: "before" | "inside" | "end") => {
    if (dragId === target || (target && isDesc(target, dragId))) return;
    const t = target ? rows.find((r) => r.id === target)! : null;
    const newParent = mode === "inside" ? target : mode === "end" ? null : t?.parent_id ?? null;
    const sibs = children(newParent).filter((r) => r.id !== dragId);
    const idx = mode === "before" ? sibs.findIndex((r) => r.id === target) : sibs.length;
    const dragged = rows.find((r) => r.id === dragId)!;
    sibs.splice(idx, 0, dragged);
    const ups = sibs.map((r, i) => db.from("menus").update({ ordem: i, parent_id: newParent, local }).eq("id", r.id));
    const res = await Promise.all(ups);
    const err = res.find((x: { error: unknown }) => x.error);
    if (err) toast.error(err.error.message); else toast.success("Menu reorganizado");
    onChanged();
  };

  const Node = ({ r, depth }: { r: Row; depth: number }) => {
    const kids = children(r.id);
    return (
      <li>
        <div
          draggable
          onDragStart={(e) => { setDrag(r.id); e.dataTransfer.effectAllowed = "move"; }}
          onDragEnd={() => { setDrag(null); setOver(null); }}
          onDragOver={(e) => {
            e.preventDefault();
            const b = e.currentTarget.getBoundingClientRect();
            setOver({ id: r.id, mode: e.clientY - b.top < b.height / 2 ? "before" : "inside" });
          }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (drag && over) move(drag, r.id, over.mode); setOver(null); }}
          className={cn(
            "group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors",
            drag === r.id && "opacity-40",
            over?.id === r.id && over.mode === "before" && "border-t-2 border-t-brand-accent",
            over?.id === r.id && over.mode === "inside" && "bg-brand-accent-soft ring-2 ring-brand-accent/40",
          )}
          style={{ marginLeft: depth * 28 }}
        >
          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
          {depth > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="font-medium">{String(r["label_pt"] ?? "")}</span>
          <span className="truncate text-xs text-muted-foreground">{String(r["url"] ?? "")}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <StatusBadge tone={r["ativo"] ? "success" : "neutral"}>{r["ativo"] ? "Ativo" : "Inativo"}</StatusBadge>
            {perms.criar && <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Adicionar submenu" title="Adicionar submenu" onClick={() => onNew({ local, parent_id: r.id, ordem: kids.length })}><Plus className="h-4 w-4" /></Button>}
            {perms.editar && <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Editar" title="Editar" onClick={() => onEdit(r)}><Pencil className="h-4 w-4" /></Button>}
            {perms.excluir && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Excluir" title="Excluir" onClick={() => onDelete(r)}><Trash2 className="h-4 w-4" /></Button>}
          </span>
        </div>
        {kids.length > 0 && <ul className="mt-2 space-y-2">{kids.map((k) => <Node key={k.id} r={k} depth={depth + 1} />)}</ul>}
      </li>
    );
  };

  const roots = children(null);
  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={local} onValueChange={setLocal}>
          <TabsList><TabsTrigger value="header">Topo (header)</TabsTrigger><TabsTrigger value="footer">Rodapé (footer)</TabsTrigger></TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">Arraste para a metade de cima de um item para colocar antes; para a metade de baixo para virar submenu.</p>
      </div>
      {roots.length === 0 ? (
        <EmptyState text="Nenhum item neste menu ainda." onAdd={perms.criar ? () => onNew({ local, ordem: 0 }) : undefined} />
      ) : (
        <>
          <ul className="space-y-2">{roots.map((r) => <Node key={r.id} r={r} depth={0} />)}</ul>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (drag) move(drag, null, "end"); }}
            className="mt-3 rounded-lg border-2 border-dashed border-border py-3 text-center text-xs text-muted-foreground"
          >
            Solte aqui para mover para o final do menu principal
          </div>
        </>
      )}
    </div>
  );
}
