export function StudentsTable({
  users,
  searchQuery,
  onEdit,
  onResetPassword,
  onDelete,
}) {
  return (
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
          {users.map((s) => (
            <tr key={s.id}>
              <td>
                <div className="font-bold text-sm">{s.fullName}</div>
              </td>
              <td><code className="text-xs">{s.username}</code></td>
              <td>
                {s.role === 'ROLE_ADMIN' ? (
                  <span className="badge badge-primary text-xs" style={{ padding: '2px 8px' }}>
                    Admin
                  </span>
                ) : (
                  <span className="badge badge-secondary text-xs" style={{ padding: '2px 8px' }}>
                    Student
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
                    onClick={() => onEdit(s)}
                    title="Edit User Profile & Role"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: 'rgba(249, 115, 22, 0.12)',
                      borderColor: 'var(--border-color)',
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                    }}
                    onClick={() => onResetPassword(s)}
                    title="Reset Password"
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                    onClick={() => onDelete(s.id)}
                    title="Delete User"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center text-muted py-5 text-xs">
                {searchQuery ? 'No matching users found.' : 'No users found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
