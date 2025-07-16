import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Download, Printer, Filter, Search, Truck, Phone, MapPin, CreditCard, Clock, User, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';
import { Order } from '../../types/order';

interface DeliveryReport {
  orders: Order[];
  totals: {
    count: number;
    total: number;
    byPaymentMethod: Record<string, { count: number; total: number }>;
  };
}

interface DeliveryDriver {
  id: string;
  name: string;
}

const PDVDailyDeliveryReport: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [report, setReport] = useState<DeliveryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [printMode, setPrintMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Payment method options
  const paymentMethods = [
    { id: 'all', label: 'Todas as formas' },
    { id: 'money', label: 'Dinheiro' },
    { id: 'pix', label: 'PIX' },
    { id: 'card', label: 'Cartão' }
  ];

  useEffect(() => {
    fetchReport();
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      // In a real implementation, this would fetch from a drivers table
      // For now, we'll use mock data
      setDrivers([
        { id: 'all', name: 'Todos os entregadores' },
        { id: 'driver1', name: 'João Silva' },
        { id: 'driver2', name: 'Maria Oliveira' },
        { id: 'driver3', name: 'Pedro Santos' }
      ]);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Simple date filtering approach
      const start = dateRange.start; // já está no formato 'YYYY-MM-DD'
      const endDate = new Date(dateRange.end);
      endDate.setDate(endDate.getDate() + 1);
      const end = endDate.toISOString().slice(0, 10); // dia seguinte
      
      // Debug logs
      console.log("Query start date:", start);
      console.log("Query end date:", end);
      
      // Fetch orders with delivery status
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('channel', 'delivery')
        .in('status', ['confirmed', 'delivered', 'out_for_delivery'])
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data
      const orders = data || [];
      
      // Calculate totals
      const totals = {
        count: orders.length,
        total: orders.reduce((sum, order) => sum + order.total_price, 0),
        byPaymentMethod: {} as Record<string, { count: number; total: number }>
      };

      // Group by payment method
      orders.forEach(order => {
        const method = order.payment_method;
        if (!totals.byPaymentMethod[method]) {
          totals.byPaymentMethod[method] = { count: 0, total: 0 };
        }
        totals.byPaymentMethod[method].count += 1;
        totals.byPaymentMethod[method].total += order.total_price;
      });

      setReport({ orders, totals });
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchReport();
  };
  
  // Debug function to check date filtering
  const debugDateFiltering = () => {
    const start = dateRange.start;
    const endDate = new Date(dateRange.end);
    endDate.setDate(endDate.getDate() + 1);
    const end = endDate.toISOString().slice(0, 10);
    
    console.log('Debugging date filtering:');
    console.log('Date range (local format):', dateRange.start, 'to', dateRange.end);
    console.log('Format used in Supabase query:');
    console.log('Start date:', start);
    console.log('End date (next day):', end);
    console.log('Equivalent SQL query:');
    console.log(`SELECT * FROM orders 
      WHERE created_at >= '${start}' 
      AND created_at < '${end}'
      AND channel = 'delivery'
      AND status IN ('delivered', 'out_for_delivery')`);
    
    alert(`Date filtering debug info:
Start date: ${start}
End date: ${end}
Check console for more details.`);
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const handleExportCSV = () => {
    if (!report) return;

    const headers = [
      'ID',
      'Cliente',
      'Telefone',
      'Endereço',
      'Bairro',
      'Pagamento',
      'Valor',
      'Data/Hora',
      'Entregador'
    ];

    const rows = report.orders.map(order => [
      order.id.slice(-8),
      order.customer_name,
      order.customer_phone,
      `${order.customer_address}${order.customer_complement ? `, ${order.customer_complement}` : ''}`,
      order.customer_neighborhood,
      getPaymentMethodLabel(order.payment_method),
      formatPrice(order.total_price),
      formatDate(order.created_at),
      'N/A' // Entregador (not implemented yet)
    ]);

    // Add summary rows
    rows.push([]);
    rows.push(['RESUMO']);
    rows.push(['Total de Pedidos', report.totals.count.toString()]);
    rows.push(['Valor Total', formatPrice(report.totals.total)]);
    rows.push([]);
    rows.push(['PAGAMENTOS']);
    
    Object.entries(report.totals.byPaymentMethod).forEach(([method, data]) => {
      rows.push([
        getPaymentMethodLabel(method),
        data.count.toString(),
        formatPrice(data.total)
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-entregas-${dateRange.start}-${dateRange.end}.csv`;
    link.click();
  };

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

  const filteredOrders = report?.orders.filter(order => {
    // Filter by driver (when implemented)
    if (selectedDriver !== 'all') {
      // This would check a driver_id field when implemented
      // return order.driver_id === selectedDriver;
    }

    // Filter by payment method
    if (selectedPaymentMethod !== 'all' && order.payment_method !== selectedPaymentMethod) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.customer_phone.includes(searchTerm) ||
        order.customer_address.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      );
    }

    return true;
  }) || [];

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_orders')} showMessage={true}>
      <div className="space-y-6" ref={printRef}>
        {/* Header - Hide in print mode */}
        {!printMode && (
          <div className="flex items-center justify-between print:hidden">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Truck size={24} className="text-purple-600" />
                Relatório de Entregas
              </h2>
              <p className="text-gray-600">Acompanhamento de pedidos entregues</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Printer size={16} />
                Imprimir
              </button>
              <button
                onClick={handleExportCSV}
                disabled={!report}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Exportar CSV
              </button>
              <button
                onClick={debugDateFiltering}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                title="Debug date filtering"
              >
                <RefreshCw size={16} />
                Debug
              </button>
            </div>
          </div>
        )}

        {/* Print Header - Only show in print mode */}
        {printMode && (
          <div className="print-header">
            <h1 className="text-2xl font-bold text-center">Relatório de Entregas - Elite Açaí</h1>
            <p className="text-center text-gray-600">
              Período: {new Date(dateRange.start).toLocaleDateString('pt-BR')} a {new Date(dateRange.end).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-center text-gray-500 text-sm">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
            <hr className="my-4" />
          </div>
        )}

        {/* Filters - Hide in print mode */}
        {!printMode && (
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-0 z-10 print:hidden">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entregador
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>{method.label}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleSearch}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Filter size={16} />
                Filtrar
              </button>
              
              <button
                onClick={fetchReport}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                title="Atualizar dados"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            
            {/* Search */}
            <div className="mt-4">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, telefone, endereço..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">Carregando relatório...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Truck size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhuma entrega encontrada para o período selecionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Pedido</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Endereço</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Pagamento</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Entregador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-medium text-purple-600">#{order.id.slice(-8)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-800">{order.customer_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone size={12} />
                            {order.customer_phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-1">
                          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-gray-800">{order.customer_address}</div>
                            <div className="text-sm text-gray-500">
                              {order.customer_neighborhood}
                              {order.customer_complement && `, ${order.customer_complement}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-gray-400" />
                          <span>{getPaymentMethodLabel(order.payment_method)}</span>
                        </div>
                        {order.payment_method === 'money' && order.change_for && (
                          <div className="text-xs text-gray-500 mt-1">
                            Troco para: {formatPrice(order.change_for)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-green-600">{formatPrice(order.total_price)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="text-gray-500">Não atribuído</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {report && (
          <div className="bg-white rounded-xl shadow-sm p-6 sticky bottom-0 print:static">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Resumo</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Entregas:</span>
                    <span className="font-bold">{report.totals.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Total:</span>
                    <span className="font-bold text-green-600">{formatPrice(report.totals.total)}</span>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Por Forma de Pagamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(report.totals.byPaymentMethod).map(([method, data]) => (
                    <div key={method} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-700">{getPaymentMethodLabel(method)}</span>
                        <span className="text-sm text-gray-500">{data.count} pedidos</span>
                      </div>
                      <div className="font-bold text-green-600">{formatPrice(data.total)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            @page {
              size: portrait;
              margin: 10mm;
            }
            
            body {
              font-family: Arial, sans-serif;
              color: #000;
              background: #fff;
            }
            
            .print\\:hidden {
              display: none !important;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f2f2f2;
            }
            
            .print-header {
              text-align: center;
              margin-bottom: 20px;
            }
            
            .print-header h1 {
              font-size: 24px;
              margin-bottom: 5px;
            }
            
            .print-header p {
              font-size: 14px;
              color: #666;
            }
          }
        `}</style>
      </div>
    </PermissionGuard>
  );
};

export default PDVDailyDeliveryReport;