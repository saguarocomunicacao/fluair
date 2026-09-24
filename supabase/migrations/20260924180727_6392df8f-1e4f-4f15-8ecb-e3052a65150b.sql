create table public.treinamentos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo_pt text not null, titulo_es text,
  descricao_pt text, descricao_es text,
  conteudo_pt text, conteudo_es text,
  duracao_pt text, duracao_es text,
  imagem_url text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  publicado boolean not null default false,
  criado_em timestamptz not null default now()
);
grant select on public.treinamentos to anon;
grant select, insert, update, delete on public.treinamentos to authenticated;
grant all on public.treinamentos to service_role;
alter table public.treinamentos enable row level security;
create policy "anonymous read published treinamentos" on public.treinamentos for select to anon using (ativo and publicado);
create policy "authenticated read treinamentos" on public.treinamentos for select to authenticated using ((ativo and publicado) or private.is_staff(auth.uid()));
create policy "staff write treinamentos" on public.treinamentos for all to authenticated using (private.can_edit_content(auth.uid())) with check (private.can_edit_content(auth.uid()));

insert into public.treinamentos (slug,titulo_pt,descricao_pt,duracao_pt,imagem_url,ordem,ativo,publicado) values
('valvulas-pneumaticas','Treinamento de Conceitos Básicos de Funcionamento, Instalação e Manutenção de Válvulas Pneumáticas',null,'Aproximadamente 4 horas','https://painel.fluair.com.br/files/treinamentos/W5B985C952A977Z1yWw315dA5W6C0A/treinamento-fluair-valvulas.jpg',1,true,true),
('sistema-abs-fluair','Treinamento de Conceitos Básicos de Funcionamento, Instalação e Manutenção do Sistema ABS Fluair',null,'Aproximadamente 4 horas','https://painel.fluair.com.br/files/treinamentos/89BZY060Yc0A9CYd73Y703z5a5y03B/folder_painel_(1).png',2,true,true);

insert into public.menus (local,label_pt,label_es,url,ordem,ativo) values ('footer','Treinamento','Capacitación','/treinamentos',4,true);