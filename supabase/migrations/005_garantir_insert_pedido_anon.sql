-- Objetivo: cliente (anon) pode INSERIR pedidos no LIFF.
-- Rode no SQL Editor do Supabase → projeto ejzaaoyqeeqyuoiozfxn → Run.

DROP POLICY IF EXISTS "Cliente pode inserir pedido" ON pedidos;

CREATE POLICY "Cliente pode inserir pedido"
  ON pedidos FOR INSERT
  TO anon
  WITH CHECK (true);
