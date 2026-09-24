import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { pick, useSite } from "@/components/site/i18n";
import { getDownloads, getSiteChrome, type DownloadItem } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const dlQuery = queryOptions({ queryKey: ["site-downloads"], queryFn: () => getDownloads(), staleTime: 60_000 });

export const Route = createFileRoute("/downloads")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(dlQuery)]),
  head: () => ({
    meta: [
      { title: "Downloads — Catálogos e manuais Fluair" },
      { name: "description", content: "Baixe catálogos, manuais técnicos e materiais das válvulas e kits ABS Fluair." },
      { property: "og:title", content: "Downloads — Fluair" },
      { property: "og:description", content: "Catálogos, manuais e materiais técnicos Fluair para download." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: siteCss }],
  }),
  component: () => {
    const { data: chrome } = useSuspenseQuery(chromeQuery);
    return <SiteLayout chrome={chrome}><Downloads /></SiteLayout>;
  },
});

const L = {
  pt: { home: "Início", title: "Downloads", intro: "Catálogos, manuais técnicos e materiais da Fluair para consulta e download.", search: "Buscar por título", all: "Todas as categorias", other: "Outros", baixar: "Baixar", arq: "arquivo", n1: "arquivo", n: "arquivos", empty_t: "Nenhum arquivo por aqui", empty_p: "Ainda não há materiais disponíveis. Volte em breve.", nores_t: "Nada encontrado", nores_p: "Tente outro termo ou categoria.", clear: "Limpar filtros" },
  es: { home: "Inicio", title: "Descargas", intro: "Catálogos, manuales técnicos y materiales de Fluair para consulta y descarga.", search: "Buscar por título", all: "Todas las categorías", other: "Otros", baixar: "Descargar", arq: "archivo", n1: "archivo", n: "archivos", empty_t: "Ningún archivo por aquí", empty_p: "Aún no hay materiales disponibles. Vuelva pronto.", nores_t: "Nada encontrado", nores_p: "Pruebe otro término o categoría.", clear: "Limpiar filtros" },
};

const kind = (ext: string) => ext === "pdf" ? "pdf" : ["zip", "rar", "7z"].includes(ext) ? "zip" : ["jpg", "jpeg", "png", "webp", "svg"].includes(ext) ? "img" : ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "dwg", "step", "stp"].includes(ext) ? "doc" : "";
const size = (n: number | null) => n == null ? "" : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function Downloads() {
  const { data } = useSuspenseQuery(dlQuery);
  const { lang } = useSite();
  const l = L[lang];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const cats = useMemo(() => [...new Set(data.itens.map((i) => i.categoria || l.other))], [data.itens, l.other]);
  const filtered = data.itens.filter((i) => (!cat || (i.categoria || l.other) === cat) && (!q || norm(pick(i, "titulo", lang)).includes(norm(q))));
  const groups = cats.map((c) => [c, filtered.filter((i) => (i.categoria || l.other) === c)] as [string, DownloadItem[]]).filter(([, a]) => a.length);

  return (
    <main>
      <div className="page-head"><div className="wrap">
        <div className="crumb"><Link to="/">{l.home}</Link> / {l.title}</div>
        <h1>{l.title}</h1><p className="intro">{l.intro}</p>
      </div><div className="dash" /></div>
      <div className="wrap dl-body">
        {data.itens.length > 0 && (
          <div className="catalog-top">
            <div className="searchbar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D6A80" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={l.search} aria-label={l.search} />
            </div>
            <div className="tools">
              <span className="rc">{filtered.length} {filtered.length === 1 ? l.n1 : l.n}</span>
              {cats.length > 1 && (
                <select className="sortsel" value={cat} onChange={(e) => setCat(e.target.value)} aria-label={l.all}>
                  <option value="">{l.all}</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>
        )}
        {data.itens.length === 0 ? (
          <div className="empty" style={{ marginTop: 20 }}><h4>{l.empty_t}</h4><p>{l.empty_p}</p></div>
        ) : groups.length === 0 ? (
          <div className="empty" style={{ marginTop: 20 }}><h4>{l.nores_t}</h4><p>{l.nores_p}</p>
            <button className="btn btn-navy btn-sm" style={{ marginTop: 18 }} onClick={() => { setQ(""); setCat(""); }}>{l.clear}</button></div>
        ) : groups.map(([c, itens]) => (
          <section className="dl-sec" key={c}>
            <h2>{c} <small>{itens.length} {itens.length === 1 ? l.n1 : l.n}</small></h2>
            <div className="dl-list">
              {itens.map((i) => {
                const desc = pick(i, "descricao", lang);
                return (
                  <div className="dl-item" key={i.id}>
                    <div className={`dl-ico ${kind(i.ext)}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></svg>
                      <span>{i.ext || l.arq}</span>
                    </div>
                    <div>
                      <h3>{pick(i, "titulo", lang)}</h3>
                      {desc && <p>{desc}</p>}
                      <div className="dl-meta">{[i.ext.toUpperCase(), size(i.tamanho)].filter(Boolean).join(" · ")}</div>
                    </div>
                    {i.arquivo_url && (
                      <a className="btn btn-navy btn-sm" href={i.arquivo_url} target="_blank" rel="noopener" download>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16" /></svg> {l.baixar}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
