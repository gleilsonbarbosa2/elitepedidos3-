/*
  # Atualizar schema da tabela delivery_products

  1. Alterações na Tabela
    - Adicionar campos para complementos e programação
    - Atualizar campos existentes
    - Adicionar índices para performance

  2. Novos Campos
    - `has_complements` (boolean) - Se o produto possui complementos
    - `complement_groups` (jsonb) - Grupos de complementos em JSON
    - `sizes` (jsonb) - Tamanhos disponíveis em JSON
    - `scheduled_days` (jsonb) - Programação de dias em JSON
    - `availability_type` (text) - Tipo de disponibilidade

  3. Índices
    - Índice para categoria
    - Índice para produtos ativos
    - Índice para produtos com promoção
    - Índice para produtos pesáveis
*/

-- Adicionar novos campos à tabela delivery_products
DO $$
BEGIN
  -- Adicionar campo has_complements se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_products' AND column_name = 'has_complements'
  ) THEN
    ALTER TABLE delivery_products ADD COLUMN has_complements boolean DEFAULT false;
  END IF;

  -- Adicionar campo complement_groups se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_products' AND column_name = 'complement_groups'
  ) THEN
    ALTER TABLE delivery_products ADD COLUMN complement_groups jsonb;
  END IF;

  -- Adicionar campo sizes se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_products' AND column_name = 'sizes'
  ) THEN
    ALTER TABLE delivery_products ADD COLUMN sizes jsonb;
  END IF;

  -- Adicionar campo scheduled_days se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_products' AND column_name = 'scheduled_days'
  ) THEN
    ALTER TABLE delivery_products ADD COLUMN scheduled_days jsonb;
  END IF;

  -- Adicionar campo availability_type se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_products' AND column_name = 'availability_type'
  ) THEN
    ALTER TABLE delivery_products ADD COLUMN availability_type text DEFAULT 'always';
  END IF;

  -- Atualizar campo category para usar enum se necessário
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_products' AND column_name = 'category' AND data_type = 'USER-DEFINED'
  ) THEN
    -- Criar enum se não existir
    DO $enum$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
        CREATE TYPE product_category AS ENUM ('acai', 'combo', 'milkshake', 'vitamina', 'sorvetes', 'bebidas', 'complementos', 'sobremesas', 'outros');
      END IF;
    END $enum$;
    
    -- Alterar coluna para usar enum
    ALTER TABLE delivery_products ALTER COLUMN category TYPE product_category USING category::product_category;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_delivery_products_category ON delivery_products(category);
CREATE INDEX IF NOT EXISTS idx_delivery_products_active ON delivery_products(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_products_weighable ON delivery_products(is_weighable);
CREATE INDEX IF NOT EXISTS idx_delivery_products_promotion ON delivery_products(original_price) WHERE original_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_products_complements ON delivery_products(has_complements) WHERE has_complements = true;
CREATE INDEX IF NOT EXISTS idx_delivery_products_scheduled ON delivery_products USING GIN(scheduled_days) WHERE scheduled_days IS NOT NULL;

-- Atualizar produtos existentes com dados padrão se necessário
UPDATE delivery_products 
SET 
  has_complements = false,
  availability_type = 'always'
WHERE 
  has_complements IS NULL 
  OR availability_type IS NULL;

-- Comentários nas colunas
COMMENT ON COLUMN delivery_products.has_complements IS 'Indica se o produto possui grupos de complementos';
COMMENT ON COLUMN delivery_products.complement_groups IS 'Grupos de complementos em formato JSON';
COMMENT ON COLUMN delivery_products.sizes IS 'Tamanhos disponíveis em formato JSON';
COMMENT ON COLUMN delivery_products.scheduled_days IS 'Programação de dias de disponibilidade em formato JSON';
COMMENT ON COLUMN delivery_products.availability_type IS 'Tipo de disponibilidade: always, scheduled, specific_days';