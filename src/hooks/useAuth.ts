import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Acao, Modulo, Perm } from "@/lib/admin-config";

type Perms = Partial<Record<Modulo, Perm>>;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [grupo, setGrupo] = useState<string | null>(null);
  const [perms, setPerms] = useState<Perms>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async (u: User | null) => {
      if (!active) return;
      setUser(u);
      let adm = false, nome: string | null = null;
      const p: Perms = {};
      if (u) {
        const { data } = await supabase.from("profiles").select("grupo_id, grupos(nome, is_admin)").eq("id", u.id).maybeSingle();
        const g = (data as { grupo_id: string | null; grupos: { nome: string; is_admin: boolean } | null } | null);
        adm = !!g?.grupos?.is_admin;
        nome = g?.grupos?.nome ?? null;
        if (g?.grupo_id && !adm) {
          const { data: rows } = await supabase.from("grupo_permissoes").select("*").eq("grupo_id", g.grupo_id);
          for (const r of rows ?? []) p[r.modulo as Modulo] = { ver: r.pode_ver, criar: r.pode_criar, editar: r.pode_editar, excluir: r.pode_excluir };
        }
      }
      if (!active) return;
      setIsAdmin(adm); setGrupo(nome); setPerms(p); setLoading(false);
    };
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => load(s?.user ?? null), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const can = useCallback((m: Modulo, a: Acao = "ver") => isAdmin || !!perms[m]?.[a], [isAdmin, perms]);

  return { user, isAdmin, grupo, perms, can, loading };
}
