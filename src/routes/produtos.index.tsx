import { sitePending } from "@/components/site/SitePending";
import { OrcStep } from "@/components/site/OrcStep";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { pick, useSite } from "@/components/site/i18n";
import { getCatalogo, getSiteChrome, type ProdutoCard } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
type Filtros = { q: string; cat: string; sort: string; page: number };
const catalogoQuery = (f: Filtros) =>
  queryOptions({ queryKey: ["site-catalogo", f], queryFn: () => getCatalogo({ data: f }), staleTime: 30_000 });

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "").default(""),
  sort: fallback(z.string(), "ordem").default("ordem"),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/produtos/")({
  pendingComponent: sitePending("grid"),
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ q: search.q, cat: search.cat, sort: search.sort, page: search.page }),
  loader: ({ context, deps }) =>
    Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(catalogoQuery(deps))]),
  head: () => ({
    meta: [
      { title: "Produtos — Catálogo Fluair de válvulas e freios ABS" },
      { name: "description", content: "Catálogo completo Fluair: válvulas pneumáticas, linha ABS, painéis de comando, conexões, manômetros, reparos e tubos." },
      { property: "og:title", content: "Catálogo de produtos Fluair" },
      { property: "og:description", content: "Busque por referência, código ou nome entre os itens em linha da Fluair." },
    ],
    links: [{ rel: "stylesheet", href: siteCss }],
  }),
  errorComponent: () => <div style={{ padding: 40 }}>Não foi possível carregar o catálogo. Tente novamente.</div>,
  notFoundComponent: () => <div style={{ padding: 40 }}>Página não encontrada.</div>,
  component: CatalogoPage,
});

function CatalogoPage() {
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  return <SiteLayout chrome={chrome}><Catalogo /></SiteLayout>;
}

function Catalogo() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/produtos/" });
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  const { data } = useSuspenseQuery(catalogoQuery({ q: search.q, cat: search.cat, sort: search.sort, page: search.page }));
  const { lang, t } = useSite();
  const cats = chrome.categorias;
  const [q, setQ] = useState(search.q);

  useEffect(() => setQ(search.q), [search.q]);
  useEffect(() => {
    if (q === search.q) return;
    const id = setTimeout(() => navigate({ search: (p) => ({ ...p, q, page: 1 }), replace: true }), 300);
    return () => clearTimeout(id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCat = (cat: string) => navigate({ search: (p) => ({ ...p, cat, page: 1 }) });
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / (data?.per ?? 24)));
  const page = Math.min(search.page, pages);
  const goPage = (n: number) => { navigate({ search: (p) => ({ ...p, page: n }) }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const catName = (id: string | null) => pick(cats.find((c) => c.id === id), "nome", lang);
  const curCat = cats.find((c) => c.slug === search.cat);

  return (
    <main>
      <div className="page-head"><div className="wrap">
        <div className="crumb"><a href="/">Home</a> / {t.cp_title}{curCat && <> / {pick(curCat, "nome", lang)}</>}</div>
        <h1>{t.cp_title}</h1>
        <p className="intro">{t.cp_intro}</p>
      </div><div className="dash" /></div>

      <div className="wrap catalog-layout">
        <aside className="filters">
          <div className="grp chips"><h4>{t.cp_cat}</h4>
            <button className={`chip ${!search.cat ? "active" : ""}`} onClick={() => setCat("")}>{t.cp_all}</button>
            {cats.map((c) => (
              <button key={c.id} className={`chip ${search.cat === c.slug ? "active" : ""}`} onClick={() => setCat(c.slug)}>{pick(c, "nome", lang)}</button>
            ))}
          </div>
          <select className="sortsel mobsel" value={search.cat} onChange={(e) => setCat(e.target.value)} aria-label={t.cp_cat}>
            <option value="">{t.cp_cat}: {t.cp_all}</option>
            {cats.map((c) => <option key={c.id} value={c.slug}>{pick(c, "nome", lang)}</option>)}
          </select>
          <div className="grp chips" style={{ border: 0 }}><h4>{t.cp_help}</h4><p style={{ fontSize: 13, color: "var(--steel)" }}>{t.cp_help_t}</p></div>
        </aside>

        <div>
          <div className="catalog-top">
            <div className="searchbar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D6A80" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.cp_search} aria-label={t.cp_search} />
            </div>
            <div className="tools">
              <span className="rc">{total} {total === 1 ? t.cp_item : t.cp_items}</span>
              <select className="sortsel" value={search.sort} onChange={(e) => navigate({ search: (p) => ({ ...p, sort: e.target.value, page: 1 }) })} aria-label="Ordenar">
                <option value="ordem">{t.cp_sort_ordem}</option>
                <option value="nome">{t.cp_sort_nome}</option>
                <option value="referencia">{t.cp_sort_ref}</option>
              </select>
            </div>
          </div>

          <div className="pgrid">
            {data && data.produtos.length === 0 && (
              <div className="empty">
                <h4>{t.cp_empty_t}</h4><p>{t.cp_empty_p}</p>
                <button className="btn btn-navy btn-sm" style={{ marginTop: 18 }} onClick={() => { setQ(""); navigate({ search: { q: "", cat: "", sort: "ordem", page: 1 } }); }}>{t.cp_clear}</button>
              </div>
            )}
            {data?.produtos.map((p) => <Card key={p.id} p={p} cat={catName(p.categoria_id)} />)}
          </div>

          {pages > 1 && (
            <div className="pager">
              <button disabled={page <= 1} onClick={() => goPage(page - 1)}>{t.prev}</button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={n === page ? "on" : ""} onClick={() => goPage(n)}>{n}</button>
              ))}
              <button disabled={page >= pages} onClick={() => goPage(page + 1)}>{t.next}</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 70 }} />
    </main>
  );
}

function Card({ p, cat }: { p: ProdutoCard; cat: string }) {
  const { lang, t } = useSite();
  const [broken, setBroken] = useState(false);
  const name = pick(p, "nome", lang);
  const ref = p.referencia || p.codigo;
  return (
    <div className="pcard">
      <div className="ph"><div className="bg" /><div className="g" />
        {p.imagem && !broken ? <img src={p.imagem} alt={name} loading="lazy" onError={() => setBroken(true)} /> : (
          <div className="ph-empty"><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" /></svg></div>
        )}
        {cat && <span className="tg">{cat}</span>}
      </div>
      <div className="b">
        <span className="code">{ref}</span>
        <a className="stretch" href={`/produtos/${encodeURIComponent(ref)}`}><h3>{name}</h3></a>
        <span className="spec">Cód. {p.codigo}</span>
        <div className="foot">
          <OrcStep variant="sm" grow label={t.add_orc_long} item={{ id: p.id, codigo: p.codigo, referencia: p.referencia, nome: name }} />
        </div>
      </div>
    </div>
  );
}
