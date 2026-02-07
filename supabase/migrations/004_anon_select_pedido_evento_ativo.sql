-- Cliente (anon) precisa ler o pedido após inserir para obter id e numero (insert...select).
-- Permite SELECT em pedidos apenas do evento ativo (necessário para devolver o número ao cliente).
CREATE POLICY "Cliente pode ler pedidos do evento ativo"
  ON pedidos FOR SELECT
  TO anon
  USING (
    evento_id IN (SELECT id FROM eventos WHERE ativo = true)
  );
