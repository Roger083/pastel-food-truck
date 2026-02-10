-- Migration 011: Adicionar campos categoria_id e popular em cardapio_itens
-- Permite associar itens a categorias e marcar itens populares

-- Adicionar coluna categoria_id com referência à tabela categorias
ALTER TABLE cardapio_itens ADD COLUMN categoria_id uuid REFERENCES categorias(id);

-- Adicionar coluna popular para destacar itens mais vendidos
ALTER TABLE cardapio_itens ADD COLUMN popular boolean DEFAULT false;

-- Criar índice para melhorar performance das queries por categoria
CREATE INDEX idx_cardapio_itens_categoria ON cardapio_itens(categoria_id);
