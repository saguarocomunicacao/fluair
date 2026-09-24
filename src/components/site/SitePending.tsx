import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { SiteLayout } from "./SiteLayout";
import { getSiteChrome } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });

export type SkelKind = "home" | "grid" | "ficha" | "list" | "cards" | "faq" | "news" | "post" | "page";

const B = ({ w = "100%", h = 14, r = 8, style }: { w?: number | string; h?: number; r?: number; style?: React.CSSProperties }) =>
  <span className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;

const Head = () => (
  <div className="page-head"><div className="wrap">
    <B w={140} h={12} style={{ opacity: .5 }} /><B w={320} h={40} style={{ marginTop: 14, opacity: .5 }} /><B w={420} h={14} style={{ marginTop: 16, opacity: .4 }} />
  </div><div className="dash" /></div>
);
const Card = () => (
  <div className="pcard"><div className="ph"><span className="sk" style={{ position: "absolute", inset: 0, borderRadius: 0 }} /></div>
    <div className="b"><B w={80} h={11} /><B w="85%" h={16} style={{ marginTop: 6 }} /><B w={90} h={12} style={{ marginTop: 6 }} /><B w={170} h={34} r={999} style={{ marginTop: 16 }} /></div></div>
);
const Grid = ({ n = 6 }: { n?: number }) => <div className="pgrid">{Array.from({ length: n }, (_, i) => <Card key={i} />)}</div>;
const Toolbar = () => <div className="catalog-top"><B w={360} h={48} r={14} /><B w={180} h={42} r={12} /></div>;

function Body({ kind }: { kind: SkelKind }) {
  switch (kind) {
    case "home": return (<>
      <div className="page-head" style={{ minHeight: "70vh" }}><div className="wrap" style={{ paddingTop: 120 }}><B w="60%" h={70} style={{ opacity: .45 }} /><B w="40%" h={70} style={{ marginTop: 14, opacity: .45 }} /></div></div>
      <div className="wrap sk-sec"><Grid n={3} /></div>
    </>);
    case "grid": return (<><Head /><div className="wrap sk-sec"><Toolbar /><div style={{ height: 22 }} /><Grid n={9} /></div></>);
    case "ficha": return (<><Head /><div className="wrap sk-sec sk-ficha">
      <span className="sk" style={{ aspectRatio: "1/1", borderRadius: 22 }} />
      <div><B w={120} h={12} /><B w={200} h={38} style={{ marginTop: 14 }} /><B w="90%" h={22} style={{ marginTop: 14 }} />
        {Array.from({ length: 5 }, (_, i) => <B key={i} h={14} style={{ marginTop: 14 }} w={`${90 - i * 8}%`} />)}
        <B w={260} h={54} r={999} style={{ marginTop: 30 }} /></div>
    </div></>);
    case "list": return (<><Head /><div className="wrap sk-sec"><Toolbar />
      {Array.from({ length: 5 }, (_, i) => <div className="dl-item" key={i} style={{ marginTop: 12 }}><B w={56} h={56} r={14} /><div><B w="50%" h={16} /><B w="70%" h={12} style={{ marginTop: 8 }} /></div><B w={110} h={38} r={999} /></div>)}
    </div></>);
    case "cards": return (<><Head /><div className="wrap sk-sec"><Toolbar />
      <div className="rep-grid">{Array.from({ length: 6 }, (_, i) => <div className="rep" key={i}><B w={40} h={20} r={6} /><B w="70%" h={18} style={{ marginTop: 12 }} /><B w="50%" h={12} style={{ marginTop: 8 }} /><B w="80%" h={30} r={999} style={{ marginTop: 16 }} /></div>)}</div>
    </div></>);
    case "faq": return (<><Head /><div className="wrap sk-sec" style={{ maxWidth: 900 }}><Toolbar /><div className="faq-acc" style={{ marginTop: 30 }}>
      {Array.from({ length: 6 }, (_, i) => <div className="faq-q" key={i} style={{ padding: "22px 24px", display: "flex", justifyContent: "space-between" }}><B w={`${75 - i * 5}%`} h={16} /><B w={30} h={30} r={99} /></div>)}
    </div></div></>);
    case "news": return (<><Head /><div className="wrap sk-sec"><Toolbar /><div className="ngrid">
      {Array.from({ length: 6 }, (_, i) => <div className="ncard" key={i}><span className="sk" style={{ aspectRatio: "16/10", borderRadius: 0 }} /><div className="bd"><B w={120} h={11} /><B w="85%" h={22} /><B w="95%" h={12} /><B w="70%" h={12} /></div></div>)}
    </div></div></>);
    case "post":
    case "page": return (<><Head /><div className="wrap"><div className="inst">
      {Array.from({ length: 9 }, (_, i) => <B key={i} h={i % 4 === 0 ? 26 : 14} w={i % 4 === 0 ? "45%" : `${96 - (i % 3) * 9}%`} style={{ marginTop: i % 4 === 0 ? 30 : 12 }} />)}
    </div></div></>);
  }
}

function Shell({ children }: { children: ReactNode }) {
  const { data } = useQuery(chromeQuery);
  if (data) return <SiteLayout chrome={data}>{children}</SiteLayout>;
  return <div className="fl-site">{children}</div>;
}

/** Componente de carregamento de rota: cabeçalho/rodapé do site + esqueleto do conteúdo. */
export function sitePending(kind: SkelKind) {
  return function SitePending() { return <Shell><main aria-busy="true"><Body kind={kind} /></main></Shell>; };
}

/** Esqueleto só do conteúdo (para usar em Suspense dentro de uma página). */
export function SiteSkeleton({ kind }: { kind: SkelKind }) { return <main aria-busy="true"><Body kind={kind} /></main>; }

export const Spin = () => <span className="spin" aria-hidden="true" />;

/** Botão com estado "carregando" breve para ações instantâneas (feedback visual). */
export function BusyButton({ onClick, children, className, busyLabel }: { onClick: () => void | Promise<unknown>; children: ReactNode; className: string; busyLabel?: ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <button className={className} disabled={busy} aria-busy={busy} onClick={async () => {
      setBusy(true);
      try { await Promise.all([onClick(), new Promise((r) => setTimeout(r, 450))]); } finally { setBusy(false); }
    }}>{busy ? <><Spin />{busyLabel ?? children}</> : children}</button>
  );
}
