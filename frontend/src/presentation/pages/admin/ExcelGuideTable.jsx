export function ExcelGuideTable() {
  return (
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
          <strong>Excel Spreadsheet Layout Guide</strong> (Required Columns & Types)
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
                ROLE_STUDENT
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
                ROLE_ADMIN
              </td>
              <td className="px-2 py-1 border-r" style={{ borderColor: 'var(--border-color)' }}>Administration</td>
              <td className="px-2 py-1 border-r" style={{ borderColor: 'var(--border-color)' }}>Staff</td>
              <td className="px-2 py-1 text-muted">vikram.admin@college.edu</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 text-muted text-[11px] border-t" style={{ borderColor: 'var(--border-color)' }}>
        Tip: In the Role column, write <code>ROLE_STUDENT</code> for student access or <code>ROLE_ADMIN</code> for admin access.
      </div>
    </div>
  );
}
