---
name: foodtruck-frontend-fix
description: Corrigir bugs e implementar ajustes pequenos no frontend do cliente deste projeto. Use quando a tarefa envolver LIFF, landing, cardapio, carrinho, popups, animacoes, i18n ou navegacao entre paginas publicas em `index.html`, `cardapio-*.html`, `liff-*.html`, `js/app.js`, `js/cardapio-*.js`, `css/style.css` ou `css/cardapio-verde.css`.
---

# Foodtruck Frontend Fix

## Workflow

1. Ler apenas a pagina e os assets diretamente envolvidos.
2. Confirmar onde o fluxo quebra: carregamento da pagina, clique, persistencia em `localStorage`, chamada ao Supabase ou apenas UI.
3. Preferir mudanca pequena e localizada.
4. Manter compatibilidade com o estado atual do projeto antes de tentar refatorar.
5. Testar por leitura de fluxo e por consistencia entre HTML, CSS e JS.

## Regras do projeto

- O frontend e majoritariamente estatico; assuma HTML com scripts inline e arquivos em `js/`.
- O carrinho usa `localStorage`; nao dependa de backend para abrir a pagina se isso puder ser evitado.
- A tela de sucesso deve abrir como overlay/popup, nao como pagina separada, quando esse for o comportamento esperado.
- Respeitar i18n basico `pt` e `ja` quando tocar em textos.
- Nao espalhar configuracao; usar `js/config.js` apenas para LIFF/Supabase.

## Checklist rapido

- IDs de elementos batem entre HTML e JS.
- A pagina nao exige Supabase/LIFF antes da hora.
- `hidden`, classes e animacoes nao conflitam.
- Links entre `cardapio-completo-verde.html`, `cardapio-item.html` e `cardapio-carrinho.html` continuam corretos.
- Chaves de `localStorage` permanecem consistentes: `foodtruck_cart`, `foodtruck_evento_id`, `idioma`.

## Quando envolver pedido

- Conferir se o frontend manda os parametros aceitos pela RPC atual.
- Se houver chance de ambiente com migration antiga, preferir fallback no frontend a quebrar o fluxo inteiro.
- Separar erro de carregamento do carrinho de erro de finalizacao do pedido.

## Saida esperada

Responder com:

- causa provavel
- mudanca aplicada
- limitacao restante, se houver
