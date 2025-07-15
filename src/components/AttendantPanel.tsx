import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useOrders } from '../../hooks/useOrders';
import { useStoreHours } from '../../hooks/useStoreHours';
import { OrderStatus } from '../../types/order';
import OrderCard from './OrderCard';
import ManualOrderForm from './ManualOrderForm';
import { supabase } from '../../lib/supabase';

interface AttendantPanelProps {
  onBackToAdmin?: () => void;
  storeSettings?: any;
}

const AttendantPanel: React.FC<AttendantPanelProps> = ({ onBackToAdmin, storeSettings }) => {
  const { hasPermission } = usePermissions();
  const { storeSettings: localStoreSettings } = useStoreHours();
  const { orders, loading, updateOrderStatus, setOrders } = useOrders();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notificationsViewed, setNotificationsViewed] = useState<boolean>(false);

  const settings = storeSettings || localStoreSettings;

  // Carregar configuração de som
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pdv_settings');
      const parsed = saved ? JSON.parse(saved) : {};
      if (parsed?.printer_layout?.sound_enabled !== undefined) {
        setSoundEnabled(parsed.printer_layout.sound_enabled);
      }
    } catch (e) {
      console.error('Erro ao carregar config de som:', e);
    }
  }, []);

  // Escutar novos pedidos em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('realtime:orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const novoPedido = payload.new;
          setOrders((prev) => {
            const exists = prev.some((p) => p.id === novoPedido.id);
            if (exists) return prev;
            return [novoPedido, ...prev];
          });
          setPendingOrdersCount((count) => count + 1);
          setNotificationsViewed(false);
          if (soundEnabled) {
            new Audio('/sounds/notify.mp3').play();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled, setOrders]);

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const handleBellClick = () => {
    setNotificationsViewed(true);
    setPendingOrdersCount(0);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        {hasPermission('create_manual_order') && (
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded"
            onClick={() => setShowManualOrderForm(true)}
          >
            Novo Pedido Manual
          </button>
        )}
        <div className="relative cursor-pointer" onClick={handleBellClick}>
          <Bell size={24} className="text-gray-700 hover:text-purple-600" />
          {pendingOrdersCount > 0 && !notificationsViewed && (
            <>
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full z-10">
                {pendingOrdersCount}
              </span>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 opacity-75 rounded-full animate-ping z-0" />
            </>
          )}
        </div>
      </div>

      {showManualOrderForm && (
        <ManualOrderForm
          onClose={() => setShowManualOrderForm(false)}
          onCreated={() => setShowManualOrderForm(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusChange={updateOrderStatus}
            storeSettings={settings}
            isAttendant={true}
          />
        ))}
      </div>
    </div>
  );
};

export default AttendantPanel;
