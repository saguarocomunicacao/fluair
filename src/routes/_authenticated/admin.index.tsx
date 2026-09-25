import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderTree, Image, MessageSquareQuote, Newspaper, Package, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { COTACAO_STATUS, PageHeader, Panel, StatusBadge } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { can } = useAuth();
  const { data } = useQuery({
    queryKey: ["dash"],
    queryFn: async () => {
      const count = async (t: "produtos" | "categorias" | "noticias" | "cotacoes") => (await supabase.from(t).select("*", { count: "exact", head: true })).count ?? 0;
      const novas = (await supabase.from("cotacoes").select("*", { count: "exact", head: true }).eq("status", "novo")).count ?? 0;
      return { produtos: await count("produtos"), categorias: await count("categorias"), noticias: await count("noticias"), cotacoesNovas: novas };
    },
  });
  const { data: recentes = [] } = useQuery({
    queryKey: ["dash-recentes"],
    enabled: can("cotacoes"),
    queryFn: async () => (await supabase.from("cotacoes").select("id, nome, empresa, status, criado_em").order("criado_em", { ascending: false }).limit(5)).data ?? [],
  });

  const cards = [
    { label: "Produtos", value: data?.produtos, icon: Package },
    { label: "Categorias", value: data?.categorias, icon: FolderTree },
    { label: "Notícias", value: data?.noticias, icon: Newspaper },
    { label: "Cotações novas", value: data?.cotacoesNovas, icon: MessageSquareQuote },
  ];
  const shortcuts = [
    { label: "Novo produto", tabela: "produtos", icon: Package },
    { label: "Nova notícia", tabela: "noticias", icon: Newspaper },
    { label: "Novo banner", tabela: "banners", icon: Image },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Bem-vindo ao painel Fluair" description="Visão geral do conteúdo e das cotações." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Panel key={c.label} className="group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-accent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-accent-soft text-brand-accent"><c.icon className="h-4 w-4" /></span>
            </div>
            <div className="mt-3 font-display text-4xl tracking-wide text-primary">{c.value ?? "—"}</div>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {can("cotacoes") && (
          <Panel>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">Cotações recentes</h2>
              <Link to="/admin/cotacoes" className="flex items-center gap-1 text-sm font-medium text-brand-accent hover:underline">Ver todas<ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {recentes.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma cotação recebida ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentes.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-primary">{c.nome.slice(0, 2).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.nome}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.empresa ?? "—"} · {new Date(c.criado_em).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <StatusBadge tone={COTACAO_STATUS[c.status]?.tone ?? "neutral"}>{COTACAO_STATUS[c.status]?.label ?? c.status}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
        {shortcuts.some((s) => can(s.tabela as never, "criar")) && (
          <Panel className="self-start">
            <div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Atalhos rápidos</h2></div>
            <div className="space-y-2 p-3">
              {shortcuts.filter((s) => can(s.tabela as never, "criar")).map((s) => (
                <Link key={s.tabela} to="/admin/conteudo/$tabela" params={{ tabela: s.tabela }} className="group flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-brand-accent/40 hover:bg-brand-accent-soft">
                  <s.icon className="h-4 w-4 text-brand-accent" />{s.label}
                  <Plus className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-brand-accent" />
                </Link>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
