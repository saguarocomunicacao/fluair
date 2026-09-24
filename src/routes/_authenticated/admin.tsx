import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  BookOpen, ChevronsUpDown, Download, FileSpreadsheet, FileText, FolderTree, HelpCircle, Home, Image, LayoutDashboard,
  LogOut, MapPin, Menu, MessageSquareQuote, Newspaper, Package, PanelLeftClose, PanelLeftOpen, Search, Settings, Users, UserSquare2, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TABLES, canContent, canSales } from "@/lib/admin-config";
import { Logo } from "@/components/admin/kit";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel — Fluair" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

type Icon = ComponentType<{ className?: string }>;
const TABLE_ICONS: Record<string, Icon> = {
  categorias: FolderTree, produtos: Package, banners: Image, paginas: FileText, menus: Menu, noticias: Newspaper,
  downloads: Download, representantes: UserSquare2, rede_autorizada: MapPin, faq: HelpCircle, configuracoes: Settings,
};
const ROLE_LABEL: Record<string, string> = { admin: "Administrador", editor_conteudo: "Editor de conteúdo", comercial: "Comercial" };

type NavItem = { label: string; icon: Icon; to: string; params?: Record<string, string>; exact?: boolean; href: string };

const linkCls = "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted hover:text-foreground";
const activeCls = { className: "bg-sidebar-accent !text-sidebar-accent-foreground before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-brand-accent" };

function AdminLayout() {
  const { user, roles, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("fluair.sidebar") === "1");
    } catch { /* noop */ }
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try { localStorage.setItem("fluair.sidebar", c ? "0" : "1"); } catch { /* noop */ }
      return !c;
    });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const sections = useMemo(() => {
    const s: { title: string; items: NavItem[] }[] = [];
    if (canSales(roles)) s.push({ title: "Comercial", items: [{ label: "Cotações", icon: MessageSquareQuote, to: "/admin/cotacoes", href: "/admin/cotacoes" }] });
    if (canContent(roles)) s.push({
      title: "Conteúdo",
      items: [
        ...TABLES.map((t) => ({ label: t.label, icon: TABLE_ICONS[t.table] ?? BookOpen, to: "/admin/conteudo/$tabela", params: { tabela: t.table }, href: `/admin/conteudo/${t.table}` })),
        { label: "Importar produtos", icon: FileSpreadsheet, to: "/admin/importar", href: "/admin/importar" },
      ],
    });
    if (roles.includes("admin")) s.push({ title: "Sistema", items: [{ label: "Usuários", icon: Users, to: "/admin/usuarios", href: "/admin/usuarios" }] });
    return s;
  }, [roles]);

  const all = sections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.title })));
  const current = all.find((i) => location.pathname.startsWith(i.href));
  const results = q.trim() ? all.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase())) : [];

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando…</div>;

  const email = user?.email ?? "";
  const name = email.split("@")[0]?.replace(/[._-]/g, " ") ?? "";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

  const renderLink = (mini: boolean) => (i: NavItem) => {
    const link = (
      <Link to={i.href} activeOptions={{ exact: !!i.exact }}
        className={cn(linkCls, mini && "justify-center px-0")}
        activeProps={activeCls} onClick={() => setMobileOpen(false)}>
        <i.icon className="h-4 w-4 shrink-0" />
        {!mini && <span className="truncate">{i.label}</span>}
      </Link>
    );
    if (!mini) return <div key={i.href}>{link}</div>;
    return (
      <Tooltip key={i.href}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>{i.label}</TooltipContent>
      </Tooltip>
    );
  };

  const sidebar = (mini: boolean) => (
    <TooltipProvider delayDuration={100}>
      <aside className={cn("flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200", mini ? "w-16" : "w-64")}>
      <div className={cn("flex h-16 items-center", mini ? "justify-center px-2" : "justify-between px-5")}>
        {mini ? <Logo symbol className="h-8" /> : <Logo className="h-7" />}
        <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
        <div>{renderLink(mini)({ label: "Início", icon: LayoutDashboard, to: "/admin", href: "/admin", exact: true })}</div>
        {sections.map((s) => (
          <div key={s.title}>
            {mini
              ? <div className="mx-auto my-3 h-px w-6 bg-sidebar-border" />
              : <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{s.title}</div>}
            <div className="space-y-0.5">{s.items.map(renderLink(mini))}</div>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger title={email} className={cn("flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", mini && "justify-center")}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials}</span>
            {!mini && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold capitalize text-foreground">{name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{email}</span>
                </span>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-xs text-muted-foreground">Papel</div>
              <div className="text-sm font-medium">{roles.map((r) => ROLE_LABEL[r] ?? r).join(", ") || "Sem papel"}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive"><LogOut className="h-4 w-4" />Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </aside>
    </TooltipProvider>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar(collapsed)}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-64">{sidebar(false)}</div>
        </div>
      )}
      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card/85 px-4 backdrop-blur sm:px-8">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
          <button onClick={toggleCollapsed} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:grid">
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-muted-foreground" />
            {current ? (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="hidden text-muted-foreground sm:inline">{current.section}</span>
                <span className="hidden text-muted-foreground sm:inline">/</span>
                <span className="truncate font-medium text-foreground">{current.label}</span>
              </>
            ) : <span className="font-medium text-foreground">Início</span>}
          </div>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ir para…" className="h-9 bg-background pl-9" onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { navigate({ to: results[0].href }); setQ(""); } }} />
            {results.length > 0 && (
              <div className="absolute right-0 top-11 w-full overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lift">
                {results.map((r) => (
                  <button key={r.href} onClick={() => { navigate({ to: r.href }); setQ(""); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted">
                    <r.icon className="h-4 w-4 text-muted-foreground" />{r.label}<span className="ml-auto text-xs text-muted-foreground">{r.section}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>
        <main className={cn("w-full px-4 py-8 sm:px-8")}>
          {roles.length === 0 ? <p className="text-muted-foreground">Sua conta ainda não tem um papel atribuído. Peça a um administrador.</p> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
