## Status atual (para retomar depois)

Data: 2026-02-15

### Objetivo resolvido
Ao editar um item dentro de um **template**, o **preço** não pode “vazar” para outros templates/eventos. Nome/descrição/etc podem ser compartilhados automaticamente.

### Resultado (comportamento esperado agora)
- **Editar nome/descrição/foto/ingredientes/alergênicos/categoria/popular**: altera o catálogo (`menu_items`) e portanto reflete em todos os templates (comportamento desejado).
- **Editar preço em modo template** (`admin-menu-ativo.html?template=...`): altera somente o preço daquele template (salva como `event_template_items.preco_override` via `Salvar` do template). Não muda `menu_items.preco_padrao`.
- **Menu Ativo** (sem `?template=`): mostra no cabeçalho **o nome do template em vigor** quando existir `active_menu.template_origem`.

### Alterações feitas (última rodada)
- **`js/admin-menu-ativo.js`**
  - Corrigido bug: em modo template, o modal de item usa `preco_atual` e o `saveItem()` não atualiza `menu_items.preco_padrao`.
  - Ajustado “Menu Ativo”: busca `template_origem` em `active_menu` e exibe no título da página.
- **`css/admin.css`**
  - Mudado destaque de preço alterado: parou de ficar vermelho; agora mantém cor normal e usa sublinhado pontilhado.

### Tabelas envolvidas (Supabase)
- **`menu_items`**: catálogo master (nome/descrição/foto + `preco_padrao`).
- **`event_template_items`**: itens por template + `preco_override` (preço por template).
- **`active_menu`**: menu em vigor + `preco_atual` e `template_origem`.

### Como testar rápido
- Abra um template A, mude o preço de um item e salve.
- Abra template B: o preço não deve mudar.
- Abra “Menu Ativo”: o cabeçalho deve mostrar `Menu Ativo — <nome do template>` quando o menu foi ativado por template.

### Estado do Git (no momento)
- Branch: `main` (local) **ahead 2** do `origin/main`.
- Mudanças não commitadas:
  - `js/admin-menu-ativo.js`
  - `css/admin.css`
  - `.gitignore` (para ignorar `*:Zone.Identifier` e `implementação.rtf`)
  - `STATUS_ATUAL.md` (este arquivo)
  - remoção registrada de um arquivo antigo `Zone.Identifier` que estava versionado no passado

### Limpeza / observações
- Arquivos tipo `*:Zone.Identifier` (metadado do Windows) devem ser ignorados e não commitados.

