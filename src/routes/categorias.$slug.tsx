import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { pick, useSite } from "@/components/site/i18n";
import { getCatalogo, getCategoria, getSiteChrome } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const categoriaQuery = (slug: string) =>
  queryOptions({ queryKey: ["site-categoria", slug], queryFn: () => getCategoria({ data: { slug } }), staleTime: 60_000 });
type F = { q: string; cat: string; sort: string; page: number };
const catalogoQuery = (f: F) =>
  queryOptions({ queryKey: ["site-catalogo", f], queryFn: () => getCatalogo({ data: f }), staleTime: 30_000 });

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  sort: fallback(z.string(), "ordem").default("ordem"),
  page: fallback(z.number().int(), 1).default(1),
});

const strip = (h: string | null | undefined) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const Route = createFileRoute("/categorias/$slug")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ q: search.q, sort: search.sort, page: search.page }),
  loader: async ({ context, params, deps }) => {
    const [, c] = await Promise.all([
      context.queryClient.ensureQueryData(chromeQuery),
      context.queryClient.ensureQueryData(categoriaQuery(params.slug)),
      context.queryClient.ensureQueryData(catalogoQuery({ ...deps, cat: params.slug })),
    ]);
    return c;
  },
  head: ({ loaderData }) => {
    const c = loaderData?.categoria;
    const links = [{ rel: "stylesheet", href: siteCss }];
    if (!c) return { meta: [{ title: "Categoria não encontrada — Fluair" }, { name: "robots", content: "noindex" }], links };
    const title = `${c.nome_pt} — Produtos Fluair`;
    const desc = (strip(c.descricao_pt) || `${c.nome_pt}: ${loaderData.total} produtos Fluair para sistemas de freio de implementos rodoviários.`).slice(0, 158);
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
        ...(c.imagem_url?.startsWith("https://") ? [{ property: "og:image", content: c.imagem_url }, { name: "twitter:image", content: c.imagem_url }] : []),
      ],
      links,
    };
  },
  errorComponent: () => <div style={{ padding: 40 }}>Não foi possível carregar a categoria. Tente novamente.</div>,
  component: CategoriaPage,
});

function CategoriaPage() {
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  return <SiteLayout chrome={chrome}><Categoria /></SiteLayout>;
}

const L = {
  pt: { home: "Início", prods: "Produtos", nf_t: "Categoria não encontrada", nf_p: "Não encontramos uma categoria ativa com esse endereço.", back: "Ver todos os produtos", n1: "produto nesta linha", n: "produtos nesta linha", others: "Outras categorias", search: "Buscar nesta categoria…" },
  es: { home: "Inicio", prods: "Productos", nf_t: "Categoría no encontrada", nf_p: "No encontramos una categoría activa con esa dirección.", back: "Ver todos los productos", n1: "producto en esta línea", n: "productos en esta línea", others: "Otras categorías", search: "Buscar en esta categoría…" },
};

function Categoria() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/categorias/$slug" });
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  const { data: cd } = useSuspenseQuery(categoriaQuery(slug));
  const { data } = useSuspenseQuery(catalogoQuery({ q: search.q, sort: search.sort, page: search.page, cat: slug }));
  const { lang, t } = useSite();
  const l = L[lang];
  const [q, setQ] = useState(search.q);
  const catalogo = { q: "", cat: "", sort: "ordem", page: 1 };

  useEffect(() => setQ(search.q), [search.q]);
  useEffect(() => {
    if (q === search.q) return;
    const id = setTimeout(() => navigate({ search: (p) => ({ ...p, q, page: 1 }), replace: true }), 300);
    return () => clearTimeout(id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = cd.categoria;
  if (!c) {
    return (
      <main>
        <div className="page-head"><div className="wrap">
          <div className="crumb"><Link to="/">{l.home}</Link> / <Link to="/produtos" search={catalogo}>{l.prods}</Link> / {slug}</div>
          <h1>{l.nf_t}</h1>
        </div><div className="dash" /></div>
        <div className="wrap nf">
          <p style={{ color: "var(--steel)", marginBottom: 22 }}>{l.nf_p}</p>
          <Link className="btn btn-navy" to="/produtos" search={catalogo}>{l.back}</Link>
        </div>
      </main>
    );
  }

  const name = pick(c, "nome", lang);
  const desc = strip(pick(c, "descricao", lang));
  const total = data.total;
  const pages = Math.max(1, Math.ceil(total / data.per));
  const page = Math.min(search.page, pages);
  const goPage = (n: number) => { navigate({ search: (p) => ({ ...p, page: n }) }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <main>
      <div className="page-head cat-head">
        {c.imagem_url && <div className="cbg" style={{ backgroundImage: `url("${c.imagem_url}")` }} />}
        <div className="wrap">
          <div className="crumb"><Link to="/">{l.home}</Link> / <Link to="/produtos" search={catalogo}>{l.prods}</Link> / {name}</div>
          <h1>{name}</h1>
          {desc && <p className="intro">{desc}</p>}
          <div className="cat-count"><b>{cd.total}</b><span>{cd.total === 1 ? l.n1 : l.n}</span></div>
        </div>
        <div className="dash" />
      </div>

      <div className="wrap cat-body">
        <nav className="cat-strip" aria-label={l.others}>
          {chrome.categorias.map((o) => (
            <Link key={o.id} to="/categorias/$slug" params={{ slug: o.slug }} search={{ q: "", sort: "ordem", page: 1 }} className={o.slug === slug ? "on" : ""}>{pick(o, "nome", lang)}</Link>
          ))}
        </nav>

        <div className="catalog-top" style={{ marginTop: 22 }}>
          <div className="searchbar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D6A80" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={l.search} aria-label={l.search} />
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
          {data.produtos.length === 0 && (
            <div className="empty">
              <h4>{t.cp_empty_t}</h4><p>{t.cp_empty_p}</p>
              <button className="btn btn-navy btn-sm" style={{ marginTop: 18 }} onClick={() => { setQ(""); navigate({ search: { q: "", sort: "ordem", page: 1 } }); }}>{t.cp_clear}</button>
            </div>
          )}
          {data.produtos.map((p) => <ProductCard key={p.id} p={p} cat={name} />)}
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
      <div style={{ height: 70 }} />
    </main>
  );
}
