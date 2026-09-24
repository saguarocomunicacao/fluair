import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Logo({ invert, className }: { invert?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("grid h-9 w-9 place-items-center rounded-xl", invert ? "bg-primary-foreground/10 ring-1 ring-primary-foreground/20" : "bg-primary")}>
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 8h11a3 3 0 1 0-3-3" />
          <path d="M4 12h15a3 3 0 1 1-3 3" />
          <path d="M4 16h7" />
        </svg>
      </div>
      <span className={cn("text-lg font-bold tracking-tight", invert ? "text-primary-foreground" : "text-primary")}>fluair</span>
    </div>
  );
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

export function EmptyState({ text, onAdd }: { text: string; onAdd?: () => void }) {
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
