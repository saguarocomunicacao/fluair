import { OrcStep } from "@/components/site/OrcStep";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { pick, useSite } from "@/components/site/i18n";
import type { ProdutoCard as P } from "@/lib/site.functions";

export function ProductCard({ p, cat }: { p: P; cat: string }) {
  const { lang, t } = useSite();
  const [broken, setBroken] = useState(false);
  const name = pick(p, "nome", lang);
  const ref = p.referencia || p.codigo;
  return (
    <div className="pcard">
      <div className="ph"><div className="bg" /><div className="g" />
        {p.imagem && !broken ? <img src={p.imagem} alt={name} loading="lazy" onError={() => setBroken(true)} /> : (
          <div className="ph-empty"><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" /></svg></div>
        )}
        {cat && <span className="tg">{cat}</span>}
      </div>
      <div className="b">
        <span className="code">{ref}</span>
        <Link className="stretch" to="/produtos/$referencia" params={{ referencia: ref }}><h3>{name}</h3></Link>
        <span className="spec">Cód. {p.codigo}</span>
        <div className="foot">
          <OrcStep variant="sm" grow label={t.add_orc_long} item={{ id: p.id, codigo: p.codigo, referencia: p.referencia, nome: name }} />
        </div>
      </div>
    </div>
  );
}
