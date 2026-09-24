import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/lib/storage";

export function UploadField({ value, onChange, bucket, image }: { value: string; onChange: (v: string) => void; bucket: string; image?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      {value && image && <img src={value} alt="" className="h-24 rounded border border-border object-contain" />}
      {value && !image && <a href={value} target="_blank" rel="noreferrer" className="block truncate text-sm text-primary underline">Arquivo atual</a>}
      <Input
        type="file"
        accept={image ? "image/*" : undefined}
        disabled={busy}
        onChange={async (e) => {
          const f = e.target.files?.[0];
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
        }}
      />
      <Input placeholder="ou cole uma URL" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
