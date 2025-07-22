import React from 'react';
import { DeliveryOrder } from '../../types/delivery-driver';
import { 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Clock, 
  Package,
  ExternalLink,
  Printer,
  MessageCircle
} from 'lucide-react';

interface DeliveryOrderCardProps {
  order: DeliveryOrder;
  onPrint: (order: DeliveryOrder) => void;
  onWhatsApp: (order: DeliveryOrder) => void;
}

const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({ 
  order, 
  onPrint, 
  onWhatsApp 
}) => {
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
      case 'pix': return 'PIX';
      case 'card': return 'Cartão';
      default: return method;
    }
  };

  const generateMapsLink = () => {
    const fullAddress = `${order.customer_address}, ${order.customer_neighborhood}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                Pedido #{order.id.slice(-8)}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock size={14} />
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(order.total_price)}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <User size={18} className="text-blue-600" />
          Dados do Cliente
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className="font-medium">{order.customer_name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-gray-400" />
            <span>{order.customer_phone}</span>
          </div>
          
          <div className="md:col-span-2 flex items-start gap-2">
            <MapPin size={16} className="text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">{order.customer_address}</p>
              <p className="text-gray-600">{order.customer_neighborhood}</p>
              {order.customer_complement && (
                <p className="text-gray-500 text-xs">Complemento: {order.customer_complement}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-gray-400" />
            <span>
              {getPaymentMethodLabel(order.payment_method)}
              {order.change_for && (
                <span className="text-gray-500 ml-1">
                  (Troco para {formatPrice(order.change_for)})
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <Package size={18} className="text-green-600" />
          Itens do Pedido ({order.items.length})
        </h4>
        
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h5 className="font-medium text-gray-800">{item.product_name}</h5>
                  
                  {item.selected_size && (
                    <p className="text-sm text-gray-600">Tamanho: {item.selected_size}</p>
                  )}
                  
                  {/* Complementos */}
                  {item.complements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Complementos:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.complements.map((comp, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {comp.name}
                            {comp.price > 0 && ` (+${formatPrice(comp.price)})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {item.observations && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                      <p className="text-sm text-yellow-800">
                        <strong>Observações:</strong> {item.observations}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">
                      Qtd: {item.quantity}x {formatPrice(item.unit_price)}
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(item.total_price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50">
        <div className="flex flex-wrap gap-3">
          <a
            href={generateMapsLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <ExternalLink size={16} />
            Abrir no Maps
          </a>
          
          <button
            onClick={() => onPrint(order)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Printer size={16} />
            Imprimir
          </button>
          
          <button
            onClick={() => onWhatsApp(order)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOrderCard;