# Nova conta LINE e canal do zero

**Importante (2025):** A LINE mudou a regra: **não dá mais para adicionar LIFF em canal do tipo Messaging API.** É preciso criar um canal do tipo **LINE Login** e adicionar o LIFF nele. O projeto continua igual; só muda onde o LIFF é criado.

Siga na ordem. No final você terá o LIFF no LINE Login e o projeto reconectado.

---

## Parte 1: Criar uma nova conta LINE

1. **No celular:** instale o app **LINE** (se ainda não tiver) pela loja de aplicativos.
2. Abra o LINE e toque em **Criar nova conta** (ou "Register" / "新規登録").
3. Escolha **Registrar com e-mail** (não use número de celular se quiser manter separado; pode usar um e-mail que você controle, ex.: Gmail).
4. Digite o **e-mail** e toque em **Avançar**.
5. O LINE envia um **código de verificação** para esse e-mail. Abra o e-mail, copie o código (geralmente 6 dígitos) e digite no app.
6. Crie uma **senha** (e anote em lugar seguro).
7. Defina um **nome** e uma **foto** (opcional). Conclua o cadastro.

Pronto: você tem uma nova conta LINE. Pode usar no celular ou deixar só para administrar o canal.

---

## Parte 2: Criar um canal LINE Login (para o LIFF)

A mensagem que aparece é: *"You can no longer add LIFF apps to a Messaging API channel. Use a LINE Login channel instead."*  
Ou seja: o LIFF precisa estar em um canal do tipo **LINE Login**, não em Messaging API.

1. Acesse **https://developers.line.biz** e entre com sua conta LINE.
2. No **Provider** "Food Truck" (ou o que você usa), clique em **Create a new channel** (ou **Add channel**).
3. Escolha **LINE Login** (não Messaging API).
4. Preencha:
   - **Channel name:** ex. "Pastel Pedidos" ou "Food Truck LIFF".
   - **Channel description**, **App types** (Web app), **Privacy policy URL**, **Terms of use URL** conforme pedido (pode usar a URL do site, ex. `https://roger083.github.io/pastel-food-truck/`).
5. Conclua a criação. Você será levado à página do **LINE Login** channel.
6. **Anote o Channel ID** e o **Channel secret** (Basic settings) se precisar depois.

---

## Parte 3: Adicionar o LIFF ao canal LINE Login

1. No **canal LINE Login** que você acabou de criar, no menu lateral clique em **LIFF**.
2. Clique em **Add** (adicionar LIFF) — aqui deve aparecer o botão, pois o canal é LINE Login.
3. Preencha:
   - **LIFF app name:** ex. "Pastel Pedidos".
   - **Size:** **Full** (tela cheia).
   - **Endpoint URL:** `https://roger083.github.io/pastel-food-truck/` (URL do seu site no GitHub Pages).
   - **Scope:** marque **profile** (para obter o userId e enviar notificação "pedido pronto").
4. Clique em **Add** (ou **Create**).
5. **Copie o LIFF ID**. Você vai colocar no `config.js`.

---

## Parte 2b: Messaging API (só para notificação "pedido pronto")

Para enviar a mensagem "Pedido #X está pronto" no LINE, o sistema usa a **Messaging API**. Você pode manter o canal **Messaging API** "Food Truck" que já existe (o que está em `developers.line.biz/console/channel/2009073797`):

1. No canal **Messaging API** (Food Truck), aba **Messaging API**.
2. Em **Channel access token**, clique em **Issue** ou **Reissue** e **copie o token**.
3. Esse token você coloca no Supabase: `npx supabase secrets set CHANNEL_ACCESS_TOKEN=seu_token`.

Assim: o **LIFF** fica no canal **LINE Login** (novo); a **notificação push** continua usando o canal **Messaging API** (o que você já tem). Os clientes abrem o LIFF (LINE Login) e, ao marcar "pronto", o backend envia a mensagem pelo Messaging API. Para o cliente receber a push, ele precisa ter adicionado o Official Account (bot) do canal Messaging API como amigo — você pode colocar um QR no truck para "Adicionar como amigo" ou avisar na própria LIFF.

---

## Parte 4: Atualizar o projeto

### 4.1 config.js

Abra **js/config.js** e troque:

- **liffId:** pelo **novo LIFF ID** (o que você copiou na Parte 3).
- **supabaseUrl** e **supabaseAnonKey** continuam iguais (não mude).

Exemplo:
```js
liffId: 'NOVO_LIFF_ID_AQUI',
supabaseUrl: 'https://ejzaaoyqeeqyuoiozfxn.supabase.co',
supabaseAnonKey: 'sb_publishable_r18ogAShfeiOmhF4SOHupg_Hyw-tHGR'
```

### 4.2 Token do Messaging API no Supabase

A notificação "pedido pronto" usa o canal **Messaging API** (o "Food Truck" que você já tem). No canal Messaging API, aba **Messaging API** → **Channel access token** → **Issue**/ **Reissue** → copie o token. No PowerShell:

```powershell
npx supabase secrets set CHANNEL_ACCESS_TOKEN=COLE_O_TOKEN_AQUI
```

Assim a notificação "pedido pronto" continua funcionando. (O cliente precisa ter adicionado o Official Account desse canal como amigo no LINE para receber a mensagem.)

### 4.3 Publicar o site (se ainda não tiver)

Se o site ainda não estiver no GitHub Pages, siga o **COLOCAR_SITE_NO_AR.md** (push para o repositório pastel-food-truck e ativar Pages). A **Endpoint URL** do LIFF já pode ser `https://roger083.github.io/pastel-food-truck/`.

---

## Resumo

| O quê | Onde |
|-------|------|
| Canal **LINE Login** | developers.line.biz → Provider "Food Truck" → Create channel → **LINE Login** |
| LIFF | No canal **LINE Login** → aba **LIFF** → Add → Endpoint URL + copiar **LIFF ID** |
| config.js | Trocar **liffId** pelo LIFF ID do canal LINE Login |
| Token (push) | Canal **Messaging API** "Food Truck" → Messaging API → Issue → copiar token |
| Supabase | `npx supabase secrets set CHANNEL_ACCESS_TOKEN=token` |

O QR code abre o LIFF (canal LINE Login). A notificação "pedido pronto" usa o Messaging API. O cliente precisa ter o Official Account do canal Messaging API como amigo no LINE para receber a mensagem.
