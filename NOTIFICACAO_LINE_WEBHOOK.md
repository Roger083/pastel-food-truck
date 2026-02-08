# Notificação LINE via Webhook (alternativa sem Edge Function)

O admin **só atualiza** o pedido para "pronto" no Supabase. Um **webhook** avisa um servidor externo, que envia a mensagem no LINE. Assim não é preciso chamar a Edge Function pelo navegador (evita o 401).

---

## Visão geral

1. **Admin:** ao clicar em "Marcar pronto", só atualiza a linha do pedido no Supabase (já feito).
2. **Supabase:** ao atualizar a tabela `pedidos`, dispara um webhook para uma URL (função na Vercel).
3. **Vercel:** a função recebe o payload, confere o segredo e envia a mensagem no LINE.

---

## 1. Deploy na Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) (grátis).
2. Instale o Vercel CLI (opcional) ou use o site: **Add New** → **Project** → importe o repositório **Roger083/pastel-food-truck** (ou faça upload da pasta do projeto).
3. Na configuração do projeto, em **Root Directory** deixe como está (ou `./`).
4. Em **Environment Variables** adicione:
   - **CHANNEL_ACCESS_TOKEN** = token do canal Messaging API (LINE Developers), o mesmo que você usaria no Supabase.
   - **WEBHOOK_SECRET** = uma senha forte (ex.: `PastelWebhook2026`). Você usará a mesma senha no Supabase.
5. Faça o **Deploy**. Anote a URL da função, algo como:  
   `https://seu-projeto.vercel.app/api/notify-line`

---

## 2. Webhook no Supabase (trigger no banco)

O Supabase precisa chamar essa URL quando um pedido for marcado como pronto. Como o Dashboard nem sempre permite header customizado, use o **SQL Editor**:

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → **SQL Editor**.
2. Crie uma **query** e cole o SQL abaixo.
3. **Substitua** no texto:
   - `SUA_URL_VERCEL` → a URL do passo 1 (ex.: `https://seu-projeto.vercel.app/api/notify-line`)
   - `SEU_WEBHOOK_SECRET` → o **mesmo** valor que você colocou em **WEBHOOK_SECRET** na Vercel.
4. Execute a query (Run).

```sql
-- Envia para o webhook na Vercel quando um pedido é marcado como pronto
create or replace function public.notify_line_on_pronto()
returns trigger
language plpgsql
security definer
as $$
declare
  req_id bigint;
  hook_url text := 'SUA_URL_VERCEL';
  hook_secret text := 'SEU_WEBHOOK_SECRET';
begin
  if new.status is distinct from 'pronto' or old.status = 'pronto' then
    return new;
  end if;
  select net.http_post(
    url := hook_url,
    body := json_build_object(
      'type', 'UPDATE',
      'table', 'pedidos',
      'schema', 'public',
      'record', row_to_json(new),
      'old_record', row_to_json(old)
    )::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', hook_secret
    )
  ) into req_id;
  return new;
end;
$$;

-- Só cria o trigger se não existir
drop trigger if exists pedidos_notify_line on public.pedidos;
create trigger pedidos_notify_line
  after update on public.pedidos
  for each row
  execute function public.notify_line_on_pronto();
```

Se der erro dizendo que **net.http_post** não existe, ative a extensão **pg_net**: em **Database** → **Extensions**, procure por **pg_net** e ative. Depois rode o SQL de novo.

---

## 3. Conferir

1. No admin, marque um pedido como **pronto** (um que tenha **line_user_id** no Supabase).
2. O cliente deve receber no LINE: *"Seu pedido A-XXX está pronto! Venha buscar."*

Se não receber, veja os **logs** da função na Vercel (Dashboard do projeto → **Functions** → **notify-line** → **Logs**) e confira se o **CHANNEL_ACCESS_TOKEN** está correto e se o pedido tem **line_user_id** preenchido.

---

## Resumo

| Onde           | O que fazer |
|----------------|-------------|
| **Admin**      | Só atualiza o pedido no Supabase (já está assim). |
| **Vercel**     | Função `api/notify-line.js` recebe o webhook e envia no LINE. |
| **Supabase**   | Trigger chama a URL da Vercel com o payload e o header `x-webhook-secret`. |

Não é mais necessário usar a Edge Function **mark-order-ready** nem **ADMIN_SECRET** no admin para a notificação.
