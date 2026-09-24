import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { pick, useSite } from "@/components/site/i18n";
import { getFaq, getSiteChrome, type FaqItem } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const faqQuery = queryOptions({ queryKey: ["site-faq"], queryFn: () => getFaq(), staleTime: 60_000 });

export const Route = createFileRoute("/suporte")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(faqQuery)]),
  head: () => ({
    meta: [
      { title: "Suporte e perguntas frequentes — Fluair" },
      { name: "description", content: "Tire suas dúvidas sobre válvulas pneumáticas e sistemas ABS Fluair para implementos rodoviários." },
      { property: "og:title", content: "Suporte — Fluair" },
      { property: "og:description", content: "Perguntas frequentes e atendimento técnico Fluair." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: siteCss }],
  }),
  component: () => {
    const { data: chrome } = useSuspenseQuery(chromeQuery);
    return <SiteLayout chrome={chrome}><Suporte /></SiteLayout>;
  },
});

const L = {
  pt: { home: "Início", title: "Suporte", intro: "Respostas rápidas para as dúvidas mais comuns sobre nossos produtos e sistemas.", search: "Buscar pergunta", other: "Geral", n1: "pergunta", n: "perguntas", empty_t: "Nenhuma pergunta por aqui", empty_p: "Em breve publicaremos as dúvidas mais frequentes. Enquanto isso, fale com a gente.", nores_t: "Nada encontrado", nores_p: "Tente outro termo.", clear: "Limpar busca", help_t: "Não achou o que procura?", help_p: "Nosso time técnico responde rapidinho.", wa: "Falar no WhatsApp", ct: "Ir para Contato" },
  es: { home: "Inicio", title: "Soporte", intro: "Respuestas rápidas a las dudas más comunes sobre nuestros productos y sistemas.", search: "Buscar pregunta", other: "General", n1: "pregunta", n: "preguntas", empty_t: "Ninguna pregunta por aquí", empty_p: "Pronto publicaremos las preguntas frecuentes. Mientras tanto, contáctenos.", nores_t: "Nada encontrado", nores_p: "Pruebe otro término.", clear: "Limpiar búsqueda", help_t: "¿No encontró lo que busca?", help_p: "Nuestro equipo técnico responde rápido.", wa: "Hablar por WhatsApp", ct: "Ir a Contacto" },
};
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function Suporte() {
  const { data } = useSuspenseQuery(faqQuery);
  const { lang, wa } = useSite();
  const l = L[lang];
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const cats = useMemo(() => [...new Set(data.itens.map((i) => i.categoria || l.other))], [data.itens, l.other]);
  const filtered = data.itens.filter((i) => !q || norm(pick(i, "pergunta", lang)).includes(norm(q)));
  const groups = cats.map((c) => [c, filtered.filter((i) => (i.categoria || l.other) === c)] as [string, FaqItem[]]).filter(([, a]) => a.length);

  return (
    <main>
      <div className="page-head"><div className="wrap">
        <div className="crumb"><Link to="/">{l.home}</Link> / {l.title}</div>
        <h1>{l.title}</h1><p className="intro">{l.intro}</p>
      </div><div className="dash" /></div>
      <div className="wrap faq-body">
        {data.itens.length > 0 && (
          <div className="catalog-top">
            <div className="searchbar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D6A80" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={l.search} aria-label={l.search} />
            </div>
            <div className="tools"><span className="rc">{filtered.length} {filtered.length === 1 ? l.n1 : l.n}</span></div>
          </div>
        )}
        {data.itens.length === 0 ? (
          <div className="empty" style={{ marginTop: 20 }}><h4>{l.empty_t}</h4><p>{l.empty_p}</p></div>
        ) : groups.length === 0 ? (
          <div className="empty" style={{ marginTop: 20 }}><h4>{l.nores_t}</h4><p>{l.nores_p}</p>
            <button className="btn btn-navy btn-sm" style={{ marginTop: 18 }} onClick={() => setQ("")}>{l.clear}</button></div>
        ) : groups.map(([c, itens]) => (
          <section className="dl-sec" key={c}>
            <h2>{c} <small>{itens.length} {itens.length === 1 ? l.n1 : l.n}</small></h2>
            <div className="faq-acc">
              {itens.map((i) => {
                const on = open === i.id;
                return (
                  <div className={`faq-q${on ? " open" : ""}`} key={i.id}>
                    <button aria-expanded={on} onClick={() => setOpen(on ? null : i.id)}>
                      <span>{pick(i, "pergunta", lang)}</span><span className="pm">+</span>
                    </button>
                    {on && <div className="faq-a prose" dangerouslySetInnerHTML={{ __html: pick(i, "resposta", lang) }} />}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="wrap">
        <div className="help">
          <div><h3>{l.help_t}</h3><p>{l.help_p}</p></div>
          <div className="btns">
            <a className="btn btn-wa" href={wa} target="_blank" rel="noreferrer">{l.wa}</a>
            <Link className="btn btn-ghost-w" to="/contato">{l.ct}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
