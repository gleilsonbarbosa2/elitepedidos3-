```typescript
import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Package, Scale, Eye, EyeOff, Image as ImageIcon, Upload, X, Check, AlertCircle, RefreshCw, PlusCircle, MinusCircle, Save, Calendar, Clock } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import ImageUploadModal from './ImageUploadModal';
import ProductScheduleModal from './ProductScheduleModal';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedProductForSchedule, setSelectedProductForSchedule] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [localComplementGroups, setLocalComplementGroups] = useState<any[]>([]);
  const [localSizes, setLocalSizes] = useState<any[]>([]);

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

  // Complementos padrão para Açaí
  const standardAcaiComplementGroups = [
    {
      id: 'tipo-acai',
      name: 'TIPO DE AÇAÍ (ESCOLHA 1 ITEM)',
      required: true,
      minItems: 1,
      maxItems: 1,
      complements: [
        { id: 'acai-tradicional', name: 'AÇAÍ PREMIUM TRADICIONAL', price: 0, description: 'Açaí tradicional premium' },
        { id: 'acai-fit', name: 'AÇAÍ PREMIUM (0% AÇÚCAR - FIT)', price: 0, description: 'Açaí sem açúcar, ideal para dieta' },
        { id: 'acai-morango', name: 'AÇAÍ PREMIUM COM MORANGO', price: 0, description: 'Açaí premium com sabor morango' }
      ]
    },
    {
      id: 'quantidade-acai',
      name: 'COMO DESEJA A QUANTIDADE DE AÇAÍ?',
      required: true,
      minItems: 1,
      maxItems: 1,
      complements: [
        { id: 'mais-acai', name: 'MAIS AÇAÍ', price: 0, description: 'Quantidade extra de açaí' },
        { id: 'nao-quero-acai', name: 'NÃO QUERO AÇAÍ', price: 0, description: 'Sem açaí' },
        { id: 'menos-acai', name: 'MENOS AÇAÍ', price: 0, description: 'Quantidade reduzida de açaí' },
        { id: 'quantidade-normal', name: 'QUANTIDADE NORMAL', price: 0, description: 'Quantidade padrão de açaí' }
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
        { id: 'creme-nutela', name: 'CREME DE NUTELA', price: 0, description: 'Creme de nutella' },
        { id: 'creme-maracuja', name: 'CREME DE MARACUJÁ', price: 0, description: 'Creme azedinho de maracujá' },
        { id: 'creme-pacoca', name: 'CREME DE PAÇOCA', price: 0, description: 'Creme de paçoca' },
        { id: 'creme-ovomaltine', name: 'CREME DE OVOMALTINE', price: 0, description: 'Creme de ovomaltine' },
        { id: 'creme-coco', name: 'CREME DE COCO', price: 0, description: 'Creme de coco' },
        { id: 'creme-morangotela', name: 'CREME MORANGOTELA', price: 0, description: 'Morango+Nutela' },
        { id: 'creme-pistache', name: 'CREME DE PISTACHE', price: 0, description: 'Creme de pistache' }
      ]
    },
    {
      id: 'adicionais-3',
      name: '3 ADICIONAIS * OPCIONAL (ATÉ 3 ITENS)',
      required: false,
      minItems: 0,
      maxItems: 3,
      complements: [
        { id: 'castanha-banda', name: 'CASTANHA EM BANDA', price: 0, description: 'Castanha em fatias' },
        { id: 'cereja', name: 'CEREJA', price: 0, description: 'Cereja doce' },
        { id: 'chocoball-mine', name: 'CHOCOBALL MINE', price: 0, description: 'Chocoball pequeno' },
        { id: 'chocoball-power', name: 'CHOCOBALL POWER', price: 0, description: 'Chocoball grande' },
        { id: 'creme-cookies-branco', name: 'CREME DE COOKIES BRANCO', price: 0, description: 'Creme de cookies branco' },
        { id: 'chocolate-avela', name: 'CHOCOLATE COM AVELÃ (NUTELA)', price: 0, description: 'Chocolate com avelã' },
        { id: 'cobertura-chocolate', name: 'COBERTURA DE CHOCOLATE', price: 0, description: 'Cobertura de chocolate' },
        { id: 'cobertura-morango', name: 'COBERTURA DE MORANGO', price: 0, description: 'Cobertura de morango' },
        { id: 'cobertura-fine-dentadura', name: 'COBERTURA FINE DENTADURA', price: 0, description: 'Cobertura fine dentadura' },
        { id: 'cobertura-fine-bananinha', name: 'COBERTURA FINE BANANINHA', price: 0, description: 'Cobertura fine bananinha' },
        { id: 'cobertura-fine-beijinho', name: 'COBERTURA FINE BEIJINHO', price: 0, description: 'Cobertura fine beijinho' },
        { id: 'ganache-meio-amargo', name: 'GANACHE MEIO AMARGO', price: 0, description: 'Ganache meio amargo' },
        { id: 'gotas-chocolate-preto', name: 'GOTAS DE CHOCOLATE PRETO', price: 0, description: 'Gotas de chocolate preto' },
        { id: 'granulado-chocolate', name: 'GRANULADO DE CHOCOLATE', price: 0, description: 'Granulado de chocolate' },
        { id: 'granola', name: 'GRANOLA', price: 0, description: 'Granola crocante' },
        { id: 'jujuba', name: 'JUJUBA', price: 0, description: 'Jujuba colorida' },
        { id: 'kiwi', name: 'KIWI', price: 0, description: 'Kiwi fatiado' },
        { id: 'leite-condensado', name: 'LEITE CONDENSADO', price: 0, description: 'Leite condensado' },
        { id: 'leite-po', name: 'LEITE EM PÓ', price: 0, description: 'Leite em pó' },
        { id: 'marshmallows', name: 'MARSHMALLOWS', price: 0, description: 'Marshmallows macios' },
        { id: 'mms', name: 'MMS', price: 0, description: 'Confetes coloridos' },
        { id: 'morango', name: 'MORANGO', price: 0, description: 'Morango fresco' },
        { id: 'pacoca', name: 'PAÇOCA', price: 0, description: 'Paçoca triturada' },
        { id: 'recheio-leitinho', name: 'RECHEIO LEITINHO', price: 0, description: 'Recheio de leitinho' },
        { id: 'sucrilhos', name: 'SUCRILHOS', price: 0, description: 'Sucrilhos crocantes' },
        { id: 'uva', name: 'UVA', price: 0, description: 'Uva fresca' },
        { id: 'uva-passas', name: 'UVA PASSAS', price: 0, description: 'Uva passas' },
        { id: 'flocos-tapioca', name: 'FLOCOS DE TAPIOCA CARAMELIZADO', price: 0, description: 'Flocos de tapioca caramelizado' },
        { id: 'canudos', name: 'CANUDOS', price: 0, description: 'Canudos crocantes' },
        { id: 'ovomaltine', name: 'OVOMALTINE', price: 0, description: 'Ovomaltine em pó' },
        { id: 'farinha-lactea', name: 'FARINHA LÁCTEA', price: 0, description: 'Farinha láctea' },
        { id: 'abacaxi-vinho', name: 'ABACAXI AO VINHO', price: 0, description: 'Abacaxi ao vinho' },
        { id: 'amendoim-colorido', name: 'AMENDOIM COLORIDO', price: 0, description: 'Amendoim colorido' },
        { id: 'fine-beijinho', name: 'FINE BEIJINHO', price: 0, description: 'Fine beijinho' },
        { id: 'fine-amora', name: 'FINE AMORA', price: 0, description: 'Fine amora' },
        { id: 'fine-dentadura', name: 'FINE DENTADURA', price: 0, description: 'Fine dentadura' },
        { id: 'neston-flocos', name: 'NESTON EM FLOCOS', price: 0, description: 'Neston em flocos' },
        { id: 'recheio-ferrero', name: 'RECHEIO FERRERO ROCHÊ', price: 0, description: 'Recheio ferrero rochê' },
        { id: 'aveia-flocos', name: 'AVEIA EM FLOCOS', price: 0, description: 'Aveia em flocos' },
        { id: 'ganache-leite', name: 'GANACHE CHOCOLATE AO LEITE', price: 0, description: 'Ganache chocolate ao leite' },
        { id: 'chocoboll-branco', name: 'CHOCOBOLL BOLA BRANCA', price: 0, description: 'Chocoboll bola branca' },
        { id: 'morango-caldas', name: 'MORANGO EM CALDAS', price: 0, description: 'Morango em caldas' },
        { id: 'doce-leite', name: 'DOCE DE LEITE', price: 0, description: 'Doce de leite' },
        { id: 'chocowafer-branco', name: 'CHOCOWAFER BRANCO', price: 0, description: 'Chocowafer branco' },
        { id: 'creme-cookies-preto', name: 'CREME DE COOKIES PRETO', price: 0, description: 'Creme de cookies preto' },
        { id: 'pasta-amendoim', name: 'PASTA DE AMENDOIM', price: 0, description: 'Pasta de amendoim' },
        { id: 'recheio-leitinho', name: 'RECHEIO DE LEITINHO', price: 0, description: 'Recheio de leitinho' },
        { id: 'beijinho', name: 'BEIJINHO', price: 0, description: 'Beijinho' },
        { id: 'brigadeiro', name: 'BRIGADEIRO', price: 0, description: 'Brigadeiro' },
        { id: 'porcoes-brownie', name: 'PORÇÕES DE BROWNIE', price: 0, description: 'Porções de brownie' },
        { id: 'raspas-chocolate', name: 'RASPAS DE CHOCOLATE', price: 0, description: 'Raspas de chocolate' },
        { id: 'recheio-ferrero', name: 'RECHEIO DE FERREIRO ROCHÊ', price: 0, description: 'Recheio de ferreiro rochê' }
      ]
    },
    {
      id: 'adicionais-10',
      name: '10 ADICIONAIS * OPCIONAL (ATÉ 10 ITENS)',
      required: false,
      minItems: 0,
      maxItems: 10,
      complements: [
        { id: 'amendoin-pago', name: 'AMENDOIN', price: 2.00, description: 'Amendoim torrado' },
        { id: 'castanha-banda-pago', name: 'CASTANHA EM BANDA', price: 3.00, description: 'Castanha em fatias' },
        { id: 'cereja-pago', name: 'CEREJA', price: 2.00, description: 'Cereja doce' },
        { id: 'chocoball-mine-pago', name: 'CHOCOBALL MINE', price: 2.00, description: 'Chocoball pequeno' },
        { id: 'chocoball-power-pago', name: 'CHOCOBALL POWER', price: 2.00, description: 'Chocoball grande' },
        { id: 'creme-cookies-pago', name: 'CREME DE COOKIES', price: 3.00, description: 'Creme de cookies' },
        { id: 'chocolate-avela-pago', name: 'CHOCOLATE COM AVELÃ (NUTELA)', price: 3.00, description: 'Chocolate com avelã' },
        { id: 'cobertura-chocolate-pago', name: 'COBERTURA DE CHOCOLATE', price: 2.00, description: 'Cobertura de chocolate' },
        { id: 'cobertura-morango-pago', name: 'COBERTURA DE MORANGO', price: 2.00, description: 'Cobertura de morango' },
        { id: 'ganache-meio-amargo-pago', name: 'GANACHE MEIO AMARGO', price: 2.00, description: 'Ganache meio amargo' },
        { id: 'granola-pago', name: 'GRANOLA', price: 2.00, description: 'Granola crocante' },
        { id: 'gotas-chocolate-pago', name: 'GOTAS DE CHOCOLATE', price: 3.00, description: 'Gotas de chocolate' },
        { id: 'granulado-chocolate-pago', name: 'GRANULADO DE CHOCOLATE', price: 2.00, description: 'Granulado de chocolate' },
        { id: 'jujuba-pago', name: 'JUJUBA', price: 2.00, description: 'Jujuba colorida' },
        { id: 'kiwi-pago', name: 'KIWI', price: 3.00, description: 'Kiwi fatiado' },
        { id: 'leite-condensado-pago', name: 'LEITE CONDENSADO', price: 2.00, description: 'Leite condensado' },
        { id: 'leite-po-pago', name: 'LEITE EM PÓ', price: 3.00, description: 'Leite em pó' },
        { id: 'marshmallows-pago', name: 'MARSHMALLOWS', price: 2.00, description: 'Marshmallows macios' },
        { id: 'mms-pago', name: 'MMS', price: 2.00, description: 'Confetes coloridos' },
        { id: 'morango-pago', name: 'MORANGO', price: 3.00, description: 'Morango fresco' },
        { id: 'pacoca-pago', name: 'PAÇOCA', price: 2.00, description: 'Paçoca triturada' },
        { id: 'recheio-ninho-pago', name: 'RECHEIO DE NINHO', price: 2.00, description: 'Recheio de ninho' },
        { id: 'uva-pago', name: 'UVA', price: 2.00, description: 'Uva fresca' },
        { id: 'uva-passas-pago', name: 'UVA PASSAS', price: 2.00, description: 'Uva passas' },
        { id: 'cobertura-fine-dentadura-pago', name: 'COBERTURA FINE DENTADURA', price: 2.00, description: 'Cobertura fine dentadura' },
        { id: 'cobertura-fine-beijinho-pago', name: 'COBERTURA FINE BEIJINHO', price: 2.00, description: 'Cobertura fine beijinho' },
        { id: 'cobertura-fine-bananinha-pago', name: 'COBERTURA FINE BANANINHA', price: 2.00, description: 'Cobertura fine bananinha' }
      ]
    },
    {
      id: 'opcionais-separados',
      name: 'VOCÊ PREFERE OS OPCIONAIS SEPARADOS OU JUNTO COM O AÇAÍ?',
      required: true,
      minItems: 1,
      maxItems: 1,
      complements: [
        { id: 'tudo-junto', name: 'SIM, QUERO TUDO JUNTO', price: 0, description: 'Misturar tudo com o açaí' },
        { id: 'separados', name: 'NÃO, QUERO SEPARADOS', price: 0, description: 'Servir os complementos separadamente' }
      ]
    },
    {
      id: 'colher-descartavel',
      name: 'CONSUMA MENOS DESCARTÁVEIS.',
      required: true,
      minItems: 1,
      maxItems: 1,
      complements: [
        { id: 'sim-colher', name: 'SIM, VOU QUERER A COLHER', price: 0, description: 'Incluir colher descartável' },
        { id: 'nao-colher', name: 'NÃO QUERO COLHER, VOU AJUDAR AO MEIO AMBIENTE', price: 0, description: 'Sem colher, ajudando o meio ambiente' }
      ]
    }
  ];

  // Complementos específicos para vitaminas
  const vitaminaComplementGroups = [
    {
      id: 'opcoes-vitamina-acai',
      name: 'Opções de Vitamina de Açaí',
      required: false,
      minItems: 0,
      maxItems: 2,
      complements: [
        { id: 'amendoim', name: 'Amendoim', price: 0, description: 'Amendoim torrado' },
        { id: 'castanha-granulada', name: 'Castanha granulada', price: 0, description: 'Castanha granulada' },
        { id: 'cereja', name: 'Cereja', price: 0, description: 'Cereja doce' },
        { id: 'farinha-lactea', name: 'Farinha Láctea', price: 0, description: 'Farinha láctea' },
        { id: 'granola', name: 'Granola', price: 0, description: 'Granola crocante' },
        { id: 'leite-condensado', name: 'Leite condensado', price: 0, description: 'Leite condensado cremoso' },
        { id: 'mel', name: 'Mel', price: 0, description: 'Mel puro' }
      ]
    }
  ];

  const filteredProducts = React.useMemo(() => {
    let result = searchTerm ? searchProducts(searchTerm) : products;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result;
  }, [products, searchProducts, searchTerm, selectedCategory]);

  // Sync localComplementGroups and localSizes with editingProduct
  React.useEffect(() => {
    if (editingProduct) {
      try {
        setLocalComplementGroups(editingProduct.complement_groups ? JSON.parse(editingProduct.complement_groups) : []);
      } catch (e) {
        console.error("Erro ao parsear complement_groups:", e);
        setLocalComplementGroups([]);
      }
      try {
        setLocalSizes(editingProduct.sizes ? JSON.parse(editingProduct.sizes) : []);
      } catch (e) {
        console.error("Erro ao parsear sizes:", e);
        setLocalSizes([]);
      }
    } else {
      setLocalComplementGroups([]);
      setLocalSizes([]);
    }
  }, [editingProduct]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleCreate = () => {
    setEditingProduct({
      id: '',
      code: '',
      barcode: '',
      name: '',
      category: 'acai',
      is_weighable: false,
      unit_price: 0,
      price_per_gram: undefined,
      original_price: undefined,
      image_url: '',
      stock_quantity: 0,
      min_stock: 0,
      is_active: true,
      description: '',
      has_complements: false,
      complement_groups: null,
      has_sizes: false, // New field for sizes
      sizes: null,
      scheduled_days: null,
      availability_type: 'always',
      created_at: '',
      updated_at: ''
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setIsCreating(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm("Tem certeza que deseja excluir \"" + name + "\"?")) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    
    if (!editingProduct.code.trim() || !editingProduct.name.trim()) {
      alert('Código e nome são obrigatórios');
      return;
    }
    
    if (editingProduct.is_weighable) {
      if (!editingProduct.price_per_gram || editingProduct.price_per_gram <= 0) {
        alert('Preço por grama deve ser maior que zero para produtos pesáveis.');
        return;
      }
    } else {
      if (!editingProduct.unit_price || editingProduct.unit_price <= 0) {
        alert('Preço unitário deve ser maior que zero para produtos unitários.');
        return;
      }
    }

    if (editingProduct.has_complements && localComplementGroups.length === 0) {
      alert('Adicione pelo menos um grupo de complementos ou desative a opção de complementos.');
      return;
    }

    if (editingProduct.has_sizes && localSizes.length === 0) {
      alert('Adicione pelo menos um tamanho ou desative a opção de tamanhos.');
      return;
    }

    setSaving(true);
    let newProductId = '';
    try {
      const productDataToSave = {
        ...editingProduct,
        complement_groups: editingProduct.has_complements ? JSON.stringify(localComplementGroups) : null,
        sizes: editingProduct.has_sizes ? JSON.stringify(localSizes) : null,
      };

      if (isCreating) {
        const { id, created_at, updated_at, ...productToCreate } = productDataToSave;
        const newProduct = await createProduct(productToCreate);
        newProductId = newProduct.id;
      } else {
        await updateProduct(editingProduct.id, productDataToSave);
        newProductId = editingProduct.id;
      }
      
      // Salvar associação da imagem após salvar o produto
      const hasCustomImage = editingProduct.image_url && 
        !editingProduct.image_url.includes('pexels.com') && 
        !editingProduct.image_url.includes('unsplash.com');
        
      if (hasCustomImage && newProductId) {
        try {
          const refreshedImageUrl = await saveImageToProduct(editingProduct.image_url, newProductId);
          // Update the product in the list with the refreshed image URL
          // This is handled by the refetch in useAdminProducts, but good to be explicit
        } catch (imageError) {
          console.error('Erro ao associar imagem (produto salvo):', imageError);
          alert('Produto salvo, mas houve erro ao associar a imagem. Tente novamente.');
        }
      }
      
      setEditingProduct(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert(\`Erro ao salvar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: any) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status');
    }
  };

  const handleAddComplementGroup = () => {
    setLocalComplementGroups(prev => [...prev, {
      id: \`group-${Date.now()}`,
      name: 'Novo Grupo',
      required: false,
      minItems: 0,
      maxItems: 1,
      complements: []
    }]);
  };

  const handleUpdateComplementGroup = (index: number, field: string, value: any) => {
    setLocalComplementGroups(prev => {
      const newGroups = [...prev];
      newGroups[index] = { ...newGroups[index], [field]: value };
      return newGroups;
    });
  };

  const handleRemoveComplementGroup = (index: number) => {
    setLocalComplementGroups(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddComplement = (groupIndex: number) => {
    setLocalComplementGroups(prev => {
      const newGroups = [...prev];
      newGroups[groupIndex].complements.push({ id: \`comp-${Date.now()}`, name: '', price: 0, description: '' });
      return newGroups;
    });
  };

  const handleUpdateComplement = (groupIndex: number, compIndex: number, field: string, value: any) => {
    setLocalComplementGroups(prev => {
      const newGroups = [...prev];
      newGroups[groupIndex].complements[compIndex] = { ...newGroups[groupIndex].complements[compIndex], [field]: value };
      return newGroups;
    });
  };

  const handleRemoveComplement = (groupIndex: number, compIndex: number) => {
    setLocalComplementGroups(prev => {
      const newGroups = [...prev];
      newGroups[groupIndex].complements = newGroups[groupIndex].complements.filter((_: any, i: number) => i !== compIndex);
      return newGroups;
    });
  };

  const handleAddSize = () => {
    setLocalSizes(prev => [...prev, {
      id: \`size-${Date.now()}`,
      name: '',
      price: 0,
      ml: undefined,
      description: ''
    }]);
  };

  const handleUpdateSize = (index: number, field: string, value: any) => {
    setLocalSizes(prev => {
      const newSizes = [...prev];
      newSizes[index] = { ...newSizes[index], [field]: value };
      return newSizes;
    });
  };

  const handleRemoveSize = (index: number) => {
    setLocalSizes(prev => prev.filter((_, i) => i !== index));
  };

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-blue-600" />
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

      {/* Search */}
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-64">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Estoque</th>
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
                        <div className="text-sm text-gray-500">{product.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {categories.find(c => c.id === product.category)?.label || product.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {product.is_weighable ? (
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <Scale size={14} />
                        {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                      </div>
                    ) : (
                      <div className="font-semibold text-green-600">
                        {formatPrice(product.price || 0)}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className={\`font-medium ${
                      product.stock_quantity <= product.min_stock ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {product.stock_quantity}
                      {product.stock_quantity <= product.min_stock && (
                        <span className="text-xs ml-1 text-red-500">(Baixo)</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={\`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
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
              {searchTerm || selectedCategory !== 'all' 
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Açaí Premium 500g"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do Produto *
                </label>
                <input
                  type="text"
                  value={editingProduct.code}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    code: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: AC001"
                />
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Barras (opcional)
                </label>
                <input
                  type="text"
                  value={editingProduct.barcode || ''}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    barcode: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Código de barras (se houver)"
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
                    category: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      unit_price: e.target.checked ? undefined : editingProduct.unit_price,
                      price_per_gram: e.target.checked ? (editingProduct.price_per_gram || 0.045) : undefined
                    })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Scale size={16} className="text-blue-600" />
                    Produto pesável (vendido por peso)
                  </span>
                </label>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingProduct.is_weighable ? 'Preço por grama (R$) *' : 'Preço unitário (R$) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.is_weighable 
                    ? editingProduct.price_per_gram || '' 
                    : editingProduct.unit_price || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setEditingProduct({
                      ...editingProduct,
                      ...(editingProduct.is_weighable 
                        ? { price_per_gram: value } 
                        : { unit_price: value })
                    });
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Preço Original (R$) (opcional)
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Preço original para promoções"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para produtos em promoção (preço riscado)
                </p>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    step={editingProduct.is_weighable ? "0.001" : "1"}
                    min="0"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      stock_quantity: parseFloat(e.target.value) || 0
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step={editingProduct.is_weighable ? "0.001" : "1"}
                    min="0"
                    value={editingProduct.min_stock}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      min_stock: parseFloat(e.target.value) || 0
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    description: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição do produto..."
                />
              </div>

              {/* Has Sizes */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.has_sizes}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      has_sizes: e.target.checked,
                      sizes: e.target.checked ? (editingProduct.sizes || '[]') : null
                    })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto possui tamanhos/variações
                  </span>
                </label>
              </div>

              {/* Sizes Editor */}
              {editingProduct.has_sizes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Tamanhos do Produto:</h4>
                  {localSizes.length === 0 && (
                    <p className="text-gray-600 mb-2">Nenhum tamanho configurado.</p>
                  )}
                  {localSizes.map((size: any, index: number) => (
                    <div key={size.id || index} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg mb-2">
                      <input
                        type="text"
                        value={size.name}
                        onChange={(e) => handleUpdateSize(index, 'name', e.target.value)}
                        className="flex-1 p-1 border rounded text-sm"
                        placeholder="Nome (Ex: 300ml)"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={size.price}
                        onChange={(e) => handleUpdateSize(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-20 p-1 border rounded text-sm"
                        placeholder="Preço"
                      />
                      <input
                        type="number"
                        value={size.ml}
                        onChange={(e) => handleUpdateSize(index, 'ml', parseInt(e.target.value) || undefined)}
                        className="w-16 p-1 border rounded text-sm"
                        placeholder="ML"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 mt-2"
                  >
                    <Plus size={16} /> Adicionar Tamanho
                  </button>
                </div>
              )}

              {/* Has Complements */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.has_complements}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      has_complements: e.target.checked,
                      complement_groups: e.target.checked ? (editingProduct.complement_groups || '[]') : null
                    })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto possui complementos/personalizações
                  </span>
                </label>
              </div>

              {/* Complement Groups Editor */}
              {editingProduct.has_complements && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Grupos de Complementos:</h4>
                  {/* Quick Setup Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setLocalComplementGroups(standardAcaiComplementGroups)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Complementos Padrão Açaí
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setLocalComplementGroups([
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
                      ])}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Sabores Milkshake
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setLocalComplementGroups(vitaminaComplementGroups)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Complementos Vitamina
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setLocalComplementGroups([])}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Limpar Complementos
                    </button>
                  </div>
                  
                  {localComplementGroups.length > 0 ? (
                    <div className="space-y-4">
                      {localComplementGroups.map((group: any, groupIndex: number) => (
                        <div key={group.id || groupIndex} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <input
                              type="text"
                              value={group.name}
                              onChange={(e) => handleUpdateComplementGroup(groupIndex, 'name', e.target.value)}
                              className="font-medium text-gray-800 w-full p-1 border rounded"
                              placeholder="Nome do Grupo"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveComplementGroup(groupIndex)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <MinusCircle size={20} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            <label className="flex items-center gap-1">
                              <input type="checkbox" checked={group.required} onChange={(e) => handleUpdateComplementGroup(groupIndex, 'required', e.target.checked)} /> Obrigatório
                            </label>
                            <label>Min: <input type="number" value={group.minItems} onChange={(e) => handleUpdateComplementGroup(groupIndex, 'minItems', parseInt(e.target.value) || 0)} className="w-16 p-1 border rounded" /></label>
                            <label>Max: <input type="number" value={group.maxItems} onChange={(e) => handleUpdateComplementGroup(groupIndex, 'maxItems', parseInt(e.target.value) || 0)} className="w-16 p-1 border rounded" /></label>
                          </div>
                          
                          <h5 className="font-medium text-gray-700 mb-2">Complementos:</h5>
                          <div className="space-y-2">
                            {group.complements.map((comp: any, compIndex: number) => (
                              <div key={comp.id || compIndex} className="flex items-center gap-2 p-2 border border-gray-100 rounded">
                                <input
                                  type="text"
                                  value={comp.name}
                                  onChange={(e) => handleUpdateComplement(groupIndex, compIndex, 'name', e.target.value)}
                                  className="flex-1 p-1 border rounded text-sm"
                                  placeholder="Nome do Complemento"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  value={comp.price}
                                  onChange={(e) => handleUpdateComplement(groupIndex, compIndex, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-20 p-1 border rounded text-sm"
                                  placeholder="Preço"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveComplement(groupIndex, compIndex)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddComplement(groupIndex)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <Plus size={16} /> Adicionar Complemento
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddComplementGroup}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 mt-4"
                      >
                        <PlusCircle size={16} /> Adicionar Grupo de Complementos
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-gray-600 mb-2">Nenhum grupo de complemento configurado.</p>
                      <button
                        type="button"
                        onClick={handleAddComplementGroup}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 mx-auto"
                      >
                        <PlusCircle size={16} /> Adicionar Primeiro Grupo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disponibilidade
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Tipo de Disponibilidade:</span>
                    <select
                      value={editingProduct.availability_type}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        availability_type: e.target.value
                      })}
                      className="p-2 border rounded text-sm"
                    >
                      <option value="always">Sempre disponível</option>
                      <option value="specific_days">Dias específicos</option>
                    </select>
                  </div>
                  {editingProduct.availability_type === 'specific_days' && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductForSchedule(editingProduct);
                          setShowScheduleModal(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <Calendar size={16} /> Programar Dias e Horários
                      </button>
                      {editingProduct.scheduled_days && (
                        <p className="text-xs text-gray-600 mt-2">
                          Programado para: {JSON.parse(editingProduct.scheduled_days).days.monday ? 'Seg,' : ''}
                          {JSON.parse(editingProduct.scheduled_days).days.tuesday ? ' Ter,' : ''}
                          {JSON.parse(editingProduct.scheduled_days).days.wednesday ? ' Qua,' : ''}
                          {JSON.parse(editingProduct.scheduled_days).days.thursday ? ' Qui,' : ''}
                          {JSON.parse(editingProduct.scheduled_days).days.friday ? ' Sex,' : ''}
                          {JSON.parse(editingProduct.scheduled_days).days.saturday ? ' Sáb,' : ''}
                          {JSON.parse(editingProduct.scheduled_days).days.sunday ? ' Dom' : ''}
                          {JSON.parse(editingProduct.scheduled_days).startTime && ` (${JSON.parse(editingProduct.scheduled_days).startTime} - ${JSON.parse(editingProduct.scheduled_days).endTime})`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active !== false}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      is_active: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600"
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
                disabled={saving || !editingProduct.name.trim() || !editingProduct.code.trim()}
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
          onSave={(productId, scheduledDays) => {
            setEditingProduct((prev: any) => ({
              ...prev,
              scheduled_days: JSON.stringify(scheduledDays),
              availability_type: scheduledDays.enabled ? 'specific_days' : 'always'
            }));
            setShowScheduleModal(false);
            setSelectedProductForSchedule(null);
          }}
          currentSchedule={editingProduct?.scheduled_days ? JSON.parse(editingProduct.scheduled_days) : null}
        />
      )}
    </div>
  );
};

export default ProductsPanelDB;
```