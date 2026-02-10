-- Migration 010: Tabela de categorias para o cardápio
-- Permite organizar os itens do cardápio em seções

CREATE TABLE categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_pt text NOT NULL,
  nome_ja text NOT NULL,
  emoji text DEFAULT '',
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

-- Inserir categorias iniciais
INSERT INTO categorias (nome_pt, nome_ja, emoji, ordem) VALUES
  ('Pastéis Salgados', '揚げパステル', '🥟', 1),
  ('Pastel Doce', 'スイーツパステル', '🍫', 2),
  ('Bebidas', '飲み物', '🍺', 3),
  ('Pratos Especiais', 'スペシャルプレート', '🍖', 4);

-- Habilitar RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (clientes podem ver as categorias)
CREATE POLICY "Cliente pode ler categorias"
  ON categorias FOR SELECT TO anon USING (true);
