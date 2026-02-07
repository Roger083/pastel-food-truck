# Configuração passo a passo (iniciante)

Siga na ordem. Cada seção diz **onde** clicar e **o que** copiar.

---

## Parte 1: config.js (LIFF + Supabase)

O arquivo `js/config.js` precisa de 3 valores. Você vai preencher um por um.

### 1.1 Supabase URL e Anon Key

1. Acesse [https://supabase.com](https://supabase.com) e faça login.
2. Clique no **seu projeto** (o que você usou para rodar o SQL).
3. No menu da esquerda, clique em **Settings** (ícone de engrenagem).
4. Clique em **API** (dentro de Project Settings).
5. Na página você verá:
   - **Project URL** – algo como `https://abcdefghijk.supabase.co`  
     → Copie esse endereço inteiro.
   - **Project API keys** – há duas chaves:
     - **anon** **public** – é a que você precisa. Clique em **Reveal** (ou no ícone de olho) e **copie** a chave (é longa, começa com `eyJ...`).
6. Abra o arquivo **`js/config.js`** no seu editor.
7. Substitua:
   - `'https://SEU_PROJECT.supabase.co'` → cole o **Project URL** que você copiou (entre aspas).
   - `'SUA_ANON_KEY'` → cole a chave **anon public** que você copiou (entre aspas).

Exemplo de como pode ficar (com dados falsos):

```js
window.FOOD_TRUCK_CONFIG = {
  liffId: '1234567890-AbCdEfGh',   // você preenche no próximo passo
  supabaseUrl: 'https://xyzabc123.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...'
};
```

### 1.2 LIFF ID (LINE)

1. Acesse [https://developers.line.biz](https://developers.line.biz) e faça login.
2. No topo, escolha o **Provider** (ex.: "Pastel Food Truck"). Se não tiver, crie um.
3. Abra o **Channel** do tipo **Messaging API** (o que você usa para o LIFF).
4. No menu da esquerda, clique em **LIFF**.
5. Você verá uma lista de apps LIFF. Clique na que você usa para o food truck (ou crie uma nova).
6. Na tela do LIFF você verá **LIFF ID** – é um número (ex.: `1234567890-AbCdEfGh`). **Copie** esse valor.
7. No **Endpoint URL** do LIFF, coloque a URL onde seu site está. Exemplos:
   - GitHub Pages: `https://seu-usuario.github.io/food-truck/`
   - Ou a URL que a Netlify/Vercel der.
8. Volte ao arquivo **`js/config.js`** e substitua `'SEU_LIFF_ID'` pelo **LIFF ID** que você copiou (entre aspas).

Pronto: o **config.js** está completo quando os 3 campos estiverem preenchidos.

---

## Parte 2: Edge Functions (lista de pedidos + notificação LINE)

**Se esta parte estiver confusa,** use o guia simplificado: **[EDGE_FUNCOES_SIMPLES.md](EDGE_FUNCOES_SIMPLES.md)** – explica em uma frase o que são e lista só os comandos que você precisa rodar, na ordem.

As Edge Functions rodam no Supabase. Você precisa:

- Instalar o Supabase CLI no computador.
- “Conectar” o projeto e publicar as duas funções.
- Definir duas “senhas” (secrets): uma para o admin do iPad e outra para o LINE enviar mensagem.

### 2.1 Instalar o Supabase CLI (no projeto, sem global)

O Supabase **não suporta mais** `npm install -g supabase`. Use a instalação **dentro do projeto**:

1. Abra o terminal **na pasta do projeto** (ex.: `cd /home/roger/projetos/food-truck`).
2. Rode (no WSL/Linux/Mac – **não** use PowerShell para isso):

```bash
npm install
```

Isso instala o Supabase como dependência de desenvolvimento (já está no `package.json`).  
Depois use sempre **`npx supabase`** em vez de `supabase`:

```bash
npx supabase --version
```

Se aparecer um número de versão, está ok.

**Se você não tiver Node/npm no WSL:** instale no Ubuntu com:

```bash
sudo apt update && sudo apt install -y nodejs npm
```

Depois rode `npm install` na pasta do projeto.

### 2.2 Fazer login e conectar o projeto

1. No terminal (na pasta do seu projeto, ex.: `food-truck`), rode:

```bash
cd /home/roger/projetos/food-truck
npx supabase login
```

O navegador vai abrir; faça login na conta Supabase e autorize. Depois volte ao terminal.

2. Pegar o **Project Ref** (ID do projeto):
   - No Supabase, abra seu projeto.
   - Em **Settings** → **General** você vê **Reference ID** (ou na URL: `https://supabase.com/dashboard/project/XXXXXXXX` → o XXXXXXXX é o ref).
   - Copie esse ID (ex.: `abcdefghijk`).

3. Conectar o projeto (na pasta do projeto):

```bash
npx supabase link --project-ref SEU_PROJECT_REF
```

Substitua `SEU_PROJECT_REF` pelo ID que você copiou. Ele vai pedir a senha do banco (a que você definiu ao criar o projeto). Digite e confirme.

### 2.3 Definir os secrets (senhas das funções)

No terminal, **na pasta do projeto**, rode **um comando por vez** (troque pelos seus valores):

**Senha do painel admin (iPad)** – escolha uma senha que só você saiba; o dono digita ela no admin:

```bash
npx supabase secrets set ADMIN_SECRET=minhasenha123
```

**Token do LINE** (para enviar “pedido pronto”):

1. No [LINE Developers](https://developers.line.biz) → seu Channel (Messaging API).
2. Aba **Messaging API**.
3. Em **Channel access token**, clique em **Issue** (ou **Reissue**) e **copie** o token (longo, começa com algo como `eyJ...` ou uma sequência de letras/números).
4. No terminal (na pasta do projeto):

```bash
npx supabase secrets set CHANNEL_ACCESS_TOKEN=COLE_O_TOKEN_AQUI
```

Substitua `COLE_O_TOKEN_AQUI` pelo token que você copiou (tudo numa linha, sem espaço).

### 2.4 Publicar as Edge Functions

Ainda na pasta do projeto (`food-truck`), rode:

```bash
npx supabase functions deploy list-orders
```

Espere terminar. Depois:

```bash
npx supabase functions deploy mark-order-ready
```

Se aparecer “Deployed successfully” (ou algo parecido), as duas funções estão no ar.

---

## Resumo do que você precisa ter

| Onde | O que |
|------|--------|
| **config.js** | `supabaseUrl`, `supabaseAnonKey`, `liffId` |
| **LINE Developers** | LIFF Endpoint URL = URL do seu site |
| **Supabase secrets** | `ADMIN_SECRET` (senha do admin), `CHANNEL_ACCESS_TOKEN` (token do canal LINE) |
| **Admin (iPad)** | O dono acessa `https://sua-url/admin.html` e digita o valor de `ADMIN_SECRET` quando pedir “合言葉” |

Se travar em algum passo, diga em qual (ex.: “não acho o LIFF ID” ou “o deploy deu erro”) e descreva o que aparece na tela que eu te guio no próximo movimento.
