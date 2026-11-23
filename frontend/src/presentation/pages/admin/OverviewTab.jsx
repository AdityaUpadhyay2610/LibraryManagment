import { useEffect } from 'react';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { StatCard } from '../../components/dashboard/StatCard';
import { PriorityCard } from '../../components/dashboard/PriorityCard';
import { QuickActionsCard } from '../../components/dashboard/QuickActionsCard';
import { ActivityFeedCard } from '../../components/dashboard/ActivityFeedCard';

export function OverviewTab() {
  const { adminData, fetchAdminData } = useAdmin();

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const transactions = adminData.transactions || [];
  const overdueLoans = transactions.filter(
    (t) => !t.returnDate && new Date(t.dueDate).getTime() < Date.now()
  );
  const totalFines = adminData.statFines || 0;

  const activities = transactions.slice(0, 5).map((t) => {
    const isReturned = Boolean(t.returnDate);
    const isOverdue = !isReturned && new Date(t.dueDate).getTime() < Date.now();
    const studentName = t.student?.fullName || t.student?.username || 'Student';
    const bookTitle = t.book?.title || 'Unknown';

    const timeString = t.returnDate
      ? new Date(t.returnDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date(t.issueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isReturned) {
      return { id: t.id, dotColor: 'emerald', user: studentName, actionText: 'returned', bookTitle, badgeText: 'Returned', badgeColor: 'emerald', time: timeString, extraNote: t.fine > 0 ? `₹${t.fine.toFixed(2)} fine` : null };
    }
    if (isOverdue) {
      return { id: t.id, dotColor: 'rose', user: studentName, actionText: 'overdue on', bookTitle, badgeText: 'Overdue', badgeColor: 'rose', time: timeString };
    }
    return { id: t.id, dotColor: 'blue', user: studentName, actionText: 'issued', bookTitle, badgeText: 'Issued', badgeColor: 'blue', time: timeString };
  });

  return (
    <div className="dash-content-stack">
      {/* Stat cards row */}
      <div className="stats-grid">
        <StatCard icon="📚" title="Total Books" value={adminData.statBooks || 0} subtitle="titles in catalog" accent="primary" />
        <StatCard icon="📖" title="Borrowed" value={adminData.statIssued || 0} subtitle="currently issued" accent="emerald" />
        <StatCard icon="👥" title="Members" value={adminData.statStudents || 0} subtitle="registered students" accent="primary" />
        <StatCard icon="⚠️" title="Overdue" value={overdueLoans.length} subtitle={`₹${totalFines.toFixed(2)} in fines`} accent="crimson" />
      </div>

      {/* Priorities */}
      {overdueLoans.length > 0 && (
        <PriorityCard
          title="Action Required"
          subtitle={`${overdueLoans.length} overdue items need attention`}
          items={[
            { id: 'p1', dotColor: 'red', text: `${overdueLoans.length} overdue accounts require follow-up`, actionLabel: 'Review', to: '/admin/transactions' },
            { id: 'p2', dotColor: 'orange', text: `${adminData.statIssued || 0} active loans in circulation`, actionLabel: 'View', to: '/admin/transactions' },
          ]}
        />
      )}

      {/* Two-column: Quick Actions + Activity */}
      <div className="dash-two-col">
        <QuickActionsCard
          actions={[
            { id: 'a1', icon: '⚡', title: 'Issue Book', description: 'Issue a book to a student', to: '/admin/issue' },
            { id: 'a2', icon: '↩️', title: 'Return Book', description: 'Process a book return', to: '/admin/transactions' },
            { id: 'a3', icon: '👤', title: 'Add Student', description: 'Register a new member', to: '/admin/students' },
          ]}
        />
        <ActivityFeedCard title="Recent Activity" viewAllLink="/admin/transactions" activities={activities} />
      </div>
    </div>
  );
}
