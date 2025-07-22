import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeliveryAuth } from '../../hooks/useDeliveryAuth';
import { useDeliveryOrders } from '../../hooks/useDeliveryOrders';
import { DeliveryOrder } from '../../types/delivery-driver';
import DeliveryOrderCard from './DeliveryOrderCard';
import { 
  Truck, 
  RefreshCw, 
  LogOut, 
  Package,
  User,
  AlertCircle
} from 'lucide-react';

const DeliveryOrdersPage: React.FC = () => {
  const { user, signOut } = useDeliveryAuth();
  const { orders, loading, error, refetch } = useDeliveryOrders();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handlePrint = (order: DeliveryOrder) => {
    // Create print window with order details
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    const getPaymentMethodLabel = (method: string) => method === 'money' ? 'Dinheiro' : method === 'pix' ? 'PIX' : method === 'card' ? 'Cartão' : method;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Pedido #${order.id.slice(-8)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: black !important; background: white !important; }
          body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; padding: 2mm; width: 76mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; }
          .separator { border-bottom: 1px dashed black; margin: 5px 0; padding-bottom: 5px; }
          .flex-between { display: flex; justify-content: space-between; align-items: center; }
          .mb-1 { margin-bottom: 2px; }
          .mb-2 { margin-bottom: 5px; }
          .mb-3 { margin-bottom: 8px; }
          .ml-2 { margin-left: 8px; }
        </style>
      </head>
      <body>
        <div class="center mb-3 separator">
          <div class="bold" style="font-size: 16px;">ELITE AÇAÍ</div>
          <div class="small">Pedido para Entrega</div>
          <div class="small">Tel: (85) 98904-1010</div>
        </div>
        
        <div class="mb-3 separator">
          <div class="bold center mb-2">=== PEDIDO #${order.id.slice(-8)} ===</div>
          <div class="small">Data: ${new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
          <div class="small">Hora: ${new Date(order.created_at).toLocaleTimeString('pt-BR')}</div>
        </div>
        
        <div class="mb-3 separator">
          <div class="bold mb-1">CLIENTE:</div>
          <div class="small">Nome: ${order.customer_name}</div>
          <div class="small">Telefone: ${order.customer_phone}</div>
          <div class="small">Endereço: ${order.customer_address}</div>
          <div class="small">Bairro: ${order.customer_neighborhood}</div>
          ${order.customer_complement ? `<div class="small">Complemento: ${order.customer_complement}</div>` : ''}
        </div>
        
        <div class="mb-3 separator">
          <div class="bold mb-1">ITENS:</div>
          ${order.items.map((item, index) => `
            <div class="mb-2">
              <div class="bold">${item.product_name}</div>
              ${item.selected_size ? `<div class="small">Tamanho: ${item.selected_size}</div>` : ''}
              <div class="flex-between">
                <span class="small">${item.quantity}x ${formatPrice(item.unit_price)}</span>
                <span class="small">${formatPrice(item.total_price)}</span>
              </div>
              ${item.complements.length > 0 ? `
                <div class="ml-2">
                  <div class="small">Complementos:</div>
                  ${item.complements.map(comp => `
                    <div class="small ml-2">• ${comp.name}${comp.price > 0 ? ` (+${formatPrice(comp.price)})` : ''}</div>
                  `).join('')}
                </div>
              ` : ''}
              ${item.observations ? `<div class="small ml-2">Obs: ${item.observations}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="mb-3 separator">
          <div class="bold mb-1">TOTAL:</div>
          <div class="flex-between bold">
            <span>VALOR:</span>
            <span>${formatPrice(order.total_price)}</span>
          </div>
        </div>
        
        <div class="mb-3 separator">
          <div class="bold mb-1">PAGAMENTO:</div>
          <div class="small">Forma: ${getPaymentMethodLabel(order.payment_method)}</div>
          ${order.change_for ? `<div class="small">Troco para: ${formatPrice(order.change_for)}</div>` : ''}
        </div>
        
        <div class="center small">
          <div class="bold mb-2">Elite Açaí</div>
          <div>Entrega confirmada</div>
          <div>Impresso: ${new Date().toLocaleString('pt-BR')}</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  const handleWhatsApp = (order: DeliveryOrder) => {
    const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    const getPaymentMethodLabel = (method: string) => method === 'money' ? 'Dinheiro' : method === 'pix' ? 'PIX' : method === 'card' ? 'Cartão' : method;

    let message = `🚚 *ENTREGA - ELITE AÇAÍ*\n\n`;
    message += `📋 *Pedido #${order.id.slice(-8)}*\n`;
    message += `👤 Cliente: ${order.customer_name}\n`;
    message += `📱 Telefone: ${order.customer_phone}\n`;
    message += `📍 Endereço: ${order.customer_address}, ${order.customer_neighborhood}\n`;
    if (order.customer_complement) {
      message += `🏠 Complemento: ${order.customer_complement}\n`;
    }
    message += `\n`;

    message += `🛒 *ITENS:*\n`;
    order.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      if (item.selected_size) {
        message += `   Tamanho: ${item.selected_size}\n`;
      }
      message += `   Qtd: ${item.quantity}x - ${formatPrice(item.total_price)}\n`;
      
      if (item.complements.length > 0) {
        message += `   Complementos:\n`;
        item.complements.forEach(comp => {
          message += `   • ${comp.name}`;
          if (comp.price > 0) {
            message += ` (+${formatPrice(comp.price)})`;
          }
          message += `\n`;
        });
      }
      
      if (item.observations) {
        message += `   Obs: ${item.observations}\n`;
      }
      message += `\n`;
    });

    message += `💰 *TOTAL: ${formatPrice(order.total_price)}*\n`;
    message += `💳 Pagamento: ${getPaymentMethodLabel(order.payment_method)}\n`;
    if (order.change_for) {
      message += `💵 Troco para: ${formatPrice(order.change_for)}\n`;
    }
    message += `\n`;

    message += `📍 *LOCALIZAÇÃO:*\n`;
    const fullAddress = `${order.customer_address}, ${order.customer_neighborhood}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    message += `https://www.google.com/maps/search/?api=1&query=${encodedAddress}\n\n`;

    message += `🕐 Pedido feito em: ${new Date(order.created_at).toLocaleString('pt-BR')}\n\n`;
    message += `Elite Açaí - Entrega confirmada! 🍧`;

    const phoneNumber = order.customer_phone.replace(/\D/g, '');
    const phoneWithCountryCode = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
    
    window.open(`https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Truck size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Portal do Entregador</h1>
                <p className="text-gray-600">Pedidos confirmados para entrega</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <User size={18} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user.user_metadata?.name || user.email}
                  </span>
                </div>
              )}
              
              <button
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package size={24} className="text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Pedidos de Hoje
                </h2>
                <p className="text-gray-600">
                  {orders.length} pedido(s) confirmados hoje ({new Date().toLocaleDateString('pt-BR')})
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {orders.length}
              </p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Erro ao carregar pedidos</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum pedido confirmado hoje
              </h3>
              <p className="text-gray-500">
                Aguardando pedidos confirmados para hoje ({new Date().toLocaleDateString('pt-BR')})...
              </p>
            </div>
          ) : (
            orders.map(order => (
              <DeliveryOrderCard
                key={order.id}
                order={order}
                onPrint={handlePrint}
                onWhatsApp={handleWhatsApp}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryOrdersPage;