import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/product';
import { products as staticProducts } from '../data/products';

export const useDeliveryProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando produtos do banco para delivery...');
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando produtos estáticos');
        setProducts(staticProducts);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('delivery_products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Se não há produtos no banco, usar produtos estáticos como fallback
      if (!data || data.length === 0) {
        console.log('📦 Nenhum produto no banco, usando produtos estáticos');
        setProducts(staticProducts);
        setLoading(false);
        return;
      }

      // Converter produtos do banco para formato do delivery
      const convertedProducts: Product[] = data.map(dbProduct => ({
        id: dbProduct.id,
        name: dbProduct.name,
        category: dbProduct.category as Product['category'],
        price: dbProduct.price,
        originalPrice: dbProduct.original_price,
        pricePerGram: dbProduct.price_per_gram,
        description: dbProduct.description,
        image: dbProduct.image_url || 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
        isActive: dbProduct.is_active,
        is_weighable: dbProduct.is_weighable,
        complementGroups: dbProduct.complement_groups ? 
          (typeof dbProduct.complement_groups === 'string' ? 
            JSON.parse(dbProduct.complement_groups) : 
            dbProduct.complement_groups) : 
          undefined,
        sizes: dbProduct.sizes ? 
          (typeof dbProduct.sizes === 'string' ? 
            JSON.parse(dbProduct.sizes) : 
            dbProduct.sizes) : 
          undefined,
        scheduledDays: dbProduct.scheduled_days ? 
          (typeof dbProduct.scheduled_days === 'string' ? 
            JSON.parse(dbProduct.scheduled_days) : 
            dbProduct.scheduled_days) : 
          undefined,
        availability: dbProduct.availability_type ? {
          type: dbProduct.availability_type,
          scheduledDays: dbProduct.scheduled_days ? 
            (typeof dbProduct.scheduled_days === 'string' ? 
              JSON.parse(dbProduct.scheduled_days) : 
              dbProduct.scheduled_days) : 
            undefined
        } : undefined
      }));

      setProducts(convertedProducts);
      console.log(`✅ ${convertedProducts.length} produtos carregados do banco para delivery`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      console.error('❌ Erro ao carregar produtos do banco:', errorMessage);
      setError(errorMessage);
      
      // Fallback para produtos estáticos em caso de erro
      try {
        const { products: staticProducts } = await import('../data/products');
        setProducts(staticProducts);
        console.log('📦 Usando produtos estáticos como fallback');
      } catch (fallbackError) {
        console.error('❌ Erro ao carregar produtos estáticos:', fallbackError);
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Configurar realtime para atualizações automáticas
  useEffect(() => {
    fetchProducts();

    // Configurar realtime para produtos
    const productsChannel = supabase
      .channel('delivery_products_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_products' },
        (payload) => {
          console.log('🔄 Produto atualizado via realtime:', payload);
          fetchProducts(); // Recarregar produtos quando houver mudanças
        }
      )
      .subscribe((status) => {
        console.log('🔌 Status da inscrição de produtos:', status);
      });

    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts
  };
};