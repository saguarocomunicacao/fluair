import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function Gallery({ produtoId }: { produtoId: string }) {
  const qc = useQueryClient();
  const key = ["galeria", produtoId];
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => (await supabase.from("produto_imagens").select("*").eq("produto_id", produtoId).order("ordem")).data ?? [],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const persist = async (ids: string[]) => {
    await Promise.all(ids.map((id, i) => supabase.from("produto_imagens").update({ ordem: i }).eq("id", id)));
    refresh();
  };
  const moveTo = (from: string, toIdx: number) => {
    const ids = data.map((d) => d.id).filter((x) => x !== from);
    ids.splice(toIdx, 0, from);
    persist(ids).then(() => toast.success(toIdx === 0 ? "Imagem principal definida" : "Ordem atualizada"));
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("produto_imagens").delete().eq("id", toDelete);
    setToDelete(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Imagem removida");
    refresh();
  };

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    try {
      for (const [i, f] of files.entries()) {
        const url = await uploadFile("produtos", f);
        const { error } = await supabase.from("produto_imagens").insert({ produto_id: produtoId, url, ordem: data.length + i });
        if (error) throw error;
      }
      toast.success(`${files.length} imagem(ns) adicionada(s)`);
      refresh();
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Galeria de imagens</h3>
        <span className="text-xs text-muted-foreground">Arraste para reordenar · a primeira é a principal</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.map((img, idx) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => setDrag(img.id)}
            onDragEnd={() => setDrag(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (drag && drag !== img.id) moveTo(drag, idx); }}
            className={cn("group relative space-y-2 rounded-lg border bg-background p-2", idx === 0 ? "border-brand-accent ring-1 ring-brand-accent/40" : "border-border", drag === img.id && "opacity-40")}
          >
            <div className="relative">
              <img src={img.url} alt={img.alt_pt ?? ""} className="h-28 w-full rounded-md bg-card object-contain" />
              {idx === 0 && <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground"><Star className="h-3 w-3" />Principal</span>}
              <GripVertical className="absolute right-1 top-1 h-4 w-4 cursor-grab text-muted-foreground" />
            </div>
            <Input className="h-8 text-xs" placeholder="Texto alternativo PT" defaultValue={img.alt_pt ?? ""} onBlur={async (e) => { await supabase.from("produto_imagens").update({ alt_pt: e.target.value }).eq("id", img.id); }} />
            <Input className="h-8 text-xs" placeholder="Texto alternativo ES" defaultValue={img.alt_es ?? ""} onBlur={async (e) => { await supabase.from("produto_imagens").update({ alt_es: e.target.value }).eq("id", img.id); }} />
            <div className="flex gap-1">
              {idx !== 0 && <Button type="button" size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => moveTo(img.id, 0)}><Star className="h-3 w-3" />Principal</Button>}
              <Button type="button" size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" aria-label="Remover imagem" title="Remover imagem" onClick={() => setToDelete(img.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) upload(Array.from(e.dataTransfer.files)); }}
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input text-sm text-muted-foreground hover:border-brand-accent/50 hover:bg-brand-accent-soft"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
          {busy ? "Enviando…" : "Adicionar imagens"}
        </button>
      </div>
      <input ref={ref} type="file" hidden accept="image/*" multiple onChange={(e) => { upload(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta imagem?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
