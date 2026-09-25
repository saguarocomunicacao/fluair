import { BusyButton } from "@/components/site/SitePending";
import { useSite } from "@/components/site/i18n";

type It = { id: string; codigo: string; referencia: string | null; nome: string };

/** Botão de orçamento consciente do carrinho: vira seletor de quantidade quando o item já está na lista. */
export function OrcStep({ item, label, variant = "sm", grow = false }: { item: It; label: string; variant?: "sm" | "big"; grow?: boolean }) {
  const { cart, addOrc, setCart } = useSite();
  const qty = cart.find((c) => c.id === item.id)?.quantidade ?? 0;

  if (!qty) {
    return <BusyButton className={`btn btn-navy ${variant === "big" ? "btn-big" : "btn-sm"}`} onClick={() => addOrc({ ...item, quantidade: 1 })}>{label}</BusyButton>;
  }

  const set = (q: number) => {
    const next = q <= 0
      ? cart.filter((c) => c.id !== item.id)
      : cart.map((c) => (c.id === item.id ? { ...c, quantidade: Math.min(999, Math.max(1, q)) } : c));
    setCart(next);
  };

  return (
    <div className={`orc-step ${variant === "big" ? "big" : ""} ${grow ? "grow" : ""}`} role="group" aria-label="Quantidade">
      <button type="button" onClick={() => set(qty - 1)} aria-label="-">−</button>
      <input value={qty} inputMode="numeric" aria-label="Quantidade" onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")) || 1)} />
      <button type="button" onClick={() => set(qty + 1)} aria-label="+">+</button>
    </div>
  );
}
