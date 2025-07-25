import { useState, useCallback } from 'react';
import { useAdminAttendanceUsers } from './useAdminAttendanceUsers';

interface AttendanceSession {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    role: 'attendant' | 'admin';
    permissions: {
      can_view_orders: boolean;
      can_update_status: boolean;
      can_chat: boolean;
      can_create_manual_orders: boolean;
      can_print_orders: boolean;
    };
  };
}

export const useAttendance = () => {
  const [session, setSession] = useState<AttendanceSession>({
    isAuthenticated: false
  });
  const { authenticateUser } = useAdminAttendanceUsers();

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const user = await authenticateUser(username, password);
      
      if (user) {
        console.log('Attendance login successful');
        
        setSession({
          isAuthenticated: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: user.permissions
          }
        });
        return true;
      }
      
      console.log('Attendance login failed');
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  }, [authenticateUser]);

  const logout = useCallback(() => {
    console.log('Attendance logout');
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