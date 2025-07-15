import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, ShoppingCart, Check, Info, Tag, Clock } from 'lucide-react';
import { Product, ProductSize, ComplementGroup, SelectedComplement, Complement } from '../../types/product';
import { isProductAvailable, getAvailabilityMessage } from '../../utils/availability';
import { useImageUpload } from '../../hooks/useImageUpload';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedSize?: ProductSize, quantity: number, observations?: string, selectedComplements?: SelectedComplement[]) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart 
}) => {
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    product.sizes ? product.sizes[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [selectedComplements, setSelectedComplements] = useState<SelectedComplement[]>([]);
  const [productImage, setProductImage] = useState<string | null>(null);
  const hasSetCustomImage = useRef<boolean>(false);

  const { getProductImage } = useImageUpload();
  
  // Fetch product image when component mounts or product changes
  useEffect(() => {
    const loadProductImage = async () => {
      try {
        const image = await getProductImage(product.id);
        // Only set the image if we haven't set a custom image yet
        if (image && !hasSetCustomImage.current) {
          setProductImage(image);
          hasSetCustomImage.current = true;
        }
      } catch (error) {
        console.error('Error loading product image:', error);
      }
    };
    
    loadProductImage();
  }, [product.id, getProductImage]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getCurrentPrice = () => {
    return selectedSize ? selectedSize.price : product.price;
  };

  const getComplementsPrice = () => {
    return selectedComplements.reduce((total, selected) => total + selected.complement.price, 0);
  };

  const getTotalPrice = () => {
    return (getCurrentPrice() + getComplementsPrice()) * quantity;
  };

  const handleComplementChange = (group: ComplementGroup, complementId: string, checked: boolean) => {
    setSelectedComplements(prev => {
      const groupSelections = prev.filter(s => s.groupId === group.id);
      
      if (checked) {
        // Verificar se pode adicionar mais itens
        if (groupSelections.length >= group.maxItems) {
          return prev;
        }
        
        const complement = group.complements.find(c => c.id === complementId);
        if (complement) {
          return [...prev, {
            groupId: group.id,
            complementId,
            complement
          }];
        }
      } else {
        // Remover item
        return prev.filter(s => !(s.groupId === group.id && s.complementId === complementId));
      }
      
      return prev;
    });
  };

  const handleRadioComplementChange = (group: ComplementGroup, complementId: string) => {
    setSelectedComplements(prev => {
      // Remove todas as seleções do grupo
      const withoutGroup = prev.filter(s => s.groupId !== group.id);
      
      const complement = group.complements.find(c => c.id === complementId);
      if (complement) {
        return [...withoutGroup, {
          groupId: group.id,
          complementId,
          complement
        }];
      }
      
      return withoutGroup;
    });
  };

  const isComplementSelected = (groupId: string, complementId: string) => {
    return selectedComplements.some(s => s.groupId === groupId && s.complementId === complementId);
  };

  const getGroupSelectionCount = (groupId: string) => {
    return selectedComplements.filter(s => s.groupId === groupId).length;
  };

  const canAddToCart = () => {
    if (!product.complementGroups) return true;
    
    return product.complementGroups.every(group => {
      const selectionCount = getGroupSelectionCount(group.id);
      return selectionCount >= group.minItems && selectionCount <= group.maxItems;
    });
  };

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, quantity, observations, selectedComplements);
    onClose();
    setQuantity(1);
    setObservations('');
    setSelectedComplements([]);
  };

  const isAvailable = isProductAvailable(product);
  const availabilityMessage = getAvailabilityMessage(product);

  // Use the fetched image or fall back to the default product image
  // Once we've set a custom image, we'll always use that
  const imageToShow = hasSetCustomImage.current && productImage ? productImage : product.image;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-xl relative">
        <div className="relative h-56 sm:h-64 overflow-hidden">
          <img
            src={imageToShow}
            alt={product.name}
            className="w-full h-full object-cover rounded-t-2xl transition-transform duration-700 hover:scale-105"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors shadow-md hover:shadow-lg"
          >
            <X size={20} />
          </button>
          
          {product.originalPrice && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md flex items-center gap-1.5">
              <Tag size={14} />
              <span>PROMOÇÃO</span>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white drop-shadow-md">{product.name}</h2>
          </div>
        </div>

        <div className="p-6 pt-4">
          <div className="mb-5">
            <p className="text-gray-600 mb-3">{product.description}</p>
            
            {/* Status de Disponibilidade */}
            <div className={`flex items-center gap-2 text-sm mb-4 ${
              isAvailable ? 'text-green-600' : 'text-red-600'
            }`}>
              <Check size={16} />
              <span className="font-medium">{availabilityMessage}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                {formatPrice(getCurrentPrice())}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-500 line-through flex items-center gap-1">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Seleção de Tamanho */}
          {product.sizes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <span className="text-sm font-bold">1</span>
                </div>
                Escolha o tamanho:
              </h3>
              <div className="space-y-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedSize?.id === size.id
                        ? 'border-purple-500 bg-purple-50 shadow-md transform scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <div className="font-medium text-gray-800">{size.name}</div>
                        {size.description && (
                          <div className="text-sm text-gray-500">{size.description}</div>
                        )}
                      </div>
                      <div className="font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        {formatPrice(size.price)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grupos de Complementos */}
          {product.complementGroups && product.complementGroups.map((group, groupIndex) => (
            <div key={group.id} className="mb-8">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <span className="text-sm font-bold">{groupIndex + 2}</span>
                  </div>
                  {group.name}
                </h3>
                <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {getGroupSelectionCount(group.id)}/{group.maxItems}
                </span>
              </div>
              
              {group.required && (
                <div className="flex items-center gap-2 mb-3 bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                  <Info size={16} />
                  <p className="text-sm font-medium">Seleção obrigatória</p>
                </div>
              )}
              
              <div className="space-y-2">
                {group.complements.map((complement) => {
                  const isSelected = isComplementSelected(group.id, complement.id);
                  const groupCount = getGroupSelectionCount(group.id);
                  const canSelect = groupCount < group.maxItems || isSelected;
                  const isRadio = group.maxItems === 1;
                  
                  return (
                    <label
                      key={complement.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-green-500 bg-green-50 shadow-sm transform scale-[1.01]'
                          : canSelect
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type={isRadio ? 'radio' : 'checkbox'}
                          name={`group-${group.id}`}
                          checked={isSelected}
                          disabled={!canSelect && !isRadio}
                          onChange={(e) => {
                            if (isRadio) {
                              // For radio buttons, always call the handler regardless of checked state
                              // This allows deselection by clicking again
                              handleRadioComplementChange(group, complement.id);
                            } else {
                              handleComplementChange(group, complement.id, e.target.checked);
                            }
                          }}
                          className={`w-4 h-4 ${isRadio ? 'text-purple-600' : 'text-green-600'}`}
                        />
                        <div>
                          <div className="font-medium text-gray-800 leading-tight">{complement.name}</div>
                          {complement.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{complement.description}</div>
                          )}
                        </div>
                      </div>
                      <div className={`font-bold ${complement.price > 0 ? 'text-amber-600' : 'text-green-600'} text-sm px-2 py-1 rounded-full ${complement.price > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                        {complement.price > 0 ? formatPrice(complement.price) : '✓ Grátis'}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Observações */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <span className="text-sm font-bold">{(product.complementGroups?.length || 0) + 2}</span>
              </div>
              Observações:
            </h3>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Sem açúcar, mais granola..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400"
            />
          </div>

          {/* Quantidade */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <span className="text-sm font-bold">{(product.complementGroups?.length || 0) + 3}</span>
              </div>
              Quantidade:
            </h3>
            <div className="flex items-center justify-center gap-6 bg-gray-50 py-4 rounded-xl">
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-white hover:bg-gray-100 border border-gray-300 rounded-l-lg p-3 transition-colors"
                >
                  <Minus size={20} className="text-gray-600" />
                </button>
                <span className="text-xl font-bold w-16 text-center border-t border-b border-gray-300 py-3 bg-white text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-white hover:bg-gray-100 border border-gray-300 rounded-r-lg p-3 transition-colors"
                >
                  <Plus size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Resumo do Preço */}
          {getComplementsPrice() > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2 pb-1 border-b border-gray-200">Resumo do Pedido</h4>
              <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Produto base:
                </span>
                <span className="font-medium">{formatPrice(getCurrentPrice())}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Complementos:
                </span>
                <span className="font-medium">{formatPrice(getComplementsPrice())}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Quantidade:
                </span>
                <span className="font-medium">{quantity}x</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-800 pt-2 mt-1 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-lg text-green-600">{formatPrice(getTotalPrice())}</span>
              </div>
            </div>
          )}

          {/* Botão Adicionar */}
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart() || !isAvailable}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
              !canAddToCart() || !isAvailable
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-80'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transform hover:scale-[1.01]'
            }`}
          >
            <ShoppingCart size={22} className="animate-bounce" />
            {!canAddToCart() 
              ? 'Complete as opções obrigatórias ⚠️'
              : `Adicionar ao Carrinho - ${formatPrice(getTotalPrice())}`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;