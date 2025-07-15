import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useOrders } from '../../hooks/useOrders'; 
import PermissionGuard from '../PermissionGuard';
import OrderCard from './OrderCard';
import ManualOrderForm from './ManualOrderForm';
import { OrderStatus } from '../../types/order';
import { supabase } from '../../lib/supabase';

interface AttendantPanelProps {
  onBackToAdmin?: () => void;
  storeSettings?: any;
}

const AttendantPanel: React.FC<AttendantPanelProps> = ({ 
  onBackToAdmin, 
  storeSettings 
}) => {
  const { hasPermission } = usePermissions();
  const { orders, loading, updateOrderStatus, setOrders } = useOrders();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notificationsViewed, setNotificationsViewed] = useState<boolean>(false);

  const settings = storeSettings;

  // Carregar configuração de som
  useEffect(() => {
    try {
      const soundSettings = localStorage.getItem('orderSoundSettings');
      if (soundSettings) {
        const settings = JSON.parse(soundSettings);
        setSoundEnabled(settings.enabled);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de som:', error);
    }
  }, []);

  // Alternar som de notificação
  const toggleSound = () => {
    try {
      const newState = !soundEnabled;
      setSoundEnabled(newState);
      
      // Salvar no localStorage
      const soundSettings = localStorage.getItem('orderSoundSettings');
      const settings = soundSettings ? JSON.parse(soundSettings) : { volume: 0.7, soundUrl: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" };
      settings.enabled = newState;
      localStorage.setItem('orderSoundSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Erro ao salvar configurações de som:', error);
    }
  };

  // Escutar novos pedidos em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('orders-panel-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('🔔 Novo pedido recebido via realtime:', payload);
          setOrders((prev) => {
            const exists = prev.some((p) => p.id === payload.new.id);
            if (exists) {
              console.log('⚠️ Pedido já existe no estado, ignorando duplicata');
              return prev;
            }
            console.log('✅ Adicionando novo pedido ao estado:', payload.new.id);
            return [payload.new as any, ...prev];
          });
          setPendingOrdersCount((count) => count + 1);
          setNotificationsViewed(false);
          if (soundEnabled) {
            console.log('🔊 Tocando som para novo pedido');
            playNewOrderSound();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          // Verificar se o pedido já existe no estado
          const orderExists = orders.some(order => order.id === payload.new.id);
          if (!orderExists) {
            console.log('🆕 Pedido atualizado não encontrado no estado, adicionando:', payload.new.id);
            setOrders(prev => [payload.new as any, ...prev]);
          }
          console.log('🔄 Pedido atualizado via realtime:', payload);
          setOrders((prev) => 
            prev.map((order) => order.id === payload.new.id ? payload.new as any : order)
          );
        }
      )
      .subscribe();
      
    // Inicializar solicitação de permissão para notificações
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        console.log('📱 Permissão de notificação:', permission);
      });
    }
    
    // Forçar uma atualização inicial para garantir que temos os dados mais recentes
    const fetchInitialOrders = async () => {
      await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20);
    };
    fetchInitialOrders();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled, setOrders]);

  // Função para tocar som de novo pedido
  const playNewOrderSound = () => {
    console.log('🔊 Tocando som de notificação para novo pedido');
    try {
      // Obter configuração de som do localStorage
      const soundSettings = localStorage.getItem('orderSoundSettings');
      const settings = soundSettings ? JSON.parse(soundSettings) : { enabled: true, volume: 0.7, soundUrl: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" };
      
      console.log('🔊 Configurações de som:', settings);
      // Verificar se o som está habilitado
      if (!settings.enabled) {
        console.log('🔕 Som de notificação desabilitado nas configurações');
        return;
      }
      
      // Criar um elemento de áudio e tocar o som configurado
      const audio = new Audio(settings.soundUrl || "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = settings.volume; // Ajustar volume conforme configuração
      audio.play().catch(e => {
        console.error('Erro ao tocar som de notificação:', e);
        // Tentar método alternativo se falhar
        playFallbackSound();
      });
      
      // Mostrar notificação visual também, se suportado pelo navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Novo Pedido!', {
          body: 'Um novo pedido foi recebido e está aguardando atendimento.',
          icon: '/vite.svg'
        });
      }
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
      // Tentar método alternativo se falhar
      playFallbackSound();
    }
  };
  
  // Método alternativo para tocar som
  const playFallbackSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Criar sequência de sons para chamar mais atenção
      const playTone = (freq: number, time: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + duration);
        
        oscillator.start(audioContext.currentTime + time);
        oscillator.stop(audioContext.currentTime + time + duration);
      };
      
      // Tocar sequência de notas (como uma campainha)
      playTone(1200, 0, 0.2);
      playTone(900, 0.3, 0.2);
      playTone(1200, 0.6, 0.3);
    } catch (error) {
      console.error('Erro ao tocar som de fallback:', error);
    }
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);
    
  const handleBellClick = () => {
    setNotificationsViewed(true);
    setPendingOrdersCount(0);
  };

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_orders')} showMessage={true}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
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

        <div className="space-y-4">
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
    </PermissionGuard>
  );
};
export default AttendantPanel;
