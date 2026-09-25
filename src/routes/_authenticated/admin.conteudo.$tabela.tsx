import { createFileRoute } from "@tanstack/react-router";
import { getTable } from "@/lib/admin-config";
import { CrudPage } from "@/components/admin/CrudPage";
import { ConfigForm } from "@/components/admin/ConfigForm";
import { useAuth } from "@/hooks/useAuth";
import type { Modulo } from "@/lib/admin-config";

export const Route = createFileRoute("/_authenticated/admin/conteudo/$tabela")({
  component: Page,
});

function Page() {
  const { tabela } = Route.useParams();
  const { can } = useAuth();
  const config = getTable(tabela);
  if (!can(tabela as Modulo)) return <p className="text-muted-foreground">Você não tem acesso a esta área.</p>;
  if (tabela === "configuracoes") return <ConfigForm />;
  if (!config) return <p>Tabela não encontrada.</p>;
  return <CrudPage key={tabela} config={config} />;
}
