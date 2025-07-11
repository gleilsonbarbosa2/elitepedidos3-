import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Minus, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const AcaiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Load customer phone from localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem('customer_phone');
    if (savedPhone) {
      setCustomerPhone(savedPhone);
    }
  }, []);

  const getInitialGreeting = () => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = 'Bom dia! ☀️';
    } else if (hour < 18) {
      greeting = 'Boa tarde! 🌤️';
    } else {
      greeting = 'Boa noite! 🌙';
    }
    
    return `${greeting} Bem-vindo(a) ao Elite Açaí! 🍧\n\nEu sou a assistente virtual e estou aqui para ajudar você! Posso te ajudar com:\n\n🛒 Fazer um pedido\n📦 Acompanhar seu pedido\n📋 Ver nosso cardápio\n💰 Informações sobre promoções\n📍 Horários e localização\n\nO que você gostaria de fazer hoje?`;
  };

  const simulateOrderLookup = (orderInput: string) => {
    // Simulate order lookup - in production, this would query the actual database
    const mockOrders = [
      { id: 'abc12345', status: 'preparing', customer: 'João Silva' },
      { id: 'def67890', status: 'ready_for_pickup', customer: 'Maria Santos' },
      { id: 'ghi11111', status: 'out_for_delivery', customer: 'Pedro Costa' },
      { id: 'jkl22222', status: 'delivered', customer: 'Ana Oliveira' }
    ];

    // Try to find order by ID (full or last 8 characters) or customer name
    const order = mockOrders.find(o => 
      o.id === orderInput.toLowerCase() ||
      o.id.slice(-8) === orderInput.toLowerCase() ||
      o.customer.toLowerCase().includes(orderInput.toLowerCase())
    );

    return order;
  };

  const getOrderStatusMessage = (status: string) => {
    switch (status) {
      case 'preparing':
      case 'confirmed':
        return "🍧 Seu pedido ainda está em preparo e será enviado em breve. Obrigado pela paciência! 🙌";
      case 'ready_for_pickup':
        return "🚴 Seu pedido já está pronto e o entregador sairá em instantes!";
      case 'out_for_delivery':
        return "📦 O entregador já está a caminho com seu pedido! Em breve você estará saboreando nosso açaí! 😋";
      case 'delivered':
        return "✅ Seu pedido foi entregue! Esperamos que tenha gostado! Qualquer dúvida ou sugestão, estamos por aqui. 💜";
      default:
        return "❌ Não encontramos um pedido com esse número/nome. Pode verificar se está correto ou nos enviar outro dado?";
    }
  };

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for order tracking intent
    if (message.includes('acompanhar pedido') || 
        message.includes('onde está meu pedido') ||
        message.includes('meu pedido já saiu') ||
        message.includes('status do pedido') ||
        message.includes('cadê meu pedido') ||
        message.includes('rastrear pedido')) {
      return "Para que eu possa verificar, por favor, me informe o número do seu pedido ou o nome completo utilizado na compra.";
    }

    // Check if user is providing order information (looks like order ID or name)
    if (message.length >= 3 && (
        /^[a-f0-9]{8,}$/i.test(message) || // Looks like order ID
        /^[a-zA-ZÀ-ÿ\s]{3,}$/.test(message) // Looks like a name
    )) {
      const order = simulateOrderLookup(message);
      if (order) {
        return getOrderStatusMessage(order.status);
      } else {
        return "❌ Não encontramos um pedido com esse número/nome. Pode verificar se está correto ou nos enviar outro dado?";
      }
    }

    // Check for new order intent
    if (message.includes('fazer pedido') || 
        message.includes('pedir açaí') ||
        message.includes('começar pedido') ||
        message.includes('cardápio') ||
        message.includes('o que vocês têm')) {
      return "Olá! Que ótimo que você quer fazer um pedido! 😊\n\nPara fazer seu pedido, você pode:\n\n🌐 Acessar nosso site de delivery\n📱 Usar nosso WhatsApp: (85) 98904-1010\n🏪 Vir até nossa loja\n\nNossos principais produtos:\n🍧 Açaí tradicional (P, M, G)\n🍨 Sorvetes artesanais\n🥤 Bebidas geladas\n🍓 Vitaminas naturais\n\nQual opção prefere para fazer seu pedido?";
    }

    // Greeting responses
    if (message.includes('oi') || message.includes('olá') || message.includes('boa')) {
      return getInitialGreeting();
    }

    // Menu/cardápio
    if (message.includes('cardápio') || message.includes('menu') || message.includes('produtos')) {
      return "🍧 **NOSSO CARDÁPIO** 🍧\n\n**AÇAÍ TRADICIONAL:**\n• Pequeno (300ml) - R$ 8,90\n• Médio (500ml) - R$ 12,90\n• Grande (700ml) - R$ 16,90\n\n**ADICIONAIS:**\n• Frutas: banana, morango, kiwi\n• Granola, aveia, castanhas\n• Leite condensado, mel\n\n**BEBIDAS:**\n• Vitaminas naturais - R$ 7,90\n• Sucos - R$ 5,90\n• Água de coco - R$ 4,90\n\nQuer fazer um pedido? 😊";
    }

    // Hours/horários
    if (message.includes('horário') || message.includes('funciona') || message.includes('aberto')) {
      return "🕐 **NOSSOS HORÁRIOS:**\n\n📅 Segunda a Sexta: 10h às 22h\n📅 Sábado: 9h às 23h\n📅 Domingo: 14h às 22h\n\n📍 **LOCALIZAÇÃO:**\nRua das Frutas, 123 - Centro\nFortaleza/CE\n\n📞 **CONTATO:**\n(85) 98904-1010";
    }

    // Delivery/entrega
    if (message.includes('entrega') || message.includes('delivery') || message.includes('entregar')) {
      return "🚴 **DELIVERY DISPONÍVEL!**\n\n📦 Taxa de entrega: R$ 5,00\n⏰ Tempo médio: 35-50 minutos\n💰 Pedido mínimo: R$ 15,00\n\n📍 Atendemos toda a região central de Fortaleza!\n\nPara fazer seu pedido:\n📱 WhatsApp: (85) 98904-1010\n🌐 Site: [link do delivery]\n\nQuer fazer um pedido agora? 😊";
    }

    // Payment/pagamento
    if (message.includes('pagamento') || message.includes('pagar') || message.includes('cartão') || message.includes('pix')) {
      return "💳 **FORMAS DE PAGAMENTO:**\n\n✅ Dinheiro\n✅ PIX\n✅ Cartão de Crédito\n✅ Cartão de Débito\n✅ Vale Refeição\n\n💡 **PROMOÇÃO PIX:**\nPagando no PIX, ganhe 5% de desconto!\n\nQuer fazer um pedido? 😊";
    }

    // Promotions/promoções
    if (message.includes('promoção') || message.includes('desconto') || message.includes('oferta')) {
      return "🎉 **PROMOÇÕES ATIVAS:**\n\n💰 **PIX:** 5% de desconto\n🍧 **Combo Família:** 2 açaís G + 2 bebidas = R$ 35,90\n📱 **Primeira compra:** 10% OFF\n🎂 **Aniversariante:** Açaí grátis no seu dia!\n\n⏰ Promoções válidas até o final do mês!\n\nQuer aproveitar alguma promoção? 😊";
    }

    // Thanks/obrigado
    if (message.includes('obrigad') || message.includes('valeu') || message.includes('brigad')) {
      return "😊 Por nada! Fico feliz em ajudar!\n\nSe precisar de mais alguma coisa, é só chamar! Estamos sempre aqui para você! 💜\n\n🍧 Elite Açaí - O melhor açaí da cidade! 🍧";
    }

    // Default response
    return "Posso ajudar com informações sobre nosso cardápio, promoções, formas de pagamento ou entrega. Se quiser fazer um pedido, é só me dizer o que você gostaria!";
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
    
    // Add greeting only when user opens chat
    if (!isOpen && messages.length === 0) {
      const initialGreeting = getInitialGreeting();
      setMessages([
        {
          id: Date.now().toString(),
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

  const simulatePostDeliveryFeedback = () => {
    const feedbackMessage: Message = {
      id: Date.now().toString(),
      text: "Olá! Tudo bem? Notei que você recebeu seu pedido recentemente. Foi bem atendido hoje? Gostaria de compartilhar sua experiência conosco?",
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, feedbackMessage]);
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = generateResponse(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

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
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[80%] ${
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AcaiChatbot;