import { sitePending } from "@/components/site/SitePending";
import { createFileRoute } from "@tanstack/react-router";
import { OndePage, chromeQuery, oeHead, oeQuery } from "@/components/site/OndeEncontrar";

export const Route = createFileRoute("/rede-autorizada")({
  pendingComponent: sitePending("cards"),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(oeQuery)]),
  head: () => oeHead("Rede autorizada — Fluair", "Mapa da rede autorizada Fluair: pontos de instalação e manutenção de freios e ABS perto de você."),
  component: () => <OndePage tipo="rede" />,
});
