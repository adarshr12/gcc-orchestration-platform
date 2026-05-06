import { useStoreData } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../lib/utils';
import { History, User, Activity, Clock } from 'lucide-react';

export default function AuditLogs() {
  const logs = useStoreData('audit_logs').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const users = useStoreData('users');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit History</h1>
          <p className="page-subtitle">Complete trail of system activities and changes</p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan="5" className="empty-state">No audit logs found</td></tr>
              ) : (
                logs.map(log => {
                  const user = users.find(u => u.id === log.user_id);
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={14} />
                          {formatDateTime(log.created_at)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={14} color="#6b7280" />
                          <span style={{ fontWeight: 500 }}>{user?.name || 'System'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${log.action.includes('Delete') ? 'badge-red' : log.action.includes('Create') ? 'badge-green' : 'badge-blue'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Activity size={14} color="#6b7280" />
                          {log.entity_type.replace('_', ' ')} #{log.entity_id}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#4b5563', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.new_value || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
