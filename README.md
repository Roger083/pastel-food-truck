# Food Truck – LIFF + Supabase

Sistema de pedidos para food truck: cliente pede via LINE (LIFF), dono vê lista no iPad e marca como pronto; cliente recebe notificação no LINE.

## O que você precisa fazer

### 1. Supabase – banco de dados

1. No [Supabase](https://supabase.com) → seu projeto → **SQL Editor**.
2. Abra o arquivo **`supabase/migrations/001_initial_schema.sql`** no seu editor, **selecione todo o conteúdo** (Ctrl+A), **copie** (Ctrl+C).
3. No SQL Editor do Supabase **cole** o conteúdo e clique em **Run**.  
   ⚠️ Não digite o nome do arquivo no editor — só o conteúdo SQL.
4. (Opcional) Repita o processo com **`supabase/migrations/002_seed_exemplo.sql`** para ter um evento e cardápio de teste.
5. **Admin (login por email/senha):** rode também **`supabase/migrations/003_admin_authenticated_rls.sql`** no SQL Editor (copie/cole e Run). Depois, no Supabase → **Authentication** → **Users** → **Add user** → crie um usuário com **email** e **senha**. Use esse email e senha para acessar o painel admin (`admin.html`).

### 2. Supabase – variáveis das Edge Functions

No projeto Supabase: **Settings** → **Edge Functions** → **Secrets** (ou **Project Settings** → **Edge Functions**):

- `CHANNEL_ACCESS_TOKEN`: token do canal LINE (Messaging API), para enviar a notificação “pedido pronto”.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são preenchidos automaticamente. O admin não usa mais `ADMIN_SECRET`; o acesso é via **Supabase Auth** (email/senha do usuário criado no passo 1.5).

### 3. Publicar as Edge Functions

Só é necessária a função **mark-order-ready**. Na pasta do projeto, com [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e logado:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy mark-order-ready
```

Defina o secret do LINE via CLI:

```bash
supabase secrets set CHANNEL_ACCESS_TOKEN=seu_channel_access_token
```

### 4. Configurar o front (LIFF + Admin)

1. Copie/crie `js/config.js` com seus dados:

```js
window.FOOD_TRUCK_CONFIG = {
  liffId: 'SEU_LIFF_ID',           // LINE Developers → LIFF
  supabaseUrl: 'https://SEU_PROJECT.supabase.co',
  supabaseAnonKey: 'SUA_ANON_KEY'   // Supabase → Settings → API → anon public
};
```

2. **LINE Developers**: no LIFF, defina a **Endpoint URL** como a URL onde o site está (ex.: GitHub Pages: `https://seu-usuario.github.io/food-truck/`).

### 5. Deploy do site (GitHub Pages ou outro)

- Coloque os arquivos na raiz do repositório (ou na pasta que o GitHub Pages usa).
- Garanta que `index.html`, `admin.html`, `css/`, `js/` e `config.js` (com seus valores) estejam acessíveis na mesma origem da URL do LIFF.

### 6. Uso

- **Cliente:** abre o LIFF pelo LINE (QR code ou link), vê o cardápio, monta o pedido e confirma; recebe o **número do pedido** e, quando o dono marcar como pronto, uma **notificação no LINE**.
- **Dono (iPad):** acessa `https://sua-url/admin.html`, faz login com **email e senha** (usuário criado no Supabase Auth), vê a lista de pedidos e clica em **できあがり** para marcar como pronto (e disparar a notificação no LINE).

## Estrutura do projeto

- `index.html` – LIFF (cliente): cardápio, carrinho, pedido, número.
- `admin.html` – Painel dono: lista de pedidos, marcar pronto.
- `js/config.js` – Configuração (LIFF ID, Supabase URL e anon key).
- `js/app.js` – Lógica do LIFF.
- `js/admin.js` – Lógica do admin.
- `supabase/migrations/` – SQL do schema e seed.
- `supabase/functions/` – Edge Function: `mark-order-ready` (notificação LINE; lista de pedidos vem direto do Supabase com o usuário logado).

## Relatório e eventos (Fase 2+)

O modelo já tem `eventos` e `pedidos` por evento. Em uma fase futura você pode:
- Trocar o evento ativo e os cardápios pelo painel.
- Gerar relatório de vendas por evento (para impostos).
