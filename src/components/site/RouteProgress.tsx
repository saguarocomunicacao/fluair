import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

/** Barra fina no topo (estilo NProgress) durante navegações do site público. */
export function RouteProgress() {
  const loading = useRouterState({ select: (s) => s.status === "pending" || s.isLoading });
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [w, setW] = useState(0);
  const [vis, setVis] = useState(false);
  const t = useRef<ReturnType<typeof setInterval>>(undefined);
  const off = path.startsWith("/admin") || path === "/auth" || path === "/definir-senha";

  useEffect(() => {
    clearInterval(t.current);
    if (loading) {
      setVis(true); setW(8);
      t.current = setInterval(() => setW((v) => (v < 90 ? v + (90 - v) * 0.12 : v)), 180);
    } else if (vis) {
      setW(100);
      const h = setTimeout(() => { setVis(false); setW(0); }, 320);
      return () => clearTimeout(h);
    }
    return () => clearInterval(t.current);
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (off) return null;
  return (
    <div aria-hidden="true" style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999, pointerEvents: "none", opacity: vis ? 1 : 0, transition: "opacity .3s" }}>
      <div style={{ height: "100%", width: `${w}%`, background: "#116ad1", boxShadow: "0 0 10px #116ad1, 0 0 4px #116ad1", transition: "width .2s ease-out" }} />
    </div>
  );
}
