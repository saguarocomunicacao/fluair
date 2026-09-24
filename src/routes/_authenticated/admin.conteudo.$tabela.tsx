import { createFileRoute } from "@tanstack/react-router";
import { getTable } from "@/lib/admin-config";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/_authenticated/admin/conteudo/$tabela")({
  component: Page,
});

function Page() {
  const { tabela } = Route.useParams();
  const config = getTable(tabela);
  if (!config) return <p>Tabela não encontrada.</p>;
  return <CrudPage key={tabela} config={config} />;
}
