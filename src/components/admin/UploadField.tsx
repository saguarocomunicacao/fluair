import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function UploadField({ value, onChange, bucket, image }: { value: string; onChange: (v: string) => void; bucket: string; image?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const send = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadFile(bucket, f));
      toast.success("Upload concluído");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && ref.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); send(e.dataTransfer.files?.[0]); }}
        className={cn(
          "flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-input bg-background p-4 transition-colors hover:border-brand-accent/50 hover:bg-brand-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          drag && "border-brand-accent bg-brand-accent-soft",
        )}
      >
        {value && image ? (
          <img src={value} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-border bg-card object-contain" />
        ) : value ? (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-muted"><FileText className="h-7 w-7 text-muted-foreground" /></div>
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-brand-accent-soft text-brand-accent">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
          </div>
        )}
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-medium">{busy ? "Enviando…" : "Arraste e solte ou clique para enviar"}</div>
          <div className="text-xs text-muted-foreground">{image ? "PNG, JPG ou WEBP" : "Qualquer arquivo"}</div>
          {value && !image && <a href={value} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mt-1 block truncate text-xs text-brand-accent underline">Abrir arquivo atual</a>}
        </div>
        {value && (
          <button type="button" aria-label="Remover" onClick={(e) => { e.stopPropagation(); onChange(""); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"><X className="h-4 w-4" /></button>
        )}
        <input ref={ref} type="file" hidden accept={image ? "image/*" : undefined} onChange={(e) => { send(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <Input placeholder="ou cole uma URL" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-9 text-xs" />
    </div>
  );
}
