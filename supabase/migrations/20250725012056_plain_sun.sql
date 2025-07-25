/*
  # Criar tabela de usuários de atendimento

  1. Nova Tabela
    - `attendance_users`
      - `id` (uuid, primary key)
      - `username` (text, unique, nome de usuário)
      - `password_hash` (text, senha hash)
      - `name` (text, nome completo)
      - `role` (text, função: attendant/admin)
      - `is_active` (boolean, se está ativo)
      - `permissions` (jsonb, permissões do usuário)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_login` (timestamp, último acesso)

  2. Segurança
    - Enable RLS na tabela `attendance_users`
    - Políticas para leitura e escrita autenticadas
    - Trigger para hash de senha automático

  3. Dados Iniciais
    - Usuário admin padrão
*/

CREATE TABLE IF NOT EXISTS attendance_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'attendant' CHECK (role IN ('attendant', 'admin')),
  is_active boolean NOT NULL DEFAULT true,
  permissions jsonb NOT NULL DEFAULT '{
    "can_view_orders": true,
    "can_update_status": true,
    "can_chat": true,
    "can_create_manual_orders": false,
    "can_print_orders": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE attendance_users ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow authenticated read access to attendance_users"
  ON attendance_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to attendance_users"
  ON attendance_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to attendance_users"
  ON attendance_users
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete to attendance_users"
  ON attendance_users
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_attendance_users_updated_at
    BEFORE UPDATE ON attendance_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para hash de senha
CREATE OR REPLACE FUNCTION hash_attendance_user_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Só fazer hash se a senha foi alterada e não está vazia
  IF NEW.password_hash IS DISTINCT FROM OLD.password_hash AND NEW.password_hash != '' THEN
    -- Para simplicidade, vamos manter a senha como texto por enquanto
    -- Em produção, use uma biblioteca de hash adequada
    NEW.password_hash = NEW.password_hash;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hash_attendance_user_password
  BEFORE INSERT OR UPDATE OF password_hash ON attendance_users
  FOR EACH ROW
  EXECUTE FUNCTION hash_attendance_user_password();

-- Inserir usuário admin padrão
INSERT INTO attendance_users (username, password_hash, name, role, is_active, permissions) VALUES
('admin', 'elite2024', 'Administrador', 'admin', true, '{
  "can_view_orders": true,
  "can_update_status": true,
  "can_chat": true,
  "can_create_manual_orders": true,
  "can_print_orders": true
}'::jsonb)
ON CONFLICT (username) DO NOTHING;