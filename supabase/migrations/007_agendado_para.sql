-- Adiciona coluna agendado_para para pedidos agendados (quem escaneia QR em rede social)
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS agendado_para timestamptz;

COMMENT ON COLUMN pedidos.agendado_para IS 'Se preenchido, pedido foi agendado para retirada neste horário.';
