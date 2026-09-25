import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import logoCor from "@/assets/fluair-logo-cor.png.asset.json";
import logoBranco from "@/assets/fluair-logo-branco.png.asset.json";
import { SiteCtx, dict, pick, readCart, type CartItem, type Lang } from "./i18n";
import type { Categoria, Menu } from "@/lib/site.functions";

type Chrome = { menus: Menu[]; config: Record<string, { pt: string; es: string }>; categorias: Categoria[] };

const digits = (s: string) => s.replace(/\D/g, "");

export function SiteLayout({ chrome, transparentTop = false, children }: { chrome: Chrome; transparentTop?: boolean; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");
  const [solid, setSolid] = useState(!transparentTop);
  const [mob, setMob] = useState(false);
  const [orc, setOrc] = useState(0);
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const l = localStorage.getItem("fluair.lang");
    if (l === "es" || l === "pt") setLangState(l);
    const c = readCart();
    setCartState(c);
    setOrc(c.reduce((a, i) => a + i.quantidade, 0));
  }, []);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("fluair.lang", l); };
  useEffect(() => { document.documentElement.lang = lang === "es" ? "es" : "pt-BR"; }, [lang]);

  const cfg = (k: string) => chrome.config[k]?.[lang] ?? "";
  const waNum = digits(cfg("whatsapp"));
  const wa = waNum ? `https://wa.me/55${waNum}` : "#";

  // Header sólido ao rolar + parallax [data-para] + reveals + contadores
  useEffect(() => {
    const el = root.current!;
    const paras = [...el.querySelectorAll<HTMLElement>("[data-para]")];
    let ticking = false;
    const onScroll = () => {
      setSolid(!transparentTop || window.scrollY > 60);
      const vh = innerHeight;
      for (const p of paras) {
        const r = p.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const c = r.top + r.height / 2 - vh / 2;
        p.style.transform = `translate3d(0,${(c * (parseFloat(p.dataset["para"]!) || 0)).toFixed(1)}px,0)`;
      }
      ticking = false;
    };
    const sc = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    addEventListener("scroll", sc, { passive: true });
    addEventListener("resize", onScroll);
    onScroll();
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.14 });
    el.querySelectorAll(".reveal").forEach((r) => io.observe(r));
    const timers: ReturnType<typeof setInterval>[] = [];
    const cio = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      const t = en.target as HTMLElement; const to = Number(t.dataset["to"]); let n = 0;
      const step = Math.max(1, Math.ceil(to / 45));
      const id = setInterval(() => { n += step; if (n >= to) { n = to; clearInterval(id); } t.textContent = String(n); }, 22);
      timers.push(id); cio.unobserve(t);
    }), { threshold: 0.6 });
    el.querySelectorAll(".count").forEach((c) => cio.observe(c));
    return () => { removeEventListener("scroll", sc); removeEventListener("resize", onScroll); io.disconnect(); cio.disconnect(); timers.forEach(clearInterval); };
  }, [transparentTop]);

  const applyCart = (items: CartItem[]) => {
    localStorage.setItem("fluair.orc.items", JSON.stringify(items));
    setCartState(items);
    setOrc(items.reduce((a, i) => a + i.quantidade, 0));
  };

  const addOrc = (item: CartItem | string) => {
    const it: CartItem = typeof item === "string" ? { id: item, codigo: "", referencia: null, nome: item, quantidade: 1 } : item;
    const cart = readCart();
    const ex = cart.find((c) => c.id === it.id);
    const q = Math.max(1, it.quantidade || 1); if (ex) ex.quantidade += q; else cart.push({ ...it, quantidade: q });
    applyCart(cart);
    setToast(`${it.nome}${it.referencia ? " " + it.referencia : ""} — ${dict[lang].added}`);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2600);
  };

  const setCart = (items: CartItem[]) => applyCart(items);
  const ctx = useMemo(() => ({ lang, setLang, t: dict[lang], cart, addOrc, setCart, wa }), [lang, wa, cart]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = dict[lang];
  const header = chrome.menus.filter((m) => m.local === "header" && !m.parent_id);
  const footer = chrome.menus.filter((m) => m.local === "footer" && !m.parent_id);
  const insta = cfg("instagram"), fb = cfg("facebook");

  return (
    <SiteCtx.Provider value={ctx}>
      <div className="fl-site" ref={root}>
        <header className={`${solid ? "solid" : ""} ${mob ? "mobopen" : ""}`}>
          <div className="wrap nav">
            <a href="/" className="brand"><span className="logo-chip"><img className="lg-branco" src={logoBranco.url} alt="Fluair" /><img className="lg-cor" src={logoCor.url} alt="" aria-hidden="true" /></span></a>
            <nav className="menu">
              {header.map((m) => <a key={m.id} href={m.url} onClick={() => setMob(false)}>{pick(m, "label", lang)}</a>)}
            </nav>
            <div className="right">
              <div className="lang">
                <button className={lang === "pt" ? "active" : ""} onClick={() => setLang("pt")}>PT</button>
                <span style={{ color: "#6c8" }}>·</span>
                <button className={lang === "es" ? "active" : ""} onClick={() => setLang("es")}>ES</button>
              </div>
              <a className="btn btn-yellow btn-sm" href="/orcamento">{t.orcamento}{orc > 0 && <span className="orc" style={{ display: "inline-grid" }}>{orc}</span>}</a>
              <button className="hamburger" aria-label="Menu" onClick={() => setMob((v) => !v)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              </button>
            </div>
          </div>
        </header>

        <div className="route-fade">{children}</div>

        <footer>
          <svg className="road-ghost" viewBox="0 0 1440 200" fill="none" preserveAspectRatio="none"><path d="M500 200 L700 20 L740 20 L940 200" stroke="#fff" strokeWidth="2" /><path d="M720 200 L720 24" stroke="#116ad1" strokeWidth="4" strokeDasharray="20 18" /></svg>
          <div className="wrap">
            <div className="fgrid">
              <div>
                <div className="fchip"><img src={logoBranco.url} alt="Fluair" /></div>
                <p style={{ maxWidth: "34ch", fontSize: 14 }}>{t.foot_tag} {cfg("tagline")}</p>
                <div className="social">
                  {insta && <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></a>}
                  {fb && <a href={`https://facebook.com/${fb}`} target="_blank" rel="noreferrer" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2 0-3 1-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9z" /></svg></a>}
                </div>
              </div>
              <div><h5>{t.foot_prod}</h5><ul>{chrome.categorias.slice(0, 4).map((c) => <li key={c.id}><a href={`/categorias/${c.slug}`}>{pick(c, "nome", lang)}</a></li>)}</ul></div>
              <div><h5>{t.foot_comp}</h5><ul>{footer.map((m) => <li key={m.id}><a href={m.url}>{pick(m, "label", lang)}</a></li>)}</ul></div>
              <div><h5>{t.foot_wa}</h5>
                <div className="wa-list">
                  <a href={`tel:+55${digits(cfg("telefone"))}`}><span className="who">{t.tel}</span> {cfg("telefone")}</a>
                  <a href={wa} target="_blank" rel="noreferrer"><span className="who">WHATSAPP</span> {cfg("whatsapp")}</a>
                  <a href={`mailto:${cfg("email")}`}><span className="who">{t.email}</span> {cfg("email")}</a>
                  <span><span className="who">{t.end}</span><br />{cfg("endereco")}</span>
                </div>
              </div>
            </div>
            <div className="fbtm"><span>© {new Date().getFullYear()} Fluair Componentes Pneumáticos Ltda.</span><span>{t.privacy}</span></div>
          </div>
        </footer>

        <a className="wa-float" href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z" /></svg>
        </a>
        <div className={`toast ${toast ? "show" : ""}`}><span className="d" /><span>{toast}</span></div>
      </div>
    </SiteCtx.Provider>
  );
}
