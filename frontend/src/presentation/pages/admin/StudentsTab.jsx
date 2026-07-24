import { useState, useEffect } from 'react';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { BRANCH_OPTIONS, YEAR_OPTIONS, DEFAULT_NEW_STUDENT } from '../../../domain/constants';

export function StudentsTab() {
  const { adminData, addStudent, fetchAdminData } = useAdmin();
  const [newStudent, setNewStudent] = useState(DEFAULT_NEW_STUDENT);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newStudent.username || !newStudent.password || !newStudent.fullName) {
      return;
    }
    try {
      await addStudent(newStudent);
      setNewStudent(DEFAULT_NEW_STUDENT);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="tab-pane-columns">
      <div className="main-col">
        <div className="glass-panel">
          <h3>Registered Students</h3>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Username</th>
                  <th>Branch</th>
                  <th>Academic Year</th>
                  <th>Email Address</th>
                </tr>
              </thead>
              <tbody>
                {adminData.users.filter(u => u.role === 'ROLE_STUDENT').map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="font-bold">{s.fullName}</div>
                    </td>
                    <td><code>{s.username}</code></td>
                    <td>{s.branch || 'N/A'}</td>
                    <td>{s.year || 'N/A'}</td>
                    <td>{s.email || <span className="text-muted italic">None</span>}</td>
                  </tr>
                ))}
                {adminData.users.filter(u => u.role === 'ROLE_STUDENT').length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No students registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="side-col">
        <div className="glass-panel sticky-form">
          <h3>Register Student</h3>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Rahul Sharma"
                value={newStudent.fullName}
                onChange={e => setNewStudent({ ...newStudent, fullName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. rahul12"
                value={newStudent.username}
                onChange={e => setNewStudent({ ...newStudent, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Login Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={newStudent.password}
                onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Branch/Course</label>
              <select 
                className="form-input"
                value={newStudent.branch}
                onChange={e => setNewStudent({ ...newStudent, branch: e.target.value })}
              >
                {BRANCH_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <select 
                className="form-input"
                value={newStudent.year}
                onChange={e => setNewStudent({ ...newStudent, year: e.target.value })}
              >
                {YEAR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Email (For Notifications)</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. rahul@example.com"
                value={newStudent.email}
                onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2">
              Add Student User
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
