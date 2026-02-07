# Como rodar o SQL no Supabase

No Supabase, use o **SQL Editor** (menu lateral).

1. **Não** digite o nome do arquivo (`001_initial_schema.sql`). Isso gera erro.
2. **Abra** o arquivo `migrations/001_initial_schema.sql` no seu editor (Cursor/VS Code).
3. **Selecione todo o conteúdo** (Ctrl+A) e **copie** (Ctrl+C).
4. No Supabase → SQL Editor, **cole** o conteúdo e clique em **Run**.

Ou use o conteúdo do arquivo `migrations/RUN_001_full.sql` (uma cópia só do SQL, para colar direto).

Depois, repita o processo com `002_seed_exemplo.sql` (ou `RUN_002_seed.sql`) se quiser dados de exemplo.
