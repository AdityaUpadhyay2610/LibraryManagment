import { BRANCH_OPTIONS, YEAR_OPTIONS } from '../../../domain/constants';

export function EditStudentModal({
  student,
  setStudent,
  onSave,
  onClose,
}) {
  if (!student) return null;

  return (
    <div
      className="glass-panel sticky-form"
      style={{
        padding: '20px',
        border: '2px solid var(--primary)',
        boxShadow: '0 8px 30px var(--primary-glow)',
      }}
    >
      <div
        className="flex justify-between items-center mb-3 pb-2 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>
          Edit User
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

      <form onSubmit={onSave}>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label text-xs">Account Role</label>
          <select
            className="form-input text-xs"
            value={student.role || 'ROLE_STUDENT'}
            onChange={(e) => setStudent({ ...student, role: e.target.value })}
          >
            <option value="ROLE_STUDENT">Student (ROLE_STUDENT)</option>
            <option value="ROLE_ADMIN">Administrator (ROLE_ADMIN)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label text-xs">Full Name</label>
          <input
            type="text"
            className="form-input text-xs"
            value={student.fullName || ''}
            onChange={(e) => setStudent({ ...student, fullName: e.target.value })}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label text-xs">Username / User ID</label>
          <input
            type="text"
            className="form-input text-xs"
            value={student.username || ''}
            onChange={(e) => setStudent({ ...student, username: e.target.value })}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label text-xs">Change Password (Optional)</label>
          <input
            type="password"
            className="form-input text-xs"
            placeholder="Leave blank to keep current"
            value={student.newPassword || ''}
            onChange={(e) => setStudent({ ...student, newPassword: e.target.value })}
          />
        </div>

        {student.role === 'ROLE_STUDENT' && (
          <>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label text-xs">Branch/Course</label>
              <select
                className="form-input text-xs"
                value={student.branch || 'CSE'}
                onChange={(e) => setStudent({ ...student, branch: e.target.value })}
              >
                {BRANCH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label text-xs">Academic Year</label>
              <select
                className="form-input text-xs"
                value={student.year || '1st Year'}
                onChange={(e) => setStudent({ ...student, year: e.target.value })}
              >
                {YEAR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label text-xs">Email Address</label>
          <input
            type="email"
            className="form-input text-xs"
            value={student.email || ''}
            onChange={(e) => setStudent({ ...student, email: e.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn btn-primary flex-1"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            Save Changes
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
