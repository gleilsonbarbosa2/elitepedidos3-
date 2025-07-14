import React, { useState, useEffect, useRef } from 'react';
import { Order } from '../../types/order';

interface OrderPrintViewProps {
  order: Order;
  storeSettings?: any;
  onClose: () => void;
}

const OrderPrintView: React.FC<OrderPrintViewProps> = ({ order, storeSettings, onClose }) => {
  const [printerSettings, setPrinterSettings] = useState({
    paper_width: '80mm',
    page_size: 300,
    font_size: 2,
    delivery_font_size: 14,
    scale: 1,
    margin_left: 0,
    margin_top: 1,
    margin_bottom: 1
  });

  const hasPrintedRef = useRef(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('pdv_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.printer_layout) {
          setPrinterSettings(settings.printer_layout);
        }
      } catch (e) {
        console.error('Erro ao carregar configurações de impressora:', e);
      }
    }
  }, []);

  useEffect(() => {
    const autoPrint = true;
    const isNew = order.status === 'pending';
    if (autoPrint && isNew && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [order]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'money': return 'Dinheiro';
      case 'pix': return 'PIX';
      case 'card': return 'Cartão';
      default: return method;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Em Preparo';
      case 'out_for_delivery': return 'Saiu para Entrega';
      case 'ready_for_pickup': return 'Pronto para Retirada';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const line = (text = '') => text + '\n';
    const msgParts: string[] = [];
    msgParts.push(line(`📦 *Novo Pedido Recebido!*`));
    msgParts.push(line(`🗞 Pedido: #${order.id.slice(-8)}`));
    msgParts.push(line(`👤 Cliente: ${order.customer_name}`));
    msgParts.push(line(`📍 Endereço: ${order.customer_address} - ${order.customer_neighborhood}`));
    if (order.customer_complement) msgParts.push(line(`🏢 Complemento: ${order.customer_complement}`));
    msgParts.push(line(`📞 Tel/WhatsApp: ${order.customer_phone}`));
    msgParts.push(line());

    msgParts.push(line(`🛒 *Itens:*`));
    order.items.forEach((item, i) => {
      msgParts.push(`${item.quantity}x ${item.product_name}${item.selected_size ? ` (${item.selected_size})` : ''}`);
      if (item.complements.length > 0) {
        item.complements.forEach((comp) => {
          msgParts.push(`   • ${comp.name} ${comp.price > 0 ? `(${formatPrice(comp.price)})` : '(Grátis)'}`);
        });
      }
      if (item.observations) {
        msgParts.push(`   📝 Obs: "${item.observations}"`);
      }
      msgParts.push(line());
    });

    msgParts.push(line(`💳 Pagamento: ${getPaymentMethodLabel(order.payment_method)}`));
    if (order.change_for) msgParts.push(line(`💵 Troco para: ${formatPrice(order.change_for)}`));
    msgParts.push(line(`💰 Total: ${formatPrice(order.total_price)}`));
    msgParts.push(line(`⏱️ Entrega estimada: ${order.estimated_delivery_minutes || 35}min`));
    msgParts.push(line());
    msgParts.push(line(`📦 Acompanhe: ${window.location.origin}/pedido/${order.id}`));
    msgParts.push(line(`🙏 Obrigado pela preferência!`));

    const fullMessage = encodeURIComponent(msgParts.join('\n'));
    const phone = order.customer_phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${fullMessage}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Impressão Térmica</h2>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">Imprimir</button>
              <button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">WhatsApp</button>
              <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">Fechar</button>
            </div>
          </div>
        </div>

        <div className="p-4 text-xs text-gray-800">
          <div className="text-center mb-3">
            <h1 className="text-lg font-bold">ELITE AÇAÍ</h1>
            <p>Delivery Premium</p>
            <p>Rua Dois, 2130-A – Cágado</p>
            <p>Tel/WhatsApp: (85) 98904-1010</p>
          </div>

          <div className="mb-2">
            <p><strong>Pedido:</strong> #{order.id.slice(-8)}</p>
            <p><strong>Data:</strong> {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
            <p><strong>Hora:</strong> {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Status:</strong> {getStatusLabel(order.status)}</p>
          </div>

          <div className="mb-2">
            <p><strong>Cliente:</strong> {order.customer_name}</p>
            <p><strong>Telefone:</strong> {order.customer_phone}</p>
            <p><strong>Endereço:</strong> {order.customer_address}, {order.customer_neighborhood}</p>
            {order.customer_complement && <p><strong>Complemento:</strong> {order.customer_complement}</p>}
          </div>

          <div className="mb-2">
            <h3 className="font-bold mb-1">Itens do Pedido:</h3>
            {order.items.map((item, index) => (
              <div key={index} className="mb-2 border-b border-gray-200 pb-1">
                <p><strong>{item.quantity}x {item.product_name}</strong> {item.selected_size && `(Tamanho: ${item.selected_size})`}</p>
                {item.complements.length > 0 && (
                  <ul className="ml-4 list-disc">
                    {item.complements.map((comp, idx) => (
                      <li key={idx}>{comp.name} {comp.price > 0 ? `(${formatPrice(comp.price)})` : '(Grátis)'}</li>
                    ))}
                  </ul>
                )}
                {item.observations && <p className="italic text-gray-600">Obs: {item.observations}</p>}
                <p>Total: {formatPrice(item.total_price)}</p>
              </div>
            ))}
          </div>

          <div className="mb-2">
            <p><strong>Subtotal:</strong> {formatPrice(order.total_price - (order.delivery_fee || 0))}</p>
            {order.delivery_fee && <p><strong>Taxa de Entrega:</strong> {formatPrice(order.delivery_fee)}</p>}
            <p><strong>Total:</strong> {formatPrice(order.total_price)}</p>
          </div>

          <div className="mb-2">
            <p><strong>Pagamento:</strong> {getPaymentMethodLabel(order.payment_method)}</p>
            {order.change_for && <p><strong>Troco para:</strong> {formatPrice(order.change_for)}</p>}
          </div>

          <div className="mt-4 border-t border-dashed pt-2 text-center">
            <p className="font-bold">Obrigado pela preferência!</p>
            <p>Acompanhe seu pedido em:</p>
            <p className="break-all">{window.location.origin}/pedido/{order.id}</p>
            <p className="mt-2 text-xs text-gray-500">CNPJ: {storeSettings?.cnpj || '00.000.000/0001-00'}</p>
            <p className="text-xs text-gray-500">Impresso em: {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <style>{`
          @media print {
            .print\:hidden { display: none !important; }
            .no-break { page-break-inside: avoid; }
            .page-break { page-break-before: always; }
            .bg-black\/50, .fixed, .rounded-lg, .max-w-sm, .overflow-hidden {
              all: unset !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OrderPrintView;
