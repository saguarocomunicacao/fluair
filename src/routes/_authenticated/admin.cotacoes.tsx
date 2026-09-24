import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COTACAO_STATUS, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/cotacoes")({
  component: Cotacoes,
});

const STATUS = ["novo", "em_atendimento", "concluido"] as const;
type Status = (typeof STATUS)[number];
const LABEL: Record<Status, string> = { novo: "Novo", em_atendimento: "Em atendimento", concluido: "Concluído" };

function Cotacoes() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<Status | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["cotacoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cotacoes").select("*, cotacao_itens(*)").order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const list = data.filter((c) => (filtro === "todos" || c.status === filtro) && [c.nome, c.email, c.empresa, c.cnpj].join(" ").toLowerCase().includes(busca.toLowerCase()));
  const atual = data.find((c) => c.id === sel);

  const mudar = async (id: string, status: Status) => {
    const { error } = await supabase.from("cotacoes").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["cotacoes"] });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Cotações" crumbs={["Comercial", "Cotações"]} description="Pedidos de orçamento recebidos pelo site." />
      <div className="flex flex-wrap gap-2">
        {(["todos", ...STATUS] as const).map((s) => (
          <Button key={s} size="sm" variant={filtro === s ? "default" : "outline"} onClick={() => setFiltro(s)}>
            {s === "todos" ? "Todas" : LABEL[s]} ({s === "todos" ? data.length : data.filter((c) => c.status === s).length})
          </Button>
        ))}
        <Input placeholder="Buscar nome, e-mail, empresa…" className="ml-auto h-9 w-72 bg-card" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Panel className="divide-y divide-border self-start overflow-hidden">
          {list.length === 0 && <EmptyState text="Nenhuma cotação por aqui." />}
          {list.map((c) => (
            <button key={c.id} onClick={() => setSel(c.id)} className={`relative block w-full px-4 py-3.5 text-left transition-colors hover:bg-brand-accent-soft ${sel === c.id ? "bg-brand-accent-soft before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-brand-accent" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.nome}</span>
                <StatusBadge tone={COTACAO_STATUS[c.status]?.tone ?? "neutral"}>{LABEL[c.status as Status]}</StatusBadge>
              </div>
              <div className="text-xs text-muted-foreground">{c.empresa ?? "—"} · {new Date(c.criado_em).toLocaleString("pt-BR")} · {c.cotacao_itens.length} itens</div>
            </button>
          ))}
        </Panel>
        {atual ? (
          <Panel className="space-y-5 self-start p-6">
            <div>
              <h2 className="text-lg font-semibold">{atual.nome}</h2>
              <p className="text-sm text-muted-foreground">{atual.empresa} {atual.cnpj && `· CNPJ ${atual.cnpj}`}</p>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">E-mail</dt><dd><a className="text-primary underline" href={`mailto:${atual.email}`}>{atual.email}</a></dd>
              <dt className="text-muted-foreground">Telefone</dt><dd>{atual.telefone ?? "—"}</dd>
              <dt className="text-muted-foreground">Estado</dt><dd>{atual.estado ?? "—"}</dd>
            </dl>
            {atual.mensagem && <p className="whitespace-pre-wrap rounded bg-muted p-3 text-sm">{atual.mensagem}</p>}
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th>Código</th><th>Produto</th><th className="text-right">Qtd</th></tr></thead>
              <tbody>{atual.cotacao_itens.map((i) => <tr key={i.id} className="border-t border-border"><td className="py-1">{i.codigo}</td><td>{i.nome}</td><td className="text-right">{i.quantidade}</td></tr>)}</tbody>
            </table>
            <div className="flex flex-wrap gap-2">
              {STATUS.map((s) => (
                <Button key={s} size="sm" variant={atual.status === s ? "default" : "outline"} onClick={() => mudar(atual.id, s)}>{LABEL[s]}</Button>
              ))}
            </div>
          </Panel>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Selecione uma cotação</div>
        )}
      </div>
    </div>
  );
}
