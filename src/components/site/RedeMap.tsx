import { useEffect, useRef } from "react";
import type { PontoRede } from "@/lib/site.functions";

const esc = (s: string | null | undefined) => (s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const digits = (s: string | null) => (s ?? "").replace(/\D/g, "");

/** Mapa (Leaflet, só no navegador) com todos os pontos; `selected` destaca e abre o pino. */
export function RedeMap({ pontos, selected, onSelect, labels }: {
  pontos: PontoRede[]; selected: string | null; onSelect: (id: string) => void; labels: { tel: string; wa: string };
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const markers = useRef(new Map<string, import("leaflet").Marker>());
  const Lref = useRef<typeof import("leaflet") | null>(null);

  const icon = (on: boolean) => {
    const L = Lref.current!;
    const c = on ? "#116ad1" : "#002860", s = on ? 30 : 22;
    return L.divIcon({ className: "", html: `<div style="width:${s}px;height:${s}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${c};border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.35)"></div>`, iconSize: [s, s], iconAnchor: [s / 2, s] });
  };

  useEffect(() => {
    let dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (dead || !el.current) return;
      Lref.current = L;
      map.current = L.map(el.current, { scrollWheelZoom: false }).setView([-15.8, -50], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map.current);
      draw();
    })();
    return () => { dead = true; map.current?.remove(); map.current = null; markers.current.clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = () => {
    const L = Lref.current, m = map.current;
    if (!L || !m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current.clear();
    const pts = pontos.filter((p) => p.lat != null && p.lng != null);
    pts.forEach((p) => {
      const tel = p.telefone ? `<br>${labels.tel}: <a href="tel:${digits(p.telefone)}">${esc(p.telefone)}</a>` : "";
      const wa = p.whatsapp ? `<br>${labels.wa}: <a target="_blank" rel="noopener" href="https://wa.me/55${digits(p.whatsapp)}">${esc(p.whatsapp)}</a>` : "";
      const mk = L.marker([p.lat!, p.lng!], { icon: icon(p.id === selected) }).addTo(m)
        .bindPopup(`<b>${esc(p.nome)}</b><br>${esc(p.endereco)}${p.endereco ? "<br>" : ""}${esc(p.cidade)}${p.estado ? "/" + esc(p.estado) : ""}${tel}${wa}`);
      mk.on("click", () => onSelect(p.id));
      markers.current.set(p.id, mk);
    });
    if (pts.length) m.fitBounds(L.latLngBounds(pts.map((p) => [p.lat!, p.lng!] as [number, number])), { padding: [40, 40], maxZoom: 13 });
  };

  useEffect(draw, [pontos]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!Lref.current) return;
    markers.current.forEach((mk, id) => mk.setIcon(icon(id === selected)));
    const mk = selected ? markers.current.get(selected) : null;
    if (mk && map.current) { map.current.setView(mk.getLatLng(), Math.max(map.current.getZoom(), 12)); mk.openPopup(); }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className="rede-map" />;
}
