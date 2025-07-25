/*
  # Criar tabela de produtos de delivery

  1. Nova Tabela
    - `delivery_products`
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