# Publicar o site

Este guia foi consolidado para o fluxo atual do projeto.

Fonte principal:

- leia primeiro `README.md`

## O que publicar

O frontend deste projeto e estatico. Para colocar no ar, publique estes arquivos e pastas na mesma origem:

- `index.html`
- `admin.html`
- `admin-dashboard.html`
- `admin-menu-ativo.html`
- paginas `cardapio-*.html` e `liff-*.html`
- `css/`
- `js/`
- `img/`

## Opcoes de hospedagem

Voce pode usar:

- GitHub Pages
- Vercel
- Netlify
- qualquer servidor de arquivos estaticos

## GitHub Pages

1. Suba o repositorio para o GitHub.
2. Em `Settings > Pages`, escolha `Deploy from a branch`.
3. Selecione a branch principal e a pasta raiz.
4. Aguarde a URL publica ficar disponivel.

URLs esperadas:

- cliente: `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`
- admin: `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/admin.html`

## LIFF

No LINE Developers, configure a `Endpoint URL` do LIFF para a URL publica do site.

Exemplo:

`https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`

## Antes de publicar

Confirme:

- `js/config.js` aponta para o projeto Supabase correto
- o `liffId` e o endpoint do LIFF pertencem ao mesmo ambiente
- as migrations do Supabase ja foram aplicadas
- o admin consegue autenticar com email e senha

## Observacao

Instrucoes antigas desta pasta mencionavam repositorios e caminhos locais especificos. Elas foram removidas para evitar conflito com o estado atual do projeto.
