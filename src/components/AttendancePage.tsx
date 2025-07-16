import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceLogin from './Orders/AttendanceLogin';
import UnifiedAttendancePage from './UnifiedAttendancePage';
import { useAttendance } from '../hooks/useAttendance';
import { BarChart3 } from 'lucide-react';


// Store session in localStorage to persist between page refreshes
const ATTENDANCE_SESSION_KEY = 'attendance_session';

const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useAttendance();

  // Check for stored session on component mount
  useEffect(() => {
    const storedSession = localStorage.getItem(ATTENDANCE_SESSION_KEY);
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        // Check if session is still valid (less than 24 hours old)
        const isValid = sessionData.timestamp && 
                       (Date.now() - sessionData.timestamp) < (24 * 60 * 60 * 1000);
                       
        if (isValid && sessionData.isAuthenticated) {
          console.log('✅ Restored attendance session from localStorage');
          // Auto-login with default credentials
          login('admin', 'elite2024');
        } else {
          // Clear expired session
          localStorage.removeItem(ATTENDANCE_SESSION_KEY);
        }
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem(ATTENDANCE_SESSION_KEY);
      }
    }
  }, [login]);

  // Se o atendente está logado, mostrar painel de atendimento
  if (session.isAuthenticated) {
    return (
      <UnifiedAttendancePage />
    );
  }

  // Se não está logado, mostrar tela de login
  return (
    <AttendanceLogin
      onLogin={(username, password) => {
        const success = login(username, password);
        if (success) {
          // Save session to localStorage
          localStorage.setItem(ATTENDANCE_SESSION_KEY, JSON.stringify({
            isAuthenticated: true,
            timestamp: Date.now()
          }));
        }
        return success;
      }}
    />
  );
};

export default AttendancePage;