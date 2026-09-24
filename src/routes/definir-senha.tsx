import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/admin/kit";

export const Route = createFileRoute("/definir-senha")({
  head: () => ({
    meta: [
      { title: "Definir senha — Painel Fluair" },
      { name: "description", content: "Crie a senha de acesso ao painel da Fluair." },
      { property: "og:title", content: "Definir senha — Painel Fluair" },
      { property: "og:description", content: "Crie a senha de acesso ao painel da Fluair." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DefinirSenha,
});

function DefinirSenha() {
  const navigate = useNavigate();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (p1.length < 8) { toast.error("A senha precisa ter ao menos 8 caracteres"); return; }
    if (p1 !== p2) { toast.error("As senhas não conferem"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (error) { toast.error("Link inválido ou expirado. Peça um novo convite ao administrador."); return; }
    toast.success("Senha definida!");
    navigate({ to: "/admin" });
  };
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-8 shadow-soft">
        <div className="flex justify-center"><Logo className="h-10" /></div>
        <div className="text-center"><h1 className="text-xl font-semibold">Definir sua senha</h1><p className="text-sm text-muted-foreground">Crie a senha para acessar o painel.</p></div>
        <div className="space-y-2"><Label>Nova senha</Label><Input type="password" value={p1} onChange={(e) => setP1(e.target.value)} /></div>
        <div className="space-y-2"><Label>Confirmar senha</Label><Input type="password" value={p2} onChange={(e) => setP2(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Salvar senha</Button>
      </form>
    </div>
  );
}
