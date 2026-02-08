-- Corrige 403 "new row violates row-level security" no INSERT de pedidos.
-- Remove a política antiga (se existir) e recria com WITH CHECK (true) para anon.

DROP POLICY IF EXISTS "Cliente pode inserir pedido" ON pedidos;

CREATE POLICY "Cliente pode inserir pedido"
  ON pedidos FOR INSERT
  TO anon
  WITH CHECK (true);
