import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function publicClient() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type Menu = { id: string; local: string; label_pt: string; label_es: string | null; url: string; parent_id: string | null; ordem: number };
export type Categoria = { id: string; slug: string; nome_pt: string; nome_es: string | null; descricao_pt: string | null; descricao_es: string | null; ordem: number };
export type Banner = { id: string; titulo_pt: string | null; titulo_es: string | null; subtitulo_pt: string | null; subtitulo_es: string | null; imagem_url: string | null; cta_label_pt: string | null; cta_label_es: string | null; cta_url: string | null };
export type ProdutoCard = { id: string; codigo: string; referencia: string | null; nome_pt: string; nome_es: string | null; categoria_id: string | null; imagem: string | null };

export const getSiteChrome = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const [menus, cfg, cats] = await Promise.all([
    db.from("menus").select("id,local,label_pt,label_es,url,parent_id,ordem").eq("ativo", true).order("ordem"),
    db.from("configuracoes").select("chave,valor_pt,valor_es"),
    db.from("categorias").select("id,slug,nome_pt,nome_es,descricao_pt,descricao_es,ordem").eq("ativo", true).order("ordem"),
  ]);
  const config: Record<string, { pt: string; es: string }> = {};
  for (const r of cfg.data ?? []) config[r.chave] = { pt: r.valor_pt ?? "", es: r.valor_es || r.valor_pt || "" };
  return { menus: (menus.data ?? []) as Menu[], config, categorias: (cats.data ?? []) as Categoria[] };
});

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const cols = "id,codigo,referencia,nome_pt,nome_es,categoria_id,ordem";
  const [banners, count, dest] = await Promise.all([
    db.from("banners").select("*").eq("local", "home_hero").eq("ativo", true).order("ordem"),
    db.from("produtos").select("id", { count: "exact", head: true }).eq("ativo", true),
    db.from("produtos").select(cols).eq("ativo", true).eq("destaque", true).order("ordem").limit(6),
  ]);
  let prods = dest.data ?? [];
  if (!prods.length) {
    const r = await db.from("produtos").select(cols).eq("ativo", true).order("ordem").limit(6);
    prods = r.data ?? [];
  }
  const ids = prods.map((p) => p.id);
  const imgs = ids.length
    ? (await db.from("produto_imagens").select("produto_id,url,ordem").in("produto_id", ids).order("ordem")).data ?? []
    : [];
  const first: Record<string, string> = {};
  for (const i of imgs) if (!first[i.produto_id]) first[i.produto_id] = i.url;
  return {
    banners: (banners.data ?? []) as Banner[],
    totalProdutos: count.count ?? 0,
    produtos: prods.map((p) => ({ ...p, imagem: first[p.id] ?? null })) as ProdutoCard[],
  };
});
