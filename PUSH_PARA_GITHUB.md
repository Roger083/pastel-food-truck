# Como dar push das alterações para o GitHub Pages

## Se o repositório Git está em outra pasta (ex.: Windows)

1. **Copie os arquivos alterados** desta pasta (WSL) para a pasta onde está o repositório Git (ex.: `C:\Users\Roger\projetos\food-truck` ou onde estiver o `pastel-food-truck`):
   - `admin.html`
   - `js/admin.js`
   - `supabase/migrations/003_admin_authenticated_rls.sql`
   - `README.md`
   - `supabase/functions/mark-order-ready/index.ts` (para você fazer deploy da função depois)

2. **Na pasta do repositório**, abra o terminal (PowerShell ou Git Bash) e rode:

   ```bash
   git status
   ```
   (para ver os arquivos modificados)

   ```bash
   git add admin.html js/admin.js supabase/migrations/003_admin_authenticated_rls.sql README.md supabase/functions/mark-order-ready/index.ts
   git commit -m "Admin com login email/senha (Supabase Auth); RLS para admin; mark-order-ready com JWT"
   git push origin main
   ```
   (use `master` em vez de `main` se for o nome da sua branch)

3. O GitHub Pages atualiza em alguns minutos. Acesse de novo a URL do admin (ex.: `https://roger083.github.io/pastel-food-truck/admin.html`).

---

## Se quiser usar ESTA pasta (WSL) como repositório

1. Inicialize o Git e conecte ao repositório remoto:

   ```bash
   cd /home/roger/projetos/food-truck
   git init
   git remote add origin https://github.com/Roger083/pastel-food-truck.git
   git fetch origin
   git checkout -b main origin/main
   ```
   (ou `origin/master` se a branch default for `master`)

2. Adicione os arquivos, faça commit e push:

   ```bash
   git add admin.html js/admin.js supabase/migrations/003_admin_authenticated_rls.sql README.md supabase/functions/mark-order-ready/index.ts
   git commit -m "Admin com login email/senha (Supabase Auth); RLS para admin; mark-order-ready com JWT"
   git push -u origin main
   ```

---

## Resumo

- **Dar push** = enviar os commits para o GitHub.
- O **GitHub Pages** serve os arquivos que estão na branch que você configurou (geralmente `main` ou `master`).
- Depois do `git push`, a nova versão do admin (login email/senha) fica disponível na mesma URL do site.
