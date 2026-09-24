import loaderLogo from "@/assets/fluair-logo-branco-loader.png.asset.json";

export function NavigationLoader() {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-primary/92 backdrop-blur-sm animate-in fade-in duration-200"
      role="status"
      aria-live="polite"
      aria-label="Carregando conteúdo"
    >
      <div className="relative grid h-44 w-44 place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-primary-foreground/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-brand-accent border-t-brand-accent" />
        <span className="grid h-36 w-36 place-items-center rounded-full bg-primary shadow-lift">
          <img
            src={loaderLogo.url}
            alt="Fluair"
            className="h-auto w-28 object-contain"
          />
        </span>
      </div>
      <span className="sr-only">Carregando conteúdo…</span>
    </div>
  );
}