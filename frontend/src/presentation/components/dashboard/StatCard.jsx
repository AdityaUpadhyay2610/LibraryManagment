export function StatCard({ icon, title, value, subtitle, badge, accent = 'primary' }) {
  const accentMap = {
    primary: 'var(--primary)',
    emerald: 'var(--accent-emerald)',
    amber: 'var(--accent-amber)',
    crimson: 'var(--accent-crimson)',
  };
  const color = accentMap[accent] || accentMap.primary;

  return (
    <div className="stat-card glass-panel" style={{ padding: '20px' }}>
      <div className="stat-card-top">
        <span className="stat-card-icon" style={{ color }}>{icon}</span>
        {badge && (
          <span className="stat-card-badge" style={{ color }}>{badge}</span>
        )}
      </div>
      <p className="stat-card-label">{title}</p>
      <p className="stat-card-value">{value}</p>
      {subtitle && <p className="stat-card-sub">{subtitle}</p>}
    </div>
  );
}
