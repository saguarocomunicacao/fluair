export type Role = "admin" | "editor_conteudo" | "comercial";

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "bool"
  | "image"
  | "file"
  | "json"
  | "select"
  | "fk"
  | "datetime";

export interface Field {
  name: string; // base name; when i18n, stored as name_pt / name_es
  label: string;
  type: FieldType;
  i18n?: boolean;
  required?: boolean;
  options?: string[];
  fk?: { table: string; label: string };
}

export interface TableConfig {
  table: string;
  label: string;
  pk?: string;
  bucket?: string;
  orderBy?: string;
  orderAsc?: boolean;
  listCols: string[]; // column names as stored
  searchCols: string[];
  fields: Field[];
  gallery?: boolean;
}

const ordem: Field = { name: "ordem", label: "Ordem", type: "number" };
const ativo: Field = { name: "ativo", label: "Ativo", type: "bool" };

export const TABLES: TableConfig[] = [
  {
    table: "categorias", label: "Categorias", bucket: "produtos", orderBy: "ordem", orderAsc: true,
    listCols: ["ordem", "nome_pt", "slug", "ativo"], searchCols: ["nome_pt", "slug"],
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "nome", label: "Nome", type: "text", i18n: true, required: true },
      { name: "descricao", label: "Descrição", type: "textarea", i18n: true },
      { name: "imagem_url", label: "Imagem", type: "image" },
      ordem, ativo,
    ],
  },
  {
    table: "produtos", label: "Produtos", bucket: "produtos", orderBy: "ordem", orderAsc: true, gallery: true,
    listCols: ["codigo", "nome_pt", "destaque", "ativo"], searchCols: ["codigo", "nome_pt"],
    fields: [
      { name: "codigo", label: "Código", type: "text", required: true },
      { name: "nome", label: "Nome", type: "text", i18n: true, required: true },
      { name: "categoria_id", label: "Categoria", type: "fk", fk: { table: "categorias", label: "nome_pt" } },
      { name: "descricao", label: "Descrição", type: "richtext", i18n: true },
      { name: "especificacoes", label: "Especificações (JSON)", type: "json" },
      { name: "ncm", label: "NCM", type: "text" },
      { name: "destaque", label: "Destaque", type: "bool" },
      ordem, ativo,
    ],
  },
  {
    table: "banners", label: "Banners", bucket: "banners", orderBy: "ordem", orderAsc: true,
    listCols: ["local", "titulo_pt", "ordem", "ativo"], searchCols: ["titulo_pt", "local"],
    fields: [
      { name: "local", label: "Local", type: "text", required: true },
      { name: "titulo", label: "Título", type: "text", i18n: true },
      { name: "subtitulo", label: "Subtítulo", type: "textarea", i18n: true },
      { name: "imagem_url", label: "Imagem", type: "image" },
      { name: "cta_label", label: "Texto do botão", type: "text", i18n: true },
      { name: "cta_url", label: "Link do botão", type: "text" },
      ordem, ativo,
    ],
  },
  {
    table: "paginas", label: "Páginas", bucket: "banners", orderBy: "atualizado_em",
    listCols: ["titulo_pt", "slug", "publicado", "atualizado_em"], searchCols: ["titulo_pt", "slug"],
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "titulo", label: "Título", type: "text", i18n: true, required: true },
      { name: "conteudo", label: "Conteúdo", type: "richtext", i18n: true },
      { name: "seo_titulo", label: "SEO título", type: "text", i18n: true },
      { name: "seo_descricao", label: "SEO descrição", type: "textarea", i18n: true },
      { name: "publicado", label: "Publicado", type: "bool" },
    ],
  },
  {
    table: "menus", label: "Menus", orderBy: "ordem", orderAsc: true,
    listCols: ["local", "label_pt", "url", "ordem", "ativo"], searchCols: ["label_pt", "url"],
    fields: [
      { name: "local", label: "Local", type: "select", options: ["header", "footer"], required: true },
      { name: "label", label: "Rótulo", type: "text", i18n: true, required: true },
      { name: "url", label: "URL", type: "text" },
      { name: "parent_id", label: "Menu pai", type: "fk", fk: { table: "menus", label: "label_pt" } },
      ordem, ativo,
    ],
  },
  {
    table: "noticias", label: "Notícias", bucket: "noticias", orderBy: "publicado_em",
    listCols: ["titulo_pt", "categoria", "publicado", "publicado_em"], searchCols: ["titulo_pt", "slug"],
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "titulo", label: "Título", type: "text", i18n: true, required: true },
      { name: "resumo", label: "Resumo", type: "textarea", i18n: true },
      { name: "conteudo", label: "Conteúdo", type: "richtext", i18n: true },
      { name: "capa_url", label: "Capa", type: "image" },
      { name: "categoria", label: "Categoria", type: "text" },
      { name: "autor", label: "Autor", type: "text" },
      { name: "publicado", label: "Publicado", type: "bool" },
      { name: "publicado_em", label: "Publicado em", type: "datetime" },
    ],
  },
  {
    table: "downloads", label: "Downloads", bucket: "downloads", orderBy: "ordem", orderAsc: true,
    listCols: ["titulo_pt", "categoria", "ordem", "ativo"], searchCols: ["titulo_pt", "categoria"],
    fields: [
      { name: "titulo", label: "Título", type: "text", i18n: true, required: true },
      { name: "descricao", label: "Descrição", type: "textarea", i18n: true },
      { name: "arquivo_url", label: "Arquivo", type: "file" },
      { name: "categoria", label: "Categoria", type: "text" },
      ordem, ativo,
    ],
  },
  {
    table: "representantes", label: "Representantes", orderBy: "ordem", orderAsc: true,
    listCols: ["nome", "empresa", "cidade", "estado", "ativo"], searchCols: ["nome", "empresa", "cidade", "estado"],
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "empresa", label: "Empresa", type: "text" },
      { name: "estado", label: "Estado (UF)", type: "text" },
      { name: "cidade", label: "Cidade", type: "text" },
      { name: "telefone", label: "Telefone", type: "text" },
      { name: "whatsapp", label: "WhatsApp", type: "text" },
      { name: "email", label: "E-mail", type: "text" },
      ordem, ativo,
    ],
  },
  {
    table: "rede_autorizada", label: "Rede autorizada", orderBy: "nome", orderAsc: true,
    listCols: ["nome", "cidade", "estado", "ativo"], searchCols: ["nome", "cidade", "estado"],
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "cidade", label: "Cidade", type: "text" },
      { name: "estado", label: "Estado (UF)", type: "text" },
      { name: "endereco", label: "Endereço", type: "text" },
      { name: "telefone", label: "Telefone", type: "text" },
      { name: "whatsapp", label: "WhatsApp", type: "text" },
      { name: "lat", label: "Latitude", type: "number" },
      { name: "lng", label: "Longitude", type: "number" },
      ativo,
    ],
  },
  {
    table: "faq", label: "FAQ", orderBy: "ordem", orderAsc: true,
    listCols: ["pergunta_pt", "categoria", "ordem", "ativo"], searchCols: ["pergunta_pt", "categoria"],
    fields: [
      { name: "pergunta", label: "Pergunta", type: "text", i18n: true, required: true },
      { name: "resposta", label: "Resposta", type: "richtext", i18n: true },
      { name: "categoria", label: "Categoria", type: "text" },
      ordem, ativo,
    ],
  },
  {
    table: "configuracoes", label: "Configurações", pk: "chave", orderBy: "chave", orderAsc: true,
    listCols: ["chave", "valor_pt", "valor_es"], searchCols: ["chave", "valor_pt"],
    fields: [
      { name: "chave", label: "Chave", type: "text", required: true },
      { name: "valor", label: "Valor", type: "textarea", i18n: true },
    ],
  },
];

export const getTable = (t: string) => TABLES.find((c) => c.table === t);

export const canContent = (roles: Role[]) => roles.includes("admin") || roles.includes("editor_conteudo");
export const canSales = (roles: Role[]) => roles.includes("admin") || roles.includes("comercial");
