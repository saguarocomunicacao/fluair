import { createFileRoute } from "@tanstack/react-router";
import { chromeQuery, paginaHead, paginaQuery, PaginaInstitucional } from "@/components/site/PaginaInstitucional";

const SLUG = "gestao-da-qualidade";

export const Route = createFileRoute("/empresa/gestao-da-qualidade")({
  loader: async ({ context }) => {
    const [, d] = await Promise.all([
      context.queryClient.ensureQueryData(chromeQuery),
      context.queryClient.ensureQueryData(paginaQuery(SLUG)),
    ]);
    return d;
  },
  head: ({ loaderData }) => paginaHead(loaderData?.pagina),
  component: () => <PaginaInstitucional slug={SLUG} />,
});
