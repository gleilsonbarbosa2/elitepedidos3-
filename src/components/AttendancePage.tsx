import React from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceLogin from './Orders/AttendanceLogin';
import UnifiedAttendancePage from './UnifiedAttendancePage';
import { useAttendance } from '../hooks/useAttendance';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGuard from './PermissionGuard';

const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useAttendance();
  const { hasPermission } = usePermissions();
  
  // Check if user has PDV operator session with attendance permission
  const pdvOperator = localStorage.getItem('pdv_operator');
  let hasPDVAccess = false;
  let operator = null;
  
  if (pdvOperator) {
    try {
      operator = JSON.parse(pdvOperator);
      hasPDVAccess = operator.permissions?.can_view_attendance === true;
    } catch (error) {
      console.error('Error parsing PDV operator:', error);
    }
  }

  // Se o atendente está logado OU tem acesso via PDV com permissão, mostrar painel de atendimento
  if (session.isAuthenticated) {
    return (
      <UnifiedAttendancePage propAttendanceSession={session} />
    );
  }
  
  // Se tem operador PDV, verificar permissão
  if (operator) {
    return (
      <PermissionGuard 
        hasPermission={hasPDVAccess} 
        showMessage={true}
        fallbackPath="/"
      >
        <UnifiedAttendancePage operator={operator} propAttendanceSession={session} />
      </PermissionGuard>
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