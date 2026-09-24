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

const WaIco = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
);
const TelIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
const MailIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
);

const UF_NAME: Record<string, Record<string, string>> = {
  pt: { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" },
  es: { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahía", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Río de Janeiro", RN: "Río Grande del Norte", RS: "Río Grande del Sur", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" },
};

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
      </div><div className={tab === "rep" ? "dash thin" : "dash"} /></div>
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
            <div className="rep-groups">
              {[...reps].sort((a, b) => (a.estado ?? "zz").localeCompare(b.estado ?? "zz") || a.nome.localeCompare(b.nome))
                .reduce<[string, typeof reps][]>((acc, r) => {
                  const k = r.estado || (lang === "es" ? "Sin estado" : "Sem estado");
                  const last = acc[acc.length - 1];
                  if (last && last[0] === k) last[1].push(r);
                  else acc.push([k, [r]]);
                  return acc;
                }, []).map(([uf, arr]) => (
                  <section className="rep-group" key={uf}>
                    <div className="rc-sec">
                      <h2><span className="st">{uf}</span>{UF_NAME[lang]?.[uf] && <span className="nm">— {UF_NAME[lang][uf]}</span>}</h2>
                    </div>
                    <div className="rep-grid">
                      {arr.map((r) => (
                        <div className="rep-card" key={r.id}>
                          <h3>{r.nome}</h3>
                          {r.empresa && <div className="rc-emp">{r.empresa}</div>}
                          {r.cidade && <div className="rc-loc">{r.cidade}</div>}
                          {r.abrangencia && <div className="rc-abr"><b>{lang === "es" ? "Cobertura" : "Abrangência"}:</b> {r.abrangencia}</div>}
                          <div className="rc-actions">
                            {r.whatsapp && (
                              <a className="rc-btn rc-wa" href={`${waUrl(r.whatsapp)}?text=${encodeURIComponent(lang === "es" ? "Hola, vengo del sitio de Fluair" : "Olá, vim pelo site da Fluair")}`} target="_blank" rel="noopener">
                                <WaIco />WhatsApp
                              </a>
                            )}
                            <span className="rc-side">
                              {r.telefone && <a className="rc-ico" href={`tel:${dg(r.telefone)}`} title={`${l.tel}: ${r.telefone}`}><TelIco /></a>}
                              {r.email && <a className="rc-ico" href={`mailto:${r.email}`} title={l.email}><MailIco /></a>}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
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
