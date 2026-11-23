import { useState } from 'react';

export function RentBookModal({ book, user, onClose, onRent }) {
  const [rentalDays, setRentalDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  if (!book) return null;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (parseInt(rentalDays, 10) || 1));
  const dueDateStr = dueDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onRent(book.id, rentalDays);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '100%', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Rent Book</h3>
            <p className="text-muted text-xs" style={{ marginTop: '2px' }}>Confirm rental details below.</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          {/* Book Info Summary */}
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', fontSize: '0.75rem', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="text-muted">Title:</span>
              <span className="font-semibold">{book.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="text-muted">Author:</span>
              <span>{book.author || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="text-muted">Copies:</span>
              <span className="text-success font-semibold">{book.copies} available</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Student:</span>
              <span>{user?.fullName || user?.username}</span>
            </div>
          </div>

          {/* Duration Selector */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Rental Duration</label>
              <span className="text-muted text-xs">Max 30 days</span>
            </div>

            <div className="filter-pills" style={{ marginBottom: '8px' }}>
              {[1, 3, 7, 14].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`filter-pill ${rentalDays === d ? 'active' : ''}`}
                  onClick={() => setRentalDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                min="1"
                max="30"
                className="form-input"
                value={rentalDays}
                onChange={(e) => setRentalDays(Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1)))}
                style={{ width: '80px', padding: '8px 12px', fontSize: '0.8rem' }}
                required
              />
              <span className="text-muted text-xs">days</span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '8px' }}>
              Return by: <strong>{dueDateStr}</strong>
            </p>
          </div>

          {/* Penalty Rules */}
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--primary-glow)', border: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            <p className="font-bold" style={{ color: 'var(--accent-amber)', marginBottom: '6px' }}>⚠️ Penalties & Returns</p>
            <ul style={{ paddingLeft: '16px', listStyle: 'disc', lineHeight: '1.6' }}>
              <li>Return in-person to the Library Admin desk only.</li>
              <li>Late fee: <strong style={{ color: 'var(--text-main)' }}>₹10/day</strong> after due date.</li>
              <li>Max 3 active books at any time.</li>
            </ul>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Processing...' : 'Confirm Rental'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
