# Nexsite CRM — Guia de Publicação (Supabase + Vercel)

Passo a passo completo, sem precisar saber programar. Segue na ordem.

---

## Parte 1 — Criar o banco no Supabase (~5 min)

1. Acesse **https://supabase.com** e crie uma conta (pode entrar com GitHub).
2. Clique em **"New Project"**.
   - Nome: `nexsite-crm` (ou o que preferir)
   - Senha do banco: gere uma forte e **guarde em local seguro** (não é a senha de login do app, é só do banco).
   - Região: escolha a mais próxima do Brasil (ex: South America - São Paulo, se disponível).
3. Espere ~2 minutos o projeto ser criado.
4. No menu lateral, clique em **SQL Editor** → **New query**.
5. Abra o arquivo `supabase-setup.sql` (está junto com este projeto), copie todo o conteúdo, cole no editor e clique em **Run**.
   - Isso cria a tabela `crm_data` e as regras de segurança.
6. Vá em **Authentication** (ícone de pessoa, no menu lateral) → **Users** → **Add user** → **Create new user**.
   - Crie um usuário pra você: seu e-mail + uma senha.
   - **Marque a opção "Auto Confirm User"** (senão ele pede confirmação por e-mail).
   - Repita pra criar o login do seu sócio.
7. Vá em **Project Settings** (ícone de engrenagem) → **API**.
   - Copie a **Project URL** (algo como `https://xxxxx.supabase.co`).
   - Copie a chave **anon public** (uma string longa).
   - Guarde os dois — vai usar na Parte 3.

---

## Parte 2 — Subir o código pro GitHub (~5 min)

1. Acesse **https://github.com** e faça login.
2. Clique em **"New repository"**.
   - Nome: `nexsite-crm`
   - Pode deixar **Private** (só você e quem convidar vê o código).
   - Não marque nenhuma opção de "adicionar README" — vamos subir os arquivos prontos.
3. Na pasta deste projeto (a que contém `package.json`, `app/`, `components/` etc.), suba os arquivos pro repositório. Duas formas:

   **Opção A — pelo site do GitHub (mais fácil, sem terminal):**
   - Na página do repositório recém-criado, clique em "uploading an existing file".
   - Arraste TODOS os arquivos e pastas do projeto (exceto `node_modules`, se existir).
   - Clique em "Commit changes".

   **Opção B — pelo terminal (se tiver Git instalado):**
   ```bash
   cd caminho/para/nexsite-crm-web
   git init
   git add .
   git commit -m "Primeira versão do CRM"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/nexsite-crm.git
   git push -u origin main
   ```

---

## Parte 3 — Publicar na Vercel (~5 min)

1. Acesse **https://vercel.com** e faça login **com sua conta do GitHub** (assim ele já enxerga seus repositórios).
2. Clique em **"Add New..." → "Project"**.
3. Encontre o repositório `nexsite-crm` na lista e clique em **"Import"**.
4. Na tela de configuração, abra **"Environment Variables"** e adicione duas:

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | a Project URL que você copiou do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave anon public que você copiou do Supabase |

5. Clique em **"Deploy"**.
6. Espere ~2 minutos. Quando terminar, a Vercel te dá um link tipo `nexsite-crm.vercel.app` — esse é o link do seu CRM, já no ar.

---

## Pronto! Como usar a partir de agora

- Acesse o link da Vercel, faça login com o e-mail/senha que você criou no Supabase (Parte 1, passo 6).
- Você e seu sócio acessam o mesmo link, com logins diferentes, vendo os mesmos dados (empresas, fluxos, histórico).
- Toda vez que você editar algo no código (se quiser mudar algo no futuro) e subir pro GitHub de novo, a Vercel atualiza o site sozinha.

---

## Se algo der errado

- **Tela de login não aparece / erro de build na Vercel:** confira se as duas variáveis de ambiente foram coladas certinho, sem espaços extras.
- **"Não foi possível carregar os dados do Supabase":** confira se rodou o `supabase-setup.sql` certinho no SQL Editor (Parte 1, passo 5).
- **Não consigo logar:** confira no Supabase → Authentication → Users se o usuário aparece com status confirmado.
- Qualquer erro específico, copie a mensagem e me manda que eu te ajudo a resolver.
