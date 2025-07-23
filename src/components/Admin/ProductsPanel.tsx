import React, { useState } from 'react';
import { products, categoryNames } from '../../data/products';
import { Product } from '../../types/product';
import ProductScheduleModal from './ProductScheduleModal';
import ImageUploadModal from './ImageUploadModal';
import { useProductScheduling } from '../../hooks/useProductScheduling';
import { useImageUpload } from '../../hooks/useImageUpload';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Search,
  Filter,
  Calendar,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Clock,
  Star
} from 'lucide-react';

const ProductsPanel: React.FC = () => {
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Product['category'] | 'all'>('all');
  const [saving, setSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProductForSchedule, setSelectedProductForSchedule] = useState<Product | null>(null);

  const { saveProductSchedule, getProductSchedule } = useProductScheduling();
  const { saveImageToProduct, getProductImage } = useImageUpload();

  const filteredProducts = localProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleCreate = () => {
    setEditingProduct({
      id: `product-${Date.now()}`,
      name: '',
      category: 'acai',
      price: 0,
      originalPrice: undefined,
      description: '',
      image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
      sizes: undefined,
      complementGroups: undefined,
      availability: undefined,
      isActive: true,
      scheduledDays: undefined,
      is_weighable: false,
      pricePerGram: undefined
    });
    setIsCreating(true);
  };

  // Load product image when editing
  React.useEffect(() => {
    if (editingProduct && editingProduct.id) {
      const loadProductImage = async () => {
        try {
          const savedImage = await getProductImage(editingProduct.id);
          if (savedImage && !editingProduct.image.includes(savedImage)) {
            setEditingProduct(prev => prev ? { ...prev, image: savedImage } : null);
          }
        } catch (error) {
          console.warn('Erro ao carregar imagem do produto:', error);
        }
      };
      loadProductImage();
    }
  }, [editingProduct?.id, getProductImage]);

  const handleSave = async () => {
    if (!editingProduct) return;

    console.log('💾 Iniciando salvamento do produto:', editingProduct.name, editingProduct.id);
    setSaving(true);
    try {
      // Validar dados obrigatórios
      if (!editingProduct.name.trim()) {
        throw new Error('Nome do produto é obrigatório');
      }
      if (!editingProduct.description.trim()) {
        throw new Error('Descrição do produto é obrigatória');
      }

      if (isCreating) {
        console.log('➕ Criando novo produto...');
        setLocalProducts(prev => [...prev, editingProduct]);
      } else {
        console.log('✏️ Atualizando produto existente...');
        setLocalProducts(prev => prev.map(p => 
          p.id === editingProduct.id ? editingProduct : p
        ));
      }
      
      // Salvar associação da imagem após salvar o produto
      const hasCustomImage = editingProduct.image && 
        !editingProduct.image.includes('pexels.com') && 
        !editingProduct.image.includes('unsplash.com') &&
        !editingProduct.image.includes('pexels.com');
        
      if (hasCustomImage) {
        console.log('🖼️ Processando imagem personalizada...');
        try {
          // Clean the image URL before saving
          const cleanImageUrl = editingProduct.image.split('?')[0];
          const refreshedImageUrl = await saveImageToProduct(cleanImageUrl, editingProduct.id);
          
          // Atualizar estado local das imagens
          setProductImages(prev => ({
            ...prev,
            [editingProduct.id]: refreshedImageUrl || editingProduct.image
          }));
          
          console.log('✅ Imagem associada e estado atualizado');
        } catch (imageError) {
          console.error('❌ Erro ao associar imagem (produto salvo):', imageError);
          // Mostrar aviso mas não falhar o salvamento do produto
          alert('Produto salvo, mas houve erro ao associar a imagem. Tente novamente.');
        }
      } else {
        console.log('📷 Usando imagem padrão (sem associação necessária)');
      }
      
      setEditingProduct(null);
      setIsCreating(false);
      
      // Mostrar feedback de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Produto salvo com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          successMessage.remove();
        }
      }, 3000);
      
    } catch (error) {
      console.error('💥 Erro ao salvar produto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar produto: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      console.log('🗑️ Excluindo produto:', name);
      setLocalProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleActive = (product: Product) => {
    console.log('🔄 Alternando status do produto:', product.name);
    setLocalProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const handleScheduleProduct = (product: Product) => {
    console.log('📅 Abrindo programação para:', product.name);
    setSelectedProductForSchedule(product);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (productId: string, scheduledDays: any) => {
    try {
      console.log('💾 Salvando programação do produto:', productId);
      await saveProductSchedule(productId, scheduledDays);
      setShowScheduleModal(false);
      setSelectedProductForSchedule(null);
    } catch (error) {
      console.error('Erro ao salvar programação:', error);
      alert('Erro ao salvar programação. Tente novamente.');
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    console.log('🖼️ Imagem selecionada:', imageUrl.substring(0, 50) + '...');
    if (editingProduct) {
      // Store the image URL without any cache-busting parameters
      const cleanUrl = imageUrl.split('?')[0];
      setEditingProduct({ ...editingProduct, image: cleanUrl });
      console.log('✅ Imagem atribuída ao produto:', editingProduct.name);
    } else {
      console.warn('⚠️ Nenhum produto em edição para receber a imagem');
    }
  };

  const getProductScheduleStatus = (product: Product) => {
    const schedule = getProductSchedule(product.id);
    
    if (schedule?.enabled) {
      const activeDays = Object.values(schedule.days).filter(Boolean).length;
      return `Programado (${activeDays}/7 dias)`;
    }
    return 'Sempre disponível';
  };

  // Carregar imagem do produto do banco de dados
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  // Carregar imagens personalizadas dos produtos
  React.useEffect(() => {
    const loadProductImages = async () => {
      console.log('🔄 Carregando imagens personalizadas para', localProducts.length, 'produtos');
      const images: Record<string, string> = {};
      let loadedCount = 0;
      
      for (const product of localProducts) {
        try {
          const savedImage = await getProductImage(product.id);
          // Only store the image if it exists and doesn't already have a custom image
          if (savedImage && !productImages[product.id]) {
            images[product.id] = savedImage;
            loadedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao carregar imagem do produto ${product.name}:`, error);
        }
      }
      
      console.log(`✅ ${loadedCount} imagens personalizadas carregadas`);
      // Merge with existing images, prioritizing existing ones
      setProductImages(prev => ({...images, ...prev}));
    };

    loadProductImages();
  }, [localProducts, getProductImage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-purple-600" />
            Gerenciar Produtos
          </h2>
          <p className="text-gray-600">Configure produtos, preços e disponibilidade</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
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

          {/* Category Filter */}
          <div className="lg:w-64">
            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as Product['category'] | 'all')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todas as categorias</option>
                {Object.entries(categoryNames).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Programação</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={productImages[product.id] || product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <div className="font-medium text-gray-800">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {categoryNames[product.category]}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-green-600">
                      {formatPrice(product.price)}
                    </div>
                    {product.originalPrice && (
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        product.isActive !== false
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {product.isActive !== false ? (
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
                    <div className="text-sm text-gray-600">
                      {getProductScheduleStatus(product)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleScheduleProduct(product)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Programar disponibilidade"
                      >
                        <Calendar size={16} />
                      </button>
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
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
              {searchTerm || categoryFilter !== 'all' 
                ? 'Nenhum produto encontrado' 
                : 'Nenhum produto cadastrado'
              }
            </p>
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
                  {isCreating ? 'Novo Produto' : 'Editar Produto'}
                </h2>
                <button
                  onClick={handleCancel}
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
                <div className="text-xs text-gray-500 mb-2">
                  <p>💡 <strong>Dica:</strong> Clique em "Alterar Imagem" para fazer upload de uma nova imagem</p>
                  <p>🔄 A imagem será salva automaticamente no banco de dados</p>
                  <p>📱 Imagens ficam sincronizadas em todos os dispositivos</p>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src={productImages[editingProduct.id] || editingProduct.image}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={() => setShowImageModal(true)}
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
                    category: e.target.value as Product['category']
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(categoryNames).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value) || 0
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Original (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      originalPrice: parseFloat(e.target.value) || undefined
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para produtos em promoção (preço riscado)
                  </p>
                </div>
              </div>

              {/* Weighable Product */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_weighable || false}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      is_weighable: e.target.checked,
                      pricePerGram: e.target.checked ? (editingProduct.pricePerGram || 0.045) : undefined
                    })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto pesável (vendido por peso)
                  </span>
                </label>
              </div>

              {/* Price per gram for weighable products */}
              {editingProduct.is_weighable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço por grama (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={editingProduct.pricePerGram || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      pricePerGram: parseFloat(e.target.value) || 0
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.045"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Preço por kg: {editingProduct.pricePerGram ? formatPrice((editingProduct.pricePerGram || 0) * 1000) : 'R$ 0,00'}
                  </p>
                </div>
              )}

              {/* Product Sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanhos do Produto
                </label>
                <div className="space-y-3">
                  {editingProduct.sizes && editingProduct.sizes.length > 0 ? (
                    editingProduct.sizes.map((size, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                            <input
                              type="text"
                              value={size.name}
                              onChange={(e) => {
                                const newSizes = [...(editingProduct.sizes || [])];
                                newSizes[index] = { ...size, name: e.target.value };
                                setEditingProduct({ ...editingProduct, sizes: newSizes });
                              }}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              placeholder="Ex: Pequeno"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Preço (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={size.price}
                              onChange={(e) => {
                                const newSizes = [...(editingProduct.sizes || [])];
                                newSizes[index] = { ...size, price: parseFloat(e.target.value) || 0 };
                                setEditingProduct({ ...editingProduct, sizes: newSizes });
                              }}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Volume (ml)</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="0"
                                value={size.ml || ''}
                                onChange={(e) => {
                                  const newSizes = [...(editingProduct.sizes || [])];
                                  newSizes[index] = { ...size, ml: parseInt(e.target.value) || undefined };
                                  setEditingProduct({ ...editingProduct, sizes: newSizes });
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                placeholder="500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newSizes = editingProduct.sizes?.filter((_, i) => i !== index) || [];
                                  setEditingProduct({ ...editingProduct, sizes: newSizes });
                                }}
                                className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="Remover tamanho"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                          <input
                            type="text"
                            value={size.description || ''}
                            onChange={(e) => {
                              const newSizes = [...(editingProduct.sizes || [])];
                              newSizes[index] = { ...size, description: e.target.value };
                              setEditingProduct({ ...editingProduct, sizes: newSizes });
                            }}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Descrição opcional do tamanho"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">Nenhum tamanho configurado</p>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newSize = {
                        id: `size-${Date.now()}`,
                        name: '',
                        price: 0,
                        ml: undefined,
                        description: ''
                      };
                      const newSizes = [...(editingProduct.sizes || []), newSize];
                      setEditingProduct({ ...editingProduct, sizes: newSizes });
                    }}
                    className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus size={16} />
                    Adicionar Tamanho
                  </button>
                </div>
              </div>

              {/* Complement Groups */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupos de Complementos
                </label>
                <div className="space-y-4">
                  {editingProduct.complementGroups && editingProduct.complementGroups.length > 0 ? (
                    editingProduct.complementGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => {
                              const newGroups = [...(editingProduct.complementGroups || [])];
                              newGroups[groupIndex] = { ...group, name: e.target.value };
                              setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                            }}
                            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                            placeholder="Nome do grupo"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newGroups = editingProduct.complementGroups?.filter((_, i) => i !== groupIndex) || [];
                              setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                            }}
                            className="ml-2 p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Remover grupo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={group.required}
                                onChange={(e) => {
                                  const newGroups = [...(editingProduct.complementGroups || [])];
                                  newGroups[groupIndex] = { ...group, required: e.target.checked };
                                  setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                                }}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-sm font-medium text-gray-700">Obrigatório</span>
                            </label>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Mín. Itens</label>
                            <input
                              type="number"
                              min="0"
                              value={group.minItems}
                              onChange={(e) => {
                                const newGroups = [...(editingProduct.complementGroups || [])];
                                newGroups[groupIndex] = { ...group, minItems: parseInt(e.target.value) || 0 };
                                setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                              }}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Máx. Itens</label>
                            <input
                              type="number"
                              min="1"
                              value={group.maxItems}
                              onChange={(e) => {
                                const newGroups = [...(editingProduct.complementGroups || [])];
                                newGroups[groupIndex] = { ...group, maxItems: parseInt(e.target.value) || 1 };
                                setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                              }}
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Complementos</label>
                          <div className="space-y-2">
                            {group.complements.map((complement, compIndex) => (
                              <div key={compIndex} className="bg-white p-3 rounded border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                                    <input
                                      type="text"
                                      value={complement.name}
                                      onChange={(e) => {
                                        const newGroups = [...(editingProduct.complementGroups || [])];
                                        const newComplements = [...group.complements];
                                        newComplements[compIndex] = { ...complement, name: e.target.value };
                                        newGroups[groupIndex] = { ...group, complements: newComplements };
                                        setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                                      }}
                                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                      placeholder="Nome do complemento"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Preço (R$)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={complement.price}
                                      onChange={(e) => {
                                        const newGroups = [...(editingProduct.complementGroups || [])];
                                        const newComplements = [...group.complements];
                                        newComplements[compIndex] = { ...complement, price: parseFloat(e.target.value) || 0 };
                                        newGroups[groupIndex] = { ...group, complements: newComplements };
                                        setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                                      }}
                                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Ações</label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newGroups = [...(editingProduct.complementGroups || [])];
                                        const newComplements = group.complements.filter((_, i) => i !== compIndex);
                                        newGroups[groupIndex] = { ...group, complements: newComplements };
                                        setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                                      }}
                                      className="w-full p-2 text-red-600 hover:bg-red-100 rounded transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Trash2 size={14} />
                                      Remover
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                                  <input
                                    type="text"
                                    value={complement.description || ''}
                                    onChange={(e) => {
                                      const newGroups = [...(editingProduct.complementGroups || [])];
                                      const newComplements = [...group.complements];
                                      newComplements[compIndex] = { ...complement, description: e.target.value };
                                      newGroups[groupIndex] = { ...group, complements: newComplements };
                                      setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                    placeholder="Descrição opcional"
                                  />
                                </div>
                              </div>
                            ))}
                            
                            <button
                              type="button"
                              onClick={() => {
                                const newComplement = {
                                  id: `comp-${Date.now()}`,
                                  name: '',
                                  price: 0,
                                  description: ''
                                };
                                const newGroups = [...(editingProduct.complementGroups || [])];
                                const newComplements = [...group.complements, newComplement];
                                newGroups[groupIndex] = { ...group, complements: newComplements };
                                setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                              }}
                              className="w-full bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <Plus size={14} />
                              Adicionar Complemento
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">Nenhum grupo de complementos configurado</p>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newGroup = {
                        id: `group-${Date.now()}`,
                        name: '',
                        required: false,
                        minItems: 0,
                        maxItems: 1,
                        complements: []
                      };
                      const newGroups = [...(editingProduct.complementGroups || []), newGroup];
                      setEditingProduct({ ...editingProduct, complementGroups: newGroups });
                    }}
                    className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus size={16} />
                    Adicionar Grupo de Complementos
                  </button>
                </div>
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
                  placeholder="Descreva o produto..."
                />
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disponibilidade
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Disponibilidade</label>
                    <select
                      value={editingProduct.availability?.type || 'always'}
                      onChange={(e) => {
                        const type = e.target.value as 'always' | 'scheduled' | 'specific_days';
                        setEditingProduct({
                          ...editingProduct,
                          availability: {
                            ...editingProduct.availability,
                            type
                          }
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="always">Sempre disponível</option>
                      <option value="scheduled">Horário programado</option>
                      <option value="specific_days">Dias específicos</option>
                    </select>
                  </div>
                  
                  {editingProduct.availability?.type === 'specific_days' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 mb-2">Dias da Semana</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'monday', label: 'Segunda' },
                          { key: 'tuesday', label: 'Terça' },
                          { key: 'wednesday', label: 'Quarta' },
                          { key: 'thursday', label: 'Quinta' },
                          { key: 'friday', label: 'Sexta' },
                          { key: 'saturday', label: 'Sábado' },
                          { key: 'sunday', label: 'Domingo' }
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingProduct.availability?.scheduledDays?.days?.[key as keyof typeof editingProduct.availability.scheduledDays.days] || false}
                              onChange={(e) => {
                                const availability = editingProduct.availability || { type: 'specific_days' as const };
                                const scheduledDays = availability.scheduledDays || {
                                  enabled: true,
                                  days: {
                                    monday: false,
                                    tuesday: false,
                                    wednesday: false,
                                    thursday: false,
                                    friday: false,
                                    saturday: false,
                                    sunday: false
                                  }
                                };
                                
                                setEditingProduct({
                                  ...editingProduct,
                                  availability: {
                                    ...availability,
                                    scheduledDays: {
                                      ...scheduledDays,
                                      days: {
                                        ...scheduledDays.days,
                                        [key]: e.target.checked
                                      }
                                    }
                                  }
                                });
                              }}
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="text-sm text-blue-700">{label}</span>
                          </label>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-blue-700 mb-1">Horário Início</label>
                          <input
                            type="time"
                            value={editingProduct.availability?.scheduledDays?.startTime || '00:00'}
                            onChange={(e) => {
                              const availability = editingProduct.availability || { type: 'specific_days' as const };
                              const scheduledDays = availability.scheduledDays || {
                                enabled: true,
                                days: {
                                  monday: false,
                                  tuesday: false,
                                  wednesday: false,
                                  thursday: false,
                                  friday: false,
                                  saturday: false,
                                  sunday: false
                                }
                              };
                              
                              setEditingProduct({
                                ...editingProduct,
                                availability: {
                                  ...availability,
                                  scheduledDays: {
                                    ...scheduledDays,
                                    startTime: e.target.value
                                  }
                                }
                              });
                            }}
                            className="w-full p-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-blue-700 mb-1">Horário Fim</label>
                          <input
                            type="time"
                            value={editingProduct.availability?.scheduledDays?.endTime || '23:59'}
                            onChange={(e) => {
                              const availability = editingProduct.availability || { type: 'specific_days' as const };
                              const scheduledDays = availability.scheduledDays || {
                                enabled: true,
                                days: {
                                  monday: false,
                                  tuesday: false,
                                  wednesday: false,
                                  thursday: false,
                                  friday: false,
                                  saturday: false,
                                  sunday: false
                                }
                              };
                              
                              setEditingProduct({
                                ...editingProduct,
                                availability: {
                                  ...availability,
                                  scheduledDays: {
                                    ...scheduledDays,
                                    endTime: e.target.value
                                  }
                                }
                              });
                            }}
                            className="w-full p-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.isActive !== false}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      isActive: e.target.checked
                    })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto ativo (visível no cardápio)
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingProduct.name.trim() || !editingProduct.description.trim()}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {saving ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save size={16} />
                    {isCreating ? 'Criar Produto' : 'Salvar Alterações'}
                  </>
                )}
              </button>
              {saving && <p className="text-xs text-gray-500 mt-1">Processando imagem e salvando dados...</p>}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedProductForSchedule && (
        <ProductScheduleModal
          product={selectedProductForSchedule}
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedProductForSchedule(null);
          }}
          onSave={handleSaveSchedule}
          currentSchedule={getProductSchedule(selectedProductForSchedule.id)}
        />
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <ImageUploadModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          onSelectImage={(imageUrl) => {
            handleImageSelect(imageUrl);
            setShowImageModal(false);
          }}
          currentImage={editingProduct?.image}
        />
      )}
    </div>
  );
};

export default ProductsPanel;