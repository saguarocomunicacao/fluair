import { Link } from "@tanstack/react-router";
import { pick, useSite } from "@/components/site/i18n";
import type { NoticiaCard as N } from "@/lib/site.functions";

export const fmtData = (iso: string | null, lang: "pt" | "es") =>
  iso ? new Date(iso).toLocaleDateString(lang === "es" ? "es-ES" : "pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }) : "";

export function NoticiaCard({ n }: { n: N }) {
  const { lang } = useSite();
  const resumo = pick(n, "resumo", lang);
  return (
    <Link className="ncard" to="/noticias/$slug" params={{ slug: n.slug }}>
      <div className="cv">{n.capa_url ? <img src={n.capa_url} alt={pick(n, "titulo", lang)} loading="lazy" /> : <span>FLUAIR</span>}</div>
      <div className="bd">
        <div className="nmeta">{n.categoria && <b>{n.categoria}</b>}<span>{fmtData(n.publicado_em, lang)}</span></div>
        <h3>{pick(n, "titulo", lang)}</h3>
        {resumo && <p>{resumo}</p>}
      </div>
    </Link>
  );
}
