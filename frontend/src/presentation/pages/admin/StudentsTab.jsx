import { useState, useEffect } from 'react';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { DEFAULT_NEW_STUDENT } from '../../../domain/constants';
import { BulkImportCard } from '../../components/BulkImportCard';
import { EditStudentModal } from './EditStudentModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { AddStudentForm } from './AddStudentForm';
import { ExcelGuideTable } from './ExcelGuideTable';
import { StudentsTable } from './StudentsTable';
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

          {/* Bulk Import Card */}
          {showImportModal && (
            <BulkImportCard
              icon="📗"
              title="Bulk User Importer (Role-Defined: Students & Admins)"
              templateUrl={adminApi.downloadStudentsTemplateUrl()}
              templateName="users_import_template.xlsx"
              fileInputId="student-file-input"
              importFile={importFile}
              setImportFile={setImportFile}
              uploading={uploading}
              onUpload={handleFileUpload}
              importResult={importResult}
              placeholder="Upload your completed .xlsx, .xls, or .csv spreadsheet file"
              uploadButtonText="Upload & Register"
            >
              <ExcelGuideTable />
            </BulkImportCard>
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

          <StudentsTable
            users={displayedUsers}
            searchQuery={searchQuery}
            onEdit={(user) => {
              setEditingStudent({ ...user, newPassword: '' });
              setResettingPasswordStudent(null);
            }}
            onResetPassword={(user) => {
              setResettingPasswordStudent(user);
              setEditingStudent(null);
              setNewPasswordVal('');
            }}
            onDelete={(id) => deleteStudent(id)}
          />

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
        {editingStudent ? (
          <EditStudentModal
            student={editingStudent}
            setStudent={setEditingStudent}
            onSave={handleSaveStudentEdit}
            onClose={() => setEditingStudent(null)}
          />
        ) : resettingPasswordStudent ? (
          <ResetPasswordModal
            student={resettingPasswordStudent}
            newPassword={newPasswordVal}
            setNewPassword={setNewPasswordVal}
            onSubmit={handleResetPasswordSubmit}
            onClose={() => setResettingPasswordStudent(null)}
          />
        ) : (
          <AddStudentForm
            newStudent={newStudent}
            setNewStudent={setNewStudent}
            onSubmit={handleSubmit}
          />
        )}
      </aside>
    </div>
  );
}
