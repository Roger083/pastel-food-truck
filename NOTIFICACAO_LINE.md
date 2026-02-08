# Notificação LINE quando o pedido estiver pronto

Para o cliente receber a mensagem no LINE ao clicar em **"Marcar pronto"** no admin, faça estes 2 passos.

---

## Nome que aparece ao abrir o menu no LINE

Quando o cliente abre o link do LIFF no LINE, o **nome do app** que aparece no topo (ou na barra) vem do **LINE Developers**, não do site. Para aparecer o nome do food truck em vez do seu nome:

1. Abra o [LINE Developers Console](https://developers.line.biz/console/).
2. Entre no canal **LINE Login** (ex.: **Pastel Pedidos**) — o canal onde o LIFF está.
3. Aba **LIFF** → clique no seu app LIFF (o que tem o LIFF ID usado no `config.js`).
4. Em **LIFF app name** (nome do app), coloque o nome do food truck (ex.: **Pastel Food Truck**).
5. Salve.

Assim, ao abrir o cardápio pelo LINE, o cliente verá o nome do food truck, não o nome do desenvolvedor. No projeto você também pode ajustar `foodTruckName` em `js/config.js` para usar o mesmo nome em títulos das páginas, se quiser.

### O que fazer com "roger.083.github.io" (ou outro domínio) aparecendo embaixo

O LINE mostra o **domínio** da página (ex.: roger.083.github.io) na barra do navegador in-app. **Não dá para esconder isso pelo código** — é o endereço real onde o site está.

Para **não** aparecer o endereço do GitHub:
- Hospede o site em um **domínio próprio** (ex.: `pedidos.seudofoodtruck.com.br`) e aponte o LIFF no LINE Developers para esse endereço. Aí o cliente verá esse domínio em vez de roger.083.github.io.
- Enquanto usar GitHub Pages, o domínio continuará visível; o importante é o **nome do app** (Pastel - Food Truck) que já está correto.

---

## Nome do bot (Official Account) — em vez de "Roger"

A conta que **envia** a notificação "Seu pedido está pronto" é o **Official Account** do canal **Messaging API**. Se hoje ele aparece como "Roger" e você quer o nome do food truck:

1. Abra o [LINE Developers Console](https://developers.line.biz/console/).
2. Abra o canal **Messaging API** (o que você usa para o token).
3. Vá na aba **Basic settings** (Configurações básicas).
4. Em **Channel name** (nome do canal), coloque o nome do food truck (ex.: **Pastel Food Truck**). Salve.

O nome que o cliente vê no LINE (na conversa onde chega a notificação) pode demorar um pouco para atualizar; se não mudar, no [LINE Official Account Manager](https://manager.line.biz/) (vincule o canal se precisar) dá para ajustar o **nome de exibição** do bot.

---

## 1. Pegar o token do canal Messaging API

1. Abra o [LINE Developers Console](https://developers.line.biz/console/).
2. Entre no **provider** (ex.: Food Truck) e abra o canal **Messaging API** (pode ter sido criado com nome "Roger"; o nome você altera no item acima).  
   ⚠️ Use o canal **Messaging API**, não o canal **LINE Login** (Pastel Pedidos).
3. Vá na aba **Messaging API**.
4. Em **Channel access token**, clique em **Issue** ou **Reissue**.
5. **Copie** o token (ele é longo; copie tudo).

---

## 2. Colocar o token no Supabase e publicar a função

Resumindo: o token que você copiou do LINE é como uma “senha” que só o Supabase pode usar para mandar mensagem no LINE. Você vai **guardar** essa senha no Supabase e **publicar** o programinha que usa essa senha quando você clica em “Marcar pronto” no admin.

### Opção A – Pelo site do Supabase (mais simples)

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard), entre no seu projeto (ejzaaoyqeeqyuoiozfxn).
2. No menu da esquerda: **Project Settings** (ícone de engrenagem) → **Edge Functions**.
3. Na seção **Secrets**, se já existir `CHANNEL_ACCESS_TOKEN` com token antigo:
   - Clique em **Delete** / apagar nesse secret.
   - Em seguida use **Add new secret** (ou **New secret**):
     - **Name:** `CHANNEL_ACCESS_TOKEN`
     - **Value:** cole o token **novo** que você copiou do LINE Developers (token longo).
   - Salve.
4. **Deploy da função** (ver seção “Deploy do mark-order-ready” mais abaixo).

### Opção B – Pelo terminal (comandos)

No **Windows**, se aparecer *"supabase não é reconhecido"*, instale o CLI antes:  
`npm install -g supabase`  
(Requer Node.js instalado. Se não tiver, use só a Opção A pelo site.)

Abra o **terminal** na pasta do projeto (WSL ou Windows).

**Passo 2.1 – Entrar no Supabase e ligar ao seu projeto (só uma vez)**

```bash
npx supabase login
```

Vai abrir o navegador para você logar. Depois:

```bash
npx supabase link --project-ref ejzaaoyqeeqyuoiozfxn
```

Vai pedir a senha do banco; digite e aperte Enter.

**Passo 2.2 – Guardar o token no Supabase**

No lugar de `COLE_O_TOKEN_AQUI`, cole o token que você copiou do LINE (tudo numa linha, sem espaço no meio):

```bash
npx supabase secrets set CHANNEL_ACCESS_TOKEN=COLE_O_TOKEN_AQUI
```

Exemplo (o seu token será outro):  
`npx supabase secrets set CHANNEL_ACCESS_TOKEN=abc123xyz...`

**Passo 2.3 – Publicar a função**

Isso envia o “programinha” que envia a mensagem no LINE para os servidores do Supabase:

```bash
npx supabase functions deploy mark-order-ready
```

Quando aparecer **Deployed** ou **Success**, está pronto.

---

## Deploy do mark-order-ready

A função que envia a mensagem no LINE precisa estar publicada no Supabase. Duas formas:

### Deploy pelo Dashboard (sem terminal)

1. No [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → menu **Edge Functions** (não “Secrets”).
2. Veja se já existe a função **mark-order-ready** na lista.
   - **Se existir:** clique nela, confira o código (ou deixe como está) e clique em **Deploy** ou **Deploy updates** no rodapé do editor.
   - **Se não existir:** clique em **Deploy a new function** → **Via Editor**.
3. Defina o **nome** da função como: `mark-order-ready`.
4. No editor, **apague** o código de exemplo e **cole** todo o conteúdo do arquivo `supabase/functions/mark-order-ready/index.ts` do seu projeto (é o código que marca o pedido como pronto e envia a mensagem no LINE).
5. Clique em **Deploy function** (ou **Deploy**).
6. Aguarde terminar (cerca de 10–30 segundos). Pronto.

Os **secrets** (como `CHANNEL_ACCESS_TOKEN`) que você configurou em Edge Functions → Secrets já ficam disponíveis para a função; não precisa configurar de novo no editor.

### Deploy pelo terminal (Windows)

1. Instale o Node.js se ainda não tiver: [nodejs.org](https://nodejs.org).
2. Abra o **Prompt de Comando** ou **PowerShell** e instale o CLI do Supabase:
   ```bash
   npm install -g supabase
   ```
3. Vá na pasta do projeto (ex.: `cd C:\Users\Roger\projetos\pastel-food-truck`).
4. Faça login e ligue ao projeto (só uma vez):
   ```bash
   npx supabase login
   npx supabase link --project-ref ejzaaoyqeeqyuoiozfxn
   ```
5. Publique a função:
   ```bash
   npx supabase functions deploy mark-order-ready
   ```
   Quando aparecer **Deployed** ou **Success**, está pronto.

---

## Conferir

1. Faça um pedido pelo LIFF (pelo LINE no celular).
2. No admin, clique em **Marcar pronto** nesse pedido.
3. O cliente deve receber no LINE: **"Seu pedido A-001 está pronto! Venha buscar."**

Se não receber, confira no admin: se aparecer o alerta dizendo que a notificação não foi enviada, o token pode estar errado ou a função não foi publicada. Use o token do canal **Messaging API** (Roger), não do LINE Login.

---

## Se não receber a notificação (diagnóstico)

**Se você já configurou o token várias vezes e mesmo assim não recebe:** na maioria dos casos o pedido está com **line_user_id vazio** no banco. A função não envia mensagem sem esse ID. Confira o item 2 abaixo e o **Motivo** que aparece no alerta do admin ao clicar em "Marcar pronto".

Siga estes passos para descobrir o que está faltando.

### 1. Apareceu o alerta no admin?

Ao clicar em **Marcar pronto**, se aparecer o alerta *"Notificação LINE não foi enviada..."*:
- A função rodou, mas **não enviou** a mensagem (token ausente/errado ou pedido sem `line_user_id`).
- Se **não** aparecer alerta: a função pode ter entendido que enviou (`line_sent: true`), mas a LINE pode ter recusado ou a conta pode não receber (veja item 4).

### 2. O pedido tem LINE user ID no banco?

Sem `line_user_id` a função **não** envia mensagem.

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → **Table Editor** → tabela **pedidos**.
2. Encontre o pedido de teste (pela data ou número).
3. Veja a coluna **line_user_id**:
   - **Se estiver vazia (null):** o cliente abriu o cardápio fora do LIFF ou a página do carrinho não conseguiu o perfil do LINE. Peça para abrir o link **pelo LINE** (toque no link do LIFF num chat) e fazer o pedido de novo; não abrir o site direto no navegador.
   - **Se tiver um valor (ex.: U1234...):** o ID foi salvo; o problema é token ou conta (itens 3 e 4).

### 3. Token no Supabase

- Em **Project Settings** → **Edge Functions** → **Secrets**, deve existir **CHANNEL_ACCESS_TOKEN** com o token **longo** copiado do LINE Developers.
- O token tem que ser do canal **Messaging API** (Roger), **não** do canal **LINE Login** (Pastel Pedidos).
- Depois de alterar o secret, faça **Deploy** de novo da função **mark-order-ready**.

### 4. Conta LINE que fez o pedido tem que ser “amiga” do bot

Para a LINE entregar a mensagem de “pedido pronto”, a **conta que fez o pedido** precisa ter **adicionado o Official Account (bot)** do canal **Messaging API (Roger)** como amigo no LINE.

- No celular: abra o LINE → Aba **Amigos** → procure pelo nome do bot (Roger ou o nome do canal Messaging API) e adicione se ainda não for amigo.
- Se a conta nunca adicionou esse bot, a API da LINE aceita o envio (pode retornar 200), mas **não entrega** a mensagem. Por isso é essencial que quem testa tenha o bot como amigo.

### 5. Logs da Edge Function

No Supabase: **Edge Functions** → **mark-order-ready** → **Logs**. Ao clicar em **Marcar pronto**, veja se aparece erro (ex.: `LINE push failed: 401` = token inválido; `403` = sem permissão / usuário não é amigo).

### 6. Se o pedido tem line_user_id e mesmo assim não chega

- **Token:** tem que ser do canal **Messaging API** (o do bot), não do LINE Login. Depois de salvar o secret, faça **Deploy** de novo da função **mark-order-ready**.
- **Amizade:** a conta LINE que fez o pedido precisa ter o bot (Official Account) como **amigo**. No LINE do celular, Aba Amigos → adicione o bot se ainda não estiver.
- **Logs:** em Edge Functions → mark-order-ready → **Logs**, confira a resposta da LINE (401 = token errado; 403 = usuário não é amigo do bot ou token de outro canal).
- **Alerta do admin:** ao clicar em "Marcar pronto", leia o **Motivo** no alerta; ele pode trazer a mensagem de erro da API.
