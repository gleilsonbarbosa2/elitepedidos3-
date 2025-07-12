import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Minus, Send, Bot, User } from 'lucide-react';
import { findIntent, getInitialGreeting } from './intents';
import { saveUnknownQuery, shouldSaveAsUnknown, addTagToQuery } from './unknowns';
import PromotionsAIResponse from './PromotionsAIResponse';

// Define message interface
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Define order state interface
interface OrderState {
  stage: 'initial' | 'delivery_info' | 'product_selection' | 'complements' | 'payment' | 'confirmation' | 'complete';
  deliveryType?: 'delivery' | 'pickup';
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  selectedProducts: Array<{
    name: string;
    price: number;
    quantity: number;
    complements?: string[];
  }>;
  paymentMethod?: 'money' | 'pix' | 'card';
  total: number;
}

const AcaiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messagesCount, setMessagesCount] = useState<number>(0);
  const [orderState, setOrderState] = useState<OrderState>({
    stage: 'initial',
    selectedProducts: [],
    total: 0
  });
  const [showPromotions, setShowPromotions] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load customer phone from localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem('customer_phone');
    if (savedPhone) {
      setCustomerPhone(savedPhone);
    }
  }, []);

  // Update messages count when messages change
  useEffect(() => {
    setMessagesCount(messages.length);
  }, [messages]);

  // Improved response generation function
  const generateResponse = (userMessage: string): string => {
    const normalizedMessage = userMessage.toLowerCase().trim();
    const matchedIntent = findIntent(normalizedMessage);

    // Se estiver em um processo de pedido, usar fluxo de pedido
    if (orderState.stage !== 'initial' && orderState.stage !== 'complete') {
      return processOrderStage(userMessage);
    }

    // Se a intent for fallback (não reconhecida)
    if (matchedIntent.id === 'fallback') {
      const context = messages.slice(-3).map(m => `${m.sender}: ${m.text}`).join('\n');
      saveUnknownQuery(userMessage, context);

      return "Essa informação ainda não está disponível, mas vou anotar para melhorar meu atendimento! 📝\n\nPosso te ajudar com informações sobre nosso cardápio, promoções, horários ou formas de pagamento. O que você gostaria de saber?";
    }

    // Caso a intenção seja válida, mas queira salvar para análise futura (score baixo, opcional)
    const matchScore = matchedIntent.keywords?.reduce((acc, kw) => {
      return normalizedMessage.includes(kw) ? acc + kw.length : acc;
    }, 0) || 0;

    if (shouldSaveAsUnknown(userMessage, matchedIntent.id, matchScore, 0.15)) {
      const context = messages.slice(-3).map(m => `${m.sender}: ${m.text}`).join('\n');
      saveUnknownQuery(userMessage, context);
    }

    // Ações especiais por ID de intent
    switch (matchedIntent.id) {
      case 'promotions':
        window.setTimeout(() => setShowPromotions(true), 300);
        break;
      case 'new_order':
        setOrderState({
          ...orderState,
          stage: 'delivery_info'
        });
        return "Vamos iniciar seu pedido! 😊\n\nVocê quer receber em casa (delivery) ou retirar em uma de nossas lojas?";
      default:
        break;
    }

    // Retorna a resposta da intent (texto ou função)
    return typeof matchedIntent.response === 'function'
      ? matchedIntent.response()
      : matchedIntent.response;
  };
  
  // Process order based on current stage
  const processOrderStage = (userInput: string): string => {
    const input = userInput.toLowerCase().trim();
    
    switch (orderState.stage) {
      case 'delivery_info':
        // Determine delivery type
        if (input.includes('casa') || input.includes('delivery') || input.includes('entreg')) {
          setOrderState({
            ...orderState,
            deliveryType: 'delivery',
            stage: 'delivery_info'
          });
          
          return "Beleza! Me informe:\n\n📍 Endereço de entrega:\n👤 Nome:\n📞 Telefone:";
        } else if (input.includes('retir') || input.includes('loja') || input.includes('buscar')) {
          setOrderState({
            ...orderState,
            deliveryType: 'pickup',
            stage: 'delivery_info'
          });
          
          return "Ótimo! Em qual loja você deseja retirar?\n\n🏡 Loja 1: Rua Dois, 2130‑A – Residencial 1 – Cágado\n🏡 Loja 2: Rua Um, 1614‑C – Residencial 1 – Cágado";
        } else if (input.includes('rua') || input.includes('avenida') || input.includes('av.')) {
          // User is providing address directly
          setOrderState({
            ...orderState,
            deliveryType: 'delivery',
            customerAddress: userInput,
            stage: 'product_selection'
          });
          
          return "Endereço anotado! Agora escolha uma categoria: Açaí, Combos, Milkshakes, Vitaminas...";
        } else {
          // Ask again for delivery type
          return "Por favor, me informe se você quer receber em casa (delivery) ou retirar em uma de nossas lojas.";
        }
        
      case 'product_selection':
        // Handle product selection
        if (input.includes('açaí') || input.includes('acai')) {
          return "Você escolheu Açaí! Temos vários tamanhos:\n\n• 300g - R$ 13,99\n• 400g - R$ 18,99\n• 500g - R$ 22,99\n• 700g - R$ 31,99\n\nQual tamanho você prefere?";
        } else if (input.includes('combo')) {
          return "Você escolheu Combos! Nossas opções:\n\n• Combo Casal (1kg + Milkshake) - R$ 49,99\n• Combo 4 (900g) - R$ 42,99\n\nQual combo você prefere?";
        } else if (input.includes('milk') || input.includes('shake')) {
          return "Você escolheu Milkshake! Temos:\n\n• 400ml - R$ 11,99\n• 500ml - R$ 12,99\n\nQual tamanho e sabor você prefere?";
        } else if (input.includes('300') || input.includes('400') || input.includes('500') || input.includes('700')) {
          // User selected a size
          let size = '';
          let price = 0;
          
          if (input.includes('300')) { size = '300g'; price = 13.99; }
          else if (input.includes('400')) { size = '400g'; price = 18.99; }
          else if (input.includes('500')) { size = '500g'; price = 22.99; }
          else if (input.includes('700')) { size = '700g'; price = 31.99; }
          
          setOrderState({
            ...orderState,
            selectedProducts: [...orderState.selectedProducts, {
              name: `Açaí ${size}`,
              price: price,
              quantity: 1
            }],
            total: orderState.total + price,
            stage: 'complements'
          });
          
          return `Você escolheu Açaí ${size}. Deseja adicionar complementos grátis?\n\n• 2 cremes (nutella, ninho, morango, etc)\n• 3 mix (granola, leite em pó, paçoca, etc)`;
        } else {
          return "Por favor, escolha uma categoria: Açaí, Combos, Milkshakes, Vitaminas...";
        }
        
      case 'complements':
        // Process complements selection
        setOrderState({
          ...orderState,
          stage: 'payment'
        });
        
        return `Pedido anotado! O total é ${formatPrice(orderState.total)}.\n\nQual a forma de pagamento?\n• Dinheiro\n• PIX\n• Cartão`;
        
      case 'payment':
        // Process payment method
        let paymentMethod: 'money' | 'pix' | 'card' = 'money';
        
        if (input.includes('pix')) {
          paymentMethod = 'pix';
        } else if (input.includes('cartão') || input.includes('cartao') || input.includes('card')) {
          paymentMethod = 'card';
        }
        
        setOrderState({
          ...orderState,
          paymentMethod,
          stage: 'confirmation'
        });
        
        let paymentDetails = '';
        if (paymentMethod === 'pix') {
          paymentDetails = "\n\n📱 **DADOS PIX:**\nChave: 85989041010\nNome: Grupo Elite";
        } else if (paymentMethod === 'money') {
          paymentDetails = "\n\nPrecisa de troco? Me informe para quanto.";
        }
        
        return `Você escolheu pagar com ${paymentMethod === 'money' ? 'dinheiro' : paymentMethod === 'pix' ? 'PIX' : 'cartão'}.${paymentDetails}\n\nConfirma o pedido?`;
        
      case 'confirmation':
        // Confirm order
        if (input.includes('sim') || input.includes('confirmo') || input.includes('ok')) {
          setOrderState({
            ...orderState,
            stage: 'complete'
          });
          
          return "🎉 Pedido enviado com sucesso! Obrigado pela preferência!\n\nEm breve você receberá uma confirmação pelo WhatsApp. Qualquer dúvida estou à disposição! 💜";
        } else if (input.includes('não') || input.includes('nao') || input.includes('cancelar')) {
          setOrderState({
            stage: 'initial',
            selectedProducts: [],
            total: 0
          });
          
          return "Pedido cancelado. Se quiser fazer um novo pedido ou tiver outras dúvidas, estou à disposição! 😊";
        } else {
          return "Por favor, confirme se deseja finalizar o pedido digitando 'sim' ou 'não'.";
        }
        
      default:
        return "Desculpe, não entendi. Vamos recomeçar o pedido? Por favor, me diga se você quer delivery ou retirada na loja.";
    }
  };
  
  // Helper function to format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
      
      // If the message looks like a phone number, store it for future use
      if (/^\d{10,11}$/.test(input.trim())) {
        setCustomerPhone(input.trim());
        localStorage.setItem('customer_phone', input.trim());
      }
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    
    // Reset order state when opening/closing chat
    setOrderState({
      stage: 'initial',
      selectedProducts: [],
      total: 0
    });
    
    // Add greeting only when user opens chat for the first time
    if (!isOpen && messages.length === 0) {
      const initialGreeting = getInitialGreeting();
      setMessages([
        {
          id: `bot-greeting-${Date.now()}`,
          text: initialGreeting,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Limpar promoções quando o usuário envia uma nova mensagem
    setShowPromotions(false);
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot typing delay with variable time based on message length
    const typingDelay = Math.min(800 + Math.random() * 800, 2000);
    window.setTimeout(() => {
      const botResponse = generateResponse(input);
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      // Se a mensagem do usuário contém palavras relacionadas a promoções, mostrar o componente
      if (input.toLowerCase().includes('promoção') || 
          input.toLowerCase().includes('promocao') || 
          input.toLowerCase().includes('desconto') || 
          input.toLowerCase().includes('oferta')) {
        window.setTimeout(() => setShowPromotions(true), 300);
      }

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, typingDelay);
  };
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Debug para verificar o estado atual
    console.log('Estado atual do chatbot:', {
      messages: messages.length,
      showPromotions,
      orderState
    });
  }, [messages]);

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-80 h-96'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Elite Açaí</h3>
            <p className="text-xs opacity-90">Assistente Virtual</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMinimize}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-2 max-w-[85%] ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    message.sender === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm whitespace-pre-line ${
                    message.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    {message.text}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show promotions component when triggered */}
            {showPromotions && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <PromotionsAIResponse />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot size={12} className="text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Clear any error state that might prevent responses
                  if (isTyping) {
                    setIsTyping(false);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>
            {orderState.stage !== 'initial' && orderState.stage !== 'complete' && (
              <div className="mt-2 text-xs text-gray-500">
                {orderState.stage === 'delivery_info' && "Informando dados de entrega..."}
                {orderState.stage === 'product_selection' && "Escolhendo produtos..."}
                {orderState.stage === 'complements' && "Selecionando complementos..."}
                {orderState.stage === 'payment' && "Informando pagamento..."}
                {orderState.stage === 'confirmation' && "Confirmando pedido..."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AcaiChatbot;