import { Outlet, NavLink, useLocation } from 'react-router';
import { useAuth } from '../../../application/hooks/useAuth';
import { useWeatherAndClock } from '../../../application/hooks/useWeatherAndClock';
import { AdminProvider } from '../../../application/contexts/AdminContext';
import { Toast } from '../../components/Toast';

function AdminDashboardContent() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { time, temp, weatherCondition, weatherIcon, locationName, refreshWeather } = useWeatherAndClock();
  const location = useLocation();

  // Extract active page from pathname (e.g., /admin/overview -> overview)
  const currentTab = location.pathname.split('/').pop() || 'overview';

  const hourVal = time.getHours() % 12 || 12;
  const hours = hourVal.toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM';
  const dayOfWeek = time.toLocaleDateString('en-US', { weekday: 'short' });
  const dateMonth = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
          {/* Live Weather & Time Panel (Mockup Replicated) */}
          <div className="glass-panel mb-5 select-none flex flex-col" style={{ padding: '12px 14px', borderRadius: '16px' }}>
            {/* Top Row: Time and Date */}
            <div className="flex items-center justify-between">
              {/* Time Block */}
              <div className="flex items-baseline font-mono select-none">
                <span className="text-2xl font-bold tracking-tight text-white">{hours}:{minutes}</span>
                <span className="text-[10px] text-muted font-semibold ml-0.5 self-end mb-0.5">{seconds}</span>
                <span className="text-[10px] font-extrabold uppercase ml-1.5" style={{ color: 'var(--primary)', textShadow: '0 0 6px var(--primary-glow)' }}>{ampm}</span>
              </div>

              {/* Date Block */}
              <div className="flex flex-col items-end text-right leading-none select-none text-[10px] text-muted">
                <span className="font-semibold">{dayOfWeek},</span>
                <span className="font-bold mt-0.5 text-white flex items-center gap-0.5">
                  <span className="text-xs">📅</span> {dateMonth}
                </span>
              </div>
            </div>

            {/* Separator line */}
            <hr className="my-2 border-t border-dashed" style={{ borderColor: 'var(--border-color)', opacity: 0.2 }} />

            {/* Bottom Row: Weather and Geolocation */}
            <div className="flex items-center justify-between">
              {/* Weather Status */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black/25 border border-white/5 flex items-center justify-center text-lg shadow-inner">
                  {weatherIcon}
                </div>
                <div className="flex flex-col select-none leading-tight">
                  <span className="text-[9px] text-muted">Temp</span>
                  <span className="text-[10px] font-bold text-white whitespace-nowrap">
                    {temp !== null ? `${temp}°C` : '--°C'} {weatherCondition}
                  </span>
                </div>
              </div>

              {/* Geolocation and Manual Refresh */}
              <div className="flex flex-col items-end text-right select-none leading-none">
                <span className="text-[9px] text-muted font-medium flex items-center gap-0.5 max-w-[80px] truncate" title={locationName}>
                  <span>📍</span> {locationName}
                </span>
                <button 
                  type="button" 
                  onClick={refreshWeather}
                  className="mt-1.5 text-[10px] text-muted hover:text-primary transition-colors flex items-center justify-center p-0.5 hover:bg-white/5 rounded"
                  title="Refresh Weather"
                >
                  <span className="text-xs">🔄</span>
                </button>
              </div>
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
