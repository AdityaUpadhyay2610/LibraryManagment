import { useState, useEffect } from 'react';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { useWeatherAndClock } from '../../../application/hooks/useWeatherAndClock';
import { DEFAULT_ISSUE_PAYLOAD } from '../../../domain/constants';

export function IssueBookTab() {
  const { adminData, issueBook, fetchAdminData } = useAdmin();
  const [payload, setPayload] = useState(DEFAULT_ISSUE_PAYLOAD);
  const { time } = useWeatherAndClock();

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const formattedTime = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!payload.studentUsername || !payload.bookTitle) {
      return;
    }
    try {
      await issueBook(payload.studentUsername, payload.bookTitle);
      setPayload(DEFAULT_ISSUE_PAYLOAD);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="tab-pane-center">
      <div className="glass-panel max-w-2xl mx-auto">
        <h3>Issue Book to Student</h3>
        <p className="text-muted text-sm mt-1">This registers a book loan transaction and generates automated email notifications.</p>
        
        <div className="mt-3 p-3 bg-black/15 border border-orange-500/10 rounded flex justify-between items-center text-xs text-muted select-none">
          <span>Transaction System Timestamp:</span>
          <span className="font-semibold text-orange-500">{formattedDate} | {formattedTime}</span>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="form-group">
            <label className="form-label">Select Registered Student (By Username)</label>
            <select 
              className="form-input"
              value={payload.studentUsername}
              onChange={e => setPayload({ ...payload, studentUsername: e.target.value })}
            >
              <option value="">-- Select Student User --</option>
              {adminData.users.filter(u => u.role === 'ROLE_STUDENT').map(s => (
                <option key={s.id} value={s.username}>{s.fullName} ({s.username})</option>
              ))}
            </select>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Select Book (By Title)</label>
            <select 
              className="form-input"
              value={payload.bookTitle}
              onChange={e => setPayload({ ...payload, bookTitle: e.target.value })}
            >
              <option value="">-- Select Available Book --</option>
              {adminData.books.map(b => (
                <option key={b.id} value={b.title} disabled={b.copies <= 0}>
                  {b.title} {b.copies <= 0 ? '(Out of stock)' : `(${b.copies} copies remaining)`}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-6">
            Proceed and Issue Book (at {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
          </button>
        </form>
      </div>
    </div>
  );
}
