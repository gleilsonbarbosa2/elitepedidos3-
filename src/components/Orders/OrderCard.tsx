// OrderCard.tsx - COMPLETO com melhorias visuais

import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types/order';
import OrderStatusBadge from './OrderStatusBadge';
import OrderChat from './OrderChat';
import OrderPrintView from './OrderPrintView';
import { ChatActions } from '../ChatActions';
import { 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  CreditCard,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Printer
} from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  storeSettings?: any;
  isAttendant?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  storeSettings,
  onStatusChange, 
  isAttendant = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'money': return 'Dinheiro';
      case 'pix': return 'PIX (85989041010)';
      case 'card': return 'Cartão';
      default: return method;
    }
  };

  const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'preparing', label: 'Em Preparo' },
    { value: 'out_for_delivery', label: 'Saiu para Entrega' },
    { value: 'ready_for_pickup', label: 'Pronto para Retirada' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <Package size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  📦 Pedido <strong className="text-purple-700">#{order.id.slice(-8)}</strong>
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              <span className="font-semibold text-blue-700">👤 {order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-400" />
              <span>{order.customer_phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" />
              <span>{order.customer_address}, {order.customer_neighborhood}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-gray-400" />
              <span>{getPaymentMethodLabel(order.payment_method)}</span>
              {order.change_for && (
                <span className="text-gray-500">
                  (Troco para {formatPrice(order.change_for)})
                </span>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-600">
                Total: {formatPrice(order.total_price)}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowPrintView(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  title="Imprimir pedido"
                >
                  <Printer size={16} className="flex-shrink-0" />
                  Imprimir
                </button>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <MessageCircle size={16} className="flex-shrink-0" />
                  {showChat ? 'Fechar Chat' : 'Chat'}
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  {isExpanded ? <ChevronUp size={16} className="flex-shrink-0" /> : <ChevronDown size={16} className="flex-shrink-0" />}
                  {isExpanded ? 'Menos' : 'Detalhes'}
                </button>
                <ChatActions 
                  telefoneCliente={order.customer_phone.replace(/\D/g, '')} 
                  nomeCliente={order.customer_name} 
                  pedidoId={order.id.slice(-6)}
                  total={order.total_price}
                  pagamento={getPaymentMethodLabel(order.payment_method)}
                  itens={order.items.map(item => ({ nome: item.product_name, quantidade: item.quantity }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderCard;
