/*
  # Criar tabela de programação de produtos

  1. Nova Tabela
    - `product_schedules`
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