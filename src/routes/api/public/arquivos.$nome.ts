import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Link permanente para arquivos do bucket "downloads".
// Só entrega arquivos cadastrados em um download ATIVO; não existe listagem.
export const Route = createFileRoute("/api/public/arquivos/$nome")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const nome = params.nome;
        if (!/^[\w.\-]{1,200}$/.test(nome)) return new Response("Not found", { status: 404 });
        const pub = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: row } = await pub.from("downloads").select("id")
          .eq("ativo", true).eq("arquivo_url", `/api/public/arquivos/${nome}`).limit(1).maybeSingle();
        if (!row) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.storage.from("downloads").createSignedUrl(nome, 300);
        if (!data?.signedUrl) return new Response("Not found", { status: 404 });
        return new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "no-store" } });
      },
    },
  },
});
