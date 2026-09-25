import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.from("profiles").select("grupos(is_admin)").eq("id", userId).maybeSingle();
  if (error || !data?.grupos?.is_admin) throw new Error("Acesso negado");
}

async function setGrupo(userId: string, grupoId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("profiles").update({ grupo_id: grupoId }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: profiles } = await context.supabase.from("profiles").select("id, nome, email, grupo_id").order("criado_em");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: au } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const info = new Map((au?.users ?? []).map((u) => [u.id, u]));
    return (profiles ?? []).map((p) => {
      const u = info.get(p.id) as { banned_until?: string | null; last_sign_in_at?: string | null; email_confirmed_at?: string | null } | undefined;
      return {
        ...p,
        ativo: !u?.banned_until || new Date(u.banned_until) < new Date(),
        ultimoAcesso: u?.last_sign_in_at ?? null,
        pendente: !u?.last_sign_in_at,
      };
    });
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email(), password: z.string().min(8), nome: z.string().min(1), grupoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true, user_metadata: { nome: data.nome },
    });
    if (error) throw new Error(error.message);
    await setGrupo(created.user.id, data.grupoId);
    return { ok: true };
  });

export const setUserGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), grupoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    await setGrupo(data.userId, data.grupoId);
    return { ok: true };
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email(), nome: z.string().min(1), grupoId: z.string().uuid(), redirectTo: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inv, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { data: { nome: data.nome }, redirectTo: data.redirectTo });
    if (error) throw new Error(error.message);
    await setGrupo(inv.user.id, data.grupoId);
    return { ok: true };
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), ativo: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Você não pode desativar a própria conta");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: data.ativo ? "none" : "876000h" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
