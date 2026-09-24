insert into public.paginas (slug, titulo_pt, titulo_es, publicado) values
 ('quem-somos','Quem somos','Quiénes somos', false),
 ('gestao-da-qualidade','Gestão da qualidade','Gestión de la calidad', false)
on conflict (slug) do nothing;
insert into public.configuracoes (chave, valor_pt, valor_es) values
 ('youtube', '', ''), ('horario', 'Segunda a sexta, 8h às 18h', 'Lunes a viernes, 8h a 18h')
on conflict (chave) do nothing;
insert into public.menus (local, label_pt, label_es, url, ordem)
select * from (values
 ('header','Início','Inicio','/',0),('header','Produtos','Productos','/produtos',1),('header','Quem somos','Quiénes somos','/quem-somos',2),
 ('header','Notícias','Noticias','/noticias',3),('header','Contato','Contacto','/contato',4),
 ('footer','Downloads','Descargas','/downloads',0),('footer','Rede autorizada','Red autorizada','/rede-autorizada',1),
 ('footer','Representantes','Representantes','/representantes',2),('footer','FAQ','FAQ','/faq',3)
) v where not exists (select 1 from public.menus);