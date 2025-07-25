import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { products as staticProducts } from '../data/products';

export interface AdminProduct {
  id: string;
  name: string;
  category: 'acai' | 'combo' | 'milkshake' | 'vitamina' | 'sorvetes' | 'bebidas' | 'complementos' | 'sobremesas' | 'outros';
  price: number;
  original_price?: number;
  code?: string; // Adicionado o campo code
  barcode?: string; // Adicionado o campo barcode
  price_per_gram?: number;
  description: string;
  image_url?: string;
  is_active: boolean;
  is_weighable: boolean;
  has_complements: boolean;
  complement_groups?: any;
  sizes?: any;
  scheduled_days?: any;
  availability_type?: 'always' | 'scheduled' | 'specific_days';
  created_at: string;
  updated_at: string;
}

export const useAdminProducts = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando produtos do banco de dados...');
      
      const { data, error } = await supabase
        .from('delivery_products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      console.log(`✅ ${data?.length || 0} produtos carregados do banco`);
      
      // Se não há produtos no banco, sincronizar com produtos do delivery
      if (!data || data.length === 0) {
        console.log('📦 Nenhum produto no banco, sincronizando com produtos do delivery...');
        await syncDeliveryProducts();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      console.error('❌ Erro ao carregar produtos:', errorMessage);
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncDeliveryProducts = useCallback(async () => {
    try {
      console.log('🔄 Sincronizando produtos do delivery para o banco...');
      
      const productsToInsert = staticProducts.map((product) => ({
        name: product.name,
        category: product.category,
        price: product.price,
        original_price: product.originalPrice,
        code: product.code, // Incluir o campo code
        barcode: product.barcode, // Incluir o campo barcode
        price_per_gram: product.pricePerGram,
        description: product.description,
        image_url: product.image,
        is_active: product.isActive !== false,
        is_weighable: product.is_weighable || false,
        has_complements: !!(product.complementGroups && product.complementGroups.length > 0),
        complement_groups: product.complementGroups ? JSON.stringify(product.complementGroups) : null,
        sizes: product.sizes ? JSON.stringify(product.sizes) : null,
        scheduled_days: product.scheduledDays ? JSON.stringify(product.scheduledDays) : null,
        availability_type: product.availability?.type || 'always'
      }));
      
      const { data, error } = await supabase
        .from('delivery_products')
        .insert(productsToInsert)
        .select();
      
      if (error) throw error;
      
      setProducts(data || []);
      console.log(`✅ ${data?.length || 0} produtos sincronizados com sucesso`);
      
      // Mostrar notificação de sucesso
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3';
      notification.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <p class="font-semibold">Produtos Sincronizados!</p>
          <p class="text-sm opacity-90">${data?.length || 0} produtos importados do delivery</p>
        </div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 5000);
      
    } catch (err) {
      console.error('❌ Erro ao sincronizar produtos:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao sincronizar produtos');
    }
  }, []);

  const createProduct = useCallback(async (product: Omit<AdminProduct, 'id' | 'created_at' | 'updated_at'>) => {
    try {      
      console.log('🚀 Criando produto no banco:', product);
      
      const { data, error } = await supabase
        .from('delivery_products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => [...prev, data]);
      console.log('✅ Produto criado no banco:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar produto:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar produto');
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<AdminProduct>) => {
    try {      
      console.log('✏️ Atualizando produto no banco:', id, updates);
      
      const { data, error } = await supabase
        .from('delivery_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => prev.map(p => p.id === id ? data : p));
      console.log('✅ Produto atualizado no banco:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao atualizar produto:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar produto');
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Excluindo produto do banco:', id);
      
      const { error } = await supabase
        .from('delivery_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      console.log('✅ Produto excluído do banco');
    } catch (err) {
      console.error('❌ Erro ao excluir produto:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir produto');
    }
  }, []);

  const searchProducts = useCallback((query: string) => {
    if (!query.trim()) return products;
    
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }, [products]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    refetch: fetchProducts,
    syncDeliveryProducts
  };
};