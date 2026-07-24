import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './application/hooks/useAuth';
import { AuthPage } from './presentation/pages/AuthPage';
import { AdminDashboard } from './presentation/pages/admin/AdminDashboard';
import { StudentDashboard } from './presentation/pages/student/StudentDashboard';
import { ProtectedRoute } from './presentation/components/ProtectedRoute';
import { Loader } from './presentation/components/Loader';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <Routes>
      {/* Root Path Router */}
      <Route 
        path="/" 
        element={
          user ? (
            user.role === 'ROLE_ADMIN' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/student" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Login / Auth page */}
      <Route path="/login" element={<AuthPage />} />

      {/* Protected Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute requiredRole="ROLE_ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Protected Student Routes */}
      <Route 
        path="/student/*" 
        element={
          <ProtectedRoute requiredRole="ROLE_STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Fallback to Root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
