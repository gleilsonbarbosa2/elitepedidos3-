import { useState, useCallback } from 'react';

interface AttendanceSession {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    role: 'attendant' | 'admin';
  };
}

// Get credentials from localStorage (managed by AttendanceCredentialsManager)
const getAttendanceCredentials = () => {
  try {
    const saved = localStorage.getItem('attendance_credentials');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Erro ao carregar credenciais:', error);
  }
  
  // Fallback credentials
  return {
    users: [
      { username: 'admin', password: 'elite2024', role: 'admin' as const },
      { username: 'carol', password: 'elite2024', role: 'attendant' as const },
      { username: 'sara', password: 'elite2024', role: 'attendant' as const }
    ]
  };
};

export const useAttendance = () => {
  const [session, setSession] = useState<AttendanceSession>({
    isAuthenticated: false
  });

  const login = useCallback((username: string, password: string): boolean => {
    const credentials = getAttendanceCredentials();
    
    console.log('🔐 Tentativa de login:', { username, password: '***' });
    console.log('📋 Credenciais disponíveis:', credentials.users.map(u => ({ username: u.username, password: '***' })));
    
    const user = credentials.users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    
    if (user) {
      console.log('✅ Login de atendimento bem-sucedido para:', user.username);
      setSession({
        isAuthenticated: true,
        user: {
          id: user.username,
          username: user.username,
          role: user.role
        }
      });
      return true;
    }
    
    console.log('❌ Login de atendimento falhou para:', username);
    console.log('🔍 Verificação detalhada:');
    credentials.users.forEach(u => {
      console.log(`  - ${u.username}: username match = ${u.username.toLowerCase() === username.toLowerCase()}, password match = ${u.password === password}`);
    });
    
    return false;
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Logout de atendimento');
    setSession({
      isAuthenticated: false
    });
  }, []);

  return {
    session,
    login,
    logout
  };
};