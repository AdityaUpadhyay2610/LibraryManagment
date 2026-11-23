import { Link } from 'react-router';

export function QuickActionsCard({ title = "QUICK ACTIONS", actions = [] }) {
  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h4 className="section-label">{title}</h4>
      <div className="quick-actions-list">
        {actions.map((act) => {
          const inner = (
            <div className="quick-action-item" key={act.id}>
              <span className="quick-action-icon">{act.icon}</span>
              <div className="quick-action-info">
                <span className="quick-action-title">{act.title}</span>
                <span className="quick-action-desc">{act.description}</span>
              </div>
              <span className="quick-action-arrow">›</span>
            </div>
          );
          if (act.to) {
            return <Link key={act.id} to={act.to} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link>;
          }
          return inner;
        })}
      </div>
    </div>
  );
}
