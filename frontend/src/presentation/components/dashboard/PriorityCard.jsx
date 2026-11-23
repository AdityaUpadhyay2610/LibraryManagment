import { Link } from 'react-router';

export function PriorityCard({ title, subtitle, items = [] }) {
  return (
    <div className="priority-card glass-panel" style={{ padding: '18px 20px' }}>
      <div className="priority-header">
        <span className="priority-icon">⚠️</span>
        <div>
          <h4 className="priority-title">{title}</h4>
          {subtitle && <p className="priority-sub">{subtitle}</p>}
        </div>
      </div>
      <div className="priority-items">
        {items.map((item) => (
          <div key={item.id} className="priority-item">
            <div className="priority-item-left">
              <span
                className="priority-dot"
                style={{
                  background: item.dotColor === 'red' ? 'var(--accent-crimson)'
                    : item.dotColor === 'orange' ? 'var(--accent-amber)'
                    : item.dotColor === 'emerald' ? 'var(--accent-emerald)'
                    : 'var(--primary)'
                }}
              />
              <span className="priority-text">{item.text}</span>
            </div>
            {item.to && (
              <Link to={item.to} className="priority-action">
                {item.actionLabel || 'View'} ›
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
