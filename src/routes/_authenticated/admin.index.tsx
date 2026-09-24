import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dash"],
    queryFn: async () => {
      const count = async (t: "produtos" | "categorias" | "noticias" | "cotacoes") => (await supabase.from(t).select("*", { count: "exact", head: true })).count ?? 0;
      const novas = (await supabase.from("cotacoes").select("*", { count: "exact", head: true }).eq("status", "novo")).count ?? 0;
      return { produtos: await count("produtos"), categorias: await count("categorias"), noticias: await count("noticias"), cotacoesNovas: novas };
    },
  });
  const cards = [["Produtos", data?.produtos], ["Categorias", data?.categorias], ["Notícias", data?.noticias], ["Cotações novas", data?.cotacoesNovas]] as const;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bem-vindo ao painel Fluair</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">{l}</div>
            <div className="text-3xl font-bold">{v ?? "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
