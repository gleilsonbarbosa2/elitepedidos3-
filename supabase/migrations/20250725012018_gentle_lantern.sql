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