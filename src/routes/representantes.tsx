import { createFileRoute } from "@tanstack/react-router";
import { OndePage, chromeQuery, oeHead, oeQuery } from "@/components/site/OndeEncontrar";

export const Route = createFileRoute("/representantes")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(chromeQuery), context.queryClient.ensureQueryData(oeQuery)]),
  head: () => oeHead("Representantes comerciais — Fluair", "Encontre o representante comercial Fluair na sua região, com telefone, WhatsApp e e-mail."),
  component: () => <OndePage tipo="rep" />,
});
