import { Spin, sitePending } from "@/components/site/SitePending";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import siteCss from "@/components/site/site.css?url";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSite } from "@/components/site/i18n";
import { enviarContato, getSiteChrome } from "@/lib/site.functions";

const chromeQuery = queryOptions({ queryKey: ["site-chrome"], queryFn: () => getSiteChrome(), staleTime: 60_000 });

export const Route = createFileRoute("/contato")({
  pendingComponent: sitePending("page"),
  loader: ({ context }) => context.queryClient.ensureQueryData(chromeQuery),
  head: () => ({
    meta: [
      { title: "Contato — Fluair Válvulas e Freios ABS" },
      { name: "description", content: "Fale com a Fluair: telefone, WhatsApp, e-mail e endereço em Palhoça/SC. Envie sua mensagem ao time comercial." },
      { property: "og:title", content: "Contato — Fluair" },
      { property: "og:description", content: "Telefone, WhatsApp, e-mail e formulário de contato da Fluair." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: siteCss }],
  }),
  component: () => {
    const { data: chrome } = useSuspenseQuery(chromeQuery);
    return <SiteLayout chrome={chrome}><Contato /></SiteLayout>;
  },
});

const L = {
  pt: {
    home: "Início", title: "Contato", intro: "Dúvidas técnicas, representação ou atendimento comercial — fale direto com a Fluair.",
    tel: "Telefone", wa: "WhatsApp", email: "E-mail", end: "Endereço", hor: "Atendimento", social: "Redes sociais", call: "Chamar no WhatsApp",
    form: "Envie uma mensagem", nome: "Nome", fone: "Telefone", empresa: "Empresa (opcional)", assunto: "Assunto", msg: "Mensagem",
    req: "Campo obrigatório", bad_email: "E-mail inválido", bad_tel: "Telefone incompleto", short: "Escreva um pouco mais",
    lgpd: "Autorizo a Fluair a usar meus dados para responder a este contato, conforme a LGPD.", lgpd_err: "Aceite o uso dos dados para continuar.",
    send: "Enviar mensagem", sending: "Enviando…", err: "Não foi possível enviar agora. Seus dados foram mantidos — tente novamente em instantes.",
    ok_t: "Mensagem enviada", ok_p: "Obrigado pelo contato. Retornaremos em breve.", again: "Enviar outra mensagem", back: "Voltar para a home",
  },
  es: {
    home: "Inicio", title: "Contacto", intro: "Dudas técnicas, representación o atención comercial — hable directo con Fluair.",
    tel: "Teléfono", wa: "WhatsApp", email: "E-mail", end: "Dirección", hor: "Atención", social: "Redes sociales", call: "Llamar por WhatsApp",
    form: "Envíe un mensaje", nome: "Nombre", fone: "Teléfono", empresa: "Empresa (opcional)", assunto: "Asunto", msg: "Mensaje",
    req: "Campo obligatorio", bad_email: "E-mail inválido", bad_tel: "Teléfono incompleto", short: "Escriba un poco más",
    lgpd: "Autorizo a Fluair a usar mis datos para responder a este contacto, conforme a la LGPD.", lgpd_err: "Acepte el uso de los datos para continuar.",
    send: "Enviar mensaje", sending: "Enviando…", err: "No fue posible enviar ahora. Sus datos se mantuvieron — intente nuevamente en instantes.",
    ok_t: "Mensaje enviado", ok_p: "Gracias por el contacto. Responderemos pronto.", again: "Enviar otro mensaje", back: "Volver al inicio",
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

type Form = { nome: string; email: string; telefone: string; empresa: string; assunto: string; mensagem: string; lgpd: boolean };
const empty: Form = { nome: "", email: "", telefone: "", empresa: "", assunto: "", mensagem: "", lgpd: false };

function Fld({ label, req = true, full, err, children }: { label: string; req?: boolean; full?: boolean; err?: string | undefined; children: ReactNode }) {
  return <div className={`fld ${full ? "oq-full" : ""} ${err ? "err" : ""}`}><label>{label}{req && " *"}</label>{children}{err && <div className="em">{err}</div>}</div>;
}

const Ico = ({ p }: { p: ReactNode }) => <span className="i"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{p}</svg></span>;
const handle = (v: string) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?[^/]+\//, "");

function Contato() {
  const { lang, wa } = useSite();
  const { data: chrome } = useSuspenseQuery(chromeQuery);
  const l = L[lang];
  const cfg = (k: string) => chrome.config[k]?.[lang] || chrome.config[k]?.pt || "";
  const [f, setF] = useState<Form>(empty);
  const [errs, setErrs] = useState<Partial<Record<keyof Form, string>>>({});
  const [sending, setSending] = useState(false);
  const [fail, setFail] = useState(false);
  const [done, setDone] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e: typeof errs = {};
    if (f.nome.trim().length < 2) e.nome = l.req;
    if (!f.email.trim()) e.email = l.req; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = l.bad_email;
    if (!f.telefone) e.telefone = l.req; else if (d(f.telefone).length < 10) e.telefone = l.bad_tel;
    if (f.assunto.trim().length < 2) e.assunto = l.req;
    if (!f.mensagem.trim()) e.mensagem = l.req; else if (f.mensagem.trim().length < 5) e.mensagem = l.short;
    if (!f.lgpd) e.lgpd = l.lgpd_err;
    setErrs(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setFail(false);
    if (!validate()) return;
    setSending(true);
    try { await enviarContato({ data: f }); setF(empty); setDone(true); }
    catch { setFail(true); } finally { setSending(false); }
  };

  const tel = cfg("telefone"), whats = cfg("whatsapp"), email = cfg("email"), end = cfg("endereco"), hor = cfg("horario");
  const insta = cfg("instagram"), fb = cfg("facebook"), yt = cfg("youtube");

  return (
    <main>
      <div className="page-head"><div className="wrap">
        <div className="crumb"><Link to="/">{l.home}</Link> / {l.title}</div>
        <h1>{l.title}</h1>
        <p className="intro">{l.intro}</p>
      </div><div className="dash" /></div>

      <div className="wrap ct">
        <div className="ct-info">
          {tel && <a className="ct-item" href={`tel:+55${d(tel)}`}><Ico p={<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" />} /><div><small>{l.tel}</small><b>{tel}</b></div></a>}
          {whats && <a className="ct-item" href={wa} target="_blank" rel="noreferrer"><Ico p={<path d="M3 21l1.7-5A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4-1z" />} /><div><small>{l.wa}</small><b>{whats}</b></div></a>}
          {email && <a className="ct-item" href={`mailto:${email}`}><Ico p={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>} /><div><small>{l.email}</small><b>{email}</b></div></a>}
          {end && <a className="ct-item" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end)}`} target="_blank" rel="noreferrer"><Ico p={<><path d="M12 21s-7-6.3-7-12a7 7 0 0114 0c0 5.7-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>} /><div><small>{l.end}</small><b>{end}</b></div></a>}
          {hor && <div className="ct-item"><Ico p={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} /><div><small>{l.hor}</small><b>{hor}</b></div></div>}
          {(insta || fb || yt) && (
            <div className="ct-social" aria-label={l.social}>
              {insta && <a href={`https://instagram.com/${handle(insta)}`} target="_blank" rel="noreferrer" aria-label="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></a>}
              {fb && <a href={`https://facebook.com/${handle(fb)}`} target="_blank" rel="noreferrer" aria-label="Facebook"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a4 4 0 00-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z" /></svg></a>}
              {yt && <a href={/^https?:/.test(yt) ? yt : `https://youtube.com/@${handle(yt)}`} target="_blank" rel="noreferrer" aria-label="YouTube"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a3 3 0 00-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 002 8.2 31 31 0 002 12a31 31 0 00.1 3.8 3 3 0 002.1 2.1c1.9.5 7.8.5 7.8.5s6 0 7.9-.5a3 3 0 002.1-2.1A31 31 0 0022 12a31 31 0 000-3.8zM10 15V9l5.2 3z" /></svg></a>}
            </div>
          )}
          {whats && <a className="btn ct-wa" href={wa} target="_blank" rel="noreferrer">{l.call}</a>}
          {end && (
            <div className="ct-map">
              <iframe title="Mapa Fluair" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent("Fluair, " + end)}&output=embed`} />
            </div>
          )}
        </div>

        <div className="ct-form">
          {done ? (
            <div className="ct-ok ok" style={{ padding: "40px 10px" }}>
              <div className="oq-ic"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div>
              <h2>{l.ok_t}</h2><p>{l.ok_p}</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setDone(false)}>{l.again}</button>
                <Link className="btn btn-navy btn-sm" to="/">{l.back}</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h3>{l.form}</h3>
              <div className="oq-fgrid">
                <Fld label={l.nome} full err={errs.nome}><input value={f.nome} maxLength={120} autoComplete="name" onChange={(e) => set("nome", e.target.value)} /></Fld>
                <Fld label={l.email} err={errs.email}><input type="email" value={f.email} maxLength={160} autoComplete="email" onChange={(e) => set("email", e.target.value)} /></Fld>
                <Fld label={l.fone} err={errs.telefone}><input value={f.telefone} inputMode="tel" autoComplete="tel" placeholder="(48) 99999-9999" onChange={(e) => set("telefone", maskTel(e.target.value))} /></Fld>
                <Fld label={l.empresa} req={false} err={errs.empresa}><input value={f.empresa} maxLength={160} autoComplete="organization" onChange={(e) => set("empresa", e.target.value)} /></Fld>
                <Fld label={l.assunto} err={errs.assunto}><input value={f.assunto} maxLength={160} onChange={(e) => set("assunto", e.target.value)} /></Fld>
                <Fld label={l.msg} full err={errs.mensagem}><textarea rows={6} value={f.mensagem} maxLength={3000} onChange={(e) => set("mensagem", e.target.value)} /></Fld>
              </div>
              <label className={`lgpd ${errs.lgpd ? "err" : ""}`}><input type="checkbox" checked={f.lgpd} onChange={(e) => set("lgpd", e.target.checked)} /> <span>{l.lgpd} *</span></label>
              {errs.lgpd && <div className="fld"><div className="em">{errs.lgpd}</div></div>}
              {fail && <div className="orc-alert" role="alert">{l.err}</div>}
              <button className="btn btn-navy orc-send" disabled={sending}>{sending ? <><Spin />{l.sending}</> : l.send}</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
