import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TABLES, canContent, canSales } from "@/lib/admin-config";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel — Fluair" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const linkCls = "block rounded px-3 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent";
const activeCls = { className: "bg-sidebar-accent font-semibold" };

function AdminLayout() {
  const { user, roles, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (loading) return <div className="p-8 text-muted-foreground">Carregando…</div>;

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar p-4">
        <div className="mb-6">
          <div className="text-xl font-black tracking-tight text-primary">FLUAIR</div>
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          <div className="text-xs text-muted-foreground">{roles.join(", ") || "sem papel"}</div>
        </div>
        <nav className="space-y-4">
          <Link to="/admin" activeOptions={{ exact: true }} className={linkCls} activeProps={activeCls}>Início</Link>
          {canSales(roles) && (
            <div>
              <div className="px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">Comercial</div>
              <Link to="/admin/cotacoes" className={linkCls} activeProps={activeCls}>Cotações</Link>
            </div>
          )}
          {canContent(roles) && (
            <div>
              <div className="px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">Conteúdo</div>
              {TABLES.map((t) => (
                <Link key={t.table} to="/admin/conteudo/$tabela" params={{ tabela: t.table }} className={linkCls} activeProps={activeCls}>{t.label}</Link>
              ))}
              <Link to="/admin/importar" className={linkCls} activeProps={activeCls}>Importar produtos (CSV)</Link>
            </div>
          )}
          {roles.includes("admin") && (
            <div>
              <div className="px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">Sistema</div>
              <Link to="/admin/usuarios" className={linkCls} activeProps={activeCls}>Usuários</Link>
            </div>
          )}
        </nav>
        <Button variant="outline" size="sm" className="mt-6 w-full" onClick={signOut}>Sair</Button>
      </aside>
      <main className="flex-1 overflow-x-auto p-6">
        {roles.length === 0 ? <p>Sua conta ainda não tem um papel atribuído. Peça a um administrador.</p> : <Outlet />}
      </main>
    </div>
  );
}
