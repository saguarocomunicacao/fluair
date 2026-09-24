import { createContext, useContext } from "react";

export type Lang = "pt" | "es";

export const dict = {
  pt: {
    orcamento: "Orçamento", h_kick: "Freio pneumático para implementos · fabricação própria",
    h_lede: "Há mais de 25 anos fabricamos as válvulas e os kits ABS que compõem o sistema de freio de reboques, semirreboques e trucks.",
    h_cta1: "Ver produtos", h_cta2: "Falar com a gente", h_scroll: "Role",
    st1: "Itens em linha", st2: "Anos de fabricação", st3: "Categorias de produto", st4: "Qualidade 9001:2015",
    sy_kick: "O sistema", sy_lead: "Tudo que freia o seu implemento",
    sy_sub: "Do engate à válvula relê, a Fluair fabrica os componentes do sistema de freio pneumático — pensados para trabalhar juntos.",
    sy_small: "componentes em linha, prontos para especificar",
    cat_kick: "Catálogo", cat_t1: "linhas,", cat_t2: "um sistema", cat_sub: "Da Linha ABS às válvulas, painéis, conexões, manômetros, reparos e tubos.", cat_go: "Ver produtos →",
    pr_kick: "Produtos", pr_t1: "Alguns itens", pr_t2: "em linha", pr_sub: "Uma amostra do catálogo — clique para abrir a ficha.", pr_all: "Ver catálogo completo",
    ver_ficha: "Ver ficha", add_orc: "+ orçamento", added: "adicionado ao orçamento",
    ab_kick: "A Fluair", ab_q1: "Mais de 25 anos", ab_q2: "na mesma estrada",
    ab_desc: "Fabricamos válvulas e kits ABS para o sistema de freio de implementos rodoviários, com engenharia própria — fornecedor das grandes montadoras de implementos da América do Sul e da reposição.",
    ab_f1: "Certificação ISO 9001:2015", ab_f3: "Montadoras de implementos da América do Sul",
    lab1: "FOTO · fábrica / linha de produção", lab2: "FOTO · implemento na estrada",
    mf_kick: "Por que Fluair", mf_t1: "Quatro motivos", mf_t2: "para seguir junto",
    sp_kick: "Suporte", sp_t1: "Downloads e", sp_t2: "atendimento",
    cta_t: "Vamos junto pela estrada?", cta_p: "Fale com o nosso time comercial e especifique o freio do seu implemento com quem fabrica.", cta_b1: "Solicitar orçamento",
    foot_prod: "Produtos", foot_comp: "Empresa", foot_wa: "Contato", tel: "TELEFONE", email: "E-MAIL", end: "ENDEREÇO",
    foot_tag: "Fabricante de válvulas e freios ABS para o sistema de freio de implementos rodoviários.", privacy: "Política de Privacidade · LGPD",
    sistema: [
      ["Engate de serviço e emergência", "Conexão pneumática entre o cavalo e o implemento.", "Automático / Manual"],
      ["Filtro de rede", "Protege o circuito contra impurezas do ar comprimido.", "Componentes"],
      ["Válvula moduladora (ABS)", "Modula a pressão de freio no eixo — base do ABS Fluair.", "Linha ABS"],
      ["Painel de comando", "Concentra o comando pneumático do implemento.", "Painéis de Comando"],
      ["Válvula relê", "Acelera o acionamento levando ar direto ao ponto de atuação.", "Válvulas"],
      ["Descarga rápida", "Libera rapidamente o ar das câmaras no desacionamento.", "Válvulas"],
      ["Dupla retenção", "Garante prioridade e segurança entre os circuitos de ar.", "Válvulas"],
    ],
    manifesto: [
      ["Fabricação própria", "Engenharia e produção nacional das válvulas e kits ABS, do projeto à expedição."],
      ["Qualidade ISO 9001:2015", "Processos certificados — o respeito pelo cliente é um compromisso de ordem ética."],
      ["Montadoras da América do Sul", "Fornecedor das grandes montadoras de implementos e de uma ampla rede de reposição."],
      ["Perto de você", "Atendimento em português e espanhol, com suporte e treinamento para a rede."],
    ],
    suporte: [
      ["Catálogo & Downloads", "Catálogo completo e fichas técnicas.", "/downloads"],
      ["Gestão da Qualidade", "ISO 9001:2015 e nossos processos.", "/empresa/gestao-da-qualidade"],
      ["F.A.Q & Treinamento", "Dúvidas frequentes e capacitação.", "/suporte"],
      ["Onde encontrar", "Rede autorizada e representantes.", "/onde-encontrar"],
    ],
  },
  es: {
    orcamento: "Cotización", h_kick: "Freno neumático para implementos · fabricación propia",
    h_lede: "Hace más de 25 años fabricamos las válvulas y los kits ABS que componen el sistema de freno de remolques, semirremolques y camiones.",
    h_cta1: "Ver productos", h_cta2: "Hablar con nosotros", h_scroll: "Desliza",
    st1: "Ítems en línea", st2: "Años de fabricación", st3: "Categorías de producto", st4: "Calidad 9001:2015",
    sy_kick: "El sistema", sy_lead: "Todo lo que frena su implemento",
    sy_sub: "Del acople a la válvula relé, Fluair fabrica los componentes del sistema de freno neumático — pensados para trabajar juntos.",
    sy_small: "componentes en línea, listos para especificar",
    cat_kick: "Catálogo", cat_t1: "líneas,", cat_t2: "un sistema", cat_sub: "De la Línea ABS a las válvulas, paneles, conexiones, manómetros, reparaciones y tubos.", cat_go: "Ver productos →",
    pr_kick: "Productos", pr_t1: "Algunos ítems", pr_t2: "en línea", pr_sub: "Una muestra del catálogo — haga clic para abrir la ficha.", pr_all: "Ver catálogo completo",
    ver_ficha: "Ver ficha", add_orc: "+ cotización", added: "agregado a la cotización",
    ab_kick: "Fluair", ab_q1: "Más de 25 años", ab_q2: "en la misma ruta",
    ab_desc: "Fabricamos válvulas y kits ABS para el sistema de freno de implementos viales, con ingeniería propia — proveedor de las grandes montadoras de implementos de América del Sur y del mercado de reposición.",
    ab_f1: "Certificación ISO 9001:2015", ab_f3: "Montadoras de implementos de América del Sur",
    lab1: "FOTO · fábrica / línea de producción", lab2: "FOTO · implemento en la ruta",
    mf_kick: "Por qué Fluair", mf_t1: "Cuatro motivos", mf_t2: "para seguir juntos",
    sp_kick: "Soporte", sp_t1: "Descargas y", sp_t2: "atención",
    cta_t: "¿Vamos juntos por la ruta?", cta_p: "Hable con nuestro equipo comercial y especifique el freno de su implemento con quien lo fabrica.", cta_b1: "Solicitar cotización",
    foot_prod: "Productos", foot_comp: "Empresa", foot_wa: "Contacto", tel: "TELÉFONO", email: "E-MAIL", end: "DIRECCIÓN",
    foot_tag: "Fabricante de válvulas y frenos ABS para el sistema de freno de implementos viales.", privacy: "Política de Privacidad · LGPD",
    sistema: [
      ["Acople de servicio y emergencia", "Conexión neumática entre el tractor y el implemento.", "Automático / Manual"],
      ["Filtro de línea", "Protege el circuito contra impurezas del aire comprimido.", "Componentes"],
      ["Válvula moduladora (ABS)", "Modula la presión de freno en el eje — base del ABS Fluair.", "Línea ABS"],
      ["Panel de comando", "Concentra el comando neumático del implemento.", "Paneles de Comando"],
      ["Válvula relé", "Acelera el accionamiento llevando aire directo al punto de actuación.", "Válvulas"],
      ["Descarga rápida", "Libera rápidamente el aire de las cámaras al desaccionar.", "Válvulas"],
      ["Doble retención", "Garantiza prioridad y seguridad entre los circuitos de aire.", "Válvulas"],
    ],
    manifesto: [
      ["Fabricación propia", "Ingeniería y producción nacional de las válvulas y kits ABS, del proyecto a la expedición."],
      ["Calidad ISO 9001:2015", "Procesos certificados — el respeto por el cliente es un compromiso ético."],
      ["Montadoras de América del Sur", "Proveedor de las grandes montadoras de implementos y de una amplia red de reposición."],
      ["Cerca de usted", "Atención en portugués y español, con soporte y capacitación para la red."],
    ],
    suporte: [
      ["Catálogo & Descargas", "Catálogo completo y fichas técnicas.", "/downloads"],
      ["Gestión de la Calidad", "ISO 9001:2015 y nuestros procesos.", "/empresa/gestao-da-qualidade"],
      ["F.A.Q & Capacitación", "Preguntas frecuentes y capacitación.", "/suporte"],
      ["Dónde encontrar", "Red autorizada y representantes.", "/onde-encontrar"],
    ],
  },
} as const;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (typeof dict)["pt"] | (typeof dict)["es"]; addOrc: (item: CartItem | string) => void; wa: string };
export const SiteCtx = createContext<Ctx>(null as unknown as Ctx);
export const useSite = () => useContext(SiteCtx);

/** Escolhe o campo _pt/_es de um registro, com fallback para o PT. */
export function pick(row: object | null | undefined, field: string, lang: Lang): string {
  if (!row) return "";
  const r = row as Record<string, unknown>;
  return String((lang === "es" && r[`${field}_es`]) || r[`${field}_pt`] || "");
}

/** Carrinho de cotação (compartilhado entre páginas do site). */
export type CartItem = { id: string; codigo: string; referencia: string | null; nome: string; quantidade: number };
export function readCart(): CartItem[] {
  try { const v = JSON.parse(localStorage.getItem("fluair.orc.items") || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
