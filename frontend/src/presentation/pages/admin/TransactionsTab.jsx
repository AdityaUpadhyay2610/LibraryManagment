import { useEffect } from 'react';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { formatDate } from '../../../services/utils';
import { adminApi } from '../../../services/api';

export function TransactionsTab() {
  const { adminData, returnBook, fetchAdminData } = useAdmin();

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleExportCsv = () => {
    window.open(adminApi.exportTransactionsCsvUrl(), '_blank');
  };

  return (
    <div className="tab-pane">
      <div className="glass-panel">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3>Library Master Log Transactions</h3>
            <p className="text-muted text-sm mt-1">Audit trail of all issued, returned, and overdue books.</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportCsv}
          >
            📥 Export CSV
          </button>
        </div>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Student Details</th>
                <th>Book Details</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Fines Charged</th>
                <th>Status & Action</th>
              </tr>
            </thead>
            <tbody>
              {adminData.transactions.map(t => (
                <tr key={t.id}>
                  <td><code>TX-{t.id}</code></td>
                  <td>
                    <div className="font-bold">{t.student?.fullName}</div>
                    <span className="text-xs text-muted">@{t.student?.username}</span>
                  </td>
                  <td>{t.book?.title}</td>
                  <td>{formatDate(t.issueDate)}</td>
                  <td>{formatDate(t.dueDate)}</td>
                  <td>
                    {t.returnDate ? (
                      formatDate(t.returnDate)
                    ) : (
                      <span className="text-warning font-semibold">Active</span>
                    )}
                  </td>
                  <td>
                    {t.fine !== null ? (
                      <span className={t.fine > 0 ? 'text-danger font-bold' : 'text-success'}>
                        ₹{t.fine.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted italic">Pending check</span>
                    )}
                  </td>
                  <td>
                    {t.returnDate ? (
                      <span className="badge badge-success">Returned</span>
                    ) : (
                      <button 
                        type="button"
                        className="btn btn-primary btn-sm" 
                        onClick={() => returnBook(t.id)}
                      >
                        Mark Returned
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {adminData.transactions.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted">No transaction logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
