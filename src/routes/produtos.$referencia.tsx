import { BusyButton, sitePending } from "@/components/site/SitePending";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { OrcStep } from "@/components/site/OrcStep";
import { pick, useSite } from "@/components/site/i18n";
import { getProduto, getSiteChrome } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const produtoQuery = (ref: string) =>
  queryOptions({ queryKey: ["site-produto", ref], queryFn: () => getProduto({ data: { ref } }), staleTime: 30_000 });

const strip = (h: string | null | undefined) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const Route = createFileRoute("/produtos/$referencia")({
  pendingComponent: sitePending("ficha"),
  loader: async ({ context, params }) => {
    const [, d] = await Promise.all([
      context.queryClient.ensureQueryData(chromeQuery),
      context.queryClient.ensureQueryData(produtoQuery(params.referencia)),
    ]);
    return d;
  },
  head: ({ loaderData }) => {
    const p = loaderData?.produto;
    if (!p) return { meta: [{ title: "Produto não encontrado — Fluair" }, { name: "robots", content: "noindex" }], links: [{ rel: "stylesheet", href: siteCss }] };
    const ref = p.referencia || p.codigo;
    const title = `${ref} — ${p.nome_pt} | Fluair`;
    const desc = (strip(p.descricao_pt) || strip(p.informacoes_tecnicas_pt) || `${p.nome_pt}, referência ${ref}, código ${p.codigo}. Fabricação Fluair.`).slice(0, 158);
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "stylesheet", href: siteCss }],
    };
  },
  errorComponent: () => <div style={{ padding: 40 }}>Não foi possível carregar o produto. Tente novamente.</div>,
  component: FichaPage,
});

function FichaPage() {
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  return <SiteLayout chrome={chrome}><Ficha /></SiteLayout>;
}

const L = {
  pt: { home: "Início", prods: "Produtos", nf_t: "Produto não encontrado", nf_p: "Não encontramos um produto ativo com essa referência.", back: "Voltar ao catálogo", cod: "Código", kit: "Kit reparo", spec: "Especificações", desc: "Descrição", info: "Informações técnicas", qty: "Quantidade", add: "+ Adicionar ao orçamento", wa: "Falar no WhatsApp", rel: "Produtos relacionados", rel_k: "Mesma categoria", msg: "Olá! Tenho interesse no produto" },
  es: { home: "Inicio", prods: "Productos", nf_t: "Producto no encontrado", nf_p: "No encontramos un producto activo con esa referencia.", back: "Volver al catálogo", cod: "Código", kit: "Kit de reparación", spec: "Especificaciones", desc: "Descripción", info: "Información técnica", qty: "Cantidad", add: "+ Agregar a la cotización", wa: "Hablar por WhatsApp", rel: "Productos relacionados", rel_k: "Misma categoría", msg: "¡Hola! Tengo interés en el producto" },
};

function Ficha() {
  const { referencia } = Route.useParams();
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  const { data } = useSuspenseQuery(produtoQuery(referencia));
  const { lang, addOrc, wa, cart } = useSite();
  const l = L[lang];
  const [sel, setSel] = useState(0);
  const [qty, setQty] = useState(1);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const p = data.produto;

  if (!p) {
    return (
      <main>
        <div className="page-head"><div className="wrap">
          <div className="crumb"><Link to="/">{l.home}</Link> / <Link to="/produtos" search={{ q: "", cat: "", sort: "ordem", page: 1 }}>{l.prods}</Link> / {referencia}</div>
          <h1>{l.nf_t}</h1>
        </div><div className="dash" /></div>
        <div className="wrap nf">
          <p style={{ color: "var(--steel)", marginBottom: 22 }}>{l.nf_p}</p>
          <Link className="btn btn-navy" to="/produtos" search={{ q: "", cat: "", sort: "ordem", page: 1 }}>{l.back}</Link>
        </div>
      </main>
    );
  }

  const cat = chrome.categorias.find((c) => c.id === p.categoria_id);
  const catName = cat ? pick(cat, "nome", lang) : "";
  const name = pick(p, "nome", lang);
  const ref = p.referencia || p.codigo;
  const desc = pick(p, "descricao", lang);
  const info = pick(p, "informacoes_tecnicas", lang);
  const specs = Object.entries(p.especificacoes ?? {}).filter(([k, v]) => k && v !== null && v !== "");
  const imgs = p.imagens;
  const cur = imgs[sel];
  const waHref = wa === "#" ? "#" : `${wa}?text=${encodeURIComponent(`${l.msg} ${name} (ref. ${ref}, cód. ${p.codigo}).`)}`;
  const catalogo = { q: "", cat: "", sort: "ordem", page: 1 };
  const placeholder = <div className="ph-empty"><svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" /></svg></div>;

  return (
    <main>
      <div className="page-head"><div className="wrap">
        <div className="crumb">
          <Link to="/">{l.home}</Link> / <Link to="/produtos" search={catalogo}>{l.prods}</Link>
          {cat && <> / <Link to="/produtos" search={{ ...catalogo, cat: cat.slug }}>{catName}</Link></>} / {ref}
        </div>
        <h1>{ref}</h1>
        <p className="intro">{name}</p>
      </div><div className="dash" /></div>

      <div className="wrap ficha">
        <div>
          <div className="gal-main">
            {cur && !broken[sel] ? <img src={cur.url} alt={pick(cur, "alt", lang) || name} onError={() => setBroken((b) => ({ ...b, [sel]: true }))} /> : placeholder}
          </div>
          {imgs.length > 1 && (
            <div className="thumbs">
              {imgs.map((im, i) => (
                <button key={i} className={i === sel ? "on" : ""} onClick={() => setSel(i)} aria-label={`Imagem ${i + 1}`}>
                  <img src={im.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {cat && <a className="f-cat" href={`/categorias/${cat.slug}`}>{catName}</a>}
          <div className="f-ref">{ref}</div>
          <h2 className="f-name">{name}</h2>
          <div className="f-meta">
            <span>{l.cod} <b>{p.codigo}</b></span>
            {p.ncm && <span>NCM <b>{p.ncm}</b></span>}
            {p.kit_reparo && <span>{l.kit} <b>{p.kit_reparo}</b></span>}
          </div>

          {specs.length > 0 && (
            <div className="f-sec"><h4>{l.spec}</h4>
              <table className="spec-t"><tbody>
                {specs.map(([k, v]) => <tr key={k}><td>{k}</td><td>{String(v)}</td></tr>)}
              </tbody></table>
            </div>
          )}
          {desc && <div className="f-sec"><h4>{l.desc}</h4><div className="f-rich" dangerouslySetInnerHTML={{ __html: desc }} /></div>}
          {info && <div className="f-sec"><h4>{l.info}</h4><div className="f-rich" dangerouslySetInnerHTML={{ __html: info }} /></div>}

          <div className="f-sec">
            <div className="buy">
              {cart.some((c) => c.id === p.id) ? (
                <OrcStep variant="big" grow label={l.add} item={{ id: p.id, codigo: p.codigo, referencia: p.referencia, nome: name }} />
              ) : (
                <>
                  <div className="qty" aria-label={l.qty}>
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-">−</button>
                    <input value={qty} inputMode="numeric" aria-label={l.qty} onChange={(e) => setQty(Math.min(999, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} />
                    <button onClick={() => setQty((q) => Math.min(999, q + 1))} aria-label="+">+</button>
                  </div>
                  <BusyButton className="btn btn-navy btn-big" onClick={() => addOrc({ id: p.id, codigo: p.codigo, referencia: p.referencia, nome: name, quantidade: qty })}>{l.add}</BusyButton>
                </>
              )}
            </div>
            <div className="sec-btns">
              <a className="btn btn-ghost btn-sm" href={waHref} target="_blank" rel="noreferrer">{l.wa}</a>
              <Link className="btn btn-ghost btn-sm" to="/produtos" search={catalogo}>{l.back}</Link>
            </div>
          </div>
        </div>
      </div>

      {data.relacionados.length > 0 && (
        <section className="wrap rel">
          <div className="sec-head"><span className="kick">{l.rel_k}</span><h2>{l.rel}</h2></div>
          <div className="pgrid" style={{ marginTop: 28 }}>
            {data.relacionados.map((r) => <ProductCard key={r.id} p={r} cat={catName} />)}
          </div>
        </section>
      )}
    </main>
  );
}
