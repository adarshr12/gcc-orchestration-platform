import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useStore';
import { formatDateTime } from '../../lib/utils';
import { Bell, CheckCheck, AlertTriangle, FileText, Clock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ICONS = { 'Escalation Raised': AlertTriangle, 'Escalation Assigned': AlertTriangle, 'Escalation Resolved': AlertTriangle, 'SLA Breached': Clock, 'Compliance Expiring': Shield, 'Milestone Overdue': Clock, 'PO Submitted': FileText, 'PO Approved': FileText, 'PO Rejected': FileText, 'Stage Changed': CheckCheck };

export default function ClientNotifications() {
  const { currentUser } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications(currentUser?.id);
  const navigate = useNavigate();

  const handleClick = (n) => {
    markAsRead(n.id);
    if (n.related_entity_type === 'escalation') navigate(`/escalations/${n.related_entity_id}`);
    else if (n.related_entity_type === 'project') navigate('/my-project');
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Notifications</h1><p className="page-subtitle">{notifications.filter(n => !n.is_read).length} unread</p></div>
        <button className="btn btn-outline" onClick={markAllAsRead}>Mark All Read</button>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {notifications.length === 0 ? <div className="empty-state">No notifications</div> : notifications.map(n => {
          const Icon = ICONS[n.notification_type] || Bell;
          return (
            <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`} onClick={() => handleClick(n)}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: !n.is_read ? '#eff6ff' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={!n.is_read ? '#2E75B6' : '#6b7280'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: !n.is_read ? 600 : 400, lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>{formatDateTime(n.created_at)}</div>
              </div>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E75B6', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
