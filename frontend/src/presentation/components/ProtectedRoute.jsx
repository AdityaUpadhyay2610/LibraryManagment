import { Navigate } from 'react-router';
import { useAuth } from '../../application/hooks/useAuth';
import { Loader } from './Loader';

export function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to correct dashboard based on actual role
    if (user.role === 'ROLE_ADMIN') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'ROLE_STUDENT') {
      return <Navigate to="/student" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
