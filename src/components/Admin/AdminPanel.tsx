import React, { useState } from 'react';
import { Package, MapPin, Clock, Users, LogOut, ShoppingBag, Settings, Database } from 'lucide-react';
import ProductsPanelDB from './ProductsPanelDB';
import NeighborhoodsPanel from './NeighborhoodsPanel';
import StoreHoursPanel from './StoreHoursPanel';
import UnifiedAttendancePage from '../UnifiedAttendancePage';
import AttendanceUsersPanelDB from './AttendanceUsersPanelDB';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'neighborhoods' | 'hours' | 'pdv' | 'users'>('products');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductsPanelDB />;
      case 'neighborhoods':
        return <NeighborhoodsPanel />;
      case 'hours':
        return <StoreHoursPanel />; 
      case 'pdv':
        return <UnifiedAttendancePage />;
      case 'users':
        return <AttendanceUsersPanelDB />;
      default:
        return <ProductsPanelDB />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <Database size={24} className="text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
                <p className="text-gray-600">Elite Açaí - Gestão Completa (Banco de Dados)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">Conectado ao Banco</span>
                </div>
              </div>
              
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut size={18} />
              Sair
            </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Database size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 mb-2">💾 Sistema de Gestão com Banco de Dados</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Produtos:</strong> Sincronização em tempo real com o delivery</li>
                <li>• <strong>Bairros:</strong> Configurações de entrega salvas no Supabase</li>
                <li>• <strong>Horários:</strong> Funcionamento da loja sincronizado em tempo real</li>
                <li>• <strong>Usuários:</strong> Sistema de autenticação via banco de dados</li>
                <li>• <strong>Edições instantâneas:</strong> Alterações aparecem imediatamente no delivery</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package size={20} />
              Produtos de Delivery
            </button>
            <button
              onClick={() => setActiveTab('neighborhoods')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'neighborhoods'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin size={20} />
              Bairros
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'hours'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock size={20} />
              Horários da Loja
            </button>
            <button
              onClick={() => setActiveTab('pdv')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'pdv'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings size={20} />
              Sistema PDV
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={20} />
              Usuários de Atendimento
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;