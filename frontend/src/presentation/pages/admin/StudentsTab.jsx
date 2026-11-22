import { useState, useEffect } from 'react';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { BRANCH_OPTIONS, YEAR_OPTIONS, DEFAULT_NEW_STUDENT } from '../../../domain/constants';
import { adminApi } from '../../../services/api';

export function StudentsTab() {
  const { adminData, addStudent, editStudent, resetStudentPassword, deleteStudent, importStudents, fetchAdminData } = useAdmin();
  const [newStudent, setNewStudent] = useState({ ...DEFAULT_NEW_STUDENT, role: 'ROLE_STUDENT' });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'ROLE_STUDENT' | 'ROLE_ADMIN'
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Editing state
  const [editingStudent, setEditingStudent] = useState(null);
  const [resettingPasswordStudent, setResettingPasswordStudent] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

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
      setNewStudent({ ...DEFAULT_NEW_STUDENT, role: 'ROLE_STUDENT' });
    } catch {
      // Toast handled by context
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);

    setUploading(true);
    setImportResult(null);
    try {
      const result = await importStudents(formData);
      setImportResult(result);
      setImportFile(null);
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await editStudent(editingStudent.id, {
        username: editingStudent.username,
        fullName: editingStudent.fullName,
        branch: editingStudent.branch,
        year: editingStudent.year,
        email: editingStudent.email,
        role: editingStudent.role,
        password: editingStudent.newPassword || undefined,
      });
      setEditingStudent(null);
    } catch {
      // Toast handled by context
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resettingPasswordStudent || !newPasswordVal) return;
    try {
      await resetStudentPassword(resettingPasswordStudent.id, newPasswordVal);
      setResettingPasswordStudent(null);
      setNewPasswordVal('');
    } catch {
      // Toast handled by context
    }
  };

  // Filter users by role and search query
  const allUsers = adminData.users || [];
  const filteredUsers = allUsers.filter(s => {
    if (roleFilter !== 'ALL' && s.role !== roleFilter) {
      return false;
    }
    const q = searchQuery.toLowerCase();
    return (
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.branch && s.branch.toLowerCase().includes(q)) ||
      (s.year && s.year.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  // Limit display to 5 users unless "Show More" is clicked
  const displayedUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 5);
  const remainingCount = filteredUsers.length - 5;

  return (
    <div className="tab-pane-columns">
      <div className="main-col">
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                User & Student Directory ({allUsers.length})
              </h3>
              <p className="text-muted text-xs mt-0.5">
                Admin controls all user roles, login credentials, and ID profiles.
              </p>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${showImportModal ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setShowImportModal(!showImportModal);
                setImportResult(null);
              }}
            >
              {showImportModal ? '✕ Close' : '📥 Bulk Import'}
            </button>
          </div>

          {/* Compact Bulk Import Card */}
          {showImportModal && (
            <div
              className="glass-card mb-4 rounded-xl p-3.5 shadow-md transition-all"
              style={{
                border: '1.5px solid var(--border-active)',
                background: 'var(--table-bg)',
              }}
            >
              <div className="flex flex-wrap justify-between items-center gap-2 pb-2 mb-2.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📗</span>
                  <span className="font-semibold text-xs text-main">
                    Bulk User Importer (Role-Defined: Students & Admins)
                  </span>
                </div>

                <a
                  href={adminApi.downloadStudentsTemplateUrl()}
                  download="users_import_template.xlsx"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  📄 Download Excel Template (.xlsx)
                </a>
              </div>

              {/* Visual Spreadsheet Structure Guide */}
              <div 
                className="mb-3 rounded-lg overflow-hidden border text-xs"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  background: 'var(--card-bg)' 
                }}
              >
                <div 
                  className="px-2.5 py-1.5 flex items-center justify-between font-semibold"
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.12)', 
                    color: '#059669', 
                    borderBottom: '1px solid var(--border-color)' 
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    📊 <strong>Excel Spreadsheet Layout Guide</strong> (Required Columns & Types)
                  </span>
                  <span className="text-[11px] font-normal opacity-80">Row 1 = Headers</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--table-bg)', borderBottom: '1px solid var(--border-color)' }}>
                        <th className="px-2 py-1 text-center font-bold text-muted border-r" style={{ borderColor: 'var(--border-color)', width: '30px' }}>#</th>
                        <th className="px-2 py-1 text-left font-bold border-r" style={{ borderColor: 'var(--border-color)' }}>A: Username</th>
                        <th className="px-2 py-1 text-left font-bold border-r" style={{ borderColor: 'var(--border-color)' }}>B: Password</th>
                        <th className="px-2 py-1 text-left font-bold border-r" style={{ borderColor: 'var(--border-color)' }}>C: FullName</th>
                        <th className="px-2 py-1 text-left font-bold border-r" style={{ borderColor: 'var(--border-color)', color: 'var(--primary)' }}>D: Role (Key)</th>
                        <th className="px-2 py-1 text-left font-bold border-r" style={{ borderColor: 'var(--border-color)' }}>E: Branch</th>
                        <th className="px-2 py-1 text-left font-bold border-r" style={{ borderColor: 'var(--border-color)' }}>F: AcademicYear</th>
                        <th className="px-2 py-1 text-left font-bold">G: Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="px-2 py-1 text-center text-muted font-mono border-r" style={{ borderColor: 'var(--border-color)', background: 'var(--table-bg)' }}>2</td>
                        <td className="px-2 py-1 font-mono border-r" style={{ borderColor: 'var(--border-color)' }}>student_rahul</td>
                        <td className="px-2 py-1 font-mono border-r" style={{ borderColor: 'var(--border-color)' }}>Pass@123#</td>
                        <td className="px-2 py-1 border-r" style={{ borderColor: 'var(--border-color)' }}>Rahul Sharma</td>
                        <td className="px-2 py-1 border-r font-semibold text-blue-600" style={{ borderColor: 'var(--border-color)' }}>
                          🎓 ROLE_STUDENT
                        </td>
                        <td className="px-2 py-1 border-r" style={{ borderColor: 'var(--border-color)' }}>Computer Science</td>
                        <td className="px-2 py-1 border-r" style={{ borderColor: 'var(--border-color)' }}>3rd Year</td>
                        <td className="px-2 py-1 text-muted">rahul@college.edu</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 text-center text-muted font-mono border-r" style={{ borderColor: 'var(--border-color)', background: 'var(--table-bg)' }}>3</td>
                        <td className="px-2 py-1 font-mono border-r" style={{ borderColor: 'var(--border-color)' }}>admin_vikram</td>
                        <td className="px-2 py-1 font-mono border-r" style={{ borderColor: 'var(--border-color)' }}>Admin@2026</td>
                        <td className="px-2 py-1 border-r" style={{ borderColor: 'var(--border-color)' }}>Vikram Patel</td>
                        <td className="px-2 py-1 border-r font-semibold text-purple-600" style={{ borderColor: 'var(--border-color)' }}>
                          🛡️ ROLE_ADMIN
                        </td>
                        <td className="px-2 py-1 border-r" style={{ borderColor: 'var(--border-color)' }}>Administration</td>
                        <td className="px-2 py-1 border-r" style={{ borderColor: 'var(--border-color)' }}>Staff</td>
                        <td className="px-2 py-1 text-muted">vikram.admin@college.edu</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 text-muted text-[11px] border-t" style={{ borderColor: 'var(--border-color)' }}>
                  💡 <strong>Tip:</strong> In the <strong>Role</strong> column, write <code>ROLE_STUDENT</code> for student access or <code>ROLE_ADMIN</code> for admin access. Passwords are automatically hashed with bcrypt upon import.
                </div>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleFileUpload}>
                <div
                  className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-lg border border-dashed"
                  style={{
                    borderColor: importFile ? 'var(--primary)' : 'var(--border-color)',
                    background: 'var(--input-bg)',
                  }}
                >
                  <input
                    type="file"
                    id="student-file-input"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => setImportFile(e.target.files[0] || null)}
                  />
                  <label
                    htmlFor="student-file-input"
                    className="btn btn-secondary btn-sm cursor-pointer whitespace-nowrap"
                    style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                  >
                    📁 {importFile ? 'Change File' : 'Choose Spreadsheet'}
                  </label>

                  <div className="text-xs flex-1 truncate px-1" style={{ color: importFile ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {importFile ? (
                      <span className="font-semibold text-primary">
                        ✓ {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      'Upload your completed .xlsx, .xls, or .csv spreadsheet file'
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!importFile || uploading}
                    className="btn btn-primary btn-sm whitespace-nowrap"
                    style={{ padding: '5px 14px', fontSize: '0.75rem' }}
                  >
                    {uploading ? '⏳ Importing...' : '🚀 Upload & Register'}
                  </button>
                </div>
              </form>

              {importResult && (
                <div
                  className="mt-2.5 p-2.5 rounded-lg text-xs"
                  style={{
                    background: importResult.error ? 'rgba(225, 29, 72, 0.08)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${importResult.error ? 'var(--accent-crimson)' : 'var(--secondary)'}`,
                    color: 'var(--text-main)',
                  }}
                >
                  {importResult.error ? (
                    <div className="font-semibold text-danger">⚠️ {importResult.error}</div>
                  ) : (
                    <div>
                      <div className="font-bold text-success">✅ {importResult.message}</div>
                      <div className="mt-0.5 text-muted">
                        Registered: <strong>{importResult.importedCount}</strong> | Skipped: <strong>{importResult.skippedCount}</strong> | Total: {importResult.totalRows}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Search Filter & Role Selector */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 Search users by name, ID / username, branch, or email..."
                className="form-input text-xs"
                style={{ padding: '8px 12px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-slate-900/40 p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${roleFilter === 'ALL' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}
                onClick={() => setRoleFilter('ALL')}
              >
                All ({allUsers.length})
              </button>
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${roleFilter === 'ROLE_STUDENT' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}
                onClick={() => setRoleFilter('ROLE_STUDENT')}
              >
                🎓 Students ({allUsers.filter(u => u.role === 'ROLE_STUDENT').length})
              </button>
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${roleFilter === 'ROLE_ADMIN' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-white'}`}
                onClick={() => setRoleFilter('ROLE_ADMIN')}
              >
                🛡️ Admins ({allUsers.filter(u => u.role === 'ROLE_ADMIN').length})
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Username / ID</th>
                  <th>Role</th>
                  <th>Branch & Year</th>
                  <th>Email</th>
                  <th style={{ textAlign: 'right' }}>Manage</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="font-bold text-sm">{s.fullName}</div>
                    </td>
                    <td><code className="text-xs">{s.username}</code></td>
                    <td>
                      {s.role === 'ROLE_ADMIN' ? (
                        <span className="badge badge-primary text-xs" style={{ padding: '2px 8px' }}>
                          🛡️ Admin
                        </span>
                      ) : (
                        <span className="badge badge-secondary text-xs" style={{ padding: '2px 8px' }}>
                          🎓 Student
                        </span>
                      )}
                    </td>
                    <td className="text-xs">
                      {s.role === 'ROLE_ADMIN' ? (
                        <span className="text-muted">Staff / Admin</span>
                      ) : (
                        <span>{s.branch || 'N/A'} &bull; {s.year || 'N/A'}</span>
                      )}
                    </td>
                    <td className="text-xs">{s.email || <span className="text-muted italic">None</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex gap-1.5 justify-end">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          onClick={() => {
                            setEditingStudent({ ...s, newPassword: '' });
                            setResettingPasswordStudent(null);
                          }}
                          title="Edit User Profile & Role"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            background: 'rgba(249, 115, 22, 0.12)',
                            borderColor: 'var(--border-color)',
                            padding: '3px 8px',
                            fontSize: '0.75rem'
                          }}
                          onClick={() => {
                            setResettingPasswordStudent(s);
                            setEditingStudent(null);
                            setNewPasswordVal('');
                          }}
                          title="Reset Password"
                        >
                          🔑 Pass
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          onClick={() => deleteStudent(s.id)}
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5 text-xs">
                      {searchQuery ? 'No matching users found.' : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Show More / Show Less Toggle Button */}
          {filteredUsers.length > 5 && (
            <div className="flex justify-center mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                onClick={() => setShowAllUsers(!showAllUsers)}
              >
                {showAllUsers ? (
                  <>▲ Show Less (Display 5 Rows)</>
                ) : (
                  <>▼ Show More (+{remainingCount} more users)</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className="side-col">
        {/* EDIT PROFILE DRAWER */}
        {editingStudent ? (
          <div
            className="glass-panel sticky-form"
            style={{
              padding: '20px',
              border: '2px solid var(--primary)',
              boxShadow: '0 8px 30px var(--primary-glow)',
            }}
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>
                ✏️ Edit User & Role
              </h3>
              <button
                type="button"
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{ background: 'var(--table-bg)', color: 'var(--text-muted)' }}
                onClick={() => setEditingStudent(null)}
              >
                ✕ Cancel
              </button>
            </div>
            <form onSubmit={handleSaveStudentEdit}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label text-xs">Account Role (Admin Decides)</label>
                <select
                  className="form-input text-xs"
                  value={editingStudent.role || 'ROLE_STUDENT'}
                  onChange={e => setEditingStudent({ ...editingStudent, role: e.target.value })}
                >
                  <option value="ROLE_STUDENT">🎓 Student (ROLE_STUDENT)</option>
                  <option value="ROLE_ADMIN">🛡️ Administrator (ROLE_ADMIN)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label text-xs">Full Name</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  value={editingStudent.fullName || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label text-xs">Username / User ID</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  value={editingStudent.username || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label text-xs">Change Password (Optional)</label>
                <input
                  type="password"
                  className="form-input text-xs"
                  placeholder="Leave blank to keep current"
                  value={editingStudent.newPassword || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, newPassword: e.target.value })}
                />
              </div>
              {editingStudent.role === 'ROLE_STUDENT' && (
                <>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label text-xs">Branch/Course</label>
                    <select
                      className="form-input text-xs"
                      value={editingStudent.branch || 'CSE'}
                      onChange={e => setEditingStudent({ ...editingStudent, branch: e.target.value })}
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
                      value={editingStudent.year || '1st Year'}
                      onChange={e => setEditingStudent({ ...editingStudent, year: e.target.value })}
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
                  value={editingStudent.email || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : resettingPasswordStudent ? (
          /* QUICK RESET PASSWORD DRAWER */
          <div
            className="glass-panel sticky-form"
            style={{
              padding: '20px',
              border: '2px solid var(--accent-amber)',
              boxShadow: '0 8px 30px var(--accent-amber-glow)',
            }}
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-amber)' }}>
                🔑 Reset Password
              </h3>
              <button
                type="button"
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{ background: 'var(--table-bg)', color: 'var(--text-muted)' }}
                onClick={() => setResettingPasswordStudent(null)}
              >
                ✕ Cancel
              </button>
            </div>
            <p className="text-xs text-muted mb-3">
              Enter a new login password for <strong>{resettingPasswordStudent.fullName}</strong>.
            </p>
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label text-xs">New Password</label>
                <input
                  type="password"
                  className="form-input text-xs"
                  placeholder="Minimum 6 characters"
                  value={newPasswordVal}
                  onChange={e => setNewPasswordVal(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                  Update Password
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  onClick={() => setResettingPasswordStudent(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* DEFAULT: CREATE NEW USER OR ADMIN */
          <div className="glass-panel sticky-form" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Create User Account</h3>
            <p className="text-xs text-muted mt-0.5">Admin decides role (Student or Administrator).</p>
            <form onSubmit={handleSubmit} className="mt-3">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label text-xs">Role Assignment</label>
                <select 
                  className="form-input text-xs"
                  value={newStudent.role || 'ROLE_STUDENT'}
                  onChange={e => setNewStudent({ ...newStudent, role: e.target.value })}
                >
                  <option value="ROLE_STUDENT">🎓 Student (Student Dashboard Access)</option>
                  <option value="ROLE_ADMIN">🛡️ Administrator (Full Admin Panel Access)</option>
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
                {newStudent.role === 'ROLE_ADMIN' ? '🛡️ Create Admin Account' : '🎓 Register Student'}
              </button>
            </form>
          </div>
        )}
      </aside>
    </div>
  );
}
