# Configuracao passo a passo

Este arquivo foi consolidado para o fluxo atual.

Use `README.md` como referencia principal. Este guia resume apenas a ordem de configuracao.

## 1. Configurar o frontend

Edite `js/config.js`:

```js
window.FOOD_TRUCK_CONFIG = {
  foodTruckName: 'Pastel Food Truck',
  liffId: 'SEU_LIFF_ID',
  supabaseUrl: 'https://SEU_PROJECT.supabase.co',
  supabaseAnonKey: 'SUA_ANON_KEY'
};
```

Preencha:

- `liffId`: LINE Developers > LIFF
- `supabaseUrl`: Supabase > Project URL
- `supabaseAnonKey`: Supabase > anon public key

## 2. Configurar o banco

No Supabase SQL Editor, aplique as migrations em ordem numerica dentro de `supabase/migrations/`.

Base minima:

- `001_initial_schema.sql`
- `002_seed_exemplo.sql`
- `003_admin_authenticated_rls.sql`

As migrations seguintes adicionam funcionalidades mais recentes, como:

- RPC de pedido
- agendamento
- idioma
- categorias
- templates
- storage de imagens

## 3. Criar usuario admin

No Supabase:

1. Acesse `Authentication > Users`.
2. Crie um usuario com email e senha.
3. Use esse login em `admin.html`.

O fluxo atual do admin usa Supabase Auth.

## 4. Configurar notificacao LINE

Escolha um dos dois modelos:

- `supabase/functions/mark-order-ready/`
- `api/notify-line.js`

Para ambos, voce precisara do token do canal Messaging API:

- `CHANNEL_ACCESS_TOKEN`

Se usar o webhook HTTP, tambem configure:

- `WEBHOOK_SECRET`

Detalhes:

- `NOTIFICACAO_LINE.md`
- `NOTIFICACAO_LINE_WEBHOOK.md`

## 5. Publicar

1. Publique o frontend.
2. Configure a `Endpoint URL` do LIFF para a URL publica do site.
3. Publique o backend correspondente ao fluxo de notificacao escolhido.

## Observacoes

- Instrucoes antigas sobre `ADMIN_SECRET` e `list-orders` nao representam o fluxo principal atual.
- Evite misturar o fluxo novo de auth do admin com documentos antigos sem revisar o codigo.
