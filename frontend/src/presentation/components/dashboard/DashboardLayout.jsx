import { useState } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../../../application/hooks/useAuth';
import { Toast } from '../Toast';

export function DashboardLayout({
  navItems = [],
  title = "Bibliotech Library",
  subtitle = "",
  children
}) {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const initials = (user?.fullName || user?.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = user?.role === 'ROLE_ADMIN' ? 'Admin' : 'Student';

  return (
    <div className="dash-root">
      <Toast />

      {/* Top Navbar */}
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <button
            type="button"
            className="dash-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          <div className="dash-brand">
            <span className="dash-brand-icon">📚</span>
            <span className="dash-brand-name">Bibliotech</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="dash-topbar-right">
          <button
            type="button"
            className="dash-icon-btn"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div className="dash-user-pill">
            <div className="dash-avatar">{initials}</div>
            <div className="dash-user-info">
              <span className="dash-user-name">{user?.fullName || user?.username}</span>
              <span className="dash-user-role">{roleLabel}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="dash-body">
        {/* Sidebar */}
        <aside className={`dash-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="dash-sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `dash-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="dash-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="dash-sidebar-footer">
            <button type="button" className="dash-nav-link" onClick={logout}>
              <span className="dash-nav-icon">🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div className="dash-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Main Workspace */}
        <main className="dash-workspace">
          <div className="dash-page-header">
            <div>
              <h2 className="dash-page-title">{title}</h2>
              {subtitle && <p className="dash-page-subtitle">{subtitle}</p>}
            </div>
            <span className="dash-page-date">📅 {formattedDate}</span>
          </div>

          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
