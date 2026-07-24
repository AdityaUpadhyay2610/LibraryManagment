import { Outlet, NavLink, useLocation } from 'react-router';
import { useAuth } from '../../../application/hooks/useAuth';
import { useWeatherAndClock } from '../../../application/hooks/useWeatherAndClock';
import { AdminProvider } from '../../../application/contexts/AdminContext';
import { Toast } from '../../components/Toast';

function AdminDashboardContent() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { time, temp } = useWeatherAndClock();
  const location = useLocation();

  // Extract active page from pathname (e.g., /admin/overview -> overview)
  const currentTab = location.pathname.split('/').pop() || 'overview';

  const formattedTime = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });

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
          <NavLink 
            to="/admin/overview"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            📊 Overview
          </NavLink>
          <NavLink 
            to="/admin/books"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            📖 Book Repository
          </NavLink>
          <NavLink 
            to="/admin/students"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            👥 Students List
          </NavLink>
          <NavLink 
            to="/admin/issue"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            ⚡ Issue Book
          </NavLink>
          <NavLink 
            to="/admin/transactions"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            ⏳ Log/Transactions
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {/* Live Weather & Time Panel */}
          <div className="glass-panel mb-4 select-none flex items-center justify-between text-xs" style={{ padding: '10px 14px', borderRadius: '12px 3px' }}>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[13px] tracking-wide" style={{ color: 'var(--primary)', textShadow: '0 0 8px var(--primary-glow)' }}>
                {formattedTime}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {formattedDate}
              </span>
            </div>
            <div className="flex items-center gap-1 font-bold text-[11px]" style={{ color: 'var(--secondary)' }}>
              <span>🌡️</span>
              <span>{temp !== null ? `${temp}°C` : '--°C'}</span>
            </div>
          </div>

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
          <h2>{currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Workspace</h2>
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
          <Outlet />
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
