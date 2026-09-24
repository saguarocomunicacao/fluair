
create type public.app_role as enum ('admin','editor_conteudo','comercial');
create type public.cotacao_status as enum ('novo','em_atendimento','concluido');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text, email text, criado_em timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null, unique(user_id, role)
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.can_edit_content(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_uid and role in ('admin','editor_conteudo')) $$;
create or replace function public.can_sales(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_uid and role in ('admin','comercial')) $$;
create or replace function public.is_staff(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_uid) $$;

create policy "own or admin read profile" on public.profiles for select to authenticated using (id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own or admin update profile" on public.profiles for update to authenticated using (id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own or admin read roles" on public.user_roles for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id,email,nome) values (new.id,new.email,coalesce(new.raw_user_meta_data->>'nome',new.email)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_atualizado() returns trigger language plpgsql set search_path = public as $$
begin new.atualizado_em = now(); return new; end $$;

create table public.categorias (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  nome_pt text not null, nome_es text, descricao_pt text, descricao_es text,
  imagem_url text, ordem int not null default 0, ativo boolean not null default true, criado_em timestamptz not null default now());
create table public.produtos (
  id uuid primary key default gen_random_uuid(), codigo text unique not null,
  nome_pt text not null, nome_es text, categoria_id uuid references public.categorias(id) on delete set null,
  descricao_pt text, descricao_es text, especificacoes jsonb not null default '{}'::jsonb, ncm text,
  destaque boolean not null default false, ativo boolean not null default true, ordem int not null default 0,
  criado_em timestamptz not null default now());
create table public.produto_imagens (
  id uuid primary key default gen_random_uuid(), produto_id uuid not null references public.produtos(id) on delete cascade,
  url text not null, alt_pt text, alt_es text, ordem int not null default 0);
create table public.banners (
  id uuid primary key default gen_random_uuid(), local text not null default 'home_hero',
  titulo_pt text, titulo_es text, subtitulo_pt text, subtitulo_es text, imagem_url text,
  cta_label_pt text, cta_label_es text, cta_url text, ordem int not null default 0, ativo boolean not null default true);
create table public.paginas (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  titulo_pt text not null, titulo_es text, conteudo_pt text, conteudo_es text,
  seo_titulo_pt text, seo_titulo_es text, seo_descricao_pt text, seo_descricao_es text,
  publicado boolean not null default false, atualizado_em timestamptz not null default now());
create trigger paginas_touch before update on public.paginas for each row execute function public.touch_atualizado();
create table public.menus (
  id uuid primary key default gen_random_uuid(), local text not null default 'header',
  label_pt text not null, label_es text, url text, parent_id uuid references public.menus(id) on delete cascade,
  ordem int not null default 0, ativo boolean not null default true);
create table public.noticias (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  titulo_pt text not null, titulo_es text, resumo_pt text, resumo_es text, conteudo_pt text, conteudo_es text,
  capa_url text, categoria text, autor text, publicado boolean not null default false, publicado_em timestamptz);
create table public.downloads (
  id uuid primary key default gen_random_uuid(), titulo_pt text not null, titulo_es text,
  descricao_pt text, descricao_es text, arquivo_url text, categoria text, ordem int not null default 0, ativo boolean not null default true);
create table public.representantes (
  id uuid primary key default gen_random_uuid(), nome text not null, empresa text, estado text, cidade text,
  telefone text, whatsapp text, email text, ordem int not null default 0, ativo boolean not null default true);
create table public.rede_autorizada (
  id uuid primary key default gen_random_uuid(), nome text not null, cidade text, estado text, endereco text,
  telefone text, whatsapp text, lat double precision, lng double precision, ativo boolean not null default true);
create table public.faq (
  id uuid primary key default gen_random_uuid(), pergunta_pt text not null, pergunta_es text,
  resposta_pt text, resposta_es text, categoria text, ordem int not null default 0, ativo boolean not null default true);
create table public.configuracoes (chave text primary key, valor_pt text, valor_es text);
create table public.cotacoes (
  id uuid primary key default gen_random_uuid(), nome text not null, email text not null, telefone text, empresa text,
  cnpj text, estado text, mensagem text, status cotacao_status not null default 'novo', criado_em timestamptz not null default now());
create table public.cotacao_itens (
  id uuid primary key default gen_random_uuid(), cotacao_id uuid not null references public.cotacoes(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete set null, codigo text, nome text, quantidade int not null default 1);

-- grants + RLS for content tables
do $$ declare t text; begin
  foreach t in array array['categorias','produtos','produto_imagens','banners','paginas','menus','noticias','downloads','representantes','rede_autorizada','faq','configuracoes'] loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "staff write %1$s" on public.%1$I for all to authenticated using (public.can_edit_content(auth.uid())) with check (public.can_edit_content(auth.uid()))', t);
  end loop; end $$;

create policy "public read categorias" on public.categorias for select using (ativo or public.is_staff(auth.uid()));
create policy "public read produtos" on public.produtos for select using (ativo or public.is_staff(auth.uid()));
create policy "public read produto_imagens" on public.produto_imagens for select using (exists(select 1 from public.produtos p where p.id=produto_id and p.ativo) or public.is_staff(auth.uid()));
create policy "public read banners" on public.banners for select using (ativo or public.is_staff(auth.uid()));
create policy "public read paginas" on public.paginas for select using (publicado or public.is_staff(auth.uid()));
create policy "public read menus" on public.menus for select using (true);
create policy "public read noticias" on public.noticias for select using (publicado or public.is_staff(auth.uid()));
create policy "public read downloads" on public.downloads for select using (ativo or public.is_staff(auth.uid()));
create policy "public read representantes" on public.representantes for select using (ativo or public.is_staff(auth.uid()));
create policy "public read rede" on public.rede_autorizada for select using (ativo or public.is_staff(auth.uid()));
create policy "public read faq" on public.faq for select using (ativo or public.is_staff(auth.uid()));
create policy "public read config" on public.configuracoes for select using (true);

grant insert on public.cotacoes, public.cotacao_itens to anon;
grant select, insert, update, delete on public.cotacoes, public.cotacao_itens to authenticated;
grant all on public.cotacoes, public.cotacao_itens to service_role;
alter table public.cotacoes enable row level security;
alter table public.cotacao_itens enable row level security;
create policy "anyone insert cotacao" on public.cotacoes for insert to anon, authenticated with check (status='novo');
create policy "anyone insert item" on public.cotacao_itens for insert to anon, authenticated with check (true);
create policy "sales read cotacao" on public.cotacoes for select to authenticated using (public.can_sales(auth.uid()));
create policy "sales update cotacao" on public.cotacoes for update to authenticated using (public.can_sales(auth.uid()));
create policy "admin delete cotacao" on public.cotacoes for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "sales read item" on public.cotacao_itens for select to authenticated using (public.can_sales(auth.uid()));

-- storage policies
create policy "public read fluair buckets" on storage.objects for select using (bucket_id in ('produtos','banners','noticias','downloads'));
create policy "staff upload fluair" on storage.objects for insert to authenticated with check (bucket_id in ('produtos','banners','noticias','downloads') and public.can_edit_content(auth.uid()));
create policy "staff update fluair" on storage.objects for update to authenticated using (bucket_id in ('produtos','banners','noticias','downloads') and public.can_edit_content(auth.uid()));
create policy "staff delete fluair" on storage.objects for delete to authenticated using (bucket_id in ('produtos','banners','noticias','downloads') and public.can_edit_content(auth.uid()));

insert into public.categorias (slug,nome_pt,nome_es,ordem) values
('linha-abs','Linha ABS','Línea ABS',1),
('valvulas-pneumaticas','Válvulas Pneumáticas','Válvulas Neumáticas',2),
('paineis-de-comando','Painéis de Comando','Paneles de Mando',3),
('componentes','Componentes','Componentes',4),
('conexoes','Conexões','Conexiones',5),
('manometros','Manômetros','Manómetros',6),
('reparos','Reparos','Reparaciones',7),
('tubos','Tubos','Tubos',8);

insert into public.configuracoes (chave,valor_pt,valor_es) values
('telefone','(48) 3112-8200','(48) 3112-8200'),
('whatsapp','(48) 99110-7742','(48) 99110-7742'),
('email','fluair@fluair.com.br','fluair@fluair.com.br'),
('endereco','Rua do Albatroz, 100, Pedra Branca, Palhoça/SC','Rua do Albatroz, 100, Pedra Branca, Palhoça/SC'),
('instagram','fluair','fluair'),
('facebook','fluair','fluair'),
('tagline','Não importa o caminho, vá com Fluair!','¡No importa el camino, ve con Fluair!');
