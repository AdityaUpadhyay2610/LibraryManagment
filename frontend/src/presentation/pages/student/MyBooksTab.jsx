import { useEffect } from 'react';
import { useStudent } from '../../../application/hooks/useStudent';
import { BookCover } from '../../components/BookCover';
import { formatDate } from '../../../services/utils';

export function MyBooksTab() {
  const { studentData, returnBook, fetchStudentData } = useStudent();

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  return (
    <div className="glass-panel">
      <h3>My Library Loan Ledger</h3>
      <p className="text-muted text-sm mt-1">Below are all active and completed book issues linked to your account.</p>
      
      <div className="table-container mt-4">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Book Cover</th>
              <th>Book Details</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Return Date</th>
              <th>Fines</th>
              <th>Status & Action</th>
            </tr>
          </thead>
          <tbody>
            {studentData.myBooks.map(t => (
              <tr key={t.id}>
                <td>
                  <div className="table-cover-wrapper w-16 h-24">
                    <BookCover title={t.book?.title} author={t.book?.author} />
                  </div>
                </td>
                <td>
                  <div className="font-bold">{t.book?.title}</div>
                  <div className="text-xs text-muted">Author: {t.book?.author}</div>
                </td>
                <td>{formatDate(t.issueDate)}</td>
                <td>{formatDate(t.dueDate)}</td>
                <td>
                  {t.returnDate ? (
                    formatDate(t.returnDate)
                  ) : (
                    <span className="text-warning font-semibold">Active Loan</span>
                  )}
                </td>
                <td>
                  {t.fine !== null ? (
                    <span className={t.fine > 0 ? 'text-danger font-bold' : 'text-success'}>
                      ₹{t.fine.toFixed(2)}
                    </span>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td>
                  {t.returnDate ? (
                    <span className="badge badge-success">Returned Successfully</span>
                  ) : (
                    <button 
                      type="button"
                      className="btn btn-primary btn-sm" 
                      onClick={() => returnBook(t.id)}
                    >
                      Return Book
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {studentData.myBooks.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-muted p-8">
                  No books currently issued to your account. Go search the catalog!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
