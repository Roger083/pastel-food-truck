# Edge Functions – explicado do zero

## Em uma frase

**Edge Functions** são dois programinhas que ficam no Supabase.  
Um **mostra a lista de pedidos** no iPad. O outro **marca o pedido como pronto** e **manda a mensagem no LINE** para o cliente.

Você **não precisa** entender o código. Só precisa **publicar** esses programas (rodando uns comandos) e **configurar duas “senhas”** (uma para o admin, outra para o LINE).

---

## Por que não dá pra fazer tudo no navegador?

- A **lista de pedidos** e o **“marcar como pronto”** precisam de uma **senha de admin** (para não qualquer um ver ou mudar pedidos).
- Para **mandar a mensagem no LINE** (“Pedido #3 está pronto”), o sistema precisa do **token do LINE**. Esse token **não pode** ficar no site (qualquer um poderia ver). Por isso ele fica só no Supabase, dentro da Edge Function.

Resumindo: o iPad chama o Supabase; o Supabase verifica a senha, atualiza o pedido e, se tiver o token do LINE, manda a mensagem. Tudo isso são as Edge Functions.

---

## O que você precisa fazer (só 4 coisas)

### 1. Login no Supabase (uma vez)

No terminal, na pasta do projeto:

```bash
cd /home/roger/projetos/food-truck
npx supabase login
```

Vai abrir o navegador. Entre na sua conta Supabase e autorize. Quando voltar ao terminal, pode seguir.

---

### 2. Ligar o projeto ao seu banco (uma vez)

O Supabase precisa saber em qual “projeto” publicar. O seu projeto tem este **ID**: `ejzaaoyqeeqyuoiozfxn`.

Rode:

```bash
npx supabase link --project-ref ejzaaoyqeeqyuoiozfxn
```

Vai pedir a **senha do banco** (a que você definiu quando criou o projeto no Supabase). Digite e aperte Enter.

---

### 3. Definir as duas “senhas” (uma vez)

**3.1 – Senha do painel (iPad)**  
Escolha uma senha que só você vai saber. O dono do truck vai digitar essa senha quando abrir o `admin.html` no iPad.

No terminal (troque `MINHA_SENHA_SEGREDO` pela senha que você escolheu):

```bash
npx supabase secrets set ADMIN_SECRET=MINHA_SENHA_SEGREDO
```

Exemplo: se a senha for `pastel2025`:

```bash
npx supabase secrets set ADMIN_SECRET=pastel2025
```

**3.2 – Token do LINE**  
No [LINE Developers](https://developers.line.biz) → seu canal (Messaging API) → aba **Messaging API** → em **Channel access token** clique em **Issue** ou **Reissue** e **copie** o token.

No terminal, **cole o token no lugar de COLE_O_TOKEN_AQUI** (tudo numa linha, sem espaço no meio):

```bash
npx supabase secrets set CHANNEL_ACCESS_TOKEN=COLE_O_TOKEN_AQUI
```

---

### 4. Publicar os dois programinhas (uma vez)

Rode um comando, espere terminar. Depois rode o outro.

```bash
npx supabase functions deploy list-orders
```

Quando acabar:

```bash
npx supabase functions deploy mark-order-ready
```

Se aparecer algo como “Deployed” ou “Success”, está feito.

---

## Resumo

| Passo | O que faz |
|-------|-----------|
| 1 | `npx supabase login` → você entra na conta Supabase |
| 2 | `npx supabase link --project-ref ejzaaoyqeeqyuoiozfxn` → liga a pasta do projeto ao seu banco (pede a senha do banco) |
| 3 | `npx supabase secrets set ADMIN_SECRET=sua_senha` → define a senha do admin no iPad |
| 3 | `npx supabase secrets set CHANNEL_ACCESS_TOKEN=token_do_line` → guarda o token do LINE no Supabase |
| 4 | `npx supabase functions deploy list-orders` → publica o programa da lista de pedidos |
| 4 | `npx supabase functions deploy mark-order-ready` → publica o programa que marca pronto e manda mensagem no LINE |

Depois disso, no **admin (iPad)** você usa a **mesma senha** que colocou em `ADMIN_SECRET` quando o site pedir “合言葉”.

Se travar em algum passo (por exemplo: “não acho o token do LINE” ou “o deploy deu erro”), diga qual passo e o que apareceu na tela que eu te guio no próximo movimento.
