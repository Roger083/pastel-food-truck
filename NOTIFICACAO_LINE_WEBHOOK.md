# Notificacao LINE via webhook HTTP

Use este documento apenas se voce escolher o fluxo de webhook externo em vez da Edge Function do Supabase.

## Arquivo envolvido

- `api/notify-line.js`

## Variaveis necessarias

- `CHANNEL_ACCESS_TOKEN`
- `WEBHOOK_SECRET`

## Fluxo

1. o admin atualiza o pedido para `pronto`
2. o banco dispara um webhook
3. o endpoint HTTP recebe o payload
4. o endpoint envia a mensagem no LINE

## Publicacao

Publique `api/notify-line.js` em um ambiente que suporte funcoes HTTP, como:

- Vercel
- outro provedor serverless compativel

Anote a URL final do endpoint, por exemplo:

`https://SEU_PROJETO.vercel.app/api/notify-line`

## Trigger no Supabase

Depois de publicar o endpoint, crie um trigger no banco para chamar essa URL quando `pedidos.status` mudar para `pronto`.

O SQL do trigger deve:

- enviar o payload do pedido atualizado
- incluir o header `x-webhook-secret`
- impedir chamadas repetidas quando o status ja estava `pronto`

## Verificacoes

Confirme:

- o endpoint responde `POST`
- o `WEBHOOK_SECRET` e igual nos dois lados
- o token do LINE pertence ao canal Messaging API correto
- o pedido possui `line_user_id`

## Observacao

Este fluxo substitui a necessidade da Edge Function de notificacao naquele ambiente. Evite manter os dois ativos sem uma convencao clara.
