# Fluair

Crie um projeto React + Tailwind chamado "Fluair" e ative o backend (Supabase).
Nesta etapa, foque só no backend e no painel administrativo (CMS). O site público vem depois.

Fluair fabrica válvulas e freios ABS para o sistema de freio de implementos rodoviários.
O CMS precisa permitir que a equipe gerencie TODO o conteúdo do site.

BANCO DE DADOS (crie as tabelas; campos de conteúdo em PT e ES, colunas _pt e _es)
- categorias: slug (único), nome, descricao, imagem_url, ordem, ativo
- produtos: codigo (único), nome, categoria_id (fk categorias), descricao,
  especificacoes (jsonb, ex.: {"rosca":"M16","linha":"ABS"}), ncm, destaque (bool), ativo, ordem, criado_em
- produto_imagens: produto_id (fk), url, alt, ordem
- banners: local (ex.: home_hero), titulo, subtitulo, imagem_url, cta_label, cta_url, ordem, ativo
- paginas: slug (único), titulo, conteudo (editor rico), seo_titulo, seo_descricao, publicado, atualizado_em
- menus: local (header/footer), label, url, parent_id (fk menus, para submenu), ordem, ativo
- noticias: slug (único), titulo, resumo, conteudo, capa_url, categoria, autor, publicado, publicado_em
- downloads: titulo, descricao, arquivo_url, categoria, ordem, ativo
- representantes: nome, empresa, estado, cidade, telefone, whatsapp, email, ordem, ativo
- rede_autorizada: nome, cidade, estado, endereco, telefone, whatsapp, lat, lng, ativo
- faq: pergunta, resposta, categoria, ordem, ativo
- configuracoes: chave (pk), valor (para telefone, whatsapp, email, endereco, instagram, facebook, tagline)
- cotacoes: nome, email, telefone, empresa, cnpj, estado, mensagem, status (novo/em_atendimento/concluido), criado_em
- cotacao_itens: cotacao_id (fk), produto_id (fk), codigo, nome, quantidade

STORAGE (buckets com leitura pública e escrita só autenticada): produtos, banners, noticias, downloads

AUTENTICAÇÃO E PAPÉIS
- Supabase Auth por e-mail e senha.
- Tabela profiles ligada ao usuário do auth, com papel (role): admin, editor_conteudo, comercial.
- admin acessa tudo; editor_conteudo acessa o conteúdo do site; comercial acessa só as cotações.

SEGURANÇA (RLS)
- Leitura pública apenas do que está ativo/publicado nas tabelas de conteúdo.
- Escrita (criar/editar/excluir) só para usuários autenticados.
- cotacoes e cotacao_itens: qualquer visitante pode inserir; só staff autenticado lê e atualiza.
- configuracoes e menus: leitura pública; escrita só autenticada.

PAINEL ADMIN (/admin, protegido por login)
- Só usuários autenticados entram. O menu do admin aparece conforme o papel do profile.
- Telas de CRUD (listar, buscar, criar, editar, excluir, com upload de imagem/arquivo para o storage) para:
  categorias, produtos (com galeria em produto_imagens), banners, paginas (com editor rico),
  menus, noticias, downloads, representantes, rede_autorizada, faq e configuracoes.
- Todos os campos de conteúdo com abas ou colunas PT e ES.
- Caixa de cotações (para o papel comercial): lista de cotacoes com seus itens, filtro por status,
  visualização do lead e botão para mudar o status.
- Importador de CSV para a tabela produtos (para subir os ~160 SKUs do catálogo atual):
  mapear as colunas codigo, nome, categoria e especificacoes.

DADOS INICIAIS (popular agora)
- categorias (ativas, nesta ordem): Linha ABS, Válvulas Pneumáticas, Painéis de Comando,
  Componentes, Conexões, Manômetros, Reparos, Tubos.
- configuracoes: telefone "(48) 3112-8200", whatsapp "(48) 99110-7742",
  email "fluair@fluair.com.br", endereco "Rua do Albatroz, 100, Pedra Branca, Palhoça/SC",
  instagram "fluair", facebook "fluair", tagline "Não importa o caminho, vá com Fluair!".

Entregue o admin funcionando com um usuário admin de teste. O front público não é para agora.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fluair.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/de71c8d9-71b3-47f3-a1ef-5179e7d9edfc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
