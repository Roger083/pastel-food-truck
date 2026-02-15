-- Admin autenticado pode deletar pedidos e pedido_itens (zerar pedidos do evento)
CREATE POLICY "Admin autenticado pode deletar pedidos"
  ON pedidos FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin autenticado pode deletar pedido_itens"
  ON pedido_itens FOR DELETE
  USING (auth.role() = 'authenticated');
