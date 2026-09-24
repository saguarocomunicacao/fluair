import { sitePending } from "@/components/site/SitePending";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { pick, useSite } from "@/components/site/i18n";
import { getSiteChrome, getTreinamentos } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const trQuery = queryOptions({ queryKey: ["site-treinamentos"], queryFn: () => getTreinamentos(), staleTime: 60_000 });

export const Route = createFileRoute("/treinamentos/")({
  pendingComponent: sitePending("news"),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(trQuery)]),
  head: () => ({
    meta: [
      { title: "Treinamentos — Válvulas pneumáticas e ABS Fluair" },
      { name: "description", content: "Treinamentos Fluair sobre funcionamento, instalação e manutenção de válvulas pneumáticas e do sistema ABS." },
      { property: "og:title", content: "Treinamentos — Fluair" },
      { property: "og:description", content: "Capacitação técnica Fluair em válvulas pneumáticas e sistema ABS." },
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
  pt: { home: "Início", title: "Treinamentos", intro: "Capacitação técnica para funcionamento, instalação e manutenção dos produtos Fluair.", empty_t: "Nenhum treinamento por aqui", empty_p: "Em breve novos treinamentos. Fale com a Fluair para saber mais.", contato: "Falar com a Fluair" },
  es: { home: "Inicio", title: "Capacitaciones", intro: "Capacitación técnica sobre funcionamiento, instalación y mantenimiento de los productos Fluair.", empty_t: "Ninguna capacitación por aquí", empty_p: "Pronto nuevas capacitaciones. Hable con Fluair para saber más.", contato: "Hablar con Fluair" },
};

function Lista() {
  const { data } = useSuspenseQuery(trQuery);
  const { lang } = useSite();
  const l = L[lang];
  return (
    <main>
      <div className="page-head"><div className="wrap">
        <div className="crumb"><Link to="/">{l.home}</Link> / {l.title}</div>
        <h1>{l.title}</h1><p className="intro">{l.intro}</p>
      </div><div className="dash" /></div>
      <div className="wrap dl-body">
        {data.itens.length === 0 ? (
          <div className="empty" style={{ marginTop: 20 }}><h4>{l.empty_t}</h4><p>{l.empty_p}</p>
            <Link className="btn btn-navy btn-sm" style={{ marginTop: 18 }} to="/contato">{l.contato}</Link></div>
        ) : (
          <div className="ngrid">
            {data.itens.map((t) => {
              const titulo = pick(t, "titulo", lang);
              const dur = pick(t, "duracao", lang);
              const desc = pick(t, "descricao", lang);
              return (
                <Link key={t.id} className="ncard" to="/treinamentos/$slug" params={{ slug: t.slug }}>
                  <div className="cv">{t.imagem_url ? <img src={t.imagem_url} alt={titulo} loading="lazy" /> : <span>FLUAIR</span>}</div>
                  <div className="bd">
                    {dur && <div className="nmeta"><b>{dur}</b></div>}
                    <h3>{titulo}</h3>
                    {desc && <p>{desc}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
