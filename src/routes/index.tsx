import { createFileRoute, redirect } from "@tanstack/react-router";

// O site público virá depois; por enquanto a raiz leva ao painel.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fluair — Válvulas e freios ABS para implementos rodoviários" },
      { name: "description", content: "Fluair fabrica válvulas e freios ABS para o sistema de freio de implementos rodoviários." },
      { property: "og:title", content: "Fluair — Válvulas e freios ABS" },
      { property: "og:description", content: "Válvulas e freios ABS para implementos rodoviários." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
