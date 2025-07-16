import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Download, Printer, RefreshCw, ShoppingCart, Truck, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';

interface SalesSummary {
  pdv_sales: {
    count: number;
    total: number;
    by_payment_method: Record<string, { count: number; total: number }>;
  };
  delivery_sales: {
    count: number;
    total: number;
    by_payment_method: Record<string, { count: number; total: number }>;
  };
  total_sales: number;
  total_amount: number;
}

const PDVDailySalesReport: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDailySales = async () => {
    try {
      setLoading(true);
      console.log('🔄 Buscando vendas do dia:', date);
      
      // Get PDV sales
      const { data: pdvSales, error: pdvError } = await supabase
        .from('pdv_sales')
        .select('*')
        .gte('created_at', `${date}T00:00:00.000Z`)
        .lte('created_at', `${date}T23:59:59.999Z`)
        .eq('is_cancelled', false);
        
      if (pdvError) throw pdvError;
      
      // Get delivery sales
      const { data: deliverySales, error: deliveryError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', `${date}T00:00:00.000Z`)
        .lte('created_at', `${date}T23:59:59.999Z`)
        .not('status', 'eq', 'cancelled');
        
      if (deliveryError) throw deliveryError;
      
      // Process PDV sales by payment method
      const pdvByPayment: Record<string, { count: number; total: number }> = {};
      pdvSales?.forEach(sale => {
        const method = sale.payment_type;
        if (!pdvByPayment[method]) {
          pdvByPayment[method] = { count: 0, total: 0 };
        }
        pdvByPayment[method].count += 1;
        pdvByPayment[method].total += sale.total_amount;
      });
      
      // Process delivery sales by payment method
      const deliveryByPayment: Record<string, { count: number; total: number }> = {};
      deliverySales?.forEach(sale => {
        const method = sale.payment_method;
        if (!deliveryByPayment[method]) {
          deliveryByPayment[method] = { count: 0, total: 0 };
        }
        deliveryByPayment[method].count += 1;
        deliveryByPayment[method].total += sale.total_price;
      });
      
      // Calculate totals
      const pdvTotal = pdvSales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const deliveryTotal = deliverySales?.reduce((sum, sale) => sum + sale.total_price, 0) || 0;
      
      setSummary({
        pdv_sales: {
          count: pdvSales?.length || 0,
          total: pdvTotal,
          by_payment_method: pdvByPayment
        },
        delivery_sales: {
          count: deliverySales?.length || 0,
          total: deliveryTotal,
          by_payment_method: deliveryByPayment
        },
        total_sales: (pdvSales?.length || 0) + (deliverySales?.length || 0),
        total_amount: pdvTotal + deliveryTotal
      });
      
      console.log('✅ Dados carregados:', {
        pdvSales: pdvSales?.length || 0,
        deliverySales: deliverySales?.length || 0,
        pdvTotal,
        deliveryTotal
      });
    } catch (error) {
      console.error('Erro ao buscar vendas do dia:', error);
      alert('Erro ao buscar vendas do dia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySales();
  }, [date]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDailySales();
    } finally {
      setRefreshing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentMethodName = (method: string) => {
    const methodNames: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'money': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'card': 'Cartão',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    
    return methodNames[method] || method;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!summary) return;
    
    const csvContent = [
      ['Relatório de Vendas Diárias - Elite Açaí'],
      ['Data', formatDate(date)],
      [''],
      ['Resumo'],
      ['Canal', 'Quantidade', 'Total'],
      ['PDV', summary.pdv_sales.count.toString(), formatPrice(summary.pdv_sales.total)],
      ['Delivery', summary.delivery_sales.count.toString(), formatPrice(summary.delivery_sales.total)],
      ['Total', summary.total_sales.toString(), formatPrice(summary.total_amount)],
      [''],
      ['Detalhamento por Forma de Pagamento - PDV'],
      ['Forma de Pagamento', 'Quantidade', 'Total'],
      ...Object.entries(summary.pdv_sales.by_payment_method).map(([method, data]) => 
        [getPaymentMethodName(method), data.count.toString(), formatPrice(data.total)]
      ),
      [''],
      ['Detalhamento por Forma de Pagamento - Delivery'],
      ['Forma de Pagamento', 'Quantidade', 'Total'],
      ...Object.entries(summary.delivery_sales.by_payment_method).map(([method, data]) => 
        [getPaymentMethodName(method), data.count.toString(), formatPrice(data.total)]
      )
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vendas-diarias-${date}.csv`;
    link.click();
  };

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_sales_report')} showMessage={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 size={24} className="text-teal-600" />
              Vendas do Dia
            </h2>
            <p className="text-gray-600">Resumo de vendas PDV e Delivery</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Atualizar
                </>
              )}
            </button>
            
            <button
              onClick={handlePrint}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer size={18} />
              Imprimir
            </button>
            
            <button
              onClick={handleExportCSV}
              disabled={!summary}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Relatório
              </label>
              <div className="relative">
                <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <span className="ml-2 text-gray-600">Carregando dados...</span>
          </div>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-3">
                    <ShoppingCart size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vendas PDV</p>
                    <p className="text-2xl font-bold text-gray-800">{summary.pdv_sales.count}</p>
                  </div>
                </div>
                <p className="mt-2 text-right font-semibold text-blue-600">
                  {formatPrice(summary.pdv_sales.total)}
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-3">
                    <Truck size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vendas Delivery</p>
                    <p className="text-2xl font-bold text-gray-800">{summary.delivery_sales.count}</p>
                  </div>
                </div>
                <p className="mt-2 text-right font-semibold text-purple-600">
                  {formatPrice(summary.delivery_sales.total)}
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-3">
                    <BarChart3 size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de Vendas</p>
                    <p className="text-2xl font-bold text-gray-800">{summary.total_sales}</p>
                  </div>
                </div>
                <p className="mt-2 text-right font-semibold text-green-600">
                  {formatPrice(summary.total_amount)}
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 rounded-full p-3">
                    <DollarSign size={24} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ticket Médio</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {summary.total_sales > 0 
                        ? formatPrice(summary.total_amount / summary.total_sales)
                        : formatPrice(0)
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* PDV Sales by Payment Method */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-blue-600" />
                  Vendas PDV por Forma de Pagamento
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Forma de Pagamento</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Quantidade</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">% do Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(summary.pdv_sales.by_payment_method).map(([method, data], index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-800">{getPaymentMethodName(method)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">{data.count}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-blue-600">{formatPrice(data.total)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">
                            {summary.pdv_sales.total > 0 
                              ? ((data.total / summary.pdv_sales.total) * 100).toFixed(1)
                              : '0.0'
                            }%
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {Object.keys(summary.pdv_sales.by_payment_method).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                          Nenhuma venda PDV registrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Delivery Sales by Payment Method */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Truck size={20} className="text-purple-600" />
                  Vendas Delivery por Forma de Pagamento
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Forma de Pagamento</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Quantidade</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">% do Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(summary.delivery_sales.by_payment_method).map(([method, data], index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-800">{getPaymentMethodName(method)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">{data.count}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-purple-600">{formatPrice(data.total)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">
                            {summary.delivery_sales.total > 0 
                              ? ((data.total / summary.delivery_sales.total) * 100).toFixed(1)
                              : '0.0'
                            }%
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {Object.keys(summary.delivery_sales.by_payment_method).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                          Nenhuma venda Delivery registrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma venda encontrada
            </h3>
            <p className="text-gray-500">
              Não há vendas registradas para a data selecionada.
            </p>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default PDVDailySalesReport;