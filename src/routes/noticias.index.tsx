import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSite } from "@/components/site/i18n";
import { NoticiaCard } from "@/components/site/NoticiaCard";
import { getNoticias, getSiteChrome } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const listQuery = (d: { q: string; cat: string; page: number }) =>
  queryOptions({ queryKey: ["site-noticias", d], queryFn: () => getNoticias({ data: d }), staleTime: 30_000 });

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "").default(""),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/noticias/")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ q: search.q, cat: search.cat, page: search.page }),
  loader: ({ context, deps }) => Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(listQuery(deps))]),
  head: () => ({
    meta: [
      { title: "Notícias — Fluair" },
      { name: "description", content: "Novidades, lançamentos e conteúdos técnicos da Fluair sobre freios e sistemas ABS para implementos." },
      { property: "og:title", content: "Notícias — Fluair" },
      { property: "og:description", content: "Novidades e conteúdos técnicos Fluair." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: siteCss }],
  }),
  component: () => {
    const { data: chrome } = useSuspenseQuery(chromeQuery);
    return <SiteLayout chrome={chrome}><Lista /></SiteLayout>;
  },
});

const L = {
  pt: { home: "Início", title: "Notícias", intro: "Novidades, lançamentos e conteúdos técnicos da Fluair.", search: "Buscar por título", all: "Todas as categorias", n1: "notícia", n: "notícias", empty_t: "Nenhuma notícia ainda", empty_p: "Em breve publicaremos novidades por aqui.", nores_t: "Nada encontrado", nores_p: "Tente outro termo ou categoria.", clear: "Limpar filtros", prev: "Anterior", next: "Próxima" },
  es: { home: "Inicio", title: "Noticias", intro: "Novedades, lanzamientos y contenidos técnicos de Fluair.", search: "Buscar por título", all: "Todas las categorías", n1: "noticia", n: "noticias", empty_t: "Ninguna noticia aún", empty_p: "Pronto publicaremos novedades aquí.", nores_t: "Nada encontrado", nores_p: "Pruebe otro término o categoría.", clear: "Limpiar filtros", prev: "Anterior", next: "Siguiente" },
};

function Lista() {
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(listQuery(search));
  const navigate = useNavigate({ from: "/noticias/" });
  const { lang } = useSite();
  const l = L[lang];
  const [q, setQ] = useState(search.q);
  useEffect(() => {
    const t = setTimeout(() => { if (q !== search.q) navigate({ search: (p) => ({ ...p, q, page: 1 }) }); }, 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = Math.ceil(data.total / 12);
  const filtering = !!(search.q || search.cat);
  const go = (page: number) => { navigate({ search: (p) => ({ ...p, page }) }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <main>
      <div className="page-head"><div className="wrap">
        <div className="crumb"><Link to="/">{l.home}</Link> / {l.title}</div>
        <h1>{l.title}</h1><p className="intro">{l.intro}</p>
      </div><div className="dash" /></div>
      <div className="wrap dl-body">
        {(data.total > 0 || filtering) && (
          <div className="catalog-top">
            <div className="searchbar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D6A80" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={l.search} aria-label={l.search} />
            </div>
            <div className="tools">
              <span className="rc">{data.total} {data.total === 1 ? l.n1 : l.n}</span>
              {data.categorias.length > 1 && (
                <select className="sortsel" value={search.cat} onChange={(e) => navigate({ search: (p) => ({ ...p, cat: e.target.value, page: 1 }) })} aria-label={l.all}>
                  <option value="">{l.all}</option>{data.categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>
        )}
        {data.total === 0 ? (
          filtering ? (
            <div className="empty" style={{ marginTop: 20 }}><h4>{l.nores_t}</h4><p>{l.nores_p}</p>
              <button className="btn btn-navy btn-sm" style={{ marginTop: 18 }} onClick={() => { setQ(""); navigate({ search: { q: "", cat: "", page: 1 } }); }}>{l.clear}</button></div>
          ) : <div className="empty" style={{ marginTop: 20 }}><h4>{l.empty_t}</h4><p>{l.empty_p}</p></div>
        ) : (
          <div className="ngrid">{data.noticias.map((n) => <NoticiaCard key={n.id} n={n} />)}</div>
        )}
        {pages > 1 && (
          <div className="pager">
            <button disabled={search.page <= 1} onClick={() => go(search.page - 1)}>{l.prev}</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <button key={n} className={n === search.page ? "on" : ""} onClick={() => go(n)}>{n}</button>)}
            <button disabled={search.page >= pages} onClick={() => go(search.page + 1)}>{l.next}</button>
          </div>
        )}
      </div>
    </main>
  );
}
