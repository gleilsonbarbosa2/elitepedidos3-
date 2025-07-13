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
  const [session, setSession] = useState<AttendanceSession>({
    isAuthenticated: false
  });

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