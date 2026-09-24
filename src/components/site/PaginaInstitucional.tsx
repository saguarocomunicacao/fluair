import { Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { pick, useSite } from "@/components/site/i18n";
import { getPagina, getSiteChrome, type Pagina } from "@/lib/site.functions";

export const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
export const paginaQuery = (slug: string) =>
  queryOptions({ queryKey: ["site-pagina", slug], queryFn: () => getPagina({ data: { slug } }), staleTime: 60_000 });

const strip = (h: string | null | undefined) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** head() compartilhado: SEO do painel, senão título + resumo do conteúdo. */
export function paginaHead(p: Pagina | null | undefined) {
  const links = [{ rel: "stylesheet", href: siteCss }];
  if (!p) return { meta: [{ title: "Página não encontrada — Fluair" }, { name: "robots", content: "noindex" }], links };
  const title = p.seo_titulo_pt || `${p.titulo_pt} — Fluair`;
  const desc = (p.seo_descricao_pt || strip(p.conteudo_pt)).slice(0, 158);
  return {
    meta: [
      { title }, { name: "description", content: desc },
      { property: "og:title", content: title }, { property: "og:description", content: desc },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links,
  };
}

const L = {
  pt: { home: "Início", emp: "Empresa", nf_t: "Página não encontrada", nf_p: "Esta página não existe ou ainda não foi publicada.", back: "Voltar para a home" },
  es: { home: "Inicio", emp: "Empresa", nf_t: "Página no encontrada", nf_p: "Esta página no existe o aún no fue publicada.", back: "Volver al inicio" },
};

export function PaginaInstitucional({ slug }: { slug: string }) {
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  return <SiteLayout chrome={chrome}><Corpo slug={slug} /></SiteLayout>;
}

function Corpo({ slug }: { slug: string }) {
  const { data } = useSuspenseQuery(paginaQuery(slug));
  const { lang } = useSite();
  const l = L[lang];
  const p = data.pagina;
  const titulo = p ? pick(p, "titulo", lang) : l.nf_t;
  const html = p ? pick(p, "conteudo", lang) : "";
  return (
    <main>
      <div className="page-head"><div className="wrap">
        <div className="crumb"><Link to="/">{l.home}</Link> / {l.emp} / {titulo}</div>
        <h1>{titulo}</h1>
      </div><div className="dash" /></div>
      {p ? (
        <div className="wrap"><article className="inst prose" dangerouslySetInnerHTML={{ __html: html }} /></div>
      ) : (
        <div className="wrap nf">
          <p style={{ color: "var(--steel)", marginBottom: 22 }}>{l.nf_p}</p>
          <Link className="btn btn-navy" to="/">{l.back}</Link>
        </div>
      )}
    </main>
  );
}
