import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminAttendanceUser {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: 'attendant' | 'admin';
  is_active: boolean;
  permissions: {
    can_view_orders: boolean;
    can_update_status: boolean;
    can_chat: boolean;
    can_create_manual_orders: boolean;
    can_print_orders: boolean;
  };
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export const useAdminAttendanceUsers = () => {
  const [users, setUsers] = useState<AdminAttendanceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando usuários de atendimento do banco...');
      
      const { data, error } = await supabase
        .from('attendance_users')
        .select('*')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
      console.log(`✅ ${data?.length || 0} usuários carregados do banco`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      console.error('❌ Erro ao carregar usuários:', errorMessage);
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (user: Omit<AdminAttendanceUser, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🚀 Criando usuário no banco:', user);
      
      const { data, error } = await supabase
        .from('attendance_users')
        .insert([user])
        .select()
        .single();

      if (error) throw error;
      
      setUsers(prev => [...prev, data]);
      console.log('✅ Usuário criado no banco:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar usuário:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar usuário');
    }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<AdminAttendanceUser>) => {
    try {
      console.log('✏️ Atualizando usuário no banco:', id, updates);
      
      const { data, error } = await supabase
        .from('attendance_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === id ? data : u));
      console.log('✅ Usuário atualizado no banco:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao atualizar usuário:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Excluindo usuário do banco:', id);
      
      const { error } = await supabase
        .from('attendance_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setUsers(prev => prev.filter(u => u.id !== id));
      console.log('✅ Usuário excluído do banco');
    } catch (err) {
      console.error('❌ Erro ao excluir usuário:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir usuário');
    }
  }, []);

  const authenticateUser = useCallback(async (username: string, password: string): Promise<AdminAttendanceUser | null> => {
    try {
      console.log('🔐 Autenticando usuário:', username);
      
      const { data, error } = await supabase
        .from('attendance_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.log('❌ Credenciais inválidas');
        return null;
      }

      // Atualizar último login
      await supabase
        .from('attendance_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      console.log('✅ Usuário autenticado:', data.name);
      return data;
    } catch (err) {
      console.error('❌ Erro na autenticação:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    authenticateUser,
    refetch: fetchUsers
  };
};