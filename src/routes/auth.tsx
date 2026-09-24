import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/admin/kit";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Painel Fluair" },
      { name: "description", content: "Acesso restrito ao painel administrativo da Fluair." },
      { property: "og:title", content: "Entrar — Painel Fluair" },
      { property: "og:description", content: "Acesso restrito ao painel administrativo da Fluair." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError("E-mail ou senha inválidos."); return; }
    navigate({ to: "/admin" });
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="brand-pattern relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <Logo invert className="h-10" />
        <div className="max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Painel de conteúdo Fluair</h2>
          <p className="mt-4 text-base text-primary-foreground/70">Produtos, catálogo, notícias e cotações em um só lugar.</p>
        </div>
        <p className="text-sm text-primary-foreground/60">Não importa o caminho, vá com Fluair!</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <form onSubmit={submit} className="w-full max-w-[400px] rounded-xl border border-border bg-card p-8 shadow-lift sm:p-10">
          <Logo className="mb-8 h-9" />
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse com seu e-mail corporativo.</p>

          {error && (
            <div role="alert" className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" required autoComplete="email" placeholder="voce@fluair.com.br" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} className="h-11 pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button type="button" onClick={() => toast.info("Peça a um administrador para redefinir sua senha.")} className="text-xs font-medium text-brand-accent hover:underline">
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} className="h-11 px-10" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:text-brand-accent focus-visible:outline-none">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={busy}>
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Entrando…</> : "Entrar"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
