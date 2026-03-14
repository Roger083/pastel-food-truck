# Edge Functions e webhook

Este arquivo foi reduzido para evitar conflito com a documentacao atual.

## Estado atual

O projeto pode operar de duas formas para notificar o cliente quando o pedido fica pronto:

1. Edge Function do Supabase: `supabase/functions/mark-order-ready/`
2. Webhook HTTP: `api/notify-line.js`

O painel admin atual nao depende de `list-orders` nem de `ADMIN_SECRET` para login. Ele usa Supabase Auth com email e senha.

## Quando usar Edge Function

Use a Edge Function se voce quer manter o fluxo de notificacao dentro do Supabase.

Comandos base:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy mark-order-ready
supabase secrets set CHANNEL_ACCESS_TOKEN=seu_token
```

## Quando usar webhook HTTP

Use o webhook se voce prefere disparar a notificacao por um endpoint externo, por exemplo na Vercel.

Nesse caso:

- publique `api/notify-line.js`
- configure `CHANNEL_ACCESS_TOKEN`
- configure `WEBHOOK_SECRET`
- crie o gatilho no banco conforme `NOTIFICACAO_LINE_WEBHOOK.md`

## Recomendacao

Padronize apenas um fluxo por ambiente. Manter os dois ativos sem convencao clara aumenta risco de operacao duplicada ou documentacao divergente.
