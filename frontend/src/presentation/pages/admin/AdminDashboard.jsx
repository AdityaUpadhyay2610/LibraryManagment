import { Outlet } from 'react-router';
import { AdminProvider } from '../../../application/contexts/AdminContext';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';

const adminNavItems = [
  { to: '/admin/overview', label: 'Dashboard', icon: '📊' },
  { to: '/admin/books', label: 'Books', icon: '📖' },
  { to: '/admin/students', label: 'Members', icon: '👥' },
  { to: '/admin/issue', label: 'Issue Book', icon: '⚡' },
  { to: '/admin/transactions', label: 'Transactions', icon: '⏳' },
];

function AdminDashboardContent() {
  return (
    <DashboardLayout
      navItems={adminNavItems}
      title="Bibliotech Admin Portal"
      subtitle="Here's what's happening at Bibliotech Library today."
    >
      <Outlet />
    </DashboardLayout>
  );
}

export function AdminDashboard() {
  return (
    <AdminProvider>
      <AdminDashboardContent />
    </AdminProvider>
  );
}
