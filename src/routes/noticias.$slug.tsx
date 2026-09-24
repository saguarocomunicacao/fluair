import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { pick, useSite } from "@/components/site/i18n";
import { NoticiaCard, fmtData } from "@/components/site/NoticiaCard";
import { getNoticia, getSiteChrome } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const postQuery = (slug: string) => queryOptions({ queryKey: ["site-noticia", slug], queryFn: () => getNoticia({ data: { slug } }), staleTime: 60_000 });
const strip = (h: string | null | undefined) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export const Route = createFileRoute("/noticias/$slug")({
  loader: async ({ context, params }) => {
    const [, post] = await Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(postQuery(params.slug))]);
    return post;
  },
  head: ({ loaderData }) => {
    const links = [{ rel: "stylesheet", href: siteCss }];
    const n = loaderData?.noticia;
    if (!n) return { meta: [{ title: "Notícia não encontrada — Fluair" }, { name: "robots", content: "noindex" }], links };
    const title = `${n.titulo_pt} — Fluair`;
    const desc = (n.resumo_pt || strip(n.conteudo_pt)).slice(0, 158);
    const meta = [
      { title }, { name: "description", content: desc },
      { property: "og:title", content: title }, { property: "og:description", content: desc },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" },
    ];
    if (n.capa_url?.startsWith("https://")) meta.push({ property: "og:image", content: n.capa_url }, { name: "twitter:image", content: n.capa_url });
    return { meta, links };
  },
  component: () => {
    const { data: chrome } = useSuspenseQuery(chromeQuery);
    return <SiteLayout chrome={chrome}><Post /></SiteLayout>;
  },
});

const L = {
  pt: { home: "Início", list: "Notícias", nf_t: "Notícia não encontrada", nf_p: "Esta notícia não existe ou ainda não foi publicada.", back: "Ver todas as notícias", por: "Por", rel: "Notícias relacionadas" },
  es: { home: "Inicio", list: "Noticias", nf_t: "Noticia no encontrada", nf_p: "Esta noticia no existe o aún no fue publicada.", back: "Ver todas las noticias", por: "Por", rel: "Noticias relacionadas" },
};

function Post() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(slug));
  const { lang } = useSite();
  const l = L[lang];
  const n = data.noticia;
  const titulo = n ? pick(n, "titulo", lang) : l.nf_t;
  return (
    <main>
      <div className="page-head post-head">
        {n?.capa_url && <div className="bg" style={{ backgroundImage: `url("${n.capa_url}")` }} />}
        <div className="wrap">
          <div className="crumb"><Link to="/">{l.home}</Link> / <Link to="/noticias">{l.list}</Link> / {titulo}</div>
          <h1>{titulo}</h1>
          {n && <div className="nmeta">{n.categoria && <b>{n.categoria}</b>}{n.autor && <span>{l.por} {n.autor}</span>}<span>{fmtData(n.publicado_em, lang)}</span></div>}
        </div><div className="dash" />
      </div>
      {n ? (
        <>
          {n.capa_url && <div className="wrap post-cover"><img src={n.capa_url} alt={titulo} /></div>}
          <div className="wrap"><article className="inst prose" dangerouslySetInnerHTML={{ __html: pick(n, "conteudo", lang) || `<p>${pick(n, "resumo", lang)}</p>` }} /></div>
          {data.relacionadas.length > 0 && (
            <div className="wrap rel">
              <h2>{l.rel}</h2>
              <div className="ngrid">{data.relacionadas.map((r) => <NoticiaCard key={r.id} n={r} />)}</div>
            </div>
          )}
        </>
      ) : (
        <div className="wrap nf">
          <p style={{ color: "var(--steel)", marginBottom: 22 }}>{l.nf_p}</p>
          <Link className="btn btn-navy" to="/noticias">{l.back}</Link>
        </div>
      )}
    </main>
  );
}
