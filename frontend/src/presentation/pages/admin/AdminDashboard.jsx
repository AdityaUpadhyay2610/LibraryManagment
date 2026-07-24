import { useAuth } from '../../../application/hooks/useAuth';
import { useAdmin } from '../../../application/hooks/useAdmin';
import { AdminProvider } from '../../../application/contexts/AdminContext';
import { Toast } from '../../components/Toast';
import { OverviewTab } from './OverviewTab';
import { BooksTab } from './BooksTab';
import { StudentsTab } from './StudentsTab';
import { IssueBookTab } from './IssueBookTab';
import { TransactionsTab } from './TransactionsTab';

function AdminDashboardContent() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { adminTab, setAdminTab } = useAdmin();

  return (
    <div className="dashboard-layout animate-fade-in">
      <Toast />
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo">📚</span>
          <div>
            <h3>Bibliotech</h3>
            <p>Admin Control</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            type="button"
            className={`nav-link ${adminTab === 'overview' ? 'active' : ''}`}
            onClick={() => setAdminTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            type="button"
            className={`nav-link ${adminTab === 'books' ? 'active' : ''}`}
            onClick={() => setAdminTab('books')}
          >
            📖 Book Repository
          </button>
          <button 
            type="button"
            className={`nav-link ${adminTab === 'students' ? 'active' : ''}`}
            onClick={() => setAdminTab('students')}
          >
            👥 Students List
          </button>
          <button 
            type="button"
            className={`nav-link ${adminTab === 'issue' ? 'active' : ''}`}
            onClick={() => setAdminTab('issue')}
          >
            ⚡ Issue Book
          </button>
          <button 
            type="button"
            className={`nav-link ${adminTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setAdminTab('transactions')}
          >
            ⏳ Log/Transactions
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="avatar">🛡️</div>
            <div className="profile-details">
              <span className="name">{user?.fullName || user?.username}</span>
              <span className="role">Administrator</span>
            </div>
          </div>
          <button 
            type="button"
            className="btn btn-danger btn-sm w-full mt-4" 
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="workspace">
        <header className="workspace-header">
          <h2>{adminTab.charAt(0).toUpperCase() + adminTab.slice(1)} Workspace</h2>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="system-status">
              <span className="status-dot green"></span>
              MySQL Connected
            </div>
          </div>
        </header>

        <div className="workspace-content animate-fade-in">
          {adminTab === 'overview' && <OverviewTab />}
          {adminTab === 'books' && <BooksTab />}
          {adminTab === 'students' && <StudentsTab />}
          {adminTab === 'issue' && <IssueBookTab />}
          {adminTab === 'transactions' && <TransactionsTab />}
        </div>
      </main>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <AdminProvider>
      <AdminDashboardContent />
    </AdminProvider>
  );
}
