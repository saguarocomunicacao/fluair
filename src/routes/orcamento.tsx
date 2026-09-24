import { sitePending } from "@/components/site/SitePending";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { readCart, useSite, type CartItem } from "@/components/site/i18n";
import { enviarCotacao, getCartImgs, getSiteChrome } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export const Route = createFileRoute("/orcamento")({
  pendingComponent: sitePending("page"),
  loader: ({ context }) => context.queryClient.ensureQueryData(chromeQuery),
  head: () => ({
    meta: [
      { title: "Pedido de orçamento — Fluair" },
      { name: "description", content: "Monte sua lista de válvulas e componentes Fluair e envie um pedido de orçamento para o time comercial." },
      { property: "og:title", content: "Pedido de orçamento — Fluair" },
      { property: "og:description", content: "Envie sua lista de produtos Fluair e receba o retorno do nosso time comercial." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: siteCss }],
  }),
  component: () => {
    const { data: chrome } = useSuspenseQuery(chromeQuery);
    return <SiteLayout chrome={chrome}><Orcamento /></SiteLayout>;
  },
});

const L = {
  pt: {
    home: "Início", title: "Orçamento", intro: "Revise os itens, informe seus dados e nosso time comercial retorna com a proposta.",
    empty_t: "Seu orçamento está vazio", empty_p: "Adicione produtos do catálogo para montar seu pedido.", browse: "Ver produtos",
    cod: "Cód.", clear: "Limpar carrinho", cont: "Continuar comprando", rm: "Remover item",
    rm_t: "Remover este item?", rm_p: "O produto sai da sua lista de orçamento.", clear_t: "Limpar o carrinho?", clear_p: "Todos os itens serão removidos da lista.",
    cancel: "Cancelar", confirm: "Remover", confirm_clear: "Limpar",
    side: "Seus dados", total: "itens no total", nome: "Nome", email: "E-mail", tel: "Telefone / WhatsApp", empresa: "Empresa", cnpj: "CNPJ", uf: "Estado", msg: "Mensagem (opcional)",
    sel: "Selecione", req: "Campo obrigatório", bad_email: "E-mail inválido", bad_tel: "Telefone incompleto", bad_cnpj: "CNPJ incompleto",
    lgpd: "Autorizo a Fluair a usar meus dados para responder a este pedido de orçamento, conforme a LGPD.", lgpd_err: "Aceite o uso dos dados para continuar.",
    send: "Enviar pedido de orçamento", sending: "Enviando…", err: "Não foi possível enviar agora. Seus dados foram mantidos — tente novamente em instantes.",
    ok_t: "Recebemos seu pedido de orçamento", ok_p: "Nosso time comercial vai retornar em breve pelo e-mail ou telefone informado.", proto: "Protocolo", back: "Voltar para a home",
  },
  es: {
    home: "Inicio", title: "Cotización", intro: "Revise los ítems, informe sus datos y nuestro equipo comercial responde con la propuesta.",
    empty_t: "Su cotización está vacía", empty_p: "Agregue productos del catálogo para armar su pedido.", browse: "Ver productos",
    cod: "Cód.", clear: "Vaciar carrito", cont: "Seguir comprando", rm: "Quitar ítem",
    rm_t: "¿Quitar este ítem?", rm_p: "El producto sale de su lista de cotización.", clear_t: "¿Vaciar el carrito?", clear_p: "Todos los ítems serán quitados de la lista.",
    cancel: "Cancelar", confirm: "Quitar", confirm_clear: "Vaciar",
    side: "Sus datos", total: "ítems en total", nome: "Nombre", email: "E-mail", tel: "Teléfono / WhatsApp", empresa: "Empresa", cnpj: "CNPJ", uf: "Estado", msg: "Mensaje (opcional)",
    sel: "Seleccione", req: "Campo obligatorio", bad_email: "E-mail inválido", bad_tel: "Teléfono incompleto", bad_cnpj: "CNPJ incompleto",
    lgpd: "Autorizo a Fluair a usar mis datos para responder a este pedido de cotización, conforme a la LGPD.", lgpd_err: "Acepte el uso de los datos para continuar.",
    send: "Enviar pedido de cotización", sending: "Enviando…", err: "No fue posible enviar ahora. Sus datos se mantuvieron — intente nuevamente en instantes.",
    ok_t: "Recibimos su pedido de cotización", ok_p: "Nuestro equipo comercial responderá pronto por el e-mail o teléfono informado.", proto: "Protocolo", back: "Volver al inicio",
  },
};

const d = (s: string) => s.replace(/\D/g, "");
const maskTel = (v: string) => {
  const x = d(v).slice(0, 11);
  if (x.length <= 2) return x.length ? `(${x}` : "";
  if (x.length <= 6) return `(${x.slice(0, 2)}) ${x.slice(2)}`;
  if (x.length <= 10) return `(${x.slice(0, 2)}) ${x.slice(2, 6)}-${x.slice(6)}`;
  return `(${x.slice(0, 2)}) ${x.slice(2, 7)}-${x.slice(7)}`;
};
const maskCnpj = (v: string) => {
  const x = d(v).slice(0, 14);
  return x.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
};

type Form = { nome: string; email: string; telefone: string; empresa: string; cnpj: string; estado: string; mensagem: string; lgpd: boolean };
const empty: Form = { nome: "", email: "", telefone: "", empresa: "", cnpj: "", estado: "", mensagem: "", lgpd: false };

const Ph = () => <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" /></svg>;

function Fld({ k, label, full, err, children }: { k: keyof Form; label: string; full?: boolean; err?: string | undefined; children: React.ReactNode }) {
  return <div className={`fld ${full ? "oq-full" : ""} ${err ? "err" : ""}`}><label>{label}{k !== "mensagem" && " *"}</label>{children}{err && <div className="em">{err}</div>}</div>;
}

function Orcamento() {
  const { lang, setCart } = useSite();
  const l = L[lang];
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [imgs, setImgs] = useState<Record<string, string>>({});
  const [f, setF] = useState<Form>(empty);
  const [errs, setErrs] = useState<Partial<Record<keyof Form, string>>>({});
  const [sending, setSending] = useState(false);
  const [fail, setFail] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "one"; id: string } | { kind: "all" } | null>(null);

  useEffect(() => {
    const c = readCart(); setItems(c);
    if (c.length) getCartImgs({ data: { ids: c.map((i) => i.id) } }).then(setImgs).catch(() => {});
  }, []);

  const save = (next: CartItem[]) => { setItems(next); setCart(next); };
  const setQty = (id: string, q: number) => save((items ?? []).map((i) => (i.id === id ? { ...i, quantidade: Math.min(999, Math.max(1, q)) } : i)));
  const total = (items ?? []).reduce((a, i) => a + i.quantidade, 0);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e: typeof errs = {};
    if (f.nome.trim().length < 2) e.nome = l.req;
    if (!f.email.trim()) e.email = l.req; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = l.bad_email;
    if (!f.telefone) e.telefone = l.req; else if (d(f.telefone).length < 10) e.telefone = l.bad_tel;
    if (!f.empresa.trim()) e.empresa = l.req;
    if (!f.cnpj) e.cnpj = l.req; else if (d(f.cnpj).length !== 14) e.cnpj = l.bad_cnpj;
    if (!f.estado) e.estado = l.req;
    if (!f.lgpd) e.lgpd = l.lgpd_err;
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setFail(false);
    if (!items?.length || !validate()) return;
    setSending(true);
    try {
      const r = await enviarCotacao({ data: { ...f, itens: items.map((i) => ({ produto_id: i.id, codigo: i.codigo, nome: [i.referencia, i.nome].filter(Boolean).join(" — "), quantidade: i.quantidade })) } });
      save([]); setF(empty); setDone(r.protocolo); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { setFail(true); } finally { setSending(false); }
  };

  const Head = (
    <div className="page-head"><div className="wrap">
      <div className="crumb"><Link to="/">{l.home}</Link> / {l.title}</div>
      <h1>{l.title}</h1>
      {!done && <p className="intro">{l.intro}</p>}
    </div><div className="dash" /></div>
  );
  const catalogo = { q: "", cat: "", sort: "ordem", page: 1 };

  if (done) {
    return (
      <main>{Head}
        <div className="wrap ok">
          <div className="oq-ic"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div>
          <h2>{l.ok_t}</h2><p>{l.ok_p}</p>
          <div className="proto">{l.proto}: #{done}</div><br />
          <Link className="btn btn-navy" to="/">{l.back}</Link>
        </div>
      </main>
    );
  }

  if (items === null) return <main>{Head}<div style={{ height: 400 }} /></main>;

  if (!items.length) {
    return (
      <main>{Head}
        <div className="wrap nf">
          <h2 className="f-name" style={{ marginBottom: 8 }}>{l.empty_t}</h2>
          <p style={{ color: "var(--steel)", marginBottom: 22 }}>{l.empty_p}</p>
          <Link className="btn btn-navy" to="/produtos" search={catalogo}>{l.browse}</Link>
        </div>
      </main>
    );
  }


  return (
    <main>{Head}
      <div className="wrap oq-orc">
        <div>
          <div className="orc-list">
            {items.map((i) => {
              const ref = i.referencia || i.codigo;
              return (
                <div className="orc-row" key={i.id}>
                  <div className="th">{imgs[i.id] ? <img src={imgs[i.id]} alt={i.nome} loading="lazy" /> : <Ph />}</div>
                  <div>
                    {ref && <span className="ref">{ref}</span>}
                    <h3>{ref ? <Link to="/produtos/$referencia" params={{ referencia: ref }}>{i.nome}</Link> : i.nome}</h3>
                    {i.codigo && <small>{l.cod} {i.codigo}</small>}
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => setQty(i.id, i.quantidade - 1)} aria-label="-">−</button>
                    <input value={i.quantidade} inputMode="numeric" aria-label="Quantidade" onChange={(e) => setQty(i.id, Number(d(e.target.value)) || 1)} />
                    <button type="button" onClick={() => setQty(i.id, i.quantidade + 1)} aria-label="+">+</button>
                  </div>
                  <button type="button" className="rm" aria-label={l.rm} title={l.rm} onClick={() => setConfirm({ kind: "one", id: i.id })}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
          <div className="orc-actions">
            <Link className="btn btn-ghost btn-sm" to="/produtos" search={catalogo}>{l.cont}</Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm({ kind: "all" })}>{l.clear}</button>
          </div>
        </div>

        <form className="orc-side" onSubmit={submit} noValidate>
          <h3>{l.side}</h3>
          <div className="orc-sum"><span>{l.total}</span><b>{total}</b></div>
          <div className="oq-fgrid">
            <Fld k="nome" err={errs.nome} label={l.nome} full><input value={f.nome} maxLength={120} autoComplete="name" onChange={(e) => set("nome", e.target.value)} /></Fld>
            <Fld k="email" err={errs.email} label={l.email} full><input type="email" value={f.email} maxLength={160} autoComplete="email" onChange={(e) => set("email", e.target.value)} /></Fld>
            <Fld k="telefone" err={errs.telefone} label={l.tel}><input value={f.telefone} inputMode="tel" autoComplete="tel" placeholder="(48) 99999-9999" onChange={(e) => set("telefone", maskTel(e.target.value))} /></Fld>
            <Fld k="estado" err={errs.estado} label={l.uf}>
              <select value={f.estado} onChange={(e) => set("estado", e.target.value)}><option value="">{l.sel}</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select>
            </Fld>
            <Fld k="empresa" err={errs.empresa} label={l.empresa}><input value={f.empresa} maxLength={160} autoComplete="organization" onChange={(e) => set("empresa", e.target.value)} /></Fld>
            <Fld k="cnpj" err={errs.cnpj} label={l.cnpj}><input value={f.cnpj} inputMode="numeric" placeholder="00.000.000/0000-00" onChange={(e) => set("cnpj", maskCnpj(e.target.value))} /></Fld>
            <Fld k="mensagem" err={errs.mensagem} label={l.msg} full><textarea rows={3} value={f.mensagem} maxLength={2000} onChange={(e) => set("mensagem", e.target.value)} /></Fld>
          </div>
          <label className={`lgpd ${errs.lgpd ? "err" : ""}`}><input type="checkbox" checked={f.lgpd} onChange={(e) => set("lgpd", e.target.checked)} /> <span>{l.lgpd} *</span></label>
          {errs.lgpd && <div className="fld"><div className="em">{errs.lgpd}</div></div>}
          {fail && <div className="orc-alert" role="alert">{l.err}</div>}
          <button className="btn btn-navy orc-send" disabled={sending}>{sending ? l.sending : l.send}</button>
        </form>
      </div>

      {confirm && (
        <div className="modal-bg" onClick={() => setConfirm(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h4>{confirm.kind === "all" ? l.clear_t : l.rm_t}</h4>
            <p>{confirm.kind === "all" ? l.clear_p : l.rm_p}</p>
            <div className="oq-row">
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>{l.cancel}</button>
              <button className="btn btn-red btn-sm" onClick={() => { save(confirm.kind === "all" ? [] : items.filter((i) => i.id !== confirm.id)); setConfirm(null); }}>
                {confirm.kind === "all" ? l.confirm_clear : l.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
