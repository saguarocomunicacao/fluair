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

export const getCategoria = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "").slice(0, 120) }))
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: c } = await db.from("categorias").select("id,slug,nome_pt,nome_es,descricao_pt,descricao_es,imagem_url").eq("slug", data.slug).eq("ativo", true).maybeSingle();
    if (!c) return { categoria: null, total: 0 };
    const { count } = await db.from("produtos").select("id", { count: "exact", head: true }).eq("ativo", true).eq("categoria_id", c.id);
    return { categoria: c, total: count ?? 0 };
  });

export const getCartImgs = createServerFn({ method: "POST" })
  .inputValidator((d: { ids: string[] }) => ({ ids: (Array.isArray(d.ids) ? d.ids : []).filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 200) }))
  .handler(async ({ data }) => {
    if (!data.ids.length) return {} as Record<string, string>;
    const { data: ri } = await publicClient().from("produto_imagens").select("produto_id,url,ordem").in("produto_id", data.ids).order("ordem");
    const first: Record<string, string> = {};
    (ri ?? []).forEach((i) => { if (!first[i.produto_id]) first[i.produto_id] = i.url; });
    return first;
  });

const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
export const enviarCotacao = createServerFn({ method: "POST" })
  .inputValidator((d: {
    nome: string; email: string; telefone: string; empresa: string; cnpj: string; estado: string; mensagem: string; lgpd: boolean;
    itens: { produto_id: string; codigo: string; nome: string; quantidade: number }[];
  }) => {
    const r = {
      nome: s(d.nome, 120), email: s(d.email, 160).toLowerCase(), telefone: s(d.telefone, 30), empresa: s(d.empresa, 160),
      cnpj: s(d.cnpj, 20), estado: s(d.estado, 2).toUpperCase(), mensagem: s(d.mensagem, 2000),
      itens: (Array.isArray(d.itens) ? d.itens : []).slice(0, 200).map((i) => ({
        produto_id: /^[0-9a-f-]{36}$/i.test(String(i.produto_id)) ? String(i.produto_id) : null,
        codigo: s(i.codigo, 40), nome: s(i.nome, 200), quantidade: Math.min(999, Math.max(1, Math.floor(Number(i.quantidade) || 1))),
      })),
    };
    if (!d.lgpd) throw new Error("consent");
    if (r.nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) || r.telefone.replace(/\D/g, "").length < 10
      || !r.empresa || r.cnpj.replace(/\D/g, "").length !== 14 || !/^[A-Z]{2}$/.test(r.estado) || !r.itens.length) throw new Error("invalid");
    return r;
  })
  .handler(async ({ data }) => {
    const db = publicClient();
    const id = crypto.randomUUID();
    const { itens, ...lead } = data;
    const a = await db.from("cotacoes").insert({ id, ...lead, mensagem: lead.mensagem || null, status: "novo" });
    if (a.error) { console.error("cotacao", a.error); throw new Error("save"); }
    const b = await db.from("cotacao_itens").insert(itens.map((i) => ({ ...i, cotacao_id: id })));
    if (b.error) { console.error("itens", b.error); throw new Error("save"); }
    return { protocolo: id.slice(0, 8).toUpperCase() };
  });

export const enviarContato = createServerFn({ method: "POST" })
  .inputValidator((d: { nome: string; email: string; telefone: string; empresa: string; assunto: string; mensagem: string; lgpd: boolean }) => {
    const r = { nome: s(d.nome, 120), email: s(d.email, 160).toLowerCase(), telefone: s(d.telefone, 30), empresa: s(d.empresa, 160), assunto: s(d.assunto, 160), mensagem: s(d.mensagem, 3000) };
    if (!d.lgpd || r.nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) || r.telefone.replace(/\D/g, "").length < 10 || r.assunto.length < 2 || r.mensagem.length < 5) throw new Error("invalid");
    return r;
  })
  .handler(async ({ data }) => {
    const { error } = await publicClient().from("cotacoes").insert({
      nome: data.nome, email: data.email, telefone: data.telefone, empresa: data.empresa || null, status: "novo",
      mensagem: `[CONTATO] Assunto: ${data.assunto}\n\n${data.mensagem}`,
    });
    if (error) { console.error("contato", error); throw new Error("save"); }
    return { ok: true };
  });

export type Pagina = { slug: string; titulo_pt: string; titulo_es: string | null; conteudo_pt: string | null; conteudo_es: string | null; seo_titulo_pt: string | null; seo_titulo_es: string | null; seo_descricao_pt: string | null; seo_descricao_es: string | null; atualizado_em: string };
export const getPagina = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "").slice(0, 120) }))
  .handler(async ({ data }) => {
    const { data: p } = await publicClient().from("paginas")
      .select("slug,titulo_pt,titulo_es,conteudo_pt,conteudo_es,seo_titulo_pt,seo_titulo_es,seo_descricao_pt,seo_descricao_es,atualizado_em")
      .eq("slug", data.slug).eq("publicado", true).maybeSingle();
    return { pagina: (p ?? null) as Pagina | null };
  });
