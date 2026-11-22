import { BRANCH_OPTIONS, YEAR_OPTIONS } from '../../../domain/constants';

export function AddStudentForm({
  newStudent,
  setNewStudent,
  onSubmit,
}) {
  return (
    <div className="glass-panel sticky-form" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.15rem' }}>Create User Account</h3>
      <p className="text-xs text-muted mt-0.5">Admin decides role (Student or Administrator).</p>
      <form onSubmit={onSubmit} className="mt-3">
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label text-xs">Role Assignment</label>
          <select 
            className="form-input text-xs"
            value={newStudent.role || 'ROLE_STUDENT'}
            onChange={e => setNewStudent({ ...newStudent, role: e.target.value })}
          >
            <option value="ROLE_STUDENT">Student (Student Dashboard Access)</option>
            <option value="ROLE_ADMIN">Administrator (Full Admin Panel Access)</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label text-xs">Full Name</label>
          <input 
            type="text" 
            className="form-input text-xs" 
            placeholder="e.g. Rahul Sharma"
            value={newStudent.fullName}
            onChange={e => setNewStudent({ ...newStudent, fullName: e.target.value })}
            required
          />
        </div>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label text-xs">Username / User ID</label>
          <input 
            type="text" 
            className="form-input text-xs" 
            placeholder="e.g. rahul12 or admin_raj"
            value={newStudent.username}
            onChange={e => setNewStudent({ ...newStudent, username: e.target.value })}
            required
          />
        </div>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label text-xs">Login Password</label>
          <input 
            type="password" 
            className="form-input text-xs" 
            placeholder="••••••••"
            value={newStudent.password}
            onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
            required
          />
        </div>
        {newStudent.role === 'ROLE_STUDENT' && (
          <>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label text-xs">Branch/Course</label>
              <select 
                className="form-input text-xs"
                value={newStudent.branch}
                onChange={e => setNewStudent({ ...newStudent, branch: e.target.value })}
              >
                {BRANCH_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label text-xs">Academic Year</label>
              <select 
                className="form-input text-xs"
                value={newStudent.year}
                onChange={e => setNewStudent({ ...newStudent, year: e.target.value })}
              >
                {YEAR_OPTIONS.map(opt => (
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
            placeholder="e.g. user@example.com"
            value={newStudent.email}
            onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          {newStudent.role === 'ROLE_ADMIN' ? 'Create Admin Account' : 'Register Student'}
        </button>
      </form>
    </div>
  );
}
