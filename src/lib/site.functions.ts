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

export const getCatalogo = createServerFn({ method: "GET" })
  .inputValidator((d: { q?: string; cat?: string; sort?: string; page?: number }) => d)
  .handler(async ({ data }) => {
    const db = publicClient();
    const PER = 24;
    const page = Math.max(1, Math.floor(data.page || 1));
    let q = db.from("produtos").select("id,codigo,referencia,nome_pt,nome_es,categoria_id,ordem", { count: "exact" }).eq("ativo", true);
    if (data.cat) {
      const c = await db.from("categorias").select("id").eq("slug", data.cat).eq("ativo", true).maybeSingle();
      q = q.eq("categoria_id", c.data?.id ?? "00000000-0000-0000-0000-000000000000");
    }
    const term = (data.q || "").trim().slice(0, 80).replace(/[,()%*\\]/g, " ");
    if (term) q = q.or(["referencia", "codigo", "nome_pt", "nome_es"].map((c) => `${c}.ilike.%${term}%`).join(","));
    if (data.sort === "nome") q = q.order("nome_pt");
    else if (data.sort === "referencia") q = q.order("referencia", { nullsFirst: false });
    else q = q.order("ordem").order("nome_pt");
    const r = await q.range((page - 1) * PER, page * PER - 1);
    const prods = r.data ?? [];
    const ids = prods.map((p) => p.id);
    const imgs = ids.length ? (await db.from("produto_imagens").select("produto_id,url,ordem").in("produto_id", ids).order("ordem")).data ?? [] : [];
    const first: Record<string, string> = {};
    for (const i of imgs) if (!first[i.produto_id]) first[i.produto_id] = i.url;
    return { total: r.count ?? 0, page, per: PER, produtos: prods.map((p) => ({ ...p, imagem: first[p.id] ?? null })) as ProdutoCard[] };
  });

export type ProdutoFicha = {
  id: string; codigo: string; referencia: string | null; nome_pt: string; nome_es: string | null;
  descricao_pt: string | null; descricao_es: string | null; informacoes_tecnicas_pt: string | null; informacoes_tecnicas_es: string | null;
  especificacoes: Record<string, string | number | boolean | null> | null; ncm: string | null; kit_reparo: string | null; categoria_id: string | null;
  imagens: { url: string; alt_pt: string | null; alt_es: string | null }[];
};

export const getProduto = createServerFn({ method: "GET" })
  .inputValidator((d: { ref: string }) => ({ ref: String(d.ref ?? "").slice(0, 120) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const cols = "id,codigo,referencia,nome_pt,nome_es,descricao_pt,descricao_es,informacoes_tecnicas_pt,informacoes_tecnicas_es,especificacoes,ncm,kit_reparo,categoria_id";
    let { data: rows } = await sb.from("produtos").select(cols).eq("ativo", true).eq("referencia", data.ref).order("ordem").limit(1);
    if (!rows?.length) ({ data: rows } = await sb.from("produtos").select(cols).eq("ativo", true).eq("codigo", data.ref).limit(1));
    const p = rows?.[0];
    if (!p) return { produto: null, relacionados: [] as ProdutoCard[] };
    const { data: imgs } = await sb.from("produto_imagens").select("*").eq("produto_id", p.id).order("ordem");
    let relacionados: ProdutoCard[] = [];
    if (p.categoria_id) {
      const { data: rel } = await sb.from("produtos").select("id,codigo,referencia,nome_pt,nome_es,categoria_id")
        .eq("ativo", true).eq("categoria_id", p.categoria_id).neq("id", p.id).order("ordem").limit(4);
      const ids = (rel ?? []).map((r) => r.id);
      const first: Record<string, string> = {};
      if (ids.length) {
        const { data: ri } = await sb.from("produto_imagens").select("produto_id,url,ordem").in("produto_id", ids).order("ordem");
        (ri ?? []).forEach((i) => { if (!first[i.produto_id]) first[i.produto_id] = i.url; });
      }
      relacionados = (rel ?? []).map((r) => ({ ...r, imagem: first[r.id] ?? null }));
    }
    const imagens = ((imgs ?? []) as Record<string, unknown>[]).map((i) => ({
      url: String(i["url"]), alt_pt: (i["alt_pt"] as string) ?? null, alt_es: (i["alt_es"] as string) ?? null,
    }));
    return { produto: { ...p, imagens } as ProdutoFicha, relacionados };
  });
