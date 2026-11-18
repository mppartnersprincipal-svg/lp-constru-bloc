-- Pedidos dos leads do Google, lançados pelo Vinícius em /pedidos (substitui a planilha
-- "Controle de Pedidos - Leads Google"). Lidos pela seção Vendas do /dashboard.
-- Um pedido = uma linha; os produtos ficam em itens (jsonb), gravados numa única chamada REST.
-- O total é sempre calculado no servidor (soma dos itens + taxa de entrega − desconto); ver api/_lib/pedidos.js.
-- Pedidos importados da planilha guardam o total cobrado (total_planilha); itens sem preço na planilha têm null.
-- Acesso só pela service role (API na Vercel). RLS ligado sem policies = bloqueado para anon/authenticated.
-- Projeto compartilhado: tudo daqui começa com construbloc_.
-- Idempotente: pode rodar de novo sem perder dados.

create table if not exists public.construbloc_pedidos (
  id               uuid primary key default gen_random_uuid(),
  data             date not null,
  cliente_nome     text check (cliente_nome is null or char_length(cliente_nome) <= 120),
  cliente_telefone text check (cliente_telefone is null or cliente_telefone ~ '^[0-9]{8,13}$'),
  itens            jsonb not null check (jsonb_typeof(itens) = 'array' and jsonb_array_length(itens) between 1 and 50),
  entrega          text not null default 'indefinido' check (entrega in ('entrega', 'retirada', 'indefinido')),
  taxa_entrega     numeric(10,2) not null default 0 check (taxa_entrega >= 0),
  desconto         numeric(10,2) not null default 0 check (desconto >= 0),
  total            numeric(12,2) not null check (total >= 0),   -- itens + taxa − desconto
  total_planilha   numeric(12,2),                 -- só nos importados da planilha (conferência)
  pesquisou        text check (pesquisou is null or char_length(pesquisou) <= 200),
  observacao       text check (observacao is null or char_length(observacao) <= 1000),
  origem           text not null default 'google' check (origem in ('google', 'outro')),
  ref_planilha     text unique,                   -- ex.: OUTUBRO!4 (impede importar duas vezes)
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  excluido_em      timestamptz                    -- exclusão suave (dá para desfazer pelo SQL)
);

create index if not exists construbloc_pedidos_data_idx
  on public.construbloc_pedidos (data desc) where excluido_em is null;
create index if not exists construbloc_pedidos_telefone_idx
  on public.construbloc_pedidos (cliente_telefone) where excluido_em is null and cliente_telefone is not null;

alter table public.construbloc_pedidos enable row level security;
-- Sem policies: anon/authenticated não leem nem escrevem. A API usa a service role.
revoke all on public.construbloc_pedidos from anon, authenticated;

-- Para desfazer uma exclusão (o Vinícius pede, o Pedro roda):
-- update public.construbloc_pedidos set excluido_em = null where id = '<id>';
