/*
  # Criar tabelas de configurações da loja

  1. Nova Tabela - store_configurations
    - `id` (text, primary key, sempre 'default')
    - `store_name` (text, nome da loja)
    - `phone` (text, telefone)
    - `cnpj` (text, CNPJ)
    - `address` (text, endereço)
    - `delivery_fee` (numeric, taxa de entrega padrão)
    - `min_order_value` (numeric, valor mínimo do pedido)
    - `estimated_delivery_time` (integer, tempo estimado em minutos)
    - `is_open_now` (boolean, controle manual de abertura)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS nas tabelas
    - Políticas para operações públicas (leitura) e autenticadas (escrita)