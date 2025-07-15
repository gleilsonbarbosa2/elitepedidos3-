import { useState, useCallback } from 'react';

interface AttendanceSession {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    role: 'attendant' | 'admin';
  };
}

const ATTENDANCE_CREDENTIALS = {
  username: 'admin', 
  password: 'elite2024'
};

export const useAttendance = () => {
  // Check if there's a stored session in localStorage
  const getInitialSession = (): AttendanceSession => {
    try {
      const storedSession = localStorage.getItem('attendance_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        // Check if session is still valid (less than 24 hours old)
        const isValid = sessionData.timestamp && 
                       (Date.now() - sessionData.timestamp) < (24 * 60 * 60 * 1000);
                       
        if (isValid && sessionData.isAuthenticated) {
          console.log('✅ Restored attendance session from localStorage');
          return {
            isAuthenticated: true,
            user: {
              id: '1',
              username: ATTENDANCE_CREDENTIALS.username,
              role: 'admin'
            }
          };
        }
      }
    } catch (error) {
      console.error('Error parsing stored session:', error);
    }
    
    return { isAuthenticated: false };
  };
  
  const [session, setSession] = useState<AttendanceSession>(getInitialSession());

  const login = useCallback((username: string, password: string): boolean => {
    if (username === ATTENDANCE_CREDENTIALS.username && password === ATTENDANCE_CREDENTIALS.password) {
      console.log('Attendance login successful');
      setSession({
        isAuthenticated: true,
        user: {
          id: '1',
          username: ATTENDANCE_CREDENTIALS.username,
          role: 'admin'
        }
      });
      return true;
    }
    console.log('Attendance login failed');
    return false;
  }, []);

  const logout = useCallback(() => {
    console.log('Attendance logout');
    // Clear session from localStorage
    localStorage.removeItem('attendance_session');
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