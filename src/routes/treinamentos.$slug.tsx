import { sitePending } from "@/components/site/SitePending";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { pick, useSite } from "@/components/site/i18n";
import { getSiteChrome, getTreinamento } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const tQuery = (slug: string) => queryOptions({ queryKey: ["site-treinamento", slug], queryFn: () => getTreinamento({ data: { slug } }), staleTime: 60_000 });
const strip = (h: string | null | undefined) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export const Route = createFileRoute("/treinamentos/$slug")({
  pendingComponent: sitePending("post"),
  loader: async ({ context, params }) => {
    const [, t] = await Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(tQuery(params.slug))]);
    return t;
  },
  head: ({ loaderData }) => {
    const links = [{ rel: "stylesheet", href: siteCss }];
    const t = loaderData?.treinamento;
    if (!t) return { meta: [{ title: "Treinamento não encontrado — Fluair" }, { name: "robots", content: "noindex" }], links };
    const title = `${t.titulo_pt} — Fluair`;
    const desc = (t.descricao_pt || strip(t.conteudo_pt) || `Treinamento Fluair. ${t.duracao_pt ?? ""}`).slice(0, 158);
    const meta = [
      { title }, { name: "description", content: desc },
      { property: "og:title", content: title }, { property: "og:description", content: desc },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" },
    ];
    if (t.imagem_url?.startsWith("https://")) meta.push({ property: "og:image", content: t.imagem_url }, { name: "twitter:image", content: t.imagem_url });
    return { meta, links };
  },
  component: () => {
    const { data: chrome } = useSuspenseQuery(chromeQuery);
    return <SiteLayout chrome={chrome}><Detalhe /></SiteLayout>;
  },
});

const L = {
  pt: { home: "Início", list: "Treinamentos", nf_t: "Treinamento não encontrado", nf_p: "Este treinamento não existe ou ainda não foi publicado.", back: "Ver todos os treinamentos", dur: "Duração", cta: "Quero participar" },
  es: { home: "Inicio", list: "Capacitaciones", nf_t: "Capacitación no encontrada", nf_p: "Esta capacitación no existe o aún no fue publicada.", back: "Ver todas las capacitaciones", dur: "Duración", cta: "Quiero participar" },
};

function Detalhe() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(tQuery(slug));
  const { lang } = useSite();
  const l = L[lang];
  const t = data.treinamento;
  const titulo = t ? pick(t, "titulo", lang) : l.nf_t;
  const dur = t ? pick(t, "duracao", lang) : "";
  const html = t ? pick(t, "conteudo", lang) || (pick(t, "descricao", lang) ? `<p>${pick(t, "descricao", lang)}</p>` : "") : "";
  return (
    <main>
      <div className="page-head post-head">
        {t?.imagem_url && <div className="bg" style={{ backgroundImage: `url("${t.imagem_url}")` }} />}
        <div className="wrap">
          <div className="crumb"><Link to="/">{l.home}</Link> / <Link to="/treinamentos">{l.list}</Link> / {titulo}</div>
          <h1>{titulo}</h1>
          {dur && <div className="nmeta"><b>{l.dur}</b><span>{dur}</span></div>}
        </div><div className="dash" />
      </div>
      {t ? (
        <>
          {t.imagem_url && <div className="wrap post-cover"><img src={t.imagem_url} alt={titulo} /></div>}
          <div className="wrap">
            {html && <article className="inst prose" dangerouslySetInnerHTML={{ __html: html }} />}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", margin: "30px 0 70px" }}>
              <Link className="btn btn-navy" to="/contato">{l.cta}</Link>
              <Link className="btn btn-ghost" to="/treinamentos">{l.back}</Link>
            </div>
          </div>
        </>
      ) : (
        <div className="wrap nf">
          <p style={{ color: "var(--steel)", marginBottom: 22 }}>{l.nf_p}</p>
          <Link className="btn btn-navy" to="/treinamentos">{l.back}</Link>
        </div>
      )}
    </main>
  );
}
