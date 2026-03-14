# Pastel Food Truck

Sistema de pedidos para food truck com cliente via LINE LIFF, painel administrativo web e backend em Supabase.

O projeto atual nao e apenas uma landing com carrinho simples. Ele inclui:

- fluxo do cliente em multiplas paginas
- painel admin com login por email/senha
- gerenciamento de templates de menu
- definicao de menu ativo
- categorias, fotos, alergenicos e itens populares
- pedidos imediatos e agendados
- notificacao de pedido pronto no LINE

## Visao geral

### Cliente

O cliente abre o LIFF pelo LINE, navega pelas paginas publicas do cardapio, adiciona itens ao carrinho e envia o pedido.

Fluxo principal atual:

- `index.html`: landing inicial
- `cardapio-completo-verde.html`: lista do cardapio por categorias
- `cardapio-item.html`: detalhe do item
- `cardapio-carrinho.html`: revisao e envio do pedido

Paginas auxiliares:

- `liff-o-que-e-pastel.html`
- `liff-galeria.html`
- `liff-faq.html`
- `liff-alergenicos.html`
- `cardapio-promocoes.html`

### Admin

O admin usa autenticacao do Supabase Auth com email e senha.

Telas principais:

- `admin.html`: pedidos do evento ativo
- `admin-dashboard.html`: lista, criacao, edicao, duplicacao e ativacao de templates
- `admin-menu-ativo.html`: edicao do menu ativo ou de um template especifico

### Backend

O backend esta dividido entre banco/funcoes do Supabase e um endpoint HTTP opcional para notificacao LINE.

- `supabase/migrations/`: schema e evolucao do banco
- `supabase/functions/mark-order-ready/`: Edge Function relacionada ao fluxo de pedido pronto
- `api/notify-line.js`: endpoint para receber webhook e enviar push no LINE

## Como o sistema funciona

1. O frontend carrega a configuracao de `js/config.js`.
2. O cliente consulta no Supabase qual e o evento ativo.
3. O cardapio exibido vem do banco, incluindo categorias, fotos, precos e status de ativo.
4. O pedido e criado pela RPC `criar_pedido`.
5. O admin faz login, visualiza os pedidos do evento ativo e marca o pedido como pronto.
6. Quando um pedido fica pronto, a notificacao do LINE pode ser enviada pelo fluxo configurado no projeto.

## Configuracao minima

Edite `js/config.js` com os valores do seu projeto:

```js
window.FOOD_TRUCK_CONFIG = {
  foodTruckName: 'Pastel Food Truck',
  liffId: 'SEU_LIFF_ID',
  supabaseUrl: 'https://SEU_PROJECT.supabase.co',
  supabaseAnonKey: 'SUA_ANON_KEY'
};
```

Campos usados no frontend:

- `liffId`: ID do app LIFF no LINE Developers
- `supabaseUrl`: URL do projeto Supabase
- `supabaseAnonKey`: chave publica anon/public do Supabase
- `foodTruckName`: nome exibido em partes da interface

Observacao:

- existe documentacao antiga no repositorio mencionando `ADMIN_SECRET`
- o fluxo admin atual em `admin.html` usa login por email e senha do Supabase Auth

## Banco de dados

As migrations estao em `supabase/migrations/`.

Para configurar do zero, aplique as migrations em ordem numerica no seu projeto Supabase. As primeiras sao a base estrutural:

- `001_initial_schema.sql`
- `002_seed_exemplo.sql`
- `003_admin_authenticated_rls.sql`

As demais migrations expandem o sistema com:

- leitura anonima do evento ativo
- RPC de criacao de pedido
- agendamento
- idioma do pedido
- categorias
- templates de menu
- storage para imagens
- exclusao administrativa de pedidos

Se quiser entender os detalhes da modelagem atual, leia tambem:

- `supabase/COMO_RODAR_SQL.md`
- os arquivos numerados dentro de `supabase/migrations/`

## Autenticacao do admin

O painel admin atual depende de Supabase Auth.

Passos:

1. No Supabase, crie um usuario em Authentication > Users.
2. Acesse `admin.html`.
3. Entre com email e senha.

Arquivos principais desse fluxo:

- `js/admin-auth.js`
- `js/admin.js`

## Notificacao no LINE

O repositorio contem dois caminhos possiveis para notificacao quando o pedido fica pronto:

### Opcao 1: Supabase Edge Function

Arquivos:

- `supabase/functions/mark-order-ready/index.ts`
- `supabase/config.toml`

Secret necessario:

- `CHANNEL_ACCESS_TOKEN`

### Opcao 2: webhook HTTP

Arquivo:

- `api/notify-line.js`

Variaveis esperadas nesse fluxo:

- `CHANNEL_ACCESS_TOKEN`
- `WEBHOOK_SECRET`

Importante:

- a documentacao do repositorio tem trechos antigos e trechos novos sobre notificacao
- antes de publicar, escolha um fluxo e padronize a configuracao correspondente

## Estrutura resumida

```text
.
├── api/
├── css/
├── img/
├── js/
├── supabase/
│   ├── functions/
│   └── migrations/
├── index.html
├── cardapio-completo-verde.html
├── cardapio-item.html
├── cardapio-carrinho.html
├── admin.html
├── admin-dashboard.html
└── admin-menu-ativo.html
```

## Arquivos principais

### Frontend cliente

- `js/app.js`: fluxo LIFF mais simples
- `js/cardapio-verde.js`: fluxo com cardapio mais rico e suporte a agendamento
- `js/cardapio-dados.js`: mapa local de imagens, descricoes, ingredientes e textos auxiliares
- `css/style.css`: base visual geral
- `css/cardapio-verde.css`: estilo do cardapio atual

### Frontend admin

- `js/admin-auth.js`: sessao e cliente Supabase do admin
- `js/admin.js`: pedidos do evento ativo
- `js/admin-dashboard.js`: templates de menu
- `js/admin-menu-ativo.js`: menu ativo, itens, categorias, fotos e alergenicos
- `css/admin.css`: estilo do admin

### Supabase

- `supabase/migrations/006_criar_pedido_rpc.sql`: RPC de criacao de pedido
- `supabase/migrations/008_criar_pedido_agendado.sql`: suporte a agendamento
- `supabase/migrations/010_categorias.sql`: categorias
- `supabase/migrations/012_template_system.sql`: templates e menu ativo
- `supabase/migrations/013_storage_bucket.sql`: bucket de imagens

## Deploy

### Frontend

Como o projeto e estatico, voce pode publicar em:

- GitHub Pages
- Vercel
- Netlify
- qualquer hospedagem de arquivos estaticos

Garanta que as paginas HTML, `css/`, `js/` e `img/` estejam disponiveis na mesma origem usada pelo LIFF.

### Supabase

Se for usar as Edge Functions, conecte o projeto com a CLI do Supabase e publique as funcoes necessarias.

Exemplo:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy mark-order-ready
```

Se for usar notificacao por webhook HTTP, publique tambem o endpoint de `api/notify-line.js` no seu provedor.

## Documentacao complementar no repositorio

Ha varios arquivos `.md` na raiz com instrucoes operacionais e historico de configuracao, por exemplo:

- `CONFIGURACAO_PASSO_A_PASSO.md`
- `NOTIFICACAO_LINE.md`
- `NOTIFICACAO_LINE_WEBHOOK.md`
- `STATUS_ATUAL.md`
- `COLOCAR_SITE_NO_AR.md`

Nem todos estao sincronizados com o estado atual do codigo. Use este `README.md` como ponto de partida e consulte os outros arquivos apenas para detalhes especificos.
