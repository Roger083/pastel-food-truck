-- Seed opcional: um cardápio e um evento ativo para testar
-- Rodar depois de 001_initial_schema.sql

INSERT INTO cardapios (id, nome) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pastel apenas');

INSERT INTO cardapio_itens (cardapio_id, nome, preco, ordem) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pastel de carne', 6.00, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pastel de queijo', 5.00, 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pastel misto', 7.00, 3),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Suco', 3.00, 4);

INSERT INTO eventos (nome, data, cardapio_id, ativo) VALUES
  ('Evento teste', CURRENT_DATE, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true);

-- Se você usar outro cardapio_id no seed, ajuste o UUID acima ou use:
-- INSERT INTO cardapios (nome) VALUES ('Pastel apenas') RETURNING id;
-- e use esse id em cardapio_itens e eventos.
