-- Admin autenticado (Supabase Auth) pode ler eventos, pedidos e itens; pode atualizar pedidos (marcar pronto)
-- Crie um usuário em Authentication > Users no Dashboard e use esse email/senha no admin.

-- Eventos: admin autenticado pode ler (para saber evento ativo)
CREATE POLICY "Admin autenticado pode ler eventos"
  ON eventos FOR SELECT
  TO authenticated
  USING (true);

-- Cardápios e itens: admin pode ler (para exibir nomes)
CREATE POLICY "Admin autenticado pode ler cardapios"
  ON cardapios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin autenticado pode ler cardapio_itens"
  ON cardapio_itens FOR SELECT
  TO authenticated
  USING (true);

-- Pedidos: admin pode ler todos e atualizar (marcar pronto)
CREATE POLICY "Admin autenticado pode ler pedidos"
  ON pedidos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin autenticado pode atualizar pedidos"
  ON pedidos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Itens do pedido: admin pode ler
CREATE POLICY "Admin autenticado pode ler pedido_itens"
  ON pedido_itens FOR SELECT
  TO authenticated
  USING (true);
