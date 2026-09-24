CREATE OR REPLACE FUNCTION private.cotacao_aberta(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.cotacoes c WHERE c.id = _id AND c.status = 'novo' AND c.criado_em >= now() - interval '15 minutes')
$$;
REVOKE ALL ON FUNCTION private.cotacao_aberta(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon;
GRANT EXECUTE ON FUNCTION private.cotacao_aberta(uuid) TO anon, authenticated, service_role;
DROP POLICY IF EXISTS "validated quote item submission" ON public.cotacao_itens;
CREATE POLICY "validated quote item submission" ON public.cotacao_itens FOR INSERT TO anon, authenticated
WITH CHECK (
  cotacao_id IS NOT NULL AND quantidade BETWEEN 1 AND 999
  AND (produto_id IS NOT NULL OR NULLIF(btrim(codigo), '') IS NOT NULL OR NULLIF(btrim(nome), '') IS NOT NULL)
  AND private.cotacao_aberta(cotacao_id)
);
DELETE FROM public.cotacoes WHERE nome = 'Teste Playwright';