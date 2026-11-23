import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useStudent } from '../../../application/hooks/useStudent';
import { BookCover } from '../../components/BookCover';
import { formatDate } from '../../../services/utils';
import { StatCard } from '../../components/dashboard/StatCard';
import { PriorityCard } from '../../components/dashboard/PriorityCard';

export function MyBooksTab() {
  const { studentData, renewBook, fetchStudentData } = useStudent();
  const [filterMode, setFilterMode] = useState('active');

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const allLoans = studentData.myBooks || [];
  const activeLoans = allLoans.filter((t) => !t.returnDate);
  const returnedLoans = allLoans.filter((t) => t.returnDate);
  const overdueLoans = activeLoans.filter((t) => new Date(t.dueDate).getTime() < Date.now());
  const totalFines = allLoans.reduce((acc, t) => acc + (t.finePaid ? 0 : (t.fine || 0)), 0);
  const catalogList = studentData.catalog || [];
  const totalCopies = catalogList.reduce((acc, b) => acc + (b.copies || 0), 0);

  const displayedLoans =
    filterMode === 'active' ? activeLoans
    : filterMode === 'history' ? returnedLoans
    : allLoans;

  const getLoanStatus = (t) => {
    if (t.returnDate) {
      return { label: 'Returned', cls: 'badge-success', detail: `Returned ${formatDate(t.returnDate)}` };
    }
    const daysLeft = Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) {
      const over = Math.abs(daysLeft);
      return { label: `${over}d overdue`, cls: 'badge-danger', detail: `₹${(over * 10).toFixed(2)} fine`, isOverdue: true };
    }
    if (daysLeft <= 2) {
      return { label: daysLeft === 0 ? 'Due today' : `${daysLeft}d left`, cls: 'badge-warning', detail: 'Return soon' };
    }
    return { label: `${daysLeft}d left`, cls: 'badge-secondary', detail: 'On time' };
  };

  return (
    <div className="dash-content-stack">
      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard icon="📖" title="Borrowed" value={activeLoans.length} subtitle={`${3 - activeLoans.length} of 3 slots free`} badge={`${activeLoans.length}/3`} accent="primary" />
        <StatCard icon={overdueLoans.length > 0 ? '⚠️' : '✓'} title="Loan Status" value={overdueLoans.length > 0 ? `${overdueLoans.length} Overdue` : 'All On Time'} subtitle={overdueLoans.length > 0 ? '₹10/day penalty applies' : 'No overdue books'} accent={overdueLoans.length > 0 ? 'crimson' : 'emerald'} />
        <StatCard icon="₹" title="Fines" value={`₹${totalFines.toFixed(2)}`} subtitle={totalFines > 0 ? 'Pay at admin desk' : 'Balance clear'} accent="amber" />
        <StatCard icon="📚" title="Library Stock" value={totalCopies} subtitle={`${catalogList.length} titles`} accent="primary" />
      </div>

      {/* Rules Notice */}
      <PriorityCard
        title="Library Rules"
        subtitle="Bibliotech Library policies"
        items={[
          { id: 'n1', dotColor: 'blue', text: 'Books must be returned physically to the Admin desk.', actionLabel: 'Catalog', to: '/student/catalog' },
          { id: 'n2', dotColor: 'orange', text: 'Overdue penalty: ₹10 per day after the due date.' },
          { id: 'n3', dotColor: 'emerald', text: 'Maximum 3 active borrowed books at any time.' },
        ]}
      />

      {/* Loan History Card */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="dash-section-header">
          <div>
            <h3 className="section-title">My Borrowed Books</h3>
            <p className="text-muted text-xs" style={{ marginTop: '2px' }}>Manage active rentals and track returns.</p>
          </div>

          {/* Filter Pills */}
          <div className="filter-pills">
            {[
              { key: 'active', label: `Active (${activeLoans.length})` },
              { key: 'history', label: `Returned (${returnedLoans.length})` },
              { key: 'all', label: `All (${allLoans.length})` },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={`filter-pill ${filterMode === f.key ? 'active' : ''}`}
                onClick={() => setFilterMode(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {displayedLoans.length > 0 ? (
          <div className="table-container" style={{ marginTop: '16px' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Book Details</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedLoans.map((t) => {
                  const status = getLoanStatus(t);
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ width: '36px', height: '48px', borderRadius: '4px', overflow: 'hidden' }}>
                          <BookCover title={t.book?.title} author={t.book?.author} />
                        </div>
                      </td>
                      <td>
                        <div className="font-bold">{t.book?.title || 'Unknown'}</div>
                        <span className="text-xs text-muted">by {t.book?.author || 'N/A'}</span>
                      </td>
                      <td>{formatDate(t.issueDate)}</td>
                      <td className="font-semibold">{formatDate(t.dueDate)}</td>
                      <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                      <td style={{ color: (t.fine || 0) > 0 ? 'var(--accent-crimson)' : 'var(--text-muted)' }}>₹{(t.fine || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {!t.returnDate ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                            <span className="text-muted" style={{ fontSize: '0.65rem', fontStyle: 'italic' }}>Return via Admin</span>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => renewBook(t.id)}>
                              Renew ({t.renewalCount || 0}/2)
                            </button>
                          </div>
                        ) : (
                          <span className="text-success font-semibold" style={{ fontSize: '0.75rem' }}>Returned ✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center" style={{ padding: '50px 0' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📚</span>
            <p className="font-bold">No {filterMode === 'active' ? 'active' : ''} borrowed books</p>
            <p className="text-muted text-xs" style={{ marginTop: '4px' }}>Browse the catalog to discover and rent books.</p>
            <Link to="/student/catalog" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
              Explore Catalog →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
