import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function Gallery({ produtoId }: { produtoId: string }) {
  const qc = useQueryClient();
  const key = ["galeria", produtoId];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => (await supabase.from("produto_imagens").select("*").eq("produto_id", produtoId).order("ordem")).data ?? [],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <Label>Galeria de imagens</Label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.map((img) => (
          <div key={img.id} className="space-y-1 rounded border border-border p-2">
            <img src={img.url} alt={img.alt_pt ?? ""} className="h-24 w-full object-contain" />
            <Input placeholder="Alt PT" defaultValue={img.alt_pt ?? ""} onBlur={async (e) => { await supabase.from("produto_imagens").update({ alt_pt: e.target.value }).eq("id", img.id); }} />
            <Input placeholder="Alt ES" defaultValue={img.alt_es ?? ""} onBlur={async (e) => { await supabase.from("produto_imagens").update({ alt_es: e.target.value }).eq("id", img.id); }} />
            <Input type="number" placeholder="Ordem" defaultValue={img.ordem} onBlur={async (e) => { await supabase.from("produto_imagens").update({ ordem: Number(e.target.value) }).eq("id", img.id); refresh(); }} />
            <Button size="sm" variant="destructive" className="w-full" onClick={async () => { await supabase.from("produto_imagens").delete().eq("id", img.id); refresh(); }}>Remover</Button>
          </div>
        ))}
      </div>
      <Input type="file" accept="image/*" multiple onChange={async (e) => {
        const files = Array.from(e.target.files ?? []);
        try {
          for (const [i, f] of files.entries()) {
            const url = await uploadFile("produtos", f);
            const { error } = await supabase.from("produto_imagens").insert({ produto_id: produtoId, url, ordem: data.length + i });
            if (error) throw error;
          }
          toast.success("Imagens adicionadas");
          refresh();
        } catch (err) { toast.error((err as Error).message); }
        e.target.value = "";
      }} />
    </div>
  );
}
