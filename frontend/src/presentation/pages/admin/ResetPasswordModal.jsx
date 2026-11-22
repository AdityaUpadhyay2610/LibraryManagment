export function ResetPasswordModal({
  student,
  newPassword,
  setNewPassword,
  onSubmit,
  onClose,
}) {
  if (!student) return null;

  return (
    <div
      className="glass-panel sticky-form"
      style={{
        padding: '20px',
        border: '2px solid var(--accent-amber)',
        boxShadow: '0 8px 30px var(--accent-amber-glow)',
      }}
    >
      <div
        className="flex justify-between items-center mb-3 pb-2 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-amber)' }}>
          Reset Password
        </h3>
        <button
          type="button"
          className="text-xs font-semibold px-2 py-1 rounded"
          style={{ background: 'var(--table-bg)', color: 'var(--text-muted)' }}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-muted mb-3">
        Enter a new login password for <strong>{student.fullName}</strong>.
      </p>

      <form onSubmit={onSubmit}>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label text-xs">New Password</label>
          <input
            type="password"
            className="form-input text-xs"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary flex-1"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            Update Password
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
