import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { pick, useSite } from "@/components/site/i18n";
import { getHome, getSiteChrome, type ProdutoCard } from "@/lib/site.functions";
import hero0 from "@/assets/fluair-hero-0.jpg.asset.json";
import hero1 from "@/assets/fluair-hero-1.jpg.asset.json";

export const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const homeQuery = queryOptions({ queryKey: ["site-home"], queryFn: () => getHome(), staleTime: 60_000 });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fluair — Válvulas e freios ABS para implementos rodoviários" },
      { name: "description", content: "Há mais de 25 anos a Fluair fabrica válvulas e kits ABS para o sistema de freio de reboques, semirreboques e trucks." },
      { property: "og:title", content: "Fluair — Não importa o caminho, vá com Fluair!" },
      { property: "og:description", content: "Válvulas pneumáticas e freios ABS com fabricação própria e qualidade ISO 9001:2015." },
    ],
    links: [
      { rel: "stylesheet", href: siteCss },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(homeQuery)]),
  errorComponent: () => <div style={{ padding: 40 }}>Não foi possível carregar a página. Tente novamente.</div>,
  notFoundComponent: () => <div style={{ padding: 40 }}>Página não encontrada.</div>,
  component: HomePage,
});

function HomePage() {
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  return (
    <SiteLayout chrome={chrome} transparentTop>
      <HomeContent />
    </SiteLayout>
  );
}

const Arrow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

function HomeContent() {
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  const { data: home } = useSuspenseQuery(homeQuery);
  const { lang, t, wa } = useSite();
  const cats = chrome.categorias;
  const catName = (id: string | null) => pick(cats.find((c) => c.id === id), "nome", lang);

  const slides = home.banners.filter((b) => b.imagem_url).map((b) => b.imagem_url!);
  const imgs = slides.length ? slides : [hero0.url, hero1.url];
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (imgs.length < 2) return;
    const id = setInterval(() => setCur((i) => (i + 1) % imgs.length), 5200);
    return () => clearInterval(id);
  }, [imgs.length]);

  const tagline = chrome.config["tagline"]?.[lang] || "Não importa o caminho, vá com Fluair!";
  const ci = tagline.indexOf(",");
  const [t1, t2] = ci > 0 ? [tagline.slice(0, ci + 1), tagline.slice(ci + 1).trim()] : [tagline, ""];
  const w = t1.split(" ");
  const b = home.banners[0];
  const total = home.totalProdutos;
  const tel = chrome.config["whatsapp"]?.[lang] ?? "";

  return (
    <main>
      <section className="hero" id="hero">
        <div className="slides" data-para="-0.04">
          {imgs.map((src, i) => <div key={src} className={`slide ${i === cur ? "on" : ""}`} style={{ backgroundImage: `url('${src}')` }} />)}
        </div>
        <div className="scrim" />
        <div className="content"><div className="wrap">
          <span className="kick light" data-para="0.12">{pick(b, "subtitulo", lang) || t.h_kick}</span>
          <h1 data-para="0.06">{w.slice(0, 2).join(" ")}<br />{w.slice(2).join(" ")} {t2 && <span className="y">{t2}</span>}</h1>
          <p className="lede" data-para="0.1">{pick(b, "titulo", lang) || t.h_lede}</p>
          <div className="cta" data-para="0.14">
            <a className="btn btn-yellow" href={b?.cta_url || "/produtos"}><span>{pick(b, "cta_label", lang) || t.h_cta1}</span><Arrow /></a>
            <a className="btn btn-ghost on-dark" href={wa} target="_blank" rel="noreferrer">{t.h_cta2}</a>
          </div>
        </div></div>
        <div className="scrolldown"><div className="m" /><span>{t.h_scroll}</span></div>
      </section>

      <section className="stats"><div className="wrap">
        <div className="stat"><div className="n"><span className="count" data-to={total}>{total}</span></div><div className="l">{t.st1}</div></div>
        <div className="stat"><div className="n">+<span className="count" data-to={25}>25</span></div><div className="l">{t.st2}</div></div>
        <div className="stat"><div className="n">{cats.length}</div><div className="l">{t.st3}</div></div>
        <div className="stat"><div className="n">ISO</div><div className="l">{t.st4}</div></div>
      </div></section>

      <section className="section sistema" id="sistema">
        <div className="wrap sist-grid">
          <div className="sist-left">
            <span className="kick">{t.sy_kick}</span>
            <div className="lead">{t.sy_lead}</div>
            <p>{t.sy_sub}</p>
            <div className="count-block"><span className="count" data-to={total}>{total}</span><small>{t.sy_small}</small></div>
          </div>
          <div className="sist-list">
            {t.sistema.map(([ti, d, tg], i) => (
              <div className="sist-item" key={ti}><div className="no">{String(i + 1).padStart(2, "0")}</div><div><h4>{ti}</h4><p>{d}</p><span className="tg">{tg}</span></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section cats" id="categorias">
        <div className="wrap">
          <div className="sec-head reveal"><span className="kick light">{t.cat_kick}</span>
            <h2 style={{ color: "#fff" }}>{numWord(cats.length, lang)} {t.cat_t1} <span className="y">{t.cat_t2}</span></h2>
            <p style={{ color: "#a9bcd8" }}>{t.cat_sub}</p></div>
          <div className="cats-grid reveal">
            {cats.map((c, i) => (
              <a className="cat" key={c.id} href={`/categorias/${c.slug}`}>
                <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                <h4>{pick(c, "nome", lang)}</h4>
                {pick(c, "descricao", lang) && <p>{pick(c, "descricao", lang)}</p>}
                <span className="go">{t.cat_go}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section prods">
        <div className="wrap">
          <div className="sec-head reveal"><span className="kick">{t.pr_kick}</span>
            <h2>{t.pr_t1} <span className="y">{t.pr_t2}</span></h2>
            <p>{t.pr_sub}</p></div>
          <div className="pgrid">{home.produtos.map((p) => <PCard key={p.id} p={p} cat={catName(p.categoria_id)} />)}</div>
          <div style={{ textAlign: "center", marginTop: 40 }}><a className="btn btn-navy" href="/produtos">{t.pr_all}</a></div>
        </div>
      </section>

      <section className="section about" id="empresa">
        <div className="big-idx" data-para="0.14" style={{ right: -10, bottom: -30, color: "rgba(255,255,255,.04)" }}>FLUAIR</div>
        <div className="wrap about-grid">
          <div className="reveal">
            <span className="kick light">{t.ab_kick}</span>
            <div className="quote" style={{ marginTop: 16 }}><span>{t.ab_q1}</span><br /><span className="y">{t.ab_q2}</span></div>
            <p className="desc">{t.ab_desc}</p>
            <div className="facts">
              <div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg><span>{t.ab_f1}</span></div>
              <div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></svg><span>{chrome.config["endereco"]?.[lang]}</span></div>
              <div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16h16M6 16V9l4-1 4 1 4 1v6" /></svg><span>{t.ab_f3}</span></div>
            </div>
          </div>
          <div className="stack reveal">
            <div className="layer l1" data-para="0.05" style={{ backgroundImage: `url('${hero1.url}')`, backgroundSize: "cover", backgroundPosition: "center" }}><div className="g" /></div>
            <div className="layer l2" data-para="-0.06" style={{ backgroundImage: `url('${hero0.url}')`, backgroundSize: "cover", backgroundPosition: "center" }}><div className="g" /></div>
            <div className="badge" data-para="-0.1"><div className="b1">ISO</div><div className="b2">9001:2015</div></div>
          </div>
        </div>
      </section>

      <section className="section tight manifesto">
        <div className="wrap">
          <div className="sec-head reveal"><span className="kick">{t.mf_kick}</span>
            <h2>{t.mf_t1} <span className="y">{t.mf_t2}</span></h2></div>
          <div>
            {t.manifesto.map(([ti, d], i) => (
              <div className="row reveal" key={ti}><div className="no">{String(i + 1).padStart(2, "0")}</div><div><h3>{ti}</h3><p>{d}</p></div>
                <div className="ar"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight" id="suporte" style={{ background: "var(--paper)" }}>
        <div className="wrap">
          <div className="sec-head reveal"><span className="kick">{t.sp_kick}</span>
            <h2>{t.sp_t1} <span className="y">{t.sp_t2}</span></h2></div>
          <div className="support-grid reveal">
            {t.suporte.map(([ti, d, href], i) => (
              <a className="sup" key={ti} href={href}><div className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{SUP_ICONS[i]}</svg></div><h4>{ti}</h4><p>{d}</p></a>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-road">
        <div className="wrap">
          <h2>{t.cta_t}</h2>
          <p>{t.cta_p}</p>
          <div className="cta">
            <a className="btn btn-navy" href="/orcamento">{t.cta_b1}</a>
            <a className="btn btn-ghost on-dark" href={wa} target="_blank" rel="noreferrer">WhatsApp {tel}</a>
          </div>
        </div>
        <div className="dash" />
      </section>
    </main>
  );
}

function PCard({ p, cat }: { p: ProdutoCard; cat: string }) {
  const { lang, t, addOrc } = useSite();
  const name = pick(p, "nome", lang);
  const href = `/produtos/${encodeURIComponent(p.referencia || p.codigo)}`;
  return (
    <div className="pcard">
      <a className="ph" href={href}><div className="bg" /><div className="g" />
        {p.imagem && <img src={p.imagem} alt={name} loading="lazy" onError={(e) => e.currentTarget.remove()} />}
        {cat && <span className="tg">{cat}</span>}</a>
      <div className="b">
        <span className="code">{p.referencia || p.codigo}</span>
        <a href={href}><h3>{name}</h3></a>
        <span className="spec">Cód. {p.codigo}</span>
        <div className="foot">
          <a className="btn btn-ghost btn-sm" href={href}>{t.ver_ficha}</a>
          <button className="btn btn-navy btn-sm" onClick={() => addOrc(`${name} ${p.referencia || p.codigo}`)}>{t.add_orc}</button>
        </div>
      </div>
    </div>
  );
}

function numWord(n: number, lang: "pt" | "es") {
  const pt = ["Zero", "Uma", "Duas", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove", "Dez", "Onze", "Doze"];
  const es = ["Cero", "Una", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez", "Once", "Doce"];
  return (lang === "es" ? es : pt)[n] ?? String(n);
}

const SUP_ICONS = [
  <><path d="M14 3v5h5M14 3H6v18h12V8z" /><path d="M9 14l3 3 3-3M12 11v6" /></>,
  <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .2c0 1.6-2.5 2-2.5 3.8" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></>,
  <><path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></>,
];
