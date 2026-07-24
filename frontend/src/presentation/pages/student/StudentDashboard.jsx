import { useAuth } from '../../../application/hooks/useAuth';
import { useStudent } from '../../../application/hooks/useStudent';
import { StudentProvider } from '../../../application/contexts/StudentContext';
import { Toast } from '../../components/Toast';
import { MyBooksTab } from './MyBooksTab';
import { CatalogTab } from './CatalogTab';

function StudentDashboardContent() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { studentTab, setStudentTab, studentData } = useStudent();

  return (
    <div className="student-dashboard-layout animate-fade-in">
      <Toast />
      
      {/* Header navigation bar */}
      <header className="student-header glass-panel">
        <div className="header-brand">
          <span className="logo">📚</span>
          <div>
            <h2>Bibliotech Student Portal</h2>
            <p>Welcome, {studentData.user?.fullName || user?.username}</p>
          </div>
        </div>
        
        <nav className="student-nav">
          <button 
            type="button"
            className={`student-nav-btn ${studentTab === 'mybooks' ? 'active' : ''}`}
            onClick={() => setStudentTab('mybooks')}
          >
            📖 My Issued Books ({studentData.myBooks?.filter(t => !t.returnDate).length || 0})
          </button>
          <button 
            type="button"
            className={`student-nav-btn ${studentTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setStudentTab('catalog')}
          >
            🔍 Search Book Catalog
          </button>
        </nav>

        <div className="student-profile-summary">
          <button 
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            style={{ marginRight: '8px' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="student-meta">
            <span className="badge badge-warning">{studentData.user?.branch}</span>
            <span className="badge badge-success">{studentData.user?.year}</span>
          </div>
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Content container */}
      <main className="student-content animate-fade-in mt-6">
        {studentTab === 'mybooks' && <MyBooksTab />}
        {studentTab === 'catalog' && <CatalogTab />}
      </main>
    </div>
  );
}

export function StudentDashboard() {
  return (
    <StudentProvider>
      <StudentDashboardContent />
    </StudentProvider>
  );
}
