import { Outlet } from 'react-router';
import { StudentProvider } from '../../../application/contexts/StudentContext';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';

const studentNavItems = [
  { to: '/student/mybooks', label: 'My Borrowed Books', icon: '📖' },
  { to: '/student/catalog', label: 'Browse Catalog & Rent', icon: '🔍' },
];

function StudentDashboardContent() {
  return (
    <DashboardLayout
      navItems={studentNavItems}
      title="Bibliotech Student Portal"
      subtitle="Track your borrowed books, loan due dates, and explore the Bibliotech Library catalog."
    >
      <Outlet />
    </DashboardLayout>
  );
}

export function StudentDashboard() {
  return (
    <StudentProvider>
      <StudentDashboardContent />
    </StudentProvider>
  );
}
