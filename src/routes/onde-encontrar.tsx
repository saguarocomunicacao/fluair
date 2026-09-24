import { createFileRoute, redirect } from "@tanstack/react-router";

// Página antiga com abas: redireciona para as novas páginas próprias.
export const Route = createFileRoute("/onde-encontrar")({
  validateSearch: (s: Record<string, unknown>) => ({ aba: s["aba"] === "rede" ? ("rede" as const) : undefined }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: search.aba === "rede" ? "/rede-autorizada" : "/representantes", statusCode: 301 });
  },
});
