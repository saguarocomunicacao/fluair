import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type KV = Record<string, string>;

export function KvEditor({ value, onChange }: { value: unknown; onChange: (v: KV) => void }) {
  const toPairs = (v: unknown): [string, string][] =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.entries(v as KV).map(([k, x]) => [k, String(x ?? "")]) : [];
  const [pairs, setPairs] = useState<[string, string][]>(() => toPairs(value));
  const push = (p: [string, string][]) => {
    setPairs(p);
    const o: KV = {};
    p.forEach(([k, v]) => { if (k.trim()) o[k.trim()] = v; });
    onChange(o);
  };
  return (
    <div className="space-y-2">
      {pairs.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma especificação. Ex.: Rosca = M16, Linha = ABS.</p>}
      {pairs.map(([k, v], i) => (
        <div key={i} className="flex gap-2">
          <Input placeholder="Chave (ex.: Rosca)" value={k} onChange={(e) => push(pairs.map((p, j) => (j === i ? [e.target.value, p[1]] : p)))} />
          <Input placeholder="Valor (ex.: M16)" value={v} onChange={(e) => push(pairs.map((p, j) => (j === i ? [p[0], e.target.value] : p)))} />
          <Button type="button" size="icon" variant="ghost" aria-label="Remover" onClick={() => push(pairs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => setPairs([...pairs, ["", ""]])}><Plus className="h-4 w-4" />Adicionar especificação</Button>
    </div>
  );
}

export function MapPicker({ lat, lng, onChange }: { lat: number | null; lng: number | null; onChange: (lat: number, lng: number) => void }) {
  const el = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marker = useRef<any>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (dead || !el.current) return;
      const start: [number, number] = lat != null && lng != null ? [lat, lng] : [-27.64, -48.67];
      map = L.map(el.current).setView(start, lat != null ? 14 : 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      const icon = L.divIcon({ className: "", html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:hsl(215 80% 40%);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>', iconSize: [22, 22], iconAnchor: [11, 22] });
      marker.current = L.marker(start, { draggable: true, icon }).addTo(map);
      marker.current.on("dragend", () => { const p = marker.current.getLatLng(); cb.current(+p.lat.toFixed(6), +p.lng.toFixed(6)); });
      map.on("click", (e) => { marker.current.setLatLng(e.latlng); cb.current(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)); });
    })();
    return () => { dead = true; map?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (marker.current && lat != null && lng != null) marker.current.setLatLng([lat, lng]); }, [lat, lng]);

  return (
    <div>
      <div ref={el} className="h-64 w-full overflow-hidden rounded-lg border border-border" />
      <p className="mt-1 text-xs text-muted-foreground">Clique no mapa ou arraste o pino para ajustar latitude e longitude.</p>
    </div>
  );
}

const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function FileMeta({ url }: { url: string | null }) {
  const [size, setSize] = useState<string | null>(null);
  const ext = url ? (url.split("?")[0]!.split(".").pop() ?? "").toUpperCase() : "";
  useEffect(() => {
    if (!url) return;
    fetch(url, { method: "HEAD" }).then((r) => { const l = r.headers.get("content-length"); if (l) setSize(fmtSize(+l)); }).catch(() => {});
  }, [url]);
  if (!url) return <span className="text-muted-foreground">Sem arquivo</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <FileText className="h-4 w-4" />
      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">{ext || "ARQ"}</span>
      {size ?? "…"}
    </a>
  );
}
