import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './application/hooks/useAuth';
import { AuthPage } from './presentation/pages/AuthPage';
import { AdminDashboard } from './presentation/pages/admin/AdminDashboard';
import { StudentDashboard } from './presentation/pages/student/StudentDashboard';
import { ProtectedRoute } from './presentation/components/ProtectedRoute';
import { Loader } from './presentation/components/Loader';

// Admin Tabs
import { OverviewTab } from './presentation/pages/admin/OverviewTab';
import { BooksTab } from './presentation/pages/admin/BooksTab';
import { StudentsTab } from './presentation/pages/admin/StudentsTab';
import { IssueBookTab } from './presentation/pages/admin/IssueBookTab';
import { TransactionsTab } from './presentation/pages/admin/TransactionsTab';

// Student Tabs
import { MyBooksTab } from './presentation/pages/student/MyBooksTab';
import { CatalogTab } from './presentation/pages/student/CatalogTab';

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

      {/* Protected Admin Routes with Nested Paths */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="ROLE_ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewTab />} />
        <Route path="books" element={<BooksTab />} />
        <Route path="students" element={<StudentsTab />} />
        <Route path="issue" element={<IssueBookTab />} />
        <Route path="transactions" element={<TransactionsTab />} />
      </Route>

      {/* Protected Student Routes with Nested Paths */}
      <Route 
        path="/student" 
        element={
          <ProtectedRoute requiredRole="ROLE_STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      >
        <Route index element={<Navigate to="mybooks" replace />} />
        <Route path="mybooks" element={<MyBooksTab />} />
        <Route path="catalog" element={<CatalogTab />} />
      </Route>

      {/* Fallback to Root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
