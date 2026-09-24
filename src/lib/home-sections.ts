/** Definição das seções editáveis da Home (compartilhada entre painel e site). */
export type Lang = "pt" | "es";
export type FieldDef = { key: string; label: string; long?: boolean; lang?: false };
export type ItemDef = { label: string; fields: FieldDef[]; auto?: boolean };
export type SectionDef = { id: string; label: string; description: string; fields: FieldDef[]; items?: ItemDef };
export type Item = Record<string, string>;
export type SectionData = Record<string, string | Item[]>;

export const HOME_SECTIONS: SectionDef[] = [
  { id: "hero", label: "Topo (hero)", description: "Primeira dobra com as fotos passando. As fotos vêm de Banners (local home_hero).",
    fields: [
      { key: "eyebrow", label: "Chamada acima do título" },
      { key: "titulo", label: "Título principal (a parte após a vírgula fica em destaque)" },
      { key: "subtitulo", label: "Subtítulo", long: true },
      { key: "cta_primario_label", label: "Botão principal — texto" },
      { key: "cta_primario_url", label: "Botão principal — link", lang: false },
      { key: "cta_secundario_label", label: "Botão WhatsApp — texto" },
      { key: "scroll", label: "Texto do indicador de rolagem" },
    ] },
  { id: "numeros", label: "Barra de números", description: "Quatro números abaixo do topo. Itens automáticos são contados do banco.",
    fields: [],
    items: { label: "Número", auto: true, fields: [{ key: "valor", label: "Valor (ex.: +25, ISO)", lang: false }, { key: "rotulo", label: "Rótulo" }] } },
  { id: "sistema", label: "O sistema", description: "Bloco com a lista numerada dos componentes do freio.",
    fields: [
      { key: "kick", label: "Chamada" }, { key: "titulo", label: "Título" }, { key: "texto", label: "Texto", long: true },
      { key: "contador_texto", label: "Texto ao lado do contador de produtos" },
    ],
    items: { label: "Componente", fields: [{ key: "titulo", label: "Título" }, { key: "texto", label: "Texto", long: true }, { key: "tag", label: "Etiqueta" }] } },
  { id: "categorias", label: "Categorias", description: "Chamada da grade de categorias (as categorias vêm do cadastro). Use {n} para o número de categorias por extenso.",
    fields: [
      { key: "kick", label: "Chamada" }, { key: "titulo", label: "Título" }, { key: "destaque", label: "Título — parte em destaque" },
      { key: "texto", label: "Texto", long: true }, { key: "link_label", label: "Texto do link de cada categoria" },
    ] },
  { id: "produtos", label: "Produtos em destaque", description: "Chamada da vitrine de produtos (os produtos vêm do cadastro).",
    fields: [
      { key: "kick", label: "Chamada" }, { key: "titulo", label: "Título" }, { key: "destaque", label: "Título — parte em destaque" },
      { key: "texto", label: "Texto", long: true }, { key: "botao_label", label: "Botão — texto" },
    ] },
  { id: "sobre", label: "A Fluair", description: "Bloco azul-escuro sobre a empresa.",
    fields: [
      { key: "kick", label: "Chamada" }, { key: "titulo", label: "Frase — linha 1" }, { key: "destaque", label: "Frase — linha 2 (destaque)" },
      { key: "texto", label: "Texto", long: true }, { key: "fato1", label: "Fato 1 (selo)" }, { key: "fato3", label: "Fato 3 (clientes)" },
      { key: "selo1", label: "Selo — linha 1", lang: false }, { key: "selo2", label: "Selo — linha 2", lang: false },
    ] },
  { id: "porque", label: "Por que Fluair", description: "Manifesto com os motivos numerados.",
    fields: [{ key: "kick", label: "Chamada" }, { key: "titulo", label: "Título" }, { key: "destaque", label: "Título — parte em destaque" }],
    items: { label: "Motivo", fields: [{ key: "titulo", label: "Título" }, { key: "texto", label: "Texto", long: true }] } },
  { id: "suporte", label: "Suporte", description: "Cartões de atalho para suporte.",
    fields: [
      { key: "kick", label: "Chamada" }, { key: "titulo", label: "Título" }, { key: "destaque", label: "Título — parte em destaque" },
      { key: "texto", label: "Texto (opcional)", long: true }, { key: "cta_label", label: "Botão abaixo dos cartões (opcional)" },
      { key: "cta_url", label: "Botão — link", lang: false },
    ],
    items: { label: "Cartão", fields: [{ key: "titulo", label: "Título" }, { key: "texto", label: "Texto" }, { key: "url", label: "Link", lang: false }] } },
  { id: "cta", label: "Chamada final", description: "Faixa final antes do rodapé.",
    fields: [
      { key: "titulo", label: "Título" }, { key: "texto", label: "Texto", long: true },
      { key: "cta_primario_label", label: "Botão principal — texto" }, { key: "cta_primario_url", label: "Botão principal — link", lang: false },
      { key: "cta_secundario_label", label: "Botão WhatsApp — texto (o número é adicionado automaticamente)" },
    ] },
];

const sys = (a: [string, string, string][]) => a.map(([titulo, texto, tag]) => ({ titulo, texto, tag }));
const two = (a: [string, string][]) => a.map(([titulo, texto]) => ({ titulo, texto }));
const sup = (a: [string, string, string][]) => a.map(([titulo, texto, url]) => ({ titulo, texto, url }));

/** Textos padrão (usados como semente e como fallback quando um campo fica vazio). */
export const HOME_DEFAULTS: Record<Lang, Record<string, SectionData>> = {
  pt: {
    hero: { eyebrow: "Freio pneumático para implementos · fabricação própria", titulo: "Não importa o caminho, vá com Fluair!",
      subtitulo: "Há mais de 25 anos fabricamos as válvulas e os kits ABS que compõem o sistema de freio de reboques, semirreboques e trucks.",
      cta_primario_label: "Ver produtos", cta_primario_url: "/produtos", cta_secundario_label: "Falar com a gente", scroll: "Role" },
    numeros: { itens: [
      { valor: "", rotulo: "Itens em linha", auto: "produtos" }, { valor: "+25", rotulo: "Anos de fabricação", auto: "" },
      { valor: "", rotulo: "Categorias de produto", auto: "categorias" }, { valor: "ISO", rotulo: "Qualidade 9001:2015", auto: "" },
    ] },
    sistema: { kick: "O sistema", titulo: "Tudo que freia o seu implemento",
      texto: "Do engate à válvula relê, a Fluair fabrica os componentes do sistema de freio pneumático — pensados para trabalhar juntos.",
      contador_texto: "componentes em linha, prontos para especificar",
      itens: sys([
        ["Engate de serviço e emergência", "Conexão pneumática entre o cavalo e o implemento.", "Automático / Manual"],
        ["Filtro de rede", "Protege o circuito contra impurezas do ar comprimido.", "Componentes"],
        ["Válvula moduladora (ABS)", "Modula a pressão de freio no eixo — base do ABS Fluair.", "Linha ABS"],
        ["Painel de comando", "Concentra o comando pneumático do implemento.", "Painéis de Comando"],
        ["Válvula relê", "Acelera o acionamento levando ar direto ao ponto de atuação.", "Válvulas"],
        ["Descarga rápida", "Libera rapidamente o ar das câmaras no desacionamento.", "Válvulas"],
        ["Dupla retenção", "Garante prioridade e segurança entre os circuitos de ar.", "Válvulas"],
      ]) },
    categorias: { kick: "Catálogo", titulo: "{n} linhas,", destaque: "um sistema",
      texto: "Da Linha ABS às válvulas, painéis, conexões, manômetros, reparos e tubos.", link_label: "Ver produtos →" },
    produtos: { kick: "Produtos", titulo: "Alguns itens", destaque: "em linha", texto: "Uma amostra do catálogo — clique para abrir a ficha.", botao_label: "Ver catálogo completo" },
    sobre: { kick: "A Fluair", titulo: "Mais de 25 anos", destaque: "na mesma estrada",
      texto: "Fabricamos válvulas e kits ABS para o sistema de freio de implementos rodoviários, com engenharia própria — fornecedor das grandes montadoras de implementos da América do Sul e da reposição.",
      fato1: "Certificação ISO 9001:2015", fato3: "Montadoras de implementos da América do Sul", selo1: "ISO", selo2: "9001:2015" },
    porque: { kick: "Por que Fluair", titulo: "Quatro motivos", destaque: "para seguir junto",
      itens: two([
        ["Fabricação própria", "Engenharia e produção nacional das válvulas e kits ABS, do projeto à expedição."],
        ["Qualidade ISO 9001:2015", "Processos certificados — o respeito pelo cliente é um compromisso de ordem ética."],
        ["Montadoras da América do Sul", "Fornecedor das grandes montadoras de implementos e de uma ampla rede de reposição."],
        ["Perto de você", "Atendimento em português e espanhol, com suporte e treinamento para a rede."],
      ]) },
    suporte: { kick: "Suporte", titulo: "Downloads e", destaque: "atendimento", texto: "", cta_label: "", cta_url: "/suporte",
      itens: sup([
        ["Catálogo & Downloads", "Catálogo completo e fichas técnicas.", "/downloads"],
        ["Gestão da Qualidade", "ISO 9001:2015 e nossos processos.", "/empresa/gestao-da-qualidade"],
        ["F.A.Q & Treinamento", "Dúvidas frequentes e capacitação.", "/suporte"],
        ["Onde encontrar", "Rede autorizada e representantes.", "/representantes"],
      ]) },
    cta: { titulo: "Vamos junto pela estrada?", texto: "Fale com o nosso time comercial e especifique o freio do seu implemento com quem fabrica.",
      cta_primario_label: "Solicitar orçamento", cta_primario_url: "/orcamento", cta_secundario_label: "WhatsApp" },
  },
  es: {
    hero: { eyebrow: "Freno neumático para implementos · fabricación propia", titulo: "No importa el camino, ¡ve con Fluair!",
      subtitulo: "Hace más de 25 años fabricamos las válvulas y los kits ABS que componen el sistema de freno de remolques, semirremolques y camiones.",
      cta_primario_label: "Ver productos", cta_secundario_label: "Hablar con nosotros", scroll: "Desliza" },
    numeros: { itens: [
      { rotulo: "Ítems en línea" }, { rotulo: "Años de fabricación" }, { rotulo: "Categorías de producto" }, { rotulo: "Calidad 9001:2015" },
    ] },
    sistema: { kick: "El sistema", titulo: "Todo lo que frena su implemento",
      texto: "Del acople a la válvula relé, Fluair fabrica los componentes del sistema de freno neumático — pensados para trabajar juntos.",
      contador_texto: "componentes en línea, listos para especificar",
      itens: sys([
        ["Acople de servicio y emergencia", "Conexión neumática entre el tractor y el implemento.", "Automático / Manual"],
        ["Filtro de línea", "Protege el circuito contra impurezas del aire comprimido.", "Componentes"],
        ["Válvula moduladora (ABS)", "Modula la presión de freno en el eje — base del ABS Fluair.", "Línea ABS"],
        ["Panel de comando", "Concentra el comando neumático del implemento.", "Paneles de Comando"],
        ["Válvula relé", "Acelera el accionamiento llevando aire directo al punto de actuación.", "Válvulas"],
        ["Descarga rápida", "Libera rápidamente el aire de las cámaras al desaccionar.", "Válvulas"],
        ["Doble retención", "Garantiza prioridad y seguridad entre los circuitos de aire.", "Válvulas"],
      ]) },
    categorias: { kick: "Catálogo", titulo: "{n} líneas,", destaque: "un sistema",
      texto: "De la Línea ABS a las válvulas, paneles, conexiones, manómetros, reparaciones y tubos.", link_label: "Ver productos →" },
    produtos: { kick: "Productos", titulo: "Algunos ítems", destaque: "en línea", texto: "Una muestra del catálogo — haga clic para abrir la ficha.", botao_label: "Ver catálogo completo" },
    sobre: { kick: "Fluair", titulo: "Más de 25 años", destaque: "en la misma ruta",
      texto: "Fabricamos válvulas y kits ABS para el sistema de freno de implementos viales, con ingeniería propia — proveedor de las grandes montadoras de implementos de América del Sur y del mercado de reposición.",
      fato1: "Certificación ISO 9001:2015", fato3: "Montadoras de implementos de América del Sur" },
    porque: { kick: "Por qué Fluair", titulo: "Cuatro motivos", destaque: "para seguir juntos",
      itens: two([
        ["Fabricación propia", "Ingeniería y producción nacional de las válvulas y kits ABS, del proyecto a la expedición."],
        ["Calidad ISO 9001:2015", "Procesos certificados — el respeto por el cliente es un compromiso ético."],
        ["Montadoras de América del Sur", "Proveedor de las grandes montadoras de implementos y de una amplia red de reposición."],
        ["Cerca de usted", "Atención en portugués y español, con soporte y capacitación para la red."],
      ]) },
    suporte: { kick: "Soporte", titulo: "Descargas y", destaque: "atención", texto: "", cta_label: "",
      itens: two([
        ["Catálogo & Descargas", "Catálogo completo y fichas técnicas."],
        ["Gestión de la Calidad", "ISO 9001:2015 y nuestros procesos."],
        ["F.A.Q & Capacitación", "Preguntas frecuentes y capacitación."],
        ["Dónde encontrar", "Red autorizada y representantes."],
      ]) },
    cta: { titulo: "¿Vamos juntos por la ruta?", texto: "Hable con nuestro equipo comercial y especifique el freno de su implemento con quien lo fabrica.",
      cta_primario_label: "Solicitar cotización", cta_secundario_label: "WhatsApp" },
  },
};

/** Campos sem idioma (links, valores, marcação automática) vivem no PT. */
const isShared = (def: SectionDef | undefined, key: string, item = false) => {
  const list = item ? def?.items?.fields : def?.fields;
  return key === "auto" || list?.find((f) => f.key === key)?.lang === false;
};

type Row = { secao: string; conteudo_pt: SectionData | null; conteudo_es: SectionData | null };

type FieldKey = "eyebrow" | "titulo" | "subtitulo" | "cta_primario_label" | "cta_primario_url" | "cta_secundario_label" | "scroll" | "kick" | "texto" | "contador_texto" | "destaque" | "link_label" | "botao_label" | "fato1" | "fato3" | "selo1" | "selo2" | "cta_label" | "cta_url";

/** Resolve uma seção para o idioma, com fallback: ES → PT do banco → padrão do código. */
export function resolveSection(rows: Row[], id: string, lang: Lang) {
  const def = HOME_SECTIONS.find((s) => s.id === id);
  const row = rows.find((r) => r.secao === id);
  const pt = (row?.conteudo_pt ?? {}) as SectionData;
  const es = (row?.conteudo_es ?? {}) as SectionData;
  const dPt = HOME_DEFAULTS.pt[id] ?? {};
  const dEs = HOME_DEFAULTS.es[id] ?? {};
  const str = (key: string) => {
    const get = (o: SectionData) => (typeof o[key] === "string" ? (o[key] as string).trim() : "");
    if (isShared(def, key)) return get(pt) || get(dPt);
    return lang === "es" ? get(es) || get(dEs) || get(pt) || get(dPt) : get(pt) || get(dPt);
  };
  const out: Record<string, string> = {};
  for (const f of def?.fields ?? []) out[f.key] = str(f.key);
  let items: Item[] = [];
  if (def?.items) {
    const ptItems = Array.isArray(pt["itens"]) && pt["itens"].length ? (pt["itens"] as Item[]) : null;
    const base = ptItems ?? ((dPt["itens"] as Item[]) || []);
    const esSrc = ptItems ? ((es["itens"] as Item[]) || []) : ((dEs["itens"] as Item[]) || []);
    items = base.map((it, i) => {
      const r: Item = {};
      for (const k of [...def.items!.fields.map((f) => f.key), "auto"]) {
        const v = (it[k] ?? "").toString();
        r[k] = !isShared(def, k, true) && lang === "es" ? (esSrc[i]?.[k] || "").toString().trim() || v : v;
      }
      return r;
    });
  }
  return { ...out, itens: items } as Record<FieldKey, string> & { itens: Item[] };
}
