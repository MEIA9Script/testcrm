-- ============================================================
-- Nexsite CRM — configuração do banco no Supabase
-- Cole este script inteiro no SQL Editor do Supabase e clique em "Run"
-- ============================================================

-- Tabela única que guarda todos os dados do CRM (empresas, fluxos, motivos de perda).
-- Como é um workspace compartilhado entre você e seu sócio, usamos uma linha só (id = 1).
create table if not exists crm_data (
  id int primary key default 1,
  companies jsonb not null default '[]'::jsonb,
  flows jsonb not null default '[]'::jsonb,
  loss_reasons jsonb not null default '[]'::jsonb,
  webhook_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- Habilita Row Level Security (obrigatório no Supabase para acesso via app)
alter table crm_data enable row level security;

-- Política: qualquer usuário autenticado (logado) pode ler e escrever.
-- Como só você e seu sócio terão login criado manualmente, isso já restringe
-- o acesso a vocês dois — ninguém de fora consegue ler sem estar logado.
create policy "Usuários autenticados podem ler"
  on crm_data for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir"
  on crm_data for insert
  to authenticated
  with check (true);

create policy "Usuários autenticados podem atualizar"
  on crm_data for update
  to authenticated
  using (true)
  with check (true);

-- Pronto! Depois de rodar este script:
-- 1. Vá em Authentication → Users → Add user, e crie o login seu e do seu sócio
--    (e-mail + senha, marque "Auto Confirm User" pra não precisar confirmar e-mail)
-- 2. Pegue a URL e a chave "anon public" em Project Settings → API
-- 3. Cole essas duas informações no .env.local (ou nas variáveis de ambiente da Vercel)
