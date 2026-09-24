import { Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSite } from "@/components/site/i18n";
import { getOndeEncontrar, getSiteChrome } from "@/lib/site.functions";

const RedeMap = lazy(() => import("@/components/site/RedeMap").then((m) => ({ default: m.RedeMap })));

export const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
export const oeQuery = queryOptions({ queryKey: ["site-onde"], queryFn: () => getOndeEncontrar(), staleTime: 60_000 });

export function oeHead(title: string, desc: string) {
  return {
    meta: [
      { title }, { name: "description", content: desc },
      { property: "og:title", content: title }, { property: "og:description", content: desc },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: siteCss }],
  };
}

export function OndePage({ tipo }: { tipo: "rep" | "rede" }) {
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  return <SiteLayout chrome={chrome}><Onde tipo={tipo} /></SiteLayout>;
}

const L = {
  pt: { home: "Início", title: "Onde encontrar", intro_rep: "Encontre o representante comercial Fluair mais perto de você.", intro_rede: "Pontos autorizados Fluair para instalação, manutenção e reparo do seu sistema de freio.", rep: "Representantes", rede: "Rede autorizada", search: "Buscar por cidade ou nome", uf: "Todos os estados", tel: "Telefone", wa: "WhatsApp", email: "E-mail", rep_e_t: "Nenhum representante encontrado", rede_e_t: "Nenhum ponto encontrado", e_p: "Tente outro estado ou termo, ou fale direto com a Fluair.", none_p: "Em breve publicaremos aqui. Enquanto isso, fale direto com a Fluair.", clear: "Limpar filtros", contato: "Falar com a Fluair" },
  es: { home: "Inicio", title: "Dónde encontrar", intro_rep: "Encuentre el representante comercial Fluair más cercano.", intro_rede: "Puntos autorizados Fluair para instalación, mantenimiento y reparación de su sistema de freno.", rep: "Representantes", rede: "Red autorizada", search: "Buscar por ciudad o nombre", uf: "Todos los estados", tel: "Teléfono", wa: "WhatsApp", email: "E-mail", rep_e_t: "Ningún representante encontrado", rede_e_t: "Ningún punto encontrado", e_p: "Pruebe otro estado o término, o hable directo con Fluair.", none_p: "Pronto publicaremos aquí. Mientras tanto, hable directo con Fluair.", clear: "Limpiar filtros", contato: "Hablar con Fluair" },
};

const dg = (s: string | null) => (s ?? "").replace(/\D/g, "");
const waUrl = (s: string) => `https://wa.me/${dg(s).startsWith("55") ? dg(s) : "55" + dg(s)}`;
const norm = (s: string | null | undefined) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function Onde({ tipo }: { tipo: "rep" | "rede" }) {
  const { data } = useSuspenseQuery(oeQuery);
  const { lang } = useSite();
  const l = L[lang];
  const tab = tipo;
  const [q, setQ] = useState("");
  const [uf, setUf] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [client, setClient] = useState(false);
  useEffect(() => setClient(true), []);

  const list = tab === "rep" ? data.representantes : data.rede;
  const ufs = [...new Set(list.map((x) => x.estado).filter(Boolean) as string[])].sort();
  const match = (x: { nome: string; cidade: string | null; estado: string | null; empresa?: string | null }) =>
    (!uf || x.estado === uf) && (!q || [x.nome, x.cidade, x.empresa].some((v) => norm(v).includes(norm(q))));
  const reps = data.representantes.filter(match);
  const rede = data.rede.filter(match);
  const shown = tab === "rep" ? reps : rede;
  const Empty = ({ t }: { t: string }) => (
    <div className="empty" style={{ marginTop: 22 }}><h4>{t}</h4><p>{list.length ? l.e_p : l.none_p}</p>
      {list.length ? <button className="btn btn-navy btn-sm" style={{ marginTop: 18 }} onClick={() => { setQ(""); setUf(""); }}>{l.clear}</button>
        : <Link className="btn btn-navy btn-sm" style={{ marginTop: 18 }} to="/contato">{l.contato}</Link>}
    </div>
  );
  const Links = ({ x }: { x: { telefone: string | null; whatsapp: string | null; email?: string | null } }) => (
    <div className="links">
      {x.telefone && <a href={`tel:${dg(x.telefone)}`} onClick={(e) => e.stopPropagation()}>{x.telefone}</a>}
      {x.whatsapp && <a className="wa" href={waUrl(x.whatsapp)} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>{l.wa}</a>}
      {x.email && <a href={`mailto:${x.email}`} onClick={(e) => e.stopPropagation()}>{l.email}</a>}
    </div>
  );

  return (
    <main>
      <div className="page-head"><div className="wrap">
        <div className="crumb"><Link to="/">{l.home}</Link> / {tab === "rep" ? l.rep : l.rede}</div>
        <h1>{tab === "rep" ? l.rep : l.rede}</h1><p className="intro">{tab === "rep" ? l.intro_rep : l.intro_rede}</p>
      </div><div className="dash" /></div>
      <div className="wrap oe-body">
        {list.length > 0 && (
          <div className="catalog-top">
            <div className="searchbar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D6A80" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={l.search} aria-label={l.search} />
            </div>
            <div className="tools">
              <span className="rc">{shown.length}</span>
              <select className="sortsel" value={uf} onChange={(e) => setUf(e.target.value)} aria-label={l.uf}>
                <option value="">{l.uf}</option>{ufs.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === "rep" ? (
          reps.length === 0 ? <Empty t={l.rep_e_t} /> : (
            <div className="rep-grid">
              {reps.map((r) => (
                <div className="rep" key={r.id}>
                  {r.estado && <span className="uf">{r.estado}</span>}
                  <h3>{r.nome}</h3>
                  {r.empresa && <div className="emp">{r.empresa}</div>}
                  {(r.cidade || r.estado) && <div className="loc">{[r.cidade, r.estado].filter(Boolean).join("/")}</div>}
                  {r.abrangencia && <div className="loc"><strong>{lang === "es" ? "Cobertura" : "Abrangência"}:</strong> {r.abrangencia}</div>}
                  <Links x={r} />
                </div>
              ))}
            </div>
          )
        ) : rede.length === 0 ? <Empty t={l.rede_e_t} /> : (
          <div className="rede-layout">
            <div className="rede-list">
              {rede.map((p) => (
                <div className={`rep ${sel === p.id ? "on" : ""}`} key={p.id} onClick={() => setSel(p.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSel(p.id)}>
                  {p.estado && <span className="uf">{p.estado}</span>}
                  <h3>{p.nome}</h3>
                  {p.endereco && <div className="emp">{p.endereco}</div>}
                  <div className="loc">{[p.cidade, p.estado].filter(Boolean).join("/")}</div>
                  <Links x={p} />
                </div>
              ))}
            </div>
            {client ? (
              <Suspense fallback={<div className="rede-map" />}>
                <RedeMap pontos={rede} selected={sel} onSelect={setSel} labels={{ tel: l.tel, wa: l.wa }} />
              </Suspense>
            ) : <div className="rede-map" />}
          </div>
        )}
      </div>
    </main>
  );
}
