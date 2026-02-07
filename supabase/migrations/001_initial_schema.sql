-- Food Truck - Schema inicial
-- Rodar no SQL Editor do Supabase (ou via CLI: supabase db push)

-- Tabela: cardapios (configurações de cardápio reutilizáveis)
CREATE TABLE cardapios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  criado_em timestamptz DEFAULT now()
);

-- Tabela: cardapio_itens (itens com preço por cardápio)
CREATE TABLE cardapio_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cardapio_id uuid NOT NULL REFERENCES cardapios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  preco decimal(10,2) NOT NULL CHECK (preco >= 0),
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

CREATE INDEX idx_cardapio_itens_cardapio ON cardapio_itens(cardapio_id);

-- Tabela: eventos (cada evento usa um cardápio; só um ativo por vez)
CREATE TABLE eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data date,
  cardapio_id uuid NOT NULL REFERENCES cardapios(id),
  ativo boolean DEFAULT false,
  criado_em timestamptz DEFAULT now()
);

CREATE INDEX idx_eventos_ativo ON eventos(ativo) WHERE ativo = true;

-- Tabela: pedidos (numero preenchido por trigger no INSERT)
CREATE TABLE pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer,
  evento_id uuid NOT NULL REFERENCES eventos(id),
  line_user_id text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_preparo', 'pronto')),
  criado_em timestamptz DEFAULT now(),
  pronto_em timestamptz,
  UNIQUE(evento_id, numero)
);

-- Trigger: gera numero automaticamente por evento
CREATE OR REPLACE FUNCTION set_pedido_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero FROM pedidos WHERE evento_id = NEW.evento_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_pedido_numero
  BEFORE INSERT ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_pedido_numero();

CREATE INDEX idx_pedidos_evento ON pedidos(evento_id);
CREATE INDEX idx_pedidos_evento_criado ON pedidos(evento_id, criado_em DESC);

-- Tabela: itens do pedido (cópia nome/preço no momento do pedido)
CREATE TABLE pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  cardapio_item_id uuid REFERENCES cardapio_itens(id),
  nome text NOT NULL,
  preco decimal(10,2) NOT NULL,
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade > 0)
);

CREATE INDEX idx_pedido_itens_pedido ON pedido_itens(pedido_id);

-- Função: próximo número de pedido por evento
CREATE OR REPLACE FUNCTION proximo_numero_pedido(p_evento_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(MAX(numero), 0) + 1 FROM pedidos WHERE evento_id = p_evento_id;
$$;

-- RLS: habilitar em todas as tabelas
ALTER TABLE cardapios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardapio_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;

-- Políticas para cliente (anon): só ler evento ativo + cardápio + itens
CREATE POLICY "Cliente pode ler evento ativo"
  ON eventos FOR SELECT
  TO anon
  USING (ativo = true);

CREATE POLICY "Cliente pode ler cardápio do evento ativo"
  ON cardapios FOR SELECT
  TO anon
  USING (
    id IN (SELECT cardapio_id FROM eventos WHERE ativo = true)
  );

CREATE POLICY "Cliente pode ler itens do cardápio ativo"
  ON cardapio_itens FOR SELECT
  TO anon
  USING (
    cardapio_id IN (SELECT cardapio_id FROM eventos WHERE ativo = true)
    AND ativo = true
  );

-- Cliente pode apenas inserir pedidos e pedido_itens (não ler/atualizar outros)
CREATE POLICY "Cliente pode inserir pedido"
  ON pedidos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Cliente pode inserir itens do pedido"
  ON pedido_itens FOR INSERT
  TO anon
  WITH CHECK (
    pedido_id IN (SELECT id FROM pedidos WHERE evento_id IN (SELECT id FROM eventos WHERE ativo = true))
  );

-- Serviço (service_role) faz tudo nas Edge Functions; anon não pode SELECT/UPDATE pedidos
-- (lista e "marcar pronto" serão via Edge Function com token admin)

COMMENT ON TABLE eventos IS 'Um evento ativo por vez; LIFF usa o cardápio desse evento';
COMMENT ON TABLE pedidos IS 'numero é único por evento; line_user_id para notificação LINE';
