# Notificacao LINE

Este guia descreve o estado atual da notificacao de pedido pronto.

## Nome exibido no LINE

Existem dois nomes diferentes no ecossistema LINE:

- nome do app LIFF: configurado no canal LINE Login
- nome do bot que envia push: configurado no canal Messaging API

O dominio exibido no navegador in-app depende da URL real publicada e nao pode ser escondido por codigo.

## Token necessario

Para enviar a notificacao, o projeto precisa do token do canal Messaging API:

- `CHANNEL_ACCESS_TOKEN`

Esse token nao deve ficar no frontend.

## Fluxos suportados

### Edge Function do Supabase

Arquivos:

- `supabase/functions/mark-order-ready/index.ts`
- `supabase/config.toml`

Deploy basico:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy mark-order-ready
supabase secrets set CHANNEL_ACCESS_TOKEN=seu_token
```

### Webhook HTTP

Arquivo:

- `api/notify-line.js`

Quando usar esse fluxo, consulte:

- `NOTIFICACAO_LINE_WEBHOOK.md`

## Admin e autenticacao

O fluxo principal atual do admin usa:

- Supabase Auth
- login com email e senha

Documentos antigos deste repositorio mencionam `ADMIN_SECRET`. Isso nao deve ser tratado como fonte principal sem revisar o codigo em uso.

## Validacao manual

Para testar:

1. abra o LIFF e crie um pedido
2. confirme que o pedido possui `line_user_id`
3. marque o pedido como pronto no admin
4. valide a chegada da mensagem no LINE

Se a mensagem nao chegar, investigue:

- token incorreto
- `line_user_id` ausente
- fluxo de notificacao publicado errado
- webhook ou Edge Function nao implantado
