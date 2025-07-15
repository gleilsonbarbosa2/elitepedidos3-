import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus, ChatMessage } from '../types/order';

// Add global error handler for message channel errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('message channel closed before a response was received')) {
      console.log('Ignoring extension-related error:', event.message);
      event.preventDefault();
      return true;
    }
  });
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Buscando pedidos...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      console.log(`✅ ${data?.length || 0} pedidos carregados`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Set channel to delivery if not specified
      // For manual orders, keep the channel as 'manual'
      const orderWithChannel = orderData.channel === 'manual' ? orderData : {
        ...orderData,
        channel: orderData.channel || 'delivery'
      };
      
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          ...orderWithChannel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Criar notificação para novo pedido
      const notificationTitle = orderData.channel === 'manual' ? 'Pedido Manual Criado' : 'Novo Pedido';
      const notificationMessage = orderData.channel === 'manual' 
        ? `Pedido manual criado para ${orderData.customer_name}`
        : `Novo pedido de ${orderData.customer_name}`;
        
      await supabase
        .from('notifications')
        .insert([{
          order_id: data.id,
          type: 'new_order',
          title: notificationTitle,
          message: notificationMessage,
          read: false,
          created_at: new Date().toISOString()
        }]);

      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar pedido');
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) throw error;
      
      // Atualizar estado local
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, updated_at: new Date().toISOString() }
          : order
      ));

      // Criar notificação de atualização de status
      const statusMessages = {
        pending: 'Pedido recebido',
        confirmed: 'Pedido confirmado',
        preparing: 'Pedido em preparo',
        out_for_delivery: 'Pedido saiu para entrega',
        ready_for_pickup: 'Pedido pronto para retirada',
        delivered: 'Pedido entregue',
        cancelled: 'Pedido cancelado'
      };

      await supabase
        .from('notifications')
        .insert([{
          order_id: orderId,
          type: 'status_update',
          title: 'Status Atualizado',
          message: statusMessages[status],
          read: false,
          created_at: new Date().toISOString()
        }]);

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  }, []);

  const playNotificationSound = () => {
    // Criar um som de notificação simples
    try {
      console.log('🔊 Tocando som de notificação');
      
      // Usar URL direta para o som
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.7;
      
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
      
      // Definir um timeout para fallback
      setTimeout(() => {
        if (audio.readyState < 3) { // HAVE_FUTURE_DATA
          console.log('Áudio não carregou a tempo, usando fallback');
          playFallbackSound();
        }
      }, 2000);
      
      // Mostrar notificação visual também, se suportado pelo navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Novo Pedido!', {
          body: 'Um novo pedido de delivery foi recebido.',
          icon: '/vite.svg'
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        // Solicitar permissão
        Notification.requestPermission();
      }
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
      // Tentar método alternativo se falhar
      playFallbackSound();
    }
  };
  
  // Função de fallback para tocar som usando Web Audio API
  const playFallbackSound = () => {
    try {
      console.log('🔊 Usando método alternativo para tocar som');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Criar um som de campainha/sino
      const playBellSound = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Frequência mais alta e volume maior para chamar atenção
        oscillator.frequency.value = 1400;
        oscillator.type = 'sine';
        
        // Volume inicial mais alto
        gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
      };
      
      // Tocar o som duas vezes com intervalo para chamar mais atenção
      playBellSound();
      
      // Tocar novamente após 300ms
      window.setTimeout(() => {
        playBellSound();
      }, 400);
    } catch (error) {
      console.error('Erro ao tocar som de fallback:', error);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Configurar realtime para pedidos
    const ordersChannel = supabase
      .channel('orders')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🔔 Novo pedido recebido via realtime:', payload);
          // Check if the order already exists in the state to avoid duplicates
          setOrders(prev => {
            const exists = prev.some(order => order.id === payload.new.id);
            if (exists) return prev;
            return [payload.new as Order, ...prev];
          });
          // Tocar som de notificação
          playNotificationSound();
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🔄 Pedido atualizado via realtime:', payload);
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id ? payload.new as Order : order
          ));
        }
      )
      .subscribe((status) => console.log('🔌 Status da inscrição de pedidos:', status));

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    refetch: fetchOrders,
    setOrders
  };
};

export const useOrderChat = (orderId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date>(new Date());
  const messagesRef = useRef<ChatMessage[]>([]); 

  // Keep a ref to the current messages for use in callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Buscando mensagens para o pedido:', orderId, 'às', new Date().toLocaleTimeString(), 'orderId type:', typeof orderId);
      
      if (!orderId) {
        console.error('❌ orderId não fornecido para buscar mensagens');
        setLoading(false);
        return;
      }
      
      // Ensure orderId is a valid UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
        console.error('❌ orderId não é um UUID válido:', orderId);
        setLoading(false);
        return;
      }

      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://placeholder.supabase.co' || 
          supabaseKey === 'placeholder-key') {
        console.error('❌ Supabase não está configurado corretamente');
        console.error('   Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
        console.error('   Valores atuais:');
        console.error('   - VITE_SUPABASE_URL:', supabaseUrl || 'undefined');
        console.error('   - VITE_SUPABASE_ANON_KEY:', supabaseKey ? '[DEFINIDO]' : 'undefined');
        setLoading(false);
        return;
      }

      // Test network connectivity first
      console.log('🌐 Testando conectividade de rede...');
      try {
        // Skip external connectivity test to avoid timeout issues
        console.log('⏭️ Pulando teste de conectividade externa para evitar timeouts');
      } catch (connectivityError) {
        console.log('⏭️ Teste de conectividade pulado');
      }

      // Test Supabase connectivity specifically
      console.log('🔍 Testando conectividade com Supabase...');
      try {
        const supabaseTest = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          signal: AbortSignal.timeout(5000)
        });
        console.log('✅ Conectividade com Supabase OK, status:', supabaseTest.status);
      } catch (supabaseTestError) {
        console.error('❌ Falha no teste de conectividade com Supabase:', supabaseTestError);
        console.error('   Verifique:');
        console.error('   1. Se o projeto Supabase está ativo em https://supabase.com/dashboard');
        console.error('   2. Se as credenciais estão corretas');
        console.error('   3. Se não há problemas de rede ou firewall');
        
        // Set empty messages and return instead of continuing
        setMessages([]);
        setLoading(false);
        return;
      }
      // Add a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 8000); // Increased timeout
      
      console.log('📡 Fazendo requisição para buscar mensagens...');
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);

      if (error) {
        if (error.message === 'Failed to fetch') {
          console.error('❌ Erro de conexão com Supabase:', error);
          console.error('   🔧 Soluções possíveis:');
          console.error('   1. Verifique sua conexão com a internet');
          console.error('   2. Confirme se as credenciais do Supabase estão corretas');
          console.error('   3. Verifique se o projeto Supabase está ativo');
          console.error('   4. Desative temporariamente extensões do navegador');
          console.error('   5. Tente usar outro navegador ou rede');
          console.error('   6. Verifique se firewall/antivírus não está bloqueando');
        } else if (error.name === 'AbortError') {
          console.error('❌ Timeout ao buscar mensagens - requisição cancelada após 8 segundos');
          console.error('   Isso pode indicar conexão lenta ou problemas no servidor');
        } else {
          console.error('❌ Erro ao buscar mensagens:', error);
        }
        setMessages([]);
        setLastFetch(new Date());
        return;
      }
      
      setMessages(data || []);
      console.log('✅ Mensagens carregadas:', data?.length || 0, 'às', new Date().toLocaleTimeString());
      setLastFetch(new Date());
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.error('❌ Requisição cancelada (timeout)');
        } else if (err.message === 'Failed to fetch') {
          console.error('❌ Falha na conexão de rede:', err);
          console.error('   🔧 Diagnóstico recomendado:');
          console.error('   1. Abra as Ferramentas do Desenvolvedor (F12)');
          console.error('   2. Vá para a aba Network e tente novamente');
          console.error('   3. Procure por requisições falhadas para identificar o problema');
        } else {
          console.error('❌ Erro inesperado ao carregar mensagens:', err);
        }
      } else {
        console.error('❌ Erro desconhecido ao carregar mensagens:', err);
      }
      // Set empty messages instead of leaving in error state
      setMessages([]);
    } finally {
      setLoading(false);
      setLastFetch(new Date());
    }
  }, [orderId]);

  // Função para recarregar mensagens periodicamente
  const refreshMessages = useCallback(async () => {
    try {
      console.log('🔄 Recarregando mensagens para o pedido:', orderId, 'às', new Date().toLocaleTimeString());
      if (!orderId) {
        console.error('❌ orderId não fornecido para recarregar mensagens');
        return;
      }
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://placeholder.supabase.co' || 
          supabaseKey === 'placeholder-key') {
        console.error('❌ Supabase não está configurado para recarregar mensagens');
        return;
      }

      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout refreshing messages')), 3000);
      });
      
      const fetchPromise = supabase
        .from('chat_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])
        .catch(err => {
          if (err.message === 'Failed to fetch') {
            console.error('❌ Erro de conexão ao recarregar mensagens:', err);
          } else {
            console.error('❌ Erro ao recarregar mensagens (timeout ou outro erro):', err);
          }
          return { data: null, error: err };
        });

      if (error) {
        console.error('❌ Erro ao recarregar mensagens:', error);
        // Don't throw error, just log it and continue
        return;
      }
      
      // Só atualizar se houver mudanças
      console.log('✅ Mensagens recarregadas:', data?.length || 0, 'às', new Date().toLocaleTimeString());
      const newMessages = data || [];
      if (newMessages.length !== messages.length || 
          (newMessages.length > 0 && messages.length > 0 && 
           newMessages[newMessages.length - 1].id !== messages[messages.length - 1]?.id)) {
        setMessages(newMessages);
        setLastFetch(new Date());
      }
    } catch (err) {
      console.error('❌ Erro ao recarregar mensagens:', err);
    }
  }, [orderId, messages]);

  const sendMessage = useCallback(async (
    message: string, 
    senderType: 'customer' | 'attendant',
    senderName: string, 
    options?: { playSound?: boolean }
  ) => {
    try {
      if (!orderId) {
        console.error('❌ orderId não fornecido para enviar mensagem');
        throw new Error('ID do pedido não fornecido');
      }
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://placeholder.supabase.co' || 
          supabaseKey === 'placeholder-key') {
        throw new Error('Supabase não está configurado corretamente. Verifique o arquivo .env');
      }

      console.log('📤 Enviando mensagem:', message, 'tipo:', senderType);
      
      if (!message.trim()) {
        console.warn('Tentativa de enviar mensagem vazia');
        return null;
      }
      
      const { data, error } = await supabase
        .from('chat_messages') // Using the correct table name
        .insert([{
          order_id: orderId,
          sender_type: senderType,
          sender_name: senderName,
          message,
          created_at: new Date().toISOString(),
          read_by_customer: senderType === 'customer',
          read_by_attendant: senderType === 'attendant'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao inserir mensagem:', error);
        if (error.message === 'Failed to fetch') {
          throw new Error('Erro de conexão. Verifique sua internet e configuração do Supabase.');
        }
        throw new Error(`Erro ao enviar mensagem: ${error.message}`);
      }
      console.log('✅ Mensagem enviada com sucesso');

      try {
        // Criar notificação para nova mensagem
        await supabase
          .from('notifications')
          .insert([{
            order_id: orderId,
            type: 'new_message',
            title: 'Nova Mensagem',
            message: `Nova mensagem de ${senderName}`,
            read: false,
            created_at: new Date().toISOString()
          }]);
      } catch (notifError) {
        console.warn('Erro ao criar notificação (não crítico):', notifError);
      }

      return data;
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Erro desconhecido ao enviar mensagem');
    }
  }, [orderId]);

  const markAsRead = useCallback(async (messageId: string, readerType: 'customer' | 'attendant') => {
    try {
      const updateField = readerType === 'customer' ? 'read_by_customer' : 'read_by_attendant';
      
      const { error } = await supabase
        .from('chat_messages')
        .update({ [updateField]: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      console.error('❌ orderId não fornecido no useEffect');
      setLoading(false);
      return;
    }

    fetchMessages();

    // Configurar polling para garantir que as mensagens sejam atualizadas
    const pollingInterval = setInterval(() => {
      refreshMessages();
    }, 3000); // Verificar a cada 3 segundos

    // Configurar realtime para mensagens
    const messagesChannel = supabase
      .channel(`chat:${orderId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔔 Nova mensagem recebida via realtime:', payload);
          console.log('📨 Nova mensagem recebida via realtime:', payload.new);
          setMessages(prev => [...prev, payload.new]);
          setLastFetch(new Date());
          // Tocar som para nova mensagem
          // Removed sound playing here as it's handled in the component
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔄 Mensagem atualizada via realtime:', payload);
          console.log('📝 Mensagem atualizada via realtime:', payload.new);
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id ? payload.new as ChatMessage : msg
          ));
          setLastFetch(new Date());
        }
      )
      .subscribe((status) => console.log('🔌 Status da inscrição do chat:', status));

    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(messagesChannel);
    };
  }, [orderId, fetchMessages, refreshMessages]);

  const playMessageSound = () => {
    try {
      // Obter configuração de som do localStorage
      const soundSettings = localStorage.getItem('chatSoundSettings');
      const settings = soundSettings ? JSON.parse(soundSettings) : { enabled: true, volume: 0.5, soundUrl: "https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3" };
      
      // Verificar se o som está habilitado
      if (!settings.enabled) {
        console.log('🔕 Som de mensagem desabilitado nas configurações');
        return;
      }
      
      // Criar um elemento de áudio e tocar o som configurado
      const audio = new Audio(settings.soundUrl);
      audio.volume = settings.volume; // Ajustar volume conforme configuração
      audio.play().catch(e => {
        console.error('Erro ao tocar som de mensagem:', e);
        // Tentar método alternativo se falhar
        playMessageSoundFallback();
      });
    } catch (error) {
      console.error('Erro ao tocar som de mensagem:', error);
      // Tentar método alternativo se falhar
      playMessageSoundFallback();
    }
  };
  
  // Função de fallback para tocar som usando Web Audio API
  const playMessageSoundFallback = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Erro ao tocar som de fallback:', error);
    }
  };

  // Recarregar mensagens quando a página ganha foco
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Página ganhou foco, recarregando mensagens...');
      refreshMessages();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Página ficou visível, recarregando mensagens...');
        refreshMessages();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshMessages]);

  return {
    messages,
    loading,
    lastFetch,
    sendMessage,
    markAsRead,
    refreshMessages
  };
};