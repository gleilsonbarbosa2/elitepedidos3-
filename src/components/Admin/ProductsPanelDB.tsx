import React, { useState } from 'react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Eye,
  EyeOff,
  Search,
  Image as ImageIcon,
  RefreshCw,
  Download,
  Scale,
  Tag,
  Calendar,
  ShoppingBag
} from 'lucide-react';
import ImageUploadModal from './ImageUploadModal';
import ProductScheduleModal from './ProductScheduleModal';
import { useProductScheduling } from '../../hooks/useProductScheduling';
import type { AdminProduct } from '../../hooks/useAdminProducts';

const ProductsPanelDB: React.FC = () => {
  const { 
    products, 
    loading, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    searchProducts,
    syncDeliveryProducts
  } = useAdminProducts();
  
  const { getProductSchedule, saveProductSchedule } = useProductScheduling();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedProductForSchedule, setSelectedProductForSchedule] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);

  const categories = [
    { id: 'all', label: 'Todas as Categorias' },
    { id: 'acai', label: 'Açaí' },
    { id: 'combo', label: 'Combos' },
    { id: 'milkshake', label: 'Milkshakes' },
    { id: 'vitamina', label: 'Vitaminas' },
    { id: 'sorvetes', label: 'Sorvetes' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'outros', label: 'Outros' }
  ];

  const filteredProducts = React.useMemo(() => {
    let result = searchTerm ? searchProducts(searchTerm) : products;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result;
  }, [products, searchProducts, searchTerm, selectedCategory]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleSyncProducts = async () => {
    if (confirm('Isso irá importar/atualizar todos os produtos do delivery para o banco de dados. Os produtos existentes serão atualizados. Continuar?')) {
      setSyncing(true);
      try {
        await syncDeliveryProducts();
        
        // Mostrar notificação de sucesso
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3';
        notification.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p class="font-semibold">Produtos Sincronizados!</p>
            <p class="text-sm opacity-90">Delivery atualizado automaticamente</p>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 5000);
      } catch (error) {
        console.error('Erro ao sincronizar:', error);
        alert('Erro ao sincronizar produtos');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleScheduleProduct = (product: AdminProduct) => {
    setSelectedProductForSchedule({
      id: product.id,
      name: product.name,
      scheduledDays: product.scheduled_days ? JSON.parse(product.scheduled_days) : null
    });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (productId: string, scheduledDays: any) => {
    try {
      await saveProductSchedule(productId, scheduledDays);
      
      // Atualizar produto no banco com a programação
      await updateProduct(productId, {
        scheduled_days: JSON.stringify(scheduledDays),
        availability_type: scheduledDays.enabled ? 'specific_days' : 'always'
      });
      
      setShowScheduleModal(false);
      setSelectedProductForSchedule(null);
    } catch (error) {
      console.error('Erro ao salvar programação:', error);
      alert('Erro ao salvar programação');
    }
  };

  const handleCreate = () => {
    setEditingProduct({
      id: '',
      name: '',
      category: 'acai',
      price: 0,
      price_per_gram: undefined,
      description: '',
      image_url: '',
      is_active: true,
      is_weighable: false,
      has_complements: false,
      availability_type: 'always',
      created_at: '',
      updated_at: ''
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    if (!editingProduct.name.trim() || !editingProduct.description.trim()) {
      alert('Nome e descrição são obrigatórios');
      return;
    }

    if (editingProduct.price <= 0) {
      alert('Preço deve ser maior que zero');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        const { id, created_at, updated_at, ...productData } = editingProduct;
        await createProduct(productData);
      } else {
        await updateProduct(editingProduct.id, editingProduct);
      }
      
      setEditingProduct(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert(`Erro ao salvar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  const handleToggleActive = async (product: AdminProduct) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Carregando produtos do banco...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-purple-600" />
            Gerenciar Produtos de Delivery (Banco de Dados)
          </h2>
          <p className="text-gray-600">Configure produtos do cardápio - alterações refletem automaticamente no delivery</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('/', '_blank')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <ShoppingBag size={16} />
            Ver Delivery
          </button>
          <button
            onClick={handleSyncProducts}
            disabled={syncing}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sincronizando...
              </>
            ) : (
              <>
                <Download size={16} />
                Sincronizar Produtos
              </>
            )}
          </button>
          <button
            onClick={handleCreate}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Total de Produtos</p>
              <p className="text-2xl font-bold text-blue-800">{products.length}</p>
              <p className="text-xs text-blue-600">Sincronizados com delivery</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Eye size={20} className="text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Produtos Ativos</p>
              <p className="text-xl font-bold text-green-600">
                {products.filter(p => p.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Tag size={20} className="text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Com Promoção</p>
              <p className="text-xl font-bold text-orange-600">
                {products.filter(p => p.original_price && p.original_price > p.price).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Programados</p>
              <p className="text-xl font-bold text-purple-600">
                {products.filter(p => {
                  const schedule = p.scheduled_days ? 
                    (typeof p.scheduled_days === 'string' ? JSON.parse(p.scheduled_days) : p.scheduled_days) : 
                    null;
                  return schedule?.enabled;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Real-time Status */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
            <RefreshCw size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-green-800 mb-2">🔄 Sincronização em Tempo Real Ativa</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Edições instantâneas:</strong> Alterações aqui aparecem imediatamente no delivery</li>
              <li>• <strong>Produtos ativos/inativos:</strong> Controle de visibilidade em tempo real</li>
              <li>• <strong>Preços e promoções:</strong> Atualizações automáticas no cardápio</li>
              <li>• <strong>Programação de dias:</strong> Quinta Elite e outras promoções controladas aqui</li>
              <li>• <strong>Imagens:</strong> Upload e associação automática aos produtos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Produto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Categoria</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Preço</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {categories.find(c => c.id === product.category)?.label || product.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-green-600">
                        {product.is_weighable && product.price_per_gram 
                          ? `${formatPrice(product.price_per_gram * 1000)}/kg`
                          : formatPrice(product.price)
                        }
                      </div>
                      {product.original_price && product.original_price > product.price && (
                        <div className="text-sm text-gray-500 line-through">
                          {formatPrice(product.original_price)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {product.is_weighable && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center gap-1">
                          <Scale size={10} />
                          Pesável
                        </span>
                      )}
                      {product.has_complements && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Complementos
                        </span>
                      )}
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          Promoção
                        </span>
                      )}
                      {product.scheduled_days && JSON.parse(product.scheduled_days)?.enabled && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                          <Calendar size={10} />
                          Programado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        product.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {product.is_active ? (
                        <>
                          <Eye size={12} />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleScheduleProduct(product)}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Programar dias de disponibilidade"
                      >
                        <Calendar size={16} />
                      </button>
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar produto"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir produto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm 
                ? 'Nenhum produto encontrado' 
                : 'Nenhum produto cadastrado no banco'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && products.length === 0 && (
              <button
                onClick={handleSyncProducts}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <Download size={16} />
                Importar Produtos do Delivery
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {isCreating ? 'Novo Produto (Banco)' : 'Editar Produto'}
                </h2>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreating(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem do Produto
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={editingProduct.image_url || 'https://via.placeholder.com/100?text=Sem+Imagem'}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <ImageIcon size={16} />
                    Alterar Imagem
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    name: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Açaí Premium 500g"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    category: e.target.value as AdminProduct['category']
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.filter(cat => cat.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Weighable */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_weighable}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      is_weighable: e.target.checked,
                      price: e.target.checked ? (editingProduct.price_per_gram || 0) * 1000 : editingProduct.price,
                      price_per_gram: e.target.checked ? (editingProduct.price_per_gram || 0.045) : undefined
                    })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Scale size={16} className="text-purple-600" />
                    Produto pesável (vendido por peso)
                  </span>
                </label>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingProduct.is_weighable ? 'Preço por grama (R$) *' : 'Preço (R$) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.is_weighable 
                    ? editingProduct.price_per_gram || '' 
                    : editingProduct.price || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setEditingProduct({
                      ...editingProduct,
                      ...(editingProduct.is_weighable 
                        ? { price_per_gram: value, price: value * 1000 } 
                        : { price: value })
                    });
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
                {editingProduct.is_weighable && (
                  <p className="text-xs text-gray-500 mt-1">
                    Preço por kg: {formatPrice((editingProduct.price_per_gram || 0) * 1000)}
                  </p>
                )}
              </div>

              {/* Original Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Original (para promoções)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.original_price || ''}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    original_price: parseFloat(e.target.value) || undefined
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Deixe vazio se não for promoção"
                />
                {editingProduct.original_price && editingProduct.original_price > editingProduct.price && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Tag size={12} />
                    Desconto: {formatPrice(editingProduct.original_price - editingProduct.price)} 
                    ({(((editingProduct.original_price - editingProduct.price) / editingProduct.original_price) * 100).toFixed(1)}%)
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    description: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Descrição do produto..."
                />
              </div>

              {/* Sizes Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanhos Disponíveis
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProduct.sizes ? JSON.parse(editingProduct.sizes || '[]').length > 0 : false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const defaultSizes = [
                            { id: 'pequeno', name: 'Pequeno (300ml)', price: editingProduct.price * 0.7, description: 'Tamanho pequeno' },
                            { id: 'medio', name: 'Médio (500ml)', price: editingProduct.price, description: 'Tamanho médio' },
                            { id: 'grande', name: 'Grande (700ml)', price: editingProduct.price * 1.3, description: 'Tamanho grande' }
                          ];
                          setEditingProduct({
                            ...editingProduct,
                            sizes: JSON.stringify(defaultSizes)
                          });
                        } else {
                          setEditingProduct({
                            ...editingProduct,
                            sizes: null
                          });
                        }
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Produto possui diferentes tamanhos
                    </span>
                  </label>
                  
                  {editingProduct.sizes && JSON.parse(editingProduct.sizes || '[]').length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-gray-800">Configurar Tamanhos:</h4>
                      {JSON.parse(editingProduct.sizes || '[]').map((size: any, index: number) => (
                        <div key={index} className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={size.name}
                            onChange={(e) => {
                              const sizes = JSON.parse(editingProduct.sizes || '[]');
                              sizes[index].name = e.target.value;
                              setEditingProduct({
                                ...editingProduct,
                                sizes: JSON.stringify(sizes)
                              });
                            }}
                            placeholder="Nome do tamanho"
                            className="p-2 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={size.price}
                            onChange={(e) => {
                              const sizes = JSON.parse(editingProduct.sizes || '[]');
                              sizes[index].price = parseFloat(e.target.value) || 0;
                              setEditingProduct({
                                ...editingProduct,
                                sizes: JSON.stringify(sizes)
                              });
                            }}
                            placeholder="Preço"
                            className="p-2 border border-gray-300 rounded text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const sizes = JSON.parse(editingProduct.sizes || '[]');
                              sizes.splice(index, 1);
                              setEditingProduct({
                                ...editingProduct,
                                sizes: JSON.stringify(sizes)
                              });
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const sizes = JSON.parse(editingProduct.sizes || '[]');
                          sizes.push({
                            id: `size-${Date.now()}`,
                            name: '',
                            price: editingProduct.price,
                            description: ''
                          });
                          setEditingProduct({
                            ...editingProduct,
                            sizes: JSON.stringify(sizes)
                          });
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Adicionar Tamanho
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Has Complements */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.has_complements}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      has_complements: e.target.checked
                    })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto possui complementos/personalizações
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Marque se o produto permite escolha de complementos, cremes, adicionais, etc.
                </p>
              </div>

              {/* Complement Groups Configuration */}
              {editingProduct.has_complements && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grupos de Complementos
                  </label>
                  <div className="space-y-4">
                    {/* Quick Setup Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const standardGroups = [
                            {
                              id: 'tipo-acai',
                              name: 'TIPO DE AÇAÍ (ESCOLHA 1 ITEM)',
                              required: true,
                              minItems: 1,
                              maxItems: 1,
                              complements: [
                                { id: 'acai-tradicional', name: 'AÇAÍ PREMIUM TRADICIONAL', price: 0, description: 'Açaí tradicional premium' },
                                { id: 'acai-fit', name: 'AÇAÍ PREMIUM (0% AÇÚCAR - FIT)', price: 0, description: 'Açaí sem açúcar' },
                                { id: 'acai-morango', name: 'AÇAÍ PREMIUM COM MORANGO', price: 0, description: 'Açaí com sabor morango' }
                              ]
                            },
                            {
                              id: 'cremes-opcional',
                              name: 'CREMES * OPCIONAL (ATÉ 2 ITEM)',
                              required: false,
                              minItems: 0,
                              maxItems: 2,
                              complements: [
                                { id: 'creme-cupuacu', name: 'CREME DE CUPUAÇU', price: 0, description: 'Creme cremoso de cupuaçu' },
                                { id: 'creme-morango', name: 'CREME DE MORANGO', price: 0, description: 'Creme doce de morango' },
                                { id: 'creme-ninho', name: 'CREME DE NINHO', price: 0, description: 'Creme de leite ninho' },
                                { id: 'creme-nutela', name: 'CREME DE NUTELA', price: 0, description: 'Creme de nutella' }
                              ]
                            },
                            {
                              id: 'adicionais-3',
                              name: '3 ADICIONAIS * OPCIONAL (ATÉ 3 ITENS)',
                              required: false,
                              minItems: 0,
                              maxItems: 3,
                              complements: [
                                { id: 'granola', name: 'GRANOLA', price: 0, description: 'Granola crocante' },
                                { id: 'morango', name: 'MORANGO', price: 0, description: 'Morango fresco' },
                                { id: 'leite-condensado', name: 'LEITE CONDENSADO', price: 0, description: 'Leite condensado' },
                                { id: 'pacoca', name: 'PAÇOCA', price: 0, description: 'Paçoca triturada' }
                              ]
                            }
                          ];
                          setEditingProduct({
                            ...editingProduct,
                            complement_groups: JSON.stringify(standardGroups)
                          });
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Complementos Padrão Açaí
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const milkshakeGroups = [
                            {
                              id: 'sabor-milkshake',
                              name: 'Escolha o Sabor',
                              required: true,
                              minItems: 1,
                              maxItems: 1,
                              complements: [
                                { id: 'morango', name: 'Morango', price: 0, description: 'Milkshake de morango' },
                                { id: 'chocolate', name: 'Chocolate', price: 0, description: 'Milkshake de chocolate' },
                                { id: 'baunilha', name: 'Baunilha', price: 0, description: 'Milkshake de baunilha' },
                                { id: 'ovomaltine', name: 'Ovomaltine', price: 0, description: 'Milkshake de ovomaltine' }
                              ]
                            }
                          ];
                          setEditingProduct({
                            ...editingProduct,
                            complement_groups: JSON.stringify(milkshakeGroups)
                          });
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Sabores Milkshake
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct({
                            ...editingProduct,
                            complement_groups: null
                          });
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Limpar Complementos
                      </button>
                    </div>
                    
                    {/* Complement Groups Editor */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">Editor de Complementos:</h4>
                      <textarea
                        value={editingProduct.complement_groups ? 
                          JSON.stringify(JSON.parse(editingProduct.complement_groups), null, 2) : 
                          ''
                        }
                        onChange={(e) => {
                          try {
                            // Validar JSON
                            JSON.parse(e.target.value);
                            setEditingProduct({
                              ...editingProduct,
                              complement_groups: e.target.value
                            });
                          } catch (error) {
                            // JSON inválido, mas permitir edição
                            setEditingProduct({
                              ...editingProduct,
                              complement_groups: e.target.value
                            });
                          }
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm h-40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Configuração JSON dos grupos de complementos..."
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Use os botões acima para configurações rápidas ou edite o JSON diretamente
                      </p>
                      
                      {/* JSON Validation */}
                      {editingProduct.complement_groups && (() => {
                        try {
                          JSON.parse(editingProduct.complement_groups);
                          return (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              JSON válido
                            </p>
                          );
                        } catch (error) {
                          return (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              JSON inválido: {error instanceof Error ? error.message : 'Erro de sintaxe'}
                            </p>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      is_active: e.target.checked
                    })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto ativo (visível no cardápio de delivery)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Desmarcar remove o produto do delivery instantaneamente
                </p>
              </div>
              
              {/* Availability Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Disponibilidade
                </label>
                <select
                  value={editingProduct.availability_type || 'always'}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    availability_type: e.target.value as 'always' | 'scheduled' | 'specific_days'
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="always">Sempre disponível</option>
                  <option value="specific_days">Dias específicos (ex: Quinta Elite)</option>
                  <option value="scheduled">Horário programado</option>
                </select>
                
                {editingProduct.availability_type === 'specific_days' && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700 mb-2 font-medium">
                      Configurar Dias Específicos:
                    </p>
                    <button
                      type="button"
                      onClick={() => handleScheduleProduct(editingProduct)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Configurar Programação de Dias
                    </button>
                    <p className="text-xs text-blue-600 mt-2">
                      Use para promoções como "Quinta Elite", "Promoção de Segunda", etc.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingProduct.name.trim() || !editingProduct.description.trim()}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isCreating ? 'Criar Produto' : 'Salvar Alterações'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUploadModal
          isOpen={showImageUpload}
          onClose={() => setShowImageUpload(false)}
          onSelectImage={(imageUrl) => {
            if (editingProduct) {
              setEditingProduct({
                ...editingProduct,
                image_url: imageUrl
              });
            }
            setShowImageUpload(false);
          }}
          currentImage={editingProduct?.image_url}
        />
      )}

      {/* Product Schedule Modal */}
      {showScheduleModal && selectedProductForSchedule && (
        <ProductScheduleModal
          product={selectedProductForSchedule}
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedProductForSchedule(null);
          }}
          onSave={handleSaveSchedule}
          currentSchedule={selectedProductForSchedule.scheduledDays}
        />
      )}
    </div>
  );
};

export default ProductsPanelDB;