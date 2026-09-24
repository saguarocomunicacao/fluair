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
  const [banners, count, dest, secoes] = await Promise.all([
    db.from("banners").select("*").eq("local", "home_hero").eq("ativo", true).order("ordem"),
    db.from("produtos").select("id", { count: "exact", head: true }).eq("ativo", true),
    db.from("produtos").select(cols).eq("ativo", true).eq("destaque", true).order("ordem").limit(6),
    db.from("secoes_home").select("secao,conteudo_pt,conteudo_es"),
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
    secoes: (secoes.data ?? []) as { secao: string; conteudo_pt: Record<string, string | Record<string, string>[]> | null; conteudo_es: Record<string, string | Record<string, string>[]> | null }[],
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

export type DownloadItem = { id: string; titulo_pt: string; titulo_es: string | null; descricao_pt: string | null; descricao_es: string | null; arquivo_url: string | null; categoria: string | null; ext: string; tamanho: number | null };
export const getDownloads = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("downloads")
    .select("id,titulo_pt,titulo_es,descricao_pt,descricao_es,arquivo_url,categoria,ordem")
    .eq("ativo", true).order("categoria").order("ordem");
  const rows = (data ?? []) as Omit<DownloadItem, "ext" | "tamanho">[];
  const locais = rows.some((r) => r.arquivo_url?.startsWith("/api/public/arquivos/"));
  const sizes = new Map<string, number>();
  if (locais) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: files } = await supabaseAdmin.storage.from("downloads").list("", { limit: 1000 });
    for (const f of files ?? []) { const n = Number((f.metadata as { size?: number } | null)?.size); if (n > 0) sizes.set(f.name, n); }
  }
  const itens = await Promise.all(rows.map(async (r) => {
    const path = (r.arquivo_url ?? "").split("?")[0] ?? "";
    const ext = (path.match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? "").toLowerCase();
    let tamanho: number | null = null;
    if (path.startsWith("/api/public/arquivos/")) {
      tamanho = sizes.get(path.slice("/api/public/arquivos/".length)) ?? null;
    } else if (r.arquivo_url) {
      try {
        const res = await fetch(r.arquivo_url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        const n = Number(res.headers.get("content-length"));
        if (res.ok && n > 0) tamanho = n;
      } catch { /* sem tamanho */ }
    }
    return { ...r, ext, tamanho } as DownloadItem;
  }));
  return { itens };
});

export type Representante = { id: string; nome: string; empresa: string | null; estado: string | null; cidade: string | null; abrangencia: string | null; telefone: string | null; whatsapp: string | null; email: string | null };
export type PontoRede = { id: string; nome: string; cidade: string | null; estado: string | null; endereco: string | null; telefone: string | null; whatsapp: string | null; lat: number | null; lng: number | null };
export const getOndeEncontrar = createServerFn({ method: "GET" }).handler(async () => {
  const c = publicClient();
  const [r, n] = await Promise.all([
    c.from("representantes").select("id,nome,empresa,estado,cidade,abrangencia,telefone,whatsapp,email").eq("ativo", true).order("estado").order("ordem"),
    c.from("rede_autorizada").select("id,nome,cidade,estado,endereco,telefone,whatsapp,lat,lng").eq("ativo", true).order("estado").order("cidade"),
  ]);
  return { representantes: (r.data ?? []) as Representante[], rede: (n.data ?? []) as PontoRede[] };
});

export type FaqItem = { id: string; pergunta_pt: string; pergunta_es: string | null; resposta_pt: string | null; resposta_es: string | null; categoria: string | null };
export const getFaq = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("faq")
    .select("id,pergunta_pt,pergunta_es,resposta_pt,resposta_es,categoria,ordem")
    .eq("ativo", true).order("categoria").order("ordem");
  return { itens: (data ?? []) as FaqItem[] };
});

export type NoticiaCard = { id: string; slug: string; titulo_pt: string; titulo_es: string | null; resumo_pt: string | null; resumo_es: string | null; capa_url: string | null; categoria: string | null; publicado_em: string | null };
export type Noticia = NoticiaCard & { conteudo_pt: string | null; conteudo_es: string | null; autor: string | null };
const NCOLS = "id,slug,titulo_pt,titulo_es,resumo_pt,resumo_es,capa_url,categoria,publicado_em";
export const getNoticias = createServerFn({ method: "GET" })
  .inputValidator((d: { q?: string; cat?: string; page?: number }) => ({
    q: String(d.q ?? "").slice(0, 100).replace(/[%,()]/g, " ").trim(), cat: String(d.cat ?? "").slice(0, 80),
    page: Math.max(1, Math.min(999, Number(d.page) || 1)),
  }))
  .handler(async ({ data }) => {
    const db = publicClient();
    let q = db.from("noticias").select(NCOLS, { count: "exact" }).eq("publicado", true);
    if (data.q) q = q.or(`titulo_pt.ilike.%${data.q}%,titulo_es.ilike.%${data.q}%`);
    if (data.cat) q = q.eq("categoria", data.cat);
    const from = (data.page - 1) * 12;
    const [res, cats] = await Promise.all([
      q.order("publicado_em", { ascending: false, nullsFirst: false }).range(from, from + 11),
      db.from("noticias").select("categoria").eq("publicado", true),
    ]);
    const categorias = [...new Set((cats.data ?? []).map((r) => r.categoria).filter(Boolean) as string[])].sort();
    return { noticias: (res.data ?? []) as NoticiaCard[], total: res.count ?? 0, categorias };
  });

export const getNoticia = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "").slice(0, 160) }))
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: n } = await db.from("noticias").select(`${NCOLS},conteudo_pt,conteudo_es,autor`)
      .eq("slug", data.slug).eq("publicado", true).maybeSingle();
    if (!n) return { noticia: null, relacionadas: [] as NoticiaCard[] };
    let rq = db.from("noticias").select(NCOLS).eq("publicado", true).neq("id", n.id);
    if (n.categoria) rq = rq.eq("categoria", n.categoria);
    const { data: rel } = await rq.order("publicado_em", { ascending: false, nullsFirst: false }).limit(3);
    return { noticia: n as Noticia, relacionadas: (rel ?? []) as NoticiaCard[] };
  });
