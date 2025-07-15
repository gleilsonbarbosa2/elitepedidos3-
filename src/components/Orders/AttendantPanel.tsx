import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useOrders } from '../../hooks/useOrders';
import PermissionGuard from '../PermissionGuard';
import OrderCard from './OrderCard';
import ManualOrderForm from './ManualOrderForm';
import { OrderStatus } from '../../types/order';
import { supabase } from '../../lib/supabase';

// Store session in localStorage to persist between page refreshes
const ATTENDANCE_SESSION_KEY = 'attendance_session';

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
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Wrap fetchInitialOrders in useCallback to maintain stable reference
  const fetchInitialOrders = useCallback(async () => {
    try {
      console.log('🔄 Fetching initial orders...');
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (data && data.length > 0) {
        console.log(`✅ Loaded ${data.length} initial orders`);
        setOrders(data);
        
        // Count pending orders
        const pending = data.filter(order => order.status === 'pending').length;
        if (pending > 0) {
          setPendingOrdersCount(pending);
          console.log(`🔔 Found ${pending} pending orders`);
        }
      }
    } catch (error) {
      console.error('Error fetching initial orders:', error);
    }
  }, [setOrders]);

  // Initialize orders on component mount
  useEffect(() => {
    fetchInitialOrders();
    
    // Save session to localStorage
    localStorage.setItem(ATTENDANCE_SESSION_KEY, JSON.stringify({
      isAuthenticated: true,
      timestamp: Date.now()
    }));
  }, [fetchInitialOrders]);

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
    if (isSubscribed) {
      console.log('🔌 Already subscribed to real-time updates, skipping...');
      return;
    }
    
    console.log('🔌 Setting up real-time subscription for orders...');
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
            if (exists) return prev;
            
            const newOrder = payload.new as any;
            console.log('✅ Adicionando novo pedido ao estado:', newOrder.id);
            
            // Play notification sound
            if (soundEnabled) {
              console.log('🔊 Tocando som para novo pedido');
              playNewOrderSound();
            }
            
            // Update notification count
            setPendingOrdersCount(count => count + 1);
            setNotificationsViewed(false);
            
            return [newOrder, ...prev];
          });
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
          
          // If status changed from pending to something else, update count
          if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
            setPendingOrdersCount(count => Math.max(0, count - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Subscription status:', status);
        setIsSubscribed(true);
      });
      
    // Inicializar solicitação de permissão para notificações
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        console.log('📱 Permissão de notificação:', permission);
      });
    }
    
    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [soundEnabled, setOrders, isSubscribed, orders]);

  // Função para tocar som de novo pedido
  const playNewOrderSound = () => {
    console.log('🔊 Tocando som de notificação para novo pedido');
    try {
      // Criar um elemento de áudio com URL direta
      const audio = new Audio();
      audio.src = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
      audio.volume = 1.0; // Maximum volume for notification
      
      // Tocar o som após carregar
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(e => {
          console.error('Erro ao tocar som de notificação:', e);
          playFallbackSound();
        });
      });
      
      // Lidar com erros de carregamento
      audio.addEventListener('error', () => {
        console.error('Erro ao carregar áudio de notificação');
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
      console.log('🔊 Usando método alternativo para tocar som');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Criar sequência de sons para chamar mais atenção
      const playTone = (freq: number, time: number, duration: number) => {
        try {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
        
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
        
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
        
          // Increase volume for better audibility
          gainNode.gain.setValueAtTime(1.0, audioContext.currentTime + time);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + duration);
        
          oscillator.start(audioContext.currentTime + time);
          oscillator.stop(audioContext.currentTime + time + duration);
        } catch (toneError) {
          console.error('Error playing tone:', toneError);
        }
      };
      
      // Tocar sequência de notas (como uma campainha)
      playTone(1400, 0, 0.4);  // Higher frequency, longer duration
      playTone(1000, 0.5, 0.4); // Longer pause between tones
      playTone(1400, 1.0, 0.5); // Final tone even longer
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
    console.log('🔔 Notifications viewed, resetting counter');
  };

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_orders')} showMessage={true}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {hasPermission('create_manual_order') && (
            <div>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                onClick={() => setShowManualOrderForm(true)}
              >
                Novo Pedido Manual
              </button>
            </div>
          )}  
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {orders.length > 0 ? `${orders.length} pedidos carregados` : 'Nenhum pedido'}
            </div>
            <div className="relative cursor-pointer" onClick={handleBellClick}>
              <Bell size={24} className={`${pendingOrdersCount > 0 && !notificationsViewed ? 'text-red-600' : 'text-gray-700'} hover:text-purple-600 transition-colors`} />
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
        </div>

        {showManualOrderForm && (
          <ManualOrderForm
            onClose={() => setShowManualOrderForm(false)}
            onCreated={() => setShowManualOrderForm(false)}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Carregando pedidos...</span>
          </div>
        ) : filteredOrders.length > 0 ? (
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
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Nenhum pedido encontrado</p>
            <p className="text-gray-500 text-sm mt-1">Os novos pedidos aparecerão aqui automaticamente</p>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};
export default AttendantPanel;