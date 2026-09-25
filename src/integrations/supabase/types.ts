export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          ativo: boolean
          cta_label_es: string | null
          cta_label_pt: string | null
          cta_url: string | null
          id: string
          imagem_url: string | null
          local: string
          ordem: number
          subtitulo_es: string | null
          subtitulo_pt: string | null
          titulo_es: string | null
          titulo_pt: string | null
        }
        Insert: {
          ativo?: boolean
          cta_label_es?: string | null
          cta_label_pt?: string | null
          cta_url?: string | null
          id?: string
          imagem_url?: string | null
          local?: string
          ordem?: number
          subtitulo_es?: string | null
          subtitulo_pt?: string | null
          titulo_es?: string | null
          titulo_pt?: string | null
        }
        Update: {
          ativo?: boolean
          cta_label_es?: string | null
          cta_label_pt?: string | null
          cta_url?: string | null
          id?: string
          imagem_url?: string | null
          local?: string
          ordem?: number
          subtitulo_es?: string | null
          subtitulo_pt?: string | null
          titulo_es?: string | null
          titulo_pt?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao_es: string | null
          descricao_pt: string | null
          id: string
          imagem_url: string | null
          nome_es: string | null
          nome_pt: string
          ordem: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao_es?: string | null
          descricao_pt?: string | null
          id?: string
          imagem_url?: string | null
          nome_es?: string | null
          nome_pt: string
          ordem?: number
          slug: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao_es?: string | null
          descricao_pt?: string | null
          id?: string
          imagem_url?: string | null
          nome_es?: string | null
          nome_pt?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          valor_es: string | null
          valor_pt: string | null
        }
        Insert: {
          chave: string
          valor_es?: string | null
          valor_pt?: string | null
        }
        Update: {
          chave?: string
          valor_es?: string | null
          valor_pt?: string | null
        }
        Relationships: []
      }
      cotacao_itens: {
        Row: {
          codigo: string | null
          cotacao_id: string
          id: string
          nome: string | null
          produto_id: string | null
          quantidade: number
        }
        Insert: {
          codigo?: string | null
          cotacao_id: string
          id?: string
          nome?: string | null
          produto_id?: string | null
          quantidade?: number
        }
        Update: {
          codigo?: string | null
          cotacao_id?: string
          id?: string
          nome?: string | null
          produto_id?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotacao_itens_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacao_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes: {
        Row: {
          cnpj: string | null
          criado_em: string
          email: string
          empresa: string | null
          estado: string | null
          id: string
          mensagem: string | null
          nome: string
          status: Database["public"]["Enums"]["cotacao_status"]
          telefone: string | null
        }
        Insert: {
          cnpj?: string | null
          criado_em?: string
          email: string
          empresa?: string | null
          estado?: string | null
          id?: string
          mensagem?: string | null
          nome: string
          status?: Database["public"]["Enums"]["cotacao_status"]
          telefone?: string | null
        }
        Update: {
          cnpj?: string | null
          criado_em?: string
          email?: string
          empresa?: string | null
          estado?: string | null
          id?: string
          mensagem?: string | null
          nome?: string
          status?: Database["public"]["Enums"]["cotacao_status"]
          telefone?: string | null
        }
        Relationships: []
      }
      downloads: {
        Row: {
          arquivo_url: string | null
          ativo: boolean
          categoria: string | null
          descricao_es: string | null
          descricao_pt: string | null
          id: string
          ordem: number
          titulo_es: string | null
          titulo_pt: string
        }
        Insert: {
          arquivo_url?: string | null
          ativo?: boolean
          categoria?: string | null
          descricao_es?: string | null
          descricao_pt?: string | null
          id?: string
          ordem?: number
          titulo_es?: string | null
          titulo_pt: string
        }
        Update: {
          arquivo_url?: string | null
          ativo?: boolean
          categoria?: string | null
          descricao_es?: string | null
          descricao_pt?: string | null
          id?: string
          ordem?: number
          titulo_es?: string | null
          titulo_pt?: string
        }
        Relationships: []
      }
      faq: {
        Row: {
          ativo: boolean
          categoria: string | null
          id: string
          ordem: number
          pergunta_es: string | null
          pergunta_pt: string
          resposta_es: string | null
          resposta_pt: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          id?: string
          ordem?: number
          pergunta_es?: string | null
          pergunta_pt: string
          resposta_es?: string | null
          resposta_pt?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          id?: string
          ordem?: number
          pergunta_es?: string | null
          pergunta_pt?: string
          resposta_es?: string | null
          resposta_pt?: string | null
        }
        Relationships: []
      }
      grupo_permissoes: {
        Row: {
          grupo_id: string
          modulo: string
          pode_criar: boolean
          pode_editar: boolean
          pode_excluir: boolean
          pode_ver: boolean
        }
        Insert: {
          grupo_id: string
          modulo: string
          pode_criar?: boolean
          pode_editar?: boolean
          pode_excluir?: boolean
          pode_ver?: boolean
        }
        Update: {
          grupo_id?: string
          modulo?: string
          pode_criar?: boolean
          pode_editar?: boolean
          pode_excluir?: boolean
          pode_ver?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "grupo_permissoes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          criado_em: string
          descricao: string | null
          id: string
          is_admin: boolean
          nome: string
          protegido: boolean
        }
        Insert: {
          criado_em?: string
          descricao?: string | null
          id?: string
          is_admin?: boolean
          nome: string
          protegido?: boolean
        }
        Update: {
          criado_em?: string
          descricao?: string | null
          id?: string
          is_admin?: boolean
          nome?: string
          protegido?: boolean
        }
        Relationships: []
      }
      menus: {
        Row: {
          ativo: boolean
          id: string
          label_es: string | null
          label_pt: string
          local: string
          ordem: number
          parent_id: string | null
          url: string | null
        }
        Insert: {
          ativo?: boolean
          id?: string
          label_es?: string | null
          label_pt: string
          local?: string
          ordem?: number
          parent_id?: string | null
          url?: string | null
        }
        Update: {
          ativo?: boolean
          id?: string
          label_es?: string | null
          label_pt?: string
          local?: string
          ordem?: number
          parent_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menus_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          autor: string | null
          capa_url: string | null
          categoria: string | null
          conteudo_es: string | null
          conteudo_pt: string | null
          id: string
          publicado: boolean
          publicado_em: string | null
          resumo_es: string | null
          resumo_pt: string | null
          slug: string
          titulo_es: string | null
          titulo_pt: string
        }
        Insert: {
          autor?: string | null
          capa_url?: string | null
          categoria?: string | null
          conteudo_es?: string | null
          conteudo_pt?: string | null
          id?: string
          publicado?: boolean
          publicado_em?: string | null
          resumo_es?: string | null
          resumo_pt?: string | null
          slug: string
          titulo_es?: string | null
          titulo_pt: string
        }
        Update: {
          autor?: string | null
          capa_url?: string | null
          categoria?: string | null
          conteudo_es?: string | null
          conteudo_pt?: string | null
          id?: string
          publicado?: boolean
          publicado_em?: string | null
          resumo_es?: string | null
          resumo_pt?: string | null
          slug?: string
          titulo_es?: string | null
          titulo_pt?: string
        }
        Relationships: []
      }
      paginas: {
        Row: {
          atualizado_em: string
          conteudo_es: string | null
          conteudo_pt: string | null
          id: string
          publicado: boolean
          seo_descricao_es: string | null
          seo_descricao_pt: string | null
          seo_titulo_es: string | null
          seo_titulo_pt: string | null
          slug: string
          titulo_es: string | null
          titulo_pt: string
        }
        Insert: {
          atualizado_em?: string
          conteudo_es?: string | null
          conteudo_pt?: string | null
          id?: string
          publicado?: boolean
          seo_descricao_es?: string | null
          seo_descricao_pt?: string | null
          seo_titulo_es?: string | null
          seo_titulo_pt?: string | null
          slug: string
          titulo_es?: string | null
          titulo_pt: string
        }
        Update: {
          atualizado_em?: string
          conteudo_es?: string | null
          conteudo_pt?: string | null
          id?: string
          publicado?: boolean
          seo_descricao_es?: string | null
          seo_descricao_pt?: string | null
          seo_titulo_es?: string | null
          seo_titulo_pt?: string | null
          slug?: string
          titulo_es?: string | null
          titulo_pt?: string
        }
        Relationships: []
      }
      produto_imagens: {
        Row: {
          alt_es: string | null
          alt_pt: string | null
          id: string
          ordem: number
          produto_id: string
          url: string
        }
        Insert: {
          alt_es?: string | null
          alt_pt?: string | null
          id?: string
          ordem?: number
          produto_id: string
          url: string
        }
        Update: {
          alt_es?: string | null
          alt_pt?: string | null
          id?: string
          ordem?: number
          produto_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_imagens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          codigo: string
          criado_em: string
          descricao_es: string | null
          descricao_pt: string | null
          destaque: boolean
          especificacoes: Json
          id: string
          informacoes_tecnicas_es: string | null
          informacoes_tecnicas_pt: string | null
          kit_reparo: string | null
          ncm: string | null
          nome_es: string | null
          nome_pt: string
          ordem: number
          referencia: string | null
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          codigo: string
          criado_em?: string
          descricao_es?: string | null
          descricao_pt?: string | null
          destaque?: boolean
          especificacoes?: Json
          id?: string
          informacoes_tecnicas_es?: string | null
          informacoes_tecnicas_pt?: string | null
          kit_reparo?: string | null
          ncm?: string | null
          nome_es?: string | null
          nome_pt: string
          ordem?: number
          referencia?: string | null
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          codigo?: string
          criado_em?: string
          descricao_es?: string | null
          descricao_pt?: string | null
          destaque?: boolean
          especificacoes?: Json
          id?: string
          informacoes_tecnicas_es?: string | null
          informacoes_tecnicas_pt?: string | null
          kit_reparo?: string | null
          ncm?: string | null
          nome_es?: string | null
          nome_pt?: string
          ordem?: number
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          criado_em: string
          email: string | null
          grupo_id: string | null
          id: string
          nome: string | null
        }
        Insert: {
          criado_em?: string
          email?: string | null
          grupo_id?: string | null
          id: string
          nome?: string | null
        }
        Update: {
          criado_em?: string
          email?: string | null
          grupo_id?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      rede_autorizada: {
        Row: {
          ativo: boolean
          cidade: string | null
          endereco: string | null
          estado: string | null
          id: string
          lat: number | null
          lng: number | null
          nome: string
          telefone: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nome: string
          telefone?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nome?: string
          telefone?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      representantes: {
        Row: {
          abrangencia: string | null
          ativo: boolean
          cidade: string | null
          email: string | null
          empresa: string | null
          estado: string | null
          id: string
          nome: string
          ordem: number
          telefone: string | null
          whatsapp: string | null
        }
        Insert: {
          abrangencia?: string | null
          ativo?: boolean
          cidade?: string | null
          email?: string | null
          empresa?: string | null
          estado?: string | null
          id?: string
          nome: string
          ordem?: number
          telefone?: string | null
          whatsapp?: string | null
        }
        Update: {
          abrangencia?: string | null
          ativo?: boolean
          cidade?: string | null
          email?: string | null
          empresa?: string | null
          estado?: string | null
          id?: string
          nome?: string
          ordem?: number
          telefone?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      secoes_home: {
        Row: {
          atualizado_em: string
          conteudo_es: Json
          conteudo_pt: Json
          ordem: number
          secao: string
        }
        Insert: {
          atualizado_em?: string
          conteudo_es?: Json
          conteudo_pt?: Json
          ordem?: number
          secao: string
        }
        Update: {
          atualizado_em?: string
          conteudo_es?: Json
          conteudo_pt?: Json
          ordem?: number
          secao?: string
        }
        Relationships: []
      }
      treinamentos: {
        Row: {
          ativo: boolean
          conteudo_es: string | null
          conteudo_pt: string | null
          criado_em: string
          descricao_es: string | null
          descricao_pt: string | null
          duracao_es: string | null
          duracao_pt: string | null
          id: string
          imagem_url: string | null
          ordem: number
          publicado: boolean
          slug: string
          titulo_es: string | null
          titulo_pt: string
        }
        Insert: {
          ativo?: boolean
          conteudo_es?: string | null
          conteudo_pt?: string | null
          criado_em?: string
          descricao_es?: string | null
          descricao_pt?: string | null
          duracao_es?: string | null
          duracao_pt?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number
          publicado?: boolean
          slug: string
          titulo_es?: string | null
          titulo_pt: string
        }
        Update: {
          ativo?: boolean
          conteudo_es?: string | null
          conteudo_pt?: string | null
          criado_em?: string
          descricao_es?: string | null
          descricao_pt?: string | null
          duracao_es?: string | null
          duracao_pt?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number
          publicado?: boolean
          slug?: string
          titulo_es?: string | null
          titulo_pt?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "editor_conteudo" | "comercial"
      cotacao_status: "novo" | "em_atendimento" | "concluido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor_conteudo", "comercial"],
      cotacao_status: ["novo", "em_atendimento", "concluido"],
    },
  },
} as const
