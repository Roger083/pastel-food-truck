-- Atualiza criar_pedido para aceitar agendamento (p_agendado_para timestamptz opcional).
DROP FUNCTION IF EXISTS criar_pedido(uuid, text, jsonb);

CREATE OR REPLACE FUNCTION criar_pedido(
  p_evento_id uuid,
  p_line_user_id text DEFAULT NULL,
  p_itens jsonb DEFAULT '[]',
  p_agendado_para timestamptz DEFAULT NULL
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
  INSERT INTO pedidos (evento_id, line_user_id, status, agendado_para)
  VALUES (
    p_evento_id,
    NULLIF(TRIM(p_line_user_id), ''),
    'pendente',
    p_agendado_para
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

GRANT EXECUTE ON FUNCTION criar_pedido(uuid, text, jsonb, timestamptz) TO anon;
