import { Navigate } from 'react-router';
import { useAuth } from '../../application/hooks/useAuth';

export function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'ROLE_ADMIN') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'ROLE_STUDENT') {
      return <Navigate to="/student" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
