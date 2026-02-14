-- ============================================================
-- Migration 012: Sistema de Templates de Menu
-- ============================================================

-- 1. Tabela menu_items (catálogo master de items)
CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  nome_ja text,
  desc_pt text,
  desc_ja text,
  ingredientes_pt text[] DEFAULT '{}',
  ingredientes_ja text[] DEFAULT '{}',
  preco_padrao integer NOT NULL CHECK (preco_padrao > 0),
  foto_url text,
  categoria_id uuid REFERENCES categorias(id),
  alergenicos text[] DEFAULT '{}',
  alergenicos_texto_pt text[] DEFAULT '{}',
  alergenicos_texto_ja text[] DEFAULT '{}',
  ordem integer DEFAULT 0,
  popular boolean DEFAULT false,
  ativo_no_catalogo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

-- 2. Tabela event_templates
CREATE TABLE event_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  usado_count integer DEFAULT 0,
  ultima_uso timestamptz,
  criado_em timestamptz DEFAULT now()
);

-- 3. Tabela event_template_items
CREATE TABLE event_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  preco_override integer,
  ativo boolean DEFAULT true,
  ordem integer DEFAULT 0,
  UNIQUE(template_id, item_id)
);

-- 4. Tabela active_menu
CREATE TABLE active_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE UNIQUE,
  preco_atual integer NOT NULL,
  ativo boolean DEFAULT true,
  template_origem text,
  data_ativacao timestamptz DEFAULT now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_menu ENABLE ROW LEVEL SECURITY;

-- menu_items: anon pode ler, authenticated pode tudo
CREATE POLICY "anon_select_menu_items" ON menu_items
  FOR SELECT TO anon USING (true);

CREATE POLICY "auth_all_menu_items" ON menu_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- event_templates: apenas authenticated
CREATE POLICY "auth_all_event_templates" ON event_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- event_template_items: apenas authenticated
CREATE POLICY "auth_all_event_template_items" ON event_template_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- active_menu: anon pode ler items ativos, authenticated pode tudo
CREATE POLICY "anon_select_active_menu" ON active_menu
  FOR SELECT TO anon USING (ativo = true);

CREATE POLICY "auth_all_active_menu" ON active_menu
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Migração de dados: cardapio_itens → menu_items
-- ============================================================

INSERT INTO menu_items (nome, preco_padrao, categoria_id, ordem, popular, ativo_no_catalogo)
SELECT
  ci.nome,
  GREATEST(ROUND(ci.preco)::integer, 1),
  ci.categoria_id,
  ci.ordem,
  COALESCE(ci.popular, false),
  ci.ativo
FROM cardapio_itens ci
WHERE ci.cardapio_id = (
  SELECT e.cardapio_id FROM eventos e WHERE e.ativo = true LIMIT 1
);

-- Criar template a partir do cardápio ativo atual
INSERT INTO event_templates (nome, descricao, usado_count, ultima_uso)
VALUES ('Cardápio Original', 'Template criado automaticamente a partir do cardápio ativo', 1, now());

-- Popular event_template_items com os items migrados
INSERT INTO event_template_items (template_id, item_id, preco_override, ativo, ordem)
SELECT
  (SELECT id FROM event_templates WHERE nome = 'Cardápio Original'),
  mi.id,
  NULL,
  mi.ativo_no_catalogo,
  mi.ordem
FROM menu_items mi;

-- Popular active_menu com items ativos
INSERT INTO active_menu (item_id, preco_atual, ativo, template_origem)
SELECT
  mi.id,
  mi.preco_padrao,
  true,
  'Cardápio Original'
FROM menu_items mi
WHERE mi.ativo_no_catalogo = true;
