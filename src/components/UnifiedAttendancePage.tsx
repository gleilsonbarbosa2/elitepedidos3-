import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Package, 
  DollarSign, 
  Settings,
  Truck, 
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  User,
  LogOut
} from 'lucide-react';
import AttendantPanel from './Orders/AttendantPanel'; 
import PDVSalesScreen from './PDV/PDVSalesScreen';
import CashRegisterMenu from './PDV/CashRegisterMenu';
import { usePermissions } from '../hooks/usePermissions';
import { useAttendance } from '../hooks/useAttendance';
import { useScale } from '../hooks/useScale';
import { useOrders } from '../hooks/useOrders';
import { usePDVCashRegister } from '../hooks/usePDVCashRegister';
import { useStoreHours } from '../hooks/useStoreHours';
import { PDVOperator } from '../types/pdv';

interface UnifiedAttendancePanelProps {
  operator?: PDVOperator;
  propAttendanceSession?: any;
  storeSettings?: any;
  scaleHook?: ReturnType<typeof useScale>;
}

const UnifiedAttendancePage: React.FC<UnifiedAttendancePanelProps> = ({ operator, propAttendanceSession, storeSettings, scaleHook }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'orders' | 'cash'>('sales');
  const { hasPermission } = usePermissions(operator);
  const { storeSettings: localStoreSettings } = useStoreHours();
  const { isOpen: isCashRegisterOpen, currentRegister } = usePDVCashRegister();
  const scale = useScale();
  const { orders } = useOrders();
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  
  // Função para obter o nome de exibição do operador
  const getOperatorDisplayName = (username: string) => {
    try {
      const savedUsers = localStorage.getItem('attendance_users');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        const user = users.find((u: any) => u.username === username);
        return user?.operator || username;
      }
    } catch (error) {
      console.error('Erro ao buscar nome do operador:', error);
    }
    return username;
  };

  // Get attendance session if available
  const { session: attendanceSession, logout: attendanceLogout } = useAttendance();
  
  // Calculate pending orders count from the orders data
  const pendingOrdersCount = orders.filter(order => order.status === 'pending').length;

  // Check if user is admin
  const isAdmin = !operator || operator.code?.toUpperCase() === 'ADMIN';

  const settings = storeSettings || localStoreSettings;
  
  // Check Supabase configuration on mount
  React.useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <ShoppingBag size={24} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Atendimento Unificado</h1>
                <p className="text-gray-600">Elite Açaí - Vendas, Pedidos e Caixa</p>
              </div>
            </div>
            
            {/* User Session Info */}
            <div className="flex items-center gap-4">
              {/* Attendance Session */}
              {attendanceSession.isAuthenticated && attendanceSession.user && (
                <div className="flex items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-lg">
                  <User size={16} className="text-purple-600" />
                  <div className="text-sm">
                    <span className="font-medium text-purple-800">{getOperatorDisplayName(attendanceSession.user.username)}</span>
                    <span className="text-purple-600 ml-1">
                      ({attendanceSession.user.role === 'admin' ? 'Admin' : 'Atendente'})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Deseja realmente sair do sistema de atendimento?')) {
                        attendanceLogout();
                        window.location.href = '/atendimento';
                      }
                    }}
                    className="ml-2 p-1 hover:bg-purple-200 rounded-full transition-colors"
                    title="Sair do atendimento"
                  >
                    <LogOut size={14} className="text-purple-600" />
                  </button>
                </div>
              )}
              
              {/* PDV Operator Session */}
              {operator && (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg">
                  <User size={16} className="text-green-600" />
                  <div className="text-sm">
                    <span className="font-medium text-green-800">{operator.name}</span>
                    <span className="text-green-600 ml-1">(PDV)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-800">Sistema em Modo Demonstração</h3>
                <p className="text-yellow-700 text-sm">
                  O Supabase não está configurado. Algumas funcionalidades estarão limitadas.
                  Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para acesso completo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Register Warning */}
      {supabaseConfigured && !isCashRegisterOpen && (activeTab === 'sales' || activeTab === 'orders') && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-800">Caixa Fechado</h3>
                <p className="text-yellow-700 text-sm">
                  Não é possível {activeTab === 'sales' ? 'realizar vendas' : 'visualizar pedidos'} sem um caixa aberto.
                  Por favor, abra um caixa primeiro na aba "Caixas".
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {(isAdmin || hasPermission('can_view_sales')) && (
              <button
                onClick={() => setActiveTab('sales')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'sales'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calculator size={20} />
                Vendas
              </button>
            )}
            
            {(isAdmin || hasPermission('can_view_orders')) && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 relative ${
                  activeTab === 'orders'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Truck size={20} />
                Pedidos
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            )}
            
            {(isAdmin || hasPermission('can_view_cash_register')) && (
              <button
                onClick={() => setActiveTab('cash')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'cash'
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <DollarSign size={20} />
                Caixas
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {activeTab === 'sales' && (isAdmin || hasPermission('can_view_sales')) && <PDVSalesScreen scaleHook={scaleHook || scale} storeSettings={settings} operator={operator} />}
          {activeTab === 'orders' && (isAdmin || hasPermission('can_view_orders')) && <AttendantPanel storeSettings={settings} />}
          {activeTab === 'cash' && (isAdmin || hasPermission('can_view_cash_register')) && <CashRegisterMenu storeSettings={settings} />}
        </div>
        
        {/* Show message if no tabs are visible */}
        {!isAdmin && !hasPermission('can_view_sales') && !hasPermission('can_view_orders') && !hasPermission('can_view_cash_register') && (
          <div className="text-center py-8">
            <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Você não tem permissão para acessar nenhuma funcionalidade desta página.</p>
            <p className="text-gray-400 text-sm mt-2">Entre em contato com o administrador para obter as permissões necessárias.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedAttendancePage;