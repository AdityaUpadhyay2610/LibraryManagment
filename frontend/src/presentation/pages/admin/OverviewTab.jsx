import { useEffect } from 'react';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { formatDate } from '../../../services/utils';

export function OverviewTab() {
  const { adminData, fetchAdminData } = useAdmin();

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return (
    <div className="tab-pane">
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-panel gradient-border-primary">
          <span className="stat-icon">📚</span>
          <div className="stat-value">{adminData.statBooks}</div>
          <div className="stat-label">Total Books Cataloged</div>
        </div>
        <div className="stat-card glass-panel gradient-border-secondary">
          <span className="stat-icon">📖</span>
          <div className="stat-value">{adminData.statIssued}</div>
          <div className="stat-label">Books Issued Currently</div>
        </div>
        <div className="stat-card glass-panel gradient-border-emerald">
          <span className="stat-icon">🎓</span>
          <div className="stat-value">{adminData.statStudents}</div>
          <div className="stat-label font-bold">Students Registered</div>
        </div>
        <div className="stat-card glass-panel gradient-border-amber">
          <span className="stat-icon font-sans">₹</span>
          <div className="stat-value">₹{(adminData.statFines || 0).toFixed(2)}</div>
          <div className="stat-label">Total Late Return Fines</div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="dashboard-section mt-8">
        <h3>Recent Library Activities</h3>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Book Title</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {adminData.transactions.slice(0, 5).map(t => (
                <tr key={t.id}>
                  <td>{t.student?.fullName || t.student?.username}</td>
                  <td>{t.book?.title}</td>
                  <td>{formatDate(t.issueDate)}</td>
                  <td>{formatDate(t.dueDate)}</td>
                  <td>{t.returnDate ? formatDate(t.returnDate) : '-'}</td>
                  <td>
                    <span className={`badge ${t.returnDate ? 'badge-success' : 'badge-danger'}`}>
                      {t.returnDate ? 'Returned' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {adminData.transactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted">No transactions available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
