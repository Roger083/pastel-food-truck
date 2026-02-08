# Como dar push das alterações para o GitHub Pages

## ⭐ Copiar e colar (só isso)

1. Abra o terminal **na pasta do repositório no Windows** (ex.: `C:\Users\Roger\projetos\pastel-food-truck` — onde está a pasta `.git`).

2. Cole e rode os **3 comandos**:

```bash
git add .
git commit -m "Atualiza site e migrações"
git push origin main
```

Se der erro na branch, tente: `git push origin master`

3. Pronto. O GitHub Pages atualiza em 1–2 minutos.

---

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

## Publicar só o app.js (mensagem de erro melhor + migração 004)

Use isto quando só alterou o **app.js** (e opcionalmente a migração 004).

### Se o repositório Git está na pasta do Windows

1. **Copie** da pasta do Ubuntu (WSL) para a pasta do repositório no Windows:
   - `js/app.js`
   - (opcional) `supabase/migrations/004_anon_select_pedido_evento_ativo.sql` — só se ainda não rodou no Supabase; o push é para guardar no repo.

2. **Na pasta do repositório no Windows**, abra o terminal (PowerShell ou Git Bash) e rode:

   ```bash
   git add js/app.js supabase/migrations/004_anon_select_pedido_evento_ativo.sql
   git commit -m "app.js: mensagem de erro do pedido; migração 004 RLS anon select pedidos"
   git push origin main
   ```
   (troque `main` por `master` se for o nome da sua branch)

3. Em alguns minutos o GitHub Pages serve o novo `app.js`. O LIFF passará a mostrar a mensagem de erro melhor em caso de falha.

**Lembrete:** a migração 004 você já rodou no SQL Editor do Supabase; o push do arquivo `.sql` é só para manter o repositório em dia.

---

## Resumo

- **Dar push** = enviar os commits para o GitHub.
- O **GitHub Pages** serve os arquivos que estão na branch que você configurou (geralmente `main` ou `master`).
- Depois do `git push`, a nova versão do admin (login email/senha) fica disponível na mesma URL do site.
