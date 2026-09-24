import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoCor from "@/assets/fluair-logo-cor.png.asset.json";
import logoBranco from "@/assets/fluair-logo-branco.png.asset.json";
import simbolo from "@/assets/fluair-simbolo.png.asset.json";

export function Logo({ invert, symbol, className }: { invert?: boolean; symbol?: boolean; className?: string }) {
  if (symbol) return <img src={simbolo.url} alt="Fluair" className={cn("h-8 w-auto self-start object-contain", className)} />;
  return <img src={invert ? logoBranco.url : logoCor.url} alt="Fluair" className={cn("h-8 w-auto self-start object-contain", className)} />;
}

type Tone = "success" | "neutral" | "info" | "warning";
const toneCls: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  neutral: "bg-muted text-muted-foreground",
  info: "bg-brand-accent-soft text-brand-accent",
  warning: "bg-warning-soft text-warning",
};
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", toneCls[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export const COTACAO_STATUS: Record<string, { label: string; tone: Tone }> = {
  novo: { label: "Novo", tone: "info" },
  em_atendimento: { label: "Em atendimento", tone: "warning" },
  concluido: { label: "Concluído", tone: "success" },
};

export function PageHeader({ title, crumbs, description, actions }: { title: string; crumbs?: string[]; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/admin" className="hover:text-foreground">Início</Link>
            {crumbs.map((c) => (
              <span key={c} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" />{c}</span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border border-border bg-card shadow-soft", className)}>{children}</div>;
}

export function EmptyState({ text, onAdd }: { text: string; onAdd?: (() => void) | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-accent-soft text-brand-accent">
        <Inbox className="h-7 w-7" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
      {onAdd && <Button onClick={onAdd} size="sm"><Plus className="h-4 w-4" />Adicionar</Button>}
    </div>
  );
}
