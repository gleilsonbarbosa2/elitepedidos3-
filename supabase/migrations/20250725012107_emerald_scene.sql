/*
  # Criar tabela de programação de produtos

  1. Nova Tabela
    - `admin_product_schedules`
      - `id` (uuid, primary key)
      - `product_id` (text, ID do produto)
      - `enabled` (boolean, se a programação está ativa)
      - `days` (jsonb, dias da semana habilitados)
      - `start_time` (time, horário de início)
      - `end_time` (time, horário de fim)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela
    - Políticas para operações públicas

  3. Índices
    - Índice único por product_id
    - Índices para consultas otimizadas
*/

CREATE TABLE IF NOT EXISTS admin_product_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  days jsonb NOT NULL DEFAULT '{
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": true,
    "sunday": true
  }'::jsonb,
  start_time time DEFAULT '00:00:00',
  end_time time DEFAULT '23:59:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_product_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow public read access to admin_product_schedules"
  ON admin_product_schedules
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to admin_product_schedules"
  ON admin_product_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to admin_product_schedules"
  ON admin_product_schedules
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete to admin_product_schedules"
  ON admin_product_schedules
  FOR DELETE
  TO authenticated
  USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_product_schedules_product_id 
  ON admin_product_schedules(product_id);

CREATE INDEX IF NOT EXISTS idx_admin_product_schedules_enabled 
  ON admin_product_schedules(enabled);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_product_schedules_updated_at
    BEFORE UPDATE ON admin_product_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir programações iniciais para produtos da Quinta Elite
INSERT INTO admin_product_schedules (product_id, enabled, days, start_time, end_time) VALUES
('promocao-quinta-elite-1kg', true, '{"monday": false, "tuesday": false, "wednesday": false, "thursday": true, "friday": false, "saturday": false, "sunday": false}', '00:00:00', '23:59:00'),
('promocao-quinta-elite-700g', true, '{"monday": false, "tuesday": false, "wednesday": false, "thursday": true, "friday": false, "saturday": false, "sunday": false}', '00:00:00', '23:59:00'),
('promocao-quinta-elite-600g', true, '{"monday": false, "tuesday": false, "wednesday": false, "thursday": true, "friday": false, "saturday": false, "sunday": false}', '00:00:00', '23:59:00'),
('promocao-quinta-elite-400g', true, '{"monday": false, "tuesday": false, "wednesday": false, "thursday": true, "friday": false, "saturday": false, "sunday": false}', '00:00:00', '23:59:00'),
('promocao-copo-300ml', true, '{"monday": true, "tuesday": false, "wednesday": false, "thursday": false, "friday": false, "saturday": false, "sunday": false}', '00:00:00', '23:59:00'),
('promocao-copo-400ml', true, '{"monday": false, "tuesday": false, "wednesday": true, "thursday": false, "friday": false, "saturday": false, "sunday": false}', '00:00:00', '23:59:00'),
('promocao-copo-500ml', true, '{"monday": false, "tuesday": true, "wednesday": false, "thursday": false, "friday": true, "saturday": false, "sunday": false}', '00:00:00', '23:59:00'),
('combo-4-900g', true, '{"monday": true, "tuesday": true, "wednesday": true, "thursday": false, "friday": true, "saturday": true, "sunday": true}', '00:00:00', '23:59:00'),
('acai-1kg-quinta', true, '{"monday": false, "tuesday": false, "wednesday": false, "thursday": true, "friday": false, "saturday": false, "sunday": false}', '00:00:00', '23:59:00'),
('sorvete-1kg-quinta', true, '{"monday": false, "tuesday": false, "wednesday": false, "thursday": true, "friday": false, "saturday": false, "sunday": false}', '00:00:00', '23:59:00')
ON CONFLICT (product_id) DO NOTHING;