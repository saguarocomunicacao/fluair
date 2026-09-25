import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Loader2, RefreshCw, Search, UserPlus } from "lucide-react";
import { listUsers, createUser, setUserGroup, setUserActive } from "@/lib/users.functions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: Usuarios,
});


function Usuarios() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const setGroup = useServerFn(setUserGroup);
  const setActive = useServerFn(setUserActive);
    const { data = [], isLoading } = useQuery({ queryKey: ["usuarios"], queryFn: () => list(), enabled: isAdmin });
  const { data: grupos = [] } = useQuery({ queryKey: ["grupos"], enabled: isAdmin, queryFn: async () => (await supabase.from("grupos").select("id, nome").order("nome")).data ?? [] });
  const [f, setF] = useState({ nome: "", email: "", password: "", grupoId: "" });
  const [modo, setModo] = useState<"convite" | "senha">("convite");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["usuarios"] });
  const shown = useMemo(() => data.filter((u) => `${u.nome} ${u.email}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  if (!isAdmin) return <p className="text-muted-foreground">Apenas administradores acessam esta área.</p>;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.grupoId) { toast.error("Escolha um grupo"); return; }
    setBusy(true);
    try {
      if (modo === "convite") {
        await invite({ data: { nome: f.nome, email: f.email, grupoId: f.grupoId, redirectTo: `${window.location.origin}/definir-senha` } });
        toast.success("Convite enviado por e-mail");
      } else {
        await create({ data: f });
        toast.success("Usuário criado");
      }
      setF({ ...f, nome: "", email: "", password: "" });
      refresh();
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Usuários" crumbs={["Sistema", "Usuários"]} description="Quem acessa o painel e o que cada pessoa pode fazer." />
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Panel className="self-start p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4" />Adicionar usuário</h3>
          <Tabs value={modo} onValueChange={(v) => setModo(v as typeof modo)}>
            <TabsList className="mb-4 w-full"><TabsTrigger value="convite" className="flex-1">Convidar por e-mail</TabsTrigger><TabsTrigger value="senha" className="flex-1">Criar com senha</TabsTrigger></TabsList>
            <form onSubmit={add} className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
              <TabsContent value="senha" className="mt-0 space-y-2"><Label>Senha (mín. 8)</Label><Input type="password" required={modo === "senha"} minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></TabsContent>
              <div className="space-y-2">
                <Label>Grupo</Label>
                <select required className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={f.grupoId} onChange={(e) => setF({ ...f, grupoId: e.target.value })}>
                  <option value="">Selecione…</option>
                  {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : modo === "convite" ? <Mail className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{modo === "convite" ? "Enviar convite" : "Criar usuário"}</Button>
              <p className="text-xs text-muted-foreground">O que cada grupo pode fazer é definido em Sistema → Grupos.</p>
            </form>
          </Tabs>
        </Panel>
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-sm text-muted-foreground">{data.length} usuário(s)</span>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 w-56 pl-9" /></div>
          </div>
          {isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p> : shown.length === 0 ? <EmptyState text="Nenhum usuário encontrado." /> : (
            <div className="divide-y divide-border">
              {shown.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-48 flex-1">
                    <div className="flex items-center gap-2 font-medium">{u.nome || "—"}
                      <StatusBadge tone={u.ativo ? "success" : "neutral"}>{u.ativo ? "Ativo" : "Desativado"}</StatusBadge>
                      {u.pendente && <StatusBadge tone="warning">Convite pendente</StatusBadge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email} · último acesso: {u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleString("pt-BR") : "nunca"}</div>
                  </div>
                  <select aria-label="Grupo" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={u.grupo_id ?? ""} onChange={async (e) => {
                    try { await setGroup({ data: { userId: u.id, grupoId: e.target.value } }); toast.success("Grupo atualizado"); refresh(); } catch (err) { toast.error((err as Error).message); }
                  }}>
                    {!u.grupo_id && <option value="">Sem grupo</option>}
                    {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Ativo
                    <Switch checked={u.ativo} disabled={u.id === user?.id} onCheckedChange={async (c) => {
                      try { await setActive({ data: { userId: u.id, ativo: c } }); toast.success(c ? "Usuário ativado" : "Usuário desativado"); refresh(); } catch (err) { toast.error((err as Error).message); }
                    }} />
                  </label>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
