## Skills
Local skills for this repository live in `.codex/skills/`.

### Available skills
- foodtruck-frontend-fix: Corrige bugs e implementa ajustes pequenos no frontend do cliente, especialmente LIFF, cardapio, carrinho, popups e i18n. Use quando a tarefa envolver `index.html`, `cardapio-*.html`, `liff-*.html`, `js/app.js`, `js/cardapio-*.js`, `css/style.css` ou `css/cardapio-verde.css`. (file: /home/roger/projetos/pastel-food-truck/.codex/skills/foodtruck-frontend-fix/SKILL.md)
- foodtruck-supabase-change: Ajusta schema, migrations, RPCs, RLS, storage e funcoes do Supabase deste projeto. Use quando a tarefa envolver `supabase/migrations/`, `supabase/functions/`, autenticacao admin, notificacao LINE ou inconsistencias entre frontend e banco. (file: /home/roger/projetos/pastel-food-truck/.codex/skills/foodtruck-supabase-change/SKILL.md)
- foodtruck-doc-sync: Mantem `README.md` e os outros `.md` da raiz coerentes com o estado real do repositorio. Use quando a tarefa envolver atualizar, consolidar ou simplificar documentacao local. (file: /home/roger/projetos/pastel-food-truck/.codex/skills/foodtruck-doc-sync/SKILL.md)
- foodtruck-deploy-ops: Executa checks operacionais, prepara push e orienta deploy de frontend, Supabase e notificacao LINE. Use quando a tarefa envolver publicar, validar ambiente, secrets, git push ou escolher entre Edge Function e webhook HTTP. (file: /home/roger/projetos/pastel-food-truck/.codex/skills/foodtruck-deploy-ops/SKILL.md)

### How to use skills
- Discovery: as skills acima sao as skills locais suportadas neste repositorio.
- Trigger rules: se o pedido do usuario combinar claramente com uma das descricoes acima, abra o `SKILL.md` correspondente e siga o fluxo.
- Coordination: use o menor conjunto de skills necessario. Para tarefas que mexem em frontend e banco, use primeiro `foodtruck-supabase-change` para confirmar o contrato e depois `foodtruck-frontend-fix`.
- Context hygiene: nao carregue arquivos aleatorios; abra apenas os arquivos citados no pedido e os apontados pela skill.
