import { Link } from 'react-router';

export function ActivityFeedCard({ title = "Today's Activity", viewAllLink, activities = [] }) {
  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div className="activity-header">
        <h4 className="section-title">{title}</h4>
        {viewAllLink && (
          <Link to={viewAllLink} className="activity-view-all">View all</Link>
        )}
      </div>

      <div className="activity-list">
        {activities.map((act) => (
          <div key={act.id} className="activity-item">
            <span
              className="activity-dot"
              style={{
                background: act.dotColor === 'emerald' ? 'var(--accent-emerald)'
                  : act.dotColor === 'rose' ? 'var(--accent-crimson)'
                  : act.dotColor === 'amber' ? 'var(--accent-amber)'
                  : 'var(--primary)'
              }}
            />
            <div className="activity-content">
              <p className="activity-text">
                {act.user && <strong>{act.user} </strong>}
                {act.actionText}{' '}
                {act.bookTitle && <strong>"{act.bookTitle}"</strong>}
                {act.extraNote && <span className="text-muted"> — {act.extraNote}</span>}
              </p>
              {act.badgeText && (
                <span className="activity-badge">{act.badgeText}</span>
              )}
            </div>
            {act.time && <span className="activity-time">{act.time}</span>}
          </div>
        ))}

        {activities.length === 0 && (
          <p className="text-muted text-center" style={{ padding: '30px 0', fontSize: '0.8rem' }}>
            No recent activity recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
