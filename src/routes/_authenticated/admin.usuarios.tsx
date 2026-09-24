import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listUsers, createUser, setUserRole } from "@/lib/users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: Usuarios,
});

const ROLES = ["admin", "editor_conteudo", "comercial"] as const;

function Usuarios() {
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const setRole = useServerFn(setUserRole);
  const { data = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => list() });
  const [f, setF] = useState({ nome: "", email: "", password: "", role: "editor_conteudo" as (typeof ROLES)[number] });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await create({ data: f }); toast.success("Usuário criado"); setF({ ...f, nome: "", email: "", password: "" }); qc.invalidateQueries({ queryKey: ["usuarios"] }); }
    catch (err) { toast.error((err as Error).message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usuários</h1>
      <form onSubmit={add} className="grid gap-2 rounded-md border border-border bg-card p-4 sm:grid-cols-5">
        <Input placeholder="Nome" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        <Input placeholder="E-mail" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Input placeholder="Senha (mín. 8)" type="password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as typeof f.role })}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <Button type="submit">Criar</Button>
      </form>
      <div className="divide-y divide-border rounded-md border border-border bg-card">
        {data.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div><div className="font-medium">{u.nome}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
            <div className="flex gap-3">
              {ROLES.map((r) => (
                <label key={r} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={u.roles.includes(r)} onChange={async (e) => {
                    await setRole({ data: { userId: u.id, role: r, enabled: e.target.checked } });
                    qc.invalidateQueries({ queryKey: ["usuarios"] });
                  }} />{r}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
