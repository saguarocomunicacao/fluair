CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_staff(uuid) SET SCHEMA private;
ALTER FUNCTION public.can_edit_content(uuid) SET SCHEMA private;
ALTER FUNCTION public.can_sales(uuid) SET SCHEMA private;

ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION private.is_staff(uuid) SET search_path = public;
ALTER FUNCTION private.can_edit_content(uuid) SET search_path = public;
ALTER FUNCTION private.can_sales(uuid) SET search_path = public;

CREATE OR REPLACE FUNCTION private.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role = 'admin'::public.app_role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_edit_content(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_sales(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_edit_content(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_sales(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "own or admin read profile" ON public.profiles;
DROP POLICY IF EXISTS "own or admin update profile" ON public.profiles;
CREATE POLICY "staff read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));
CREATE POLICY "self or admin update profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "own or admin read roles" ON public.user_roles;
CREATE POLICY "self or admin read roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "sales read cotacao" ON public.cotacoes;
DROP POLICY IF EXISTS "sales update cotacao" ON public.cotacoes;
DROP POLICY IF EXISTS "admin delete cotacao" ON public.cotacoes;
CREATE POLICY "sales read cotacao" ON public.cotacoes
  FOR SELECT TO authenticated USING (private.can_sales(auth.uid()));
CREATE POLICY "sales update cotacao" ON public.cotacoes
  FOR UPDATE TO authenticated
  USING (private.can_sales(auth.uid()))
  WITH CHECK (private.can_sales(auth.uid()));
CREATE POLICY "admin delete cotacao" ON public.cotacoes
  FOR DELETE TO authenticated USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "sales read item" ON public.cotacao_itens;
DROP POLICY IF EXISTS "anyone insert item" ON public.cotacao_itens;
CREATE POLICY "sales read item" ON public.cotacao_itens
  FOR SELECT TO authenticated USING (private.can_sales(auth.uid()));
CREATE POLICY "validated quote item submission" ON public.cotacao_itens
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    cotacao_id IS NOT NULL
    AND quantidade BETWEEN 1 AND 999
    AND (produto_id IS NOT NULL OR nullif(btrim(codigo), '') IS NOT NULL OR nullif(btrim(nome), '') IS NOT NULL)
    AND EXISTS (
      SELECT 1 FROM public.cotacoes c
      WHERE c.id = cotacao_itens.cotacao_id
        AND c.status = 'novo'::public.cotacao_status
        AND c.criado_em >= now() - interval '15 minutes'
    )
  );

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categorias','produtos','banners','downloads','faq','menus','rede_autorizada','representantes']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'public read ' || CASE t WHEN 'rede_autorizada' THEN 'rede' ELSE t END, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (ativo)', 'anonymous read active ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (ativo OR private.is_staff(auth.uid()))', 'authenticated read ' || t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "public read paginas" ON public.paginas;
CREATE POLICY "anonymous read published paginas" ON public.paginas
  FOR SELECT TO anon USING (publicado);
CREATE POLICY "authenticated read paginas" ON public.paginas
  FOR SELECT TO authenticated USING (publicado OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "public read noticias" ON public.noticias;
CREATE POLICY "anonymous read published noticias" ON public.noticias
  FOR SELECT TO anon USING (publicado);
CREATE POLICY "authenticated read noticias" ON public.noticias
  FOR SELECT TO authenticated USING (publicado OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "public read produto_imagens" ON public.produto_imagens;
CREATE POLICY "anonymous read active product images" ON public.produto_imagens
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_imagens.produto_id AND p.ativo));
CREATE POLICY "authenticated read product images" ON public.produto_imagens
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.produtos p WHERE p.id = produto_imagens.produto_id AND p.ativo) OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "public read config" ON public.configuracoes;
CREATE POLICY "public read config" ON public.configuracoes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public read fluair buckets" ON storage.objects;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;

GRANT SELECT ON public.categorias, public.produtos, public.produto_imagens, public.banners, public.paginas, public.menus, public.noticias, public.downloads, public.representantes, public.rede_autorizada, public.faq, public.configuracoes TO anon;
GRANT INSERT ON public.cotacoes, public.cotacao_itens TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias, public.produtos, public.produto_imagens, public.banners, public.paginas, public.menus, public.noticias, public.downloads, public.representantes, public.rede_autorizada, public.faq, public.configuracoes TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes, public.cotacao_itens TO authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;