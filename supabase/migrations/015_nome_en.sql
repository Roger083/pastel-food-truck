-- Adiciona campos em inglês na tabela menu_items
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS nome_en TEXT,
  ADD COLUMN IF NOT EXISTS desc_en TEXT,
  ADD COLUMN IF NOT EXISTS ingredientes_en TEXT[];
