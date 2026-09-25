
CREATE TABLE public.grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  is_admin boolean NOT NULL DEFAULT false,
  protegido boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grupos TO authenticated;
GRANT ALL ON public.grupos TO service_role;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.grupo_permissoes (
  grupo_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  modulo text NOT NULL CHECK (modulo IN ('cotacoes','categorias','produtos','banners','home_secoes','paginas','menus','noticias','treinamentos','downloads','representantes','rede_autorizada','faq','configuracoes','usuarios','importar')),
  pode_ver boolean NOT NULL DEFAULT false,
  pode_criar boolean NOT NULL DEFAULT false,
  pode_editar boolean NOT NULL DEFAULT false,
  pode_excluir boolean NOT NULL DEFAULT false,
  PRIMARY KEY (grupo_id, modulo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grupo_permissoes TO authenticated;
GRANT ALL ON public.grupo_permissoes TO service_role;
ALTER TABLE public.grupo_permissoes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN grupo_id uuid REFERENCES public.grupos(id) ON DELETE SET NULL;

-- Grupos equivalentes aos papéis atuais
INSERT INTO public.grupos(nome, descricao, is_admin, protegido) VALUES
 ('Administrador','Acesso total ao painel', true, true),
 ('Editor de conteúdo','Gerencia todo o conteúdo do site', false, false),
 ('Comercial','Atende as cotações', false, false);

INSERT INTO public.grupo_permissoes(grupo_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir)
SELECT g.id, m, true, true, true, true FROM public.grupos g,
 unnest(ARRAY['categorias','produtos','banners','home_secoes','paginas','menus','noticias','treinamentos','downloads','representantes','rede_autorizada','faq','configuracoes','importar']) m
WHERE g.nome='Editor de conteúdo';
INSERT INTO public.grupo_permissoes(grupo_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir)
SELECT id, 'cotacoes', true, false, true, false FROM public.grupos WHERE nome='Comercial';

UPDATE public.profiles p SET grupo_id = (
  SELECT g.id FROM public.user_roles r JOIN public.grupos g ON g.nome = CASE r.role WHEN 'admin' THEN 'Administrador' WHEN 'editor_conteudo' THEN 'Editor de conteúdo' ELSE 'Comercial' END
  WHERE r.user_id = p.id ORDER BY CASE r.role WHEN 'admin' THEN 0 WHEN 'editor_conteudo' THEN 1 ELSE 2 END LIMIT 1);

-- Funções de permissão
CREATE OR REPLACE FUNCTION private.is_admin(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p JOIN public.grupos g ON g.id=p.grupo_id WHERE p.id=_uid AND g.is_admin) $$;
CREATE OR REPLACE FUNCTION private.is_staff(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id=_uid AND grupo_id IS NOT NULL) $$;
CREATE OR REPLACE FUNCTION private.has_perm(_uid uuid, _modulo text, _acao text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT private.is_admin(_uid) OR EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.grupo_permissoes gp ON gp.grupo_id=p.grupo_id
    WHERE p.id=_uid AND gp.modulo=_modulo AND CASE _acao
      WHEN 'ver' THEN gp.pode_ver WHEN 'criar' THEN gp.pode_criar
      WHEN 'editar' THEN gp.pode_editar WHEN 'excluir' THEN gp.pode_excluir ELSE false END) $$;
CREATE OR REPLACE FUNCTION private.can_edit_content(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT private.is_admin(_uid) OR EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.grupo_permissoes gp ON gp.grupo_id=p.grupo_id
    WHERE p.id=_uid AND gp.modulo NOT IN ('cotacoes','usuarios') AND (gp.pode_criar OR gp.pode_editar)) $$;
CREATE OR REPLACE FUNCTION private.can_sales(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT private.has_perm(_uid,'cotacoes','ver') $$;
REVOKE ALL ON FUNCTION private.has_perm(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_perm(uuid,text,text) TO authenticated;

-- Grupos / permissões: leitura para equipe, escrita só admin
CREATE POLICY "staff read grupos" ON public.grupos FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "admin write grupos" ON public.grupos FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "staff read permissoes" ON public.grupo_permissoes FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "admin write permissoes" ON public.grupo_permissoes FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

-- profiles: só admin grava
DROP POLICY IF EXISTS "self or admin update profile" ON public.profiles;
CREATE POLICY "admin update profile" ON public.profiles FOR UPDATE TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "staff read profiles" ON public.profiles;
CREATE POLICY "self or admin read profiles" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR private.has_perm(auth.uid(),'usuarios','ver'));

-- Proteções: grupo Administrador e último admin
CREATE OR REPLACE FUNCTION private.admin_count() RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT count(*)::int FROM public.profiles p JOIN public.grupos g ON g.id=p.grupo_id WHERE g.is_admin $$;
CREATE OR REPLACE FUNCTION private.guard_grupos() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP='DELETE' THEN
    IF OLD.protegido THEN RAISE EXCEPTION 'O grupo Administrador não pode ser excluído'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.protegido AND (NEW.is_admin IS DISTINCT FROM true OR NEW.protegido IS DISTINCT FROM true) THEN
    RAISE EXCEPTION 'O grupo Administrador deve manter acesso total';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER grupos_guard BEFORE UPDATE OR DELETE ON public.grupos FOR EACH ROW EXECUTE FUNCTION private.guard_grupos();
CREATE OR REPLACE FUNCTION private.guard_last_admin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF private.admin_count() = 0 THEN RAISE EXCEPTION 'O sistema precisa ter pelo menos um administrador'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER profiles_last_admin AFTER UPDATE OF grupo_id OR DELETE ON public.profiles DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION private.guard_last_admin();

-- Permissões por módulo nas tabelas de conteúdo
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES ('categorias','categorias'),('produtos','produtos'),('produto_imagens','produtos'),('banners','banners'),
    ('paginas','paginas'),('menus','menus'),('noticias','noticias'),('treinamentos','treinamentos'),('downloads','downloads'),
    ('representantes','representantes'),('rede_autorizada','rede_autorizada'),('faq','faq'),('configuracoes','configuracoes')) v(t,m)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'staff write '||r.t, r.t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_perm(auth.uid(), %L, ''criar''))', 'perm insert '||r.t, r.t, r.m);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.has_perm(auth.uid(), %L, ''editar'')) WITH CHECK (private.has_perm(auth.uid(), %L, ''editar''))', 'perm update '||r.t, r.t, r.m, r.m);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (private.has_perm(auth.uid(), %L, ''excluir''))', 'perm delete '||r.t, r.t, r.m);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "staff insert secoes_home" ON public.secoes_home;
DROP POLICY IF EXISTS "staff update secoes_home" ON public.secoes_home;
CREATE POLICY "perm insert secoes_home" ON public.secoes_home FOR INSERT TO authenticated WITH CHECK (private.has_perm(auth.uid(),'home_secoes','editar'));
CREATE POLICY "perm update secoes_home" ON public.secoes_home FOR UPDATE TO authenticated USING (private.has_perm(auth.uid(),'home_secoes','editar')) WITH CHECK (private.has_perm(auth.uid(),'home_secoes','editar'));

DROP POLICY IF EXISTS "sales update cotacao" ON public.cotacoes;
DROP POLICY IF EXISTS "admin delete cotacao" ON public.cotacoes;
CREATE POLICY "perm update cotacao" ON public.cotacoes FOR UPDATE TO authenticated USING (private.has_perm(auth.uid(),'cotacoes','editar')) WITH CHECK (private.has_perm(auth.uid(),'cotacoes','editar'));
CREATE POLICY "perm delete cotacao" ON public.cotacoes FOR DELETE TO authenticated USING (private.has_perm(auth.uid(),'cotacoes','excluir'));
