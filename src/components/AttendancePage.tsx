import React from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceLogin from './Orders/AttendanceLogin';
import UnifiedAttendancePage from './UnifiedAttendancePage';
import { useAttendance } from '../hooks/useAttendance';
import { BarChart3 } from 'lucide-react';


const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useAttendance();

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
        return success;
      }} 
    />
  );
};

export default AttendancePage;