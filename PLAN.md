# Food Truck – Plano do projeto

## Objetivo
Sistema para food truck real: cliente pede via LIFF no LINE, dono vê pedidos no iPad e marca como pronto; cliente recebe notificação no LINE.

## Stack
- **Front LIFF (cliente):** GitHub Pages (estático) – cardápio, pedido, número
- **Backend + DB:** Supabase (PostgreSQL + Edge Functions)
- **Notificação:** LINE Messaging API
- **Painel dono:** mesma origem, página admin (iPad)

## Modelo de dados
- **eventos** – nome, data, cardapio_id, ativo (só um ativo)
- **cardapios** – nome (ex.: "Só pastel", "Pastel + churrasco")
- **cardapio_itens** – cardapio_id, nome, preco, ordem, ativo
- **pedidos** – numero, evento_id, line_user_id, status, criado_em, pronto_em
- **pedido_itens** – pedido_id, cardapio_item_id, nome, preco, quantidade

## Fases
- **Fase 0:** LINE + Supabase + GitHub Pages (concluída)
- **Fase 1:** Tabelas + LIFF + painel iPad + notificação LINE (em andamento)
- **Fase 2:** CRUD eventos/cardápios pelo dono
- **Fase 3:** Relatório de vendas por evento (impostos)

## Credenciais (não commitar)
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- LINE: `LIFF_ID`, `CHANNEL_ACCESS_TOKEN` (Edge Function)
- Admin: `ADMIN_SECRET` (header para painel iPad)
