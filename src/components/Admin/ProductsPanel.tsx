import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product, ComplementGroup, Complement as ComplementType, ScheduledDays } from '../../types/product';
import { useImageUpload } from '../../hooks/useImageUpload';
import ImageUploadModal from './ImageUploadModal';

interface ProductsPanelProps {
  onClose?: () => void;
}

// Rename to avoid conflict with the imported type
interface Complement extends ComplementType {
  isActive?: boolean;
}

export default function ProductsPanel({ onClose }: ProductsPanelProps) {
  const [productList, setProductList] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [showDaySelector, setShowDaySelector] = useState(false);
  const { getProductImage } = useImageUpload();

  const dayLabels = {
    monday: 'Seg',
    tuesday: 'Ter',
    wednesday: 'Qua',
    thursday: 'Qui',
    friday: 'Sex',
    saturday: 'Sáb',
    sunday: 'Dom'
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Load product images
  useEffect(() => {
    const loadProductImages = async () => {
      const images: Record<string, string> = {};
      
      for (const product of productList) {
        try {
          const imageUrl = await getProductImage(product.id);
          if (imageUrl) {
            images[product.id] = imageUrl;
          }
        } catch (error) {
          console.error(`Error loading image for product ${product.id}:`, error);
        }
      }
      
      setProductImages(images);
    };
    
    if (productList.length > 0) {
      loadProductImages();
    }
  }, [productList, getProductImage]);

  const loadProducts = async () => {
    try {
      // Load products from data/products.ts instead of database
      const { products } = await import('../../data/products');
      setProductList(products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      // In a real implementation, this would save to a database
      // For now, we'll just update the local state
      if (isCreating) {
        setProductList(prev => [...prev, editingProduct]);
      } else {
        setProductList(prev => 
          prev.map(p => p.id === editingProduct.id ? editingProduct : p)
        );
      }
      
      alert(isCreating ? 'Produto criado com sucesso!' : 'Produto atualizado com sucesso!');
      setEditingProduct(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      setProductList(prev => prev.filter(p => p.id !== productId));
      alert('Produto excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erro ao excluir produto');
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingProduct({
      id: `product-${Date.now()}`,
      name: '',
      category: 'acai',
      price: 0,
      description: '',
      image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
      complementGroups: [],
      isActive: true,
      scheduledDays: {
        enabled: false,
        days: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true
        },
        startTime: '00:00',
        endTime: '23:59'
      }
    });
  };

  const addComplementGroup = () => {
    if (!editingProduct) return;
    
    const newGroup: ComplementGroup = {
      id: `group-${Date.now()}`,
      name: 'Novo Grupo',
      required: false,
      minItems: 0,
      maxItems: 1,
      complements: []
    };
    
    setEditingProduct({
      ...editingProduct,
      complementGroups: [...(editingProduct.complementGroups || []), newGroup]
    });
  };

  const updateComplementGroup = (groupIndex: number, updates: Partial<ComplementGroup>) => {
    if (!editingProduct || !editingProduct.complementGroups) return;
    
    const updatedGroups = [...editingProduct.complementGroups];
    updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], ...updates };
    
    setEditingProduct({
      ...editingProduct,
      complementGroups: updatedGroups
    });
  };

  const removeComplementGroup = (groupIndex: number) => {
    if (!editingProduct || !editingProduct.complementGroups) return;
    
    const updatedGroups = editingProduct.complementGroups.filter((_, index) => index !== groupIndex);
    
    setEditingProduct({
      ...editingProduct,
      complementGroups: updatedGroups
    });
  };

  const addComplement = (groupIndex: number) => {
    if (!editingProduct || !editingProduct.complementGroups) return;
    
    const newComplement: Complement = {
      id: `complement-${Date.now()}`,
      name: 'Novo Complemento',
      price: 0,
      description: '',
      isActive: true
    };
    
    const updatedGroups = [...editingProduct.complementGroups];
    updatedGroups[groupIndex].complements = [
      ...updatedGroups[groupIndex].complements,
      newComplement
    ];
    
    setEditingProduct({
      ...editingProduct,
      complementGroups: updatedGroups
    });
  };

  const updateComplement = (groupIndex: number, complementIndex: number, updates: Partial<Complement>) => {
    if (!editingProduct || !editingProduct.complementGroups) return;
    
    const updatedGroups = [...editingProduct.complementGroups];
    const complement = updatedGroups[groupIndex].complements[complementIndex];
    updatedGroups[groupIndex].complements[complementIndex] = {
      ...complement,
      ...updates
    };
    
    setEditingProduct({
      ...editingProduct,
      complementGroups: updatedGroups
    });
  };

  const removeComplement = (groupIndex: number, complementIndex: number) => {
    if (!editingProduct || !editingProduct.complementGroups) return;
    
    const updatedGroups = [...editingProduct.complementGroups];
    updatedGroups[groupIndex].complements = updatedGroups[groupIndex].complements.filter(
      (_, index) => index !== complementIndex
    );
    
    setEditingProduct({
      ...editingProduct,
      complementGroups: updatedGroups
    });
  };

  const toggleDayAvailability = (day: keyof ScheduledDays['days']) => {
    if (!editingProduct || !editingProduct.scheduledDays) return;
    
    setEditingProduct({
      ...editingProduct,
      scheduledDays: {
        ...editingProduct.scheduledDays,
        days: {
          ...editingProduct.scheduledDays.days,
          [day]: !editingProduct.scheduledDays.days[day]
        }
      }
    });
  };

  const toggleDayScheduling = (enabled: boolean) => {
    if (!editingProduct) return;
    
    setEditingProduct({
      ...editingProduct,
      scheduledDays: {
        ...(editingProduct.scheduledDays || {
          days: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true
          },
          startTime: '00:00',
          endTime: '23:59'
        }),
        enabled
      }
    });
  };

  const filteredProducts = productList.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Renderização do formulário de edição
  if (editingProduct) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isCreating ? 'Novo Produto' : 'Editar Produto'}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
            >
              <Save size={16} /> Salvar
            </button>
            <button 
              onClick={() => { 
                setEditingProduct(null); 
                setIsCreating(false); 
              }} 
              className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-600"
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={editingProduct.name}
              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select
              className="w-full p-2 border rounded"
              value={editingProduct.category}
              onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
            >
              <option value="acai">Açaí</option>
              <option value="combo">Combos</option>
              <option value="milkshake">Milkshakes</option>
              <option value="vitamina">Vitaminas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full p-2 border rounded"
              value={editingProduct.price || 0}
              onChange={(e) => setEditingProduct({ 
                ...editingProduct, 
                price: parseFloat(e.target.value) || 0 
              })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preço Original (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full p-2 border rounded"
              value={editingProduct.originalPrice || 0}
              onChange={(e) => setEditingProduct({ 
                ...editingProduct, 
                originalPrice: parseFloat(e.target.value) || 0 
              })}
            />
            <p className="text-xs text-gray-500 mt-1">Deixe em branco se não for um produto em promoção</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              className="w-full p-2 border rounded"
              rows={3}
              value={editingProduct.description || ''}
              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Imagem do Produto</label>
            <div className="flex items-center gap-4">
              <img
                src={productImages[editingProduct.id] || editingProduct.image || 'https://via.placeholder.com/100?text=Sem+Imagem'}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-gray-300"
              />
              <button
                onClick={() => setShowImageUpload(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Alterar Imagem
              </button>
            </div>
          </div>

          {/* Day Availability */}
          <div className="md:col-span-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Disponibilidade por Dias</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduct.scheduledDays?.enabled || false}
                  onChange={(e) => toggleDayScheduling(e.target.checked)}
                />
                <span className="text-sm font-medium">
                  {editingProduct.scheduledDays?.enabled ? 'Ativo' : 'Inativo'}
                </span>
              </label>
            </div>
            
            {editingProduct.scheduledDays?.enabled && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(dayLabels).map(([day, label]) => {
                    const isSelected = editingProduct.scheduledDays?.days[day as keyof ScheduledDays['days']] || false;
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDayAvailability(day as keyof ScheduledDays['days'])}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          isSelected 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title={isSelected ? `Disponível ${label}` : `Indisponível ${label}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Horário de Início</label>
                    <input
                      type="time"
                      value={editingProduct.scheduledDays?.startTime || '00:00'}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        scheduledDays: {
                          ...editingProduct.scheduledDays!,
                          startTime: e.target.value
                        }
                      })}
                      className="w-full p-1.5 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Horário de Fim</label>
                    <input
                      type="time"
                      value={editingProduct.scheduledDays?.endTime || '23:59'}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        scheduledDays: {
                          ...editingProduct.scheduledDays!,
                          endTime: e.target.value
                        }
                      })}
                      className="w-full p-1.5 border rounded text-sm"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  O produto só estará disponível nos dias selecionados, durante o horário especificado.
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingProduct.isActive !== false}
                onChange={(e) => setEditingProduct({ 
                  ...editingProduct, 
                  isActive: e.target.checked 
                })}
              />
              <span className="text-sm font-medium">Produto ativo</span>
            </label>
          </div>
        </div>

        {/* Complement Groups Section */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Grupos de Complementos</h3>
            <button
              onClick={addComplementGroup}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-blue-700"
            >
              <Plus size={14} /> Novo Grupo de Complementos
            </button>
          </div>

          {editingProduct.complementGroups && editingProduct.complementGroups.length > 0 ? (
            <ul className="space-y-6 pl-0">
              {editingProduct.complementGroups.map((group, groupIndex) => (
                <li key={group.id} className="border rounded-lg p-4 bg-gray-50 list-none">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-3 w-full">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome do Grupo</label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded"
                          value={group.name}
                          onChange={(e) => updateComplementGroup(groupIndex, { name: e.target.value })}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={(e) => updateComplementGroup(groupIndex, { required: e.target.checked })}
                          />
                          <span className="text-sm">Obrigatório</span>
                        </label>
                        
                        <div>
                          <label className="text-sm mr-2">Mínimo:</label>
                          <input
                            type="number"
                            min="0"
                            className="w-16 p-1 border rounded"
                            value={group.minItems}
                            onChange={(e) => updateComplementGroup(groupIndex, { minItems: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm mr-2">Máximo:</label>
                          <input
                            type="number"
                            min="0"
                            className="w-16 p-1 border rounded"
                            value={group.maxItems}
                            onChange={(e) => updateComplementGroup(groupIndex, { maxItems: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeComplementGroup(groupIndex)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remover grupo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">Complementos ({group.complements.length})</h4>
                      <button
                        onClick={() => addComplement(groupIndex)}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-green-700"
                      >
                        <Plus size={12} /> Novo Complemento
                      </button>
                    </div>
                    
                    {group.complements.length > 0 ? (
                      <ul className="space-y-2 pl-0">
                        {group.complements.map((complement, complementIndex) => (
                          <li key={complement.id} className="bg-white border rounded p-3 list-none">
                            <div className="flex justify-between items-start">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Nome</label>
                                  <input
                                    type="text"
                                    className="w-full p-1.5 border rounded text-sm"
                                    value={complement.name}
                                    onChange={(e) => updateComplement(groupIndex, complementIndex, { name: e.target.value })}
                                  />
                                </div>
                               
                               <div>
                                 <label className="flex items-center gap-2 text-xs font-medium mb-1">
                                   <input
                                     type="checkbox"
                                     checked={complement.isActive !== false}
                                     onChange={(e) => updateComplement(groupIndex, complementIndex, { 
                                       isActive: e.target.checked 
                                     })}
                                     className="w-3 h-3"
                                   />
                                   <span className={complement.isActive !== false ? "text-green-600" : "text-gray-500"}>
                                     {complement.isActive !== false ? "Ativo" : "Inativo"}
                                   </span>
                                 </label>
                               </div>
                                
                                <div>
                                  <label className="block text-xs font-medium mb-1">Descrição</label>
                                  <input
                                    type="text"
                                    className="w-full p-1.5 border rounded text-sm"
                                    value={complement.description || ''}
                                    onChange={(e) => updateComplement(groupIndex, complementIndex, { description: e.target.value })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium mb-1">Preço (R$)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-full p-1.5 border rounded text-sm"
                                    value={complement.price || 0}
                                    onChange={(e) => updateComplement(groupIndex, complementIndex, { price: parseFloat(e.target.value) || 0 })}
                                  />
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeComplement(groupIndex, complementIndex)}
                                className="text-red-500 hover:text-red-700 p-1 ml-2"
                                title="Remover complemento"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Nenhum complemento adicionado</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">Nenhum grupo de complementos adicionado</p>
              <button
                onClick={addComplementGroup}
                className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 mx-auto hover:bg-blue-700"
              >
                <Plus size={14} /> Adicionar Grupo
              </button>
            </div>
          )}
        </div>

        {/* Image Upload Modal */}
        {showImageUpload && editingProduct && (
          <ImageUploadModal
            isOpen={showImageUpload}
            onClose={() => setShowImageUpload(false)}
            onSelectImage={(imageUrl) => {
              setEditingProduct({
                ...editingProduct,
                image: imageUrl
              });
              setProductImages({
                ...productImages,
                [editingProduct.id]: imageUrl
              });
            }}
            currentImage={productImages[editingProduct.id] || editingProduct.image}
          />
        )}
      </div>
    );
  }

  // Renderização da lista de produtos
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Produtos</h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Buscar produtos..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{product.name}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {product.category}
              </span>
            </div>
            
            <div className="mb-2">
              <img 
                src={productImages[product.id] || product.image} 
                alt={product.name}
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
            
            <p className="text-sm text-gray-700 mb-2">
              {product.description}
            </p>
            
            <div className="text-sm mb-3">
              <strong>Preço: </strong>
              R$ {product.price.toFixed(2)}
              {product.originalPrice && product.originalPrice > product.price ? (
                <span className="ml-2 line-through text-gray-500">
                  R$ {product.originalPrice.toFixed(2)}
                </span>
              ) : null}
            </div>
            
            <div className="text-sm mb-3">
              <strong>Complementos: </strong>
              {product.complementGroups ? product.complementGroups.length : 0} grupos
            </div>

            <div className="text-sm mb-3">
              <strong>Disponibilidade: </strong>
              {product.scheduledDays?.enabled ? (
                <span className="text-green-600">Dias específicos</span>
              ) : (
                <span className="text-gray-600">Todos os dias</span>
              )}
              {product.scheduledDays?.enabled && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(dayLabels).map(([day, label]) => {
                    const isAvailable = product.scheduledDays?.days[day as keyof ScheduledDays['days']];
                    return (
                      <span 
                        key={day}
                        className={`inline-block w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                          isAvailable 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={isAvailable ? `Disponível ${label}` : `Indisponível ${label}`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => { 
                  setIsCreating(false); 
                  setEditingProduct(product); 
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-blue-600"
              >
                <Edit2 size={14} /> Editar
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-red-600"
              >
                <Trash2 size={14} /> Excluir
              </button>
              <button
                onClick={() => {
                  // Toggle isActive property
                  setProductList(prev => 
                    prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p)
                  );
                }}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                  product.isActive !== false
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
                title={product.isActive !== false ? "Desativar produto" : "Ativar produto"}
              >
                {product.isActive !== false ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ativo
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    Inativo
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado.'}
        </div>
      )}
    </div>
  );
}