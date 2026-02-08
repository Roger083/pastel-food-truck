-- Adiciona coluna idioma na tabela pedidos e atualiza a função criar_pedido

-- 1. Adicionar coluna idioma (ja ou pt)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS idioma text DEFAULT 'ja';

-- 2. Atualizar função criar_pedido para aceitar idioma
DROP FUNCTION IF EXISTS criar_pedido(uuid, text, jsonb, timestamptz);

CREATE OR REPLACE FUNCTION criar_pedido(
  p_evento_id uuid,
  p_line_user_id text DEFAULT NULL,
  p_itens jsonb DEFAULT '[]',
  p_agendado_para timestamptz DEFAULT NULL,
  p_idioma text DEFAULT 'ja'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_numero integer;
  v_item jsonb;
BEGIN
  INSERT INTO pedidos (evento_id, line_user_id, status, agendado_para, idioma)
  VALUES (
    p_evento_id,
    NULLIF(TRIM(p_line_user_id), ''),
    'pendente',
    p_agendado_para,
    COALESCE(NULLIF(TRIM(p_idioma), ''), 'ja')
  )
  RETURNING id, numero INTO v_pedido_id, v_numero;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    INSERT INTO pedido_itens (pedido_id, cardapio_item_id, nome, preco, quantidade)
    VALUES (
      v_pedido_id,
      (v_item->>'cardapio_item_id')::uuid,
      v_item->>'nome',
      (v_item->>'preco')::decimal,
      GREATEST(1, (v_item->>'quantidade')::int)
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_pedido_id, 'numero', v_numero);
END;
$$;

GRANT EXECUTE ON FUNCTION criar_pedido(uuid, text, jsonb, timestamptz, text) TO anon;
