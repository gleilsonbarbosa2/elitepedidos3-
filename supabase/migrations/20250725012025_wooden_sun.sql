/*
  # Criar tabela de produtos de delivery para administração

  1. Nova Tabela
    - `delivery_products` - Produtos gerenciados pelo painel administrativo
      - `id` (uuid, primary key)
      - `name` (text, nome do produto)
      - `category` (text, categoria do produto)
      - `price` (numeric, preço do produto)
      - `original_price` (numeric, preço original para promoções)
      - `description` (text, descrição do produto)
      - `image_url` (text, URL da imagem)
      - `is_active` (boolean, se está ativo)
      - `is_weighable` (boolean, se é vendido por peso)
      - `price_per_gram` (numeric, preço por grama para produtos pesáveis)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `delivery_products`
    - Políticas para leitura pública e escrita autenticada
*/

CREATE TABLE IF NOT EXISTS delivery_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  description text NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_weighable boolean NOT NULL DEFAULT false,
  price_per_gram numeric(10,4),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow public read access to delivery_products"
  ON delivery_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to delivery_products"
  ON delivery_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to delivery_products"
  ON delivery_products
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete to delivery_products"
  ON delivery_products
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_delivery_products_updated_at
    BEFORE UPDATE ON delivery_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir produtos iniciais baseados no código atual
INSERT INTO delivery_products (name, category, price, original_price, description, image_url, is_active, is_weighable, price_per_gram) VALUES
('AÇAÍ DE 13,99 (300G)', 'acai', 13.99, 16.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('AÇAÍ DE 15,99 (350G)', 'acai', 15.99, 17.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('AÇAÍ DE 18,99 (400G)', 'acai', 18.99, 20.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('AÇAÍ DE 22,99 (500G)', 'acai', 22.99, 24.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('AÇAÍ DE 26,99 (600G)', 'acai', 26.99, 28.99, 'AÇAÍ + 2 CREME + 3 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('AÇAÍ DE 31,99 (700G)', 'acai', 31.99, 34.99, 'AÇAÍ + 2 CREME + 5 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('AÇAÍ DE 34,99 (800G)', 'acai', 34.99, 36.99, 'AÇAÍ + 2 CREME + 5 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('AÇAÍ DE 38,99 (900G)', 'acai', 38.99, 41.99, 'AÇAÍ + 2 CREME + 5 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('COMBO CASAL (1 KG) DE AÇAÍ + MILK-SHAKE (300G)', 'combo', 49.99, 54.99, 'Combo perfeito para casal: 1kg de açaí + milkshake 300g', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('COMBO 1 (400G) - Pesados Separados', 'combo', 23.99, 26.99, '300G DE AÇAÍ + 100G DE CREME + 4 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('COMBO 2 (500G) - Pesados Separados', 'combo', 26.99, 29.99, '300G DE AÇAÍ + 200G DE CREME + 4 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('COMBO 3 (600G) - Pesados Separados', 'combo', 31.99, 34.99, '400G AÇAÍ + 200G DE CREMES + 5 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('COMBO 4 (900G) - Pesados Separados', 'combo', 42.99, 44.99, '600G DE AÇAÍ + 300G DE CREME + 5 MIX', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('MILKSHAKE DE 400ML', 'milkshake', 11.99, 13.99, 'Milkshake cremoso de 400ml', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('MILKSHAKE DE 500ML', 'milkshake', 12.99, 14.99, 'Milkshake cremoso de 500ml', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('VITAMINA DE AÇAÍ - 400ml', 'vitamina', 12.00, 14.00, 'Açaí, leite em pó em cada vitamina você pode escolher duas dessas opções sem custo.', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('VITAMINA DE AÇAÍ - 500ml', 'vitamina', 15.00, 17.00, 'Açaí, leite em pó em cada vitamina você pode escolher duas dessas opções sem custo.', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, null),
('1Kg de Açaí', 'acai', 44.99, null, 'Açaí tradicional vendido por peso - 1kg', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, true, 0.04499),
('1kg de Sorvete', 'sorvetes', 44.99, null, 'Sorvete tradicional 1kg', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, true, 0.04499);