import { Outlet, NavLink } from 'react-router';
import { useAuth } from '../../../application/hooks/useAuth';
import { useStudent } from '../../../application/hooks/useStudent';
import { useWeatherAndClock } from '../../../application/hooks/useWeatherAndClock';
import { StudentProvider } from '../../../application/contexts/StudentContext';
import { Toast } from '../../components/Toast';

function StudentDashboardContent() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { studentData } = useStudent();
  const { time, temp } = useWeatherAndClock();

  const formattedTime = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formattedDate = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

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
          <NavLink 
            to="/student/mybooks"
            className={({ isActive }) => `student-nav-btn ${isActive ? 'active' : ''}`}
          >
            📖 My Issued Books ({studentData.myBooks?.filter(t => !t.returnDate).length || 0})
          </NavLink>
          <NavLink 
            to="/student/catalog"
            className={({ isActive }) => `student-nav-btn ${isActive ? 'active' : ''}`}
          >
            🔍 Search Book Catalog
          </NavLink>
        </nav>

        <div className="student-profile-summary">
          {/* Live Weather & Time */}
          <div className="flex flex-col items-end text-xs mr-4 select-none leading-tight">
            <span className="font-semibold text-orange-500 tracking-wide">{formattedTime}</span>
            <span className="text-[10px] text-muted mt-0.5 opacity-80">
              {temp !== null ? `🌡️ ${temp}°C` : '🌡️ --°C'} | {formattedDate}
            </span>
          </div>

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
        <Outlet />
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
