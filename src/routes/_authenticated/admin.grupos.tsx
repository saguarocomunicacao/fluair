import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MODULOS, type Acao } from "@/lib/admin-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/grupos")({
  component: Grupos,
});

type Grupo = { id: string; nome: string; descricao: string | null; is_admin: boolean; protegido: boolean };
type Matriz = Record<string, Record<Acao, boolean>>;
const ACOES: { id: Acao; label: string }[] = [
  { id: "ver", label: "Ver" }, { id: "criar", label: "Criar" }, { id: "editar", label: "Editar" }, { id: "excluir", label: "Excluir" },
];
const vazia = (): Matriz => Object.fromEntries(MODULOS.map((m) => [m.id, { ver: false, criar: false, editar: false, excluir: false }]));

function Grupos() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ["grupos-full"], enabled: isAdmin,
    queryFn: async () => (await supabase.from("grupos").select("*").order("nome")).data as Grupo[] ?? [],
  });
  const [sel, setSel] = useState<Grupo | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", is_admin: false });
  const [mat, setMat] = useState<Matriz>(vazia());
  const [busy, setBusy] = useState(false);

  if (!isAdmin) return <p className="text-muted-foreground">Apenas administradores acessam esta área.</p>;

  const abrir = async (g: Grupo | null) => {
    setSel(g ?? { id: "", nome: "", descricao: "", is_admin: false, protegido: false });
    setForm({ nome: g?.nome ?? "", descricao: g?.descricao ?? "", is_admin: g?.is_admin ?? false });
    const m = vazia();
    if (g) {
      const { data } = await supabase.from("grupo_permissoes").select("*").eq("grupo_id", g.id);
      for (const r of data ?? []) m[r.modulo] = { ver: r.pode_ver, criar: r.pode_criar, editar: r.pode_editar, excluir: r.pode_excluir };
    }
    setMat(m);
  };

  const toggle = (mod: string, a: Acao, v: boolean) => setMat((m) => {
    const row = { ...m[mod]!, [a]: v };
    if (a !== "ver" && v) row.ver = true;
    if (a === "ver" && !v) { row.criar = row.editar = row.excluir = false; }
    return { ...m, [mod]: row };
  });

  const salvar = async () => {
    if (!sel || !form.nome.trim()) { toast.error("Informe o nome"); return; }
    setBusy(true);
    try {
      const payload = { nome: form.nome.trim(), descricao: form.descricao || null, is_admin: form.is_admin };
      let id = sel.id;
      if (id) { const { error } = await supabase.from("grupos").update(payload).eq("id", id); if (error) throw error; }
      else { const { data, error } = await supabase.from("grupos").insert(payload).select("id").single(); if (error) throw error; id = data.id; }
      const { error: e1 } = await supabase.from("grupo_permissoes").delete().eq("grupo_id", id); if (e1) throw e1;
      const rows = Object.entries(mat).filter(([, p]) => p.ver).map(([modulo, p]) => ({ grupo_id: id, modulo, pode_ver: p.ver, pode_criar: p.criar, pode_editar: p.editar, pode_excluir: p.excluir }));
      if (!form.is_admin && rows.length) { const { error } = await supabase.from("grupo_permissoes").insert(rows); if (error) throw error; }
      toast.success("Grupo salvo");
      setSel(null);
      qc.invalidateQueries({ queryKey: ["grupos-full"] });
      qc.invalidateQueries({ queryKey: ["grupos"] });
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  };

  const excluir = async (g: Grupo) => {
    if (!confirm(`Excluir o grupo "${g.nome}"? Os usuários dele ficarão sem grupo.`)) return;
    const { error } = await supabase.from("grupos").delete().eq("id", g.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Grupo excluído");
    if (sel?.id === g.id) setSel(null);
    qc.invalidateQueries({ queryKey: ["grupos-full"] });
  };

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Grupos" crumbs={["Sistema", "Grupos"]} description="Defina o que cada grupo de usuários pode ver e fazer em cada módulo."
        actions={<Button onClick={() => abrir(null)}><Plus className="h-4 w-4" />Novo grupo</Button>} />
      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <Panel className="self-start overflow-hidden">
          {isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p> : (
            <div className="divide-y divide-border">
              {grupos.map((g) => (
                <div key={g.id} className={`flex items-center gap-2 px-4 py-3 ${sel?.id === g.id ? "bg-brand-accent-soft" : ""}`}>
                  <button type="button" onClick={() => abrir(g)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2 font-medium">{g.nome}{g.is_admin && <StatusBadge tone="success">Acesso total</StatusBadge>}</div>
                    {g.descricao && <div className="truncate text-xs text-muted-foreground">{g.descricao}</div>}
                  </button>
                  {!g.protegido && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Excluir" title="Excluir" onClick={() => excluir(g)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              ))}
            </div>
          )}
        </Panel>
        {sel ? (
          <Panel className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm">
              <Switch checked={form.is_admin} disabled={sel.protegido} onCheckedChange={(v) => setForm({ ...form, is_admin: v })} />
              Administrador (acesso total)
            </label>
            {form.is_admin ? (
              <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4 text-sm"><ShieldCheck className="h-5 w-5 text-brand-accent" />Este grupo tem acesso total a todos os módulos.</div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                    <tr><th className="px-4 py-2 text-left">Módulo</th>{ACOES.map((a) => <th key={a.id} className="w-20 px-2 py-2 text-center">{a.label}</th>)}<th className="w-28 px-2 py-2 text-center">Tudo</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {MODULOS.map((m) => {
                      const p = mat[m.id]!;
                      const tudo = ACOES.every((a) => p[a.id]);
                      return (
                        <tr key={m.id}>
                          <td className="px-4 py-2"><span className="font-medium">{m.label}</span> <span className="text-xs text-muted-foreground">· {m.secao}</span></td>
                          {ACOES.map((a) => <td key={a.id} className="text-center"><Checkbox aria-label={`${a.label} ${m.label}`} checked={p[a.id]} onCheckedChange={(v) => toggle(m.id, a.id, !!v)} /></td>)}
                          <td className="text-center"><Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setMat((x) => ({ ...x, [m.id]: { ver: !tudo, criar: !tudo, editar: !tudo, excluir: !tudo } }))}>{tudo ? "Desmarcar" : "Marcar tudo"}</Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSel(null)}>Cancelar</Button>
              <Button onClick={salvar} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Salvar grupo</Button>
            </div>
          </Panel>
        ) : <Panel className="grid place-items-center p-10 text-sm text-muted-foreground">Selecione um grupo ou crie um novo.</Panel>}
      </div>
    </div>
  );
}
