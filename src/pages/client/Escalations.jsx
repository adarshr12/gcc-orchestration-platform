import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStoreData } from '../../hooks/useStore';
import { getStatusBadgeClass, getSeverityBadgeClass, getSLAStatus, formatDateTime } from '../../lib/utils';
import { Plus, ArrowRight } from 'lucide-react';

export default function ClientEscalations() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const escalations = useStoreData('escalations', e => e.raised_by === currentUser.id);
  const users = useStoreData('users');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">My Escalations</h1><p className="page-subtitle">{escalations.length} escalations raised</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/escalations/new')}><Plus size={16} /> Raise Escalation</button>
      </div>
      {escalations.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3rem' }}>
          <p>No escalations raised yet.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/escalations/new')}>Raise Your First Escalation</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {escalations.map(e => {
            const sla = getSLAStatus(e.sla_due_date);
            const assignee = users.find(u => u.id === e.assigned_to);
            const resolved = e.status === 'Resolved' || e.status === 'Closed';
            return (
              <div key={e.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => navigate(`/escalations/${e.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.5rem' }}>{e.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge ${getSeverityBadgeClass(e.severity)}`}>{e.severity}</span>
                      <span className={`badge ${getStatusBadgeClass(e.status)}`}>{e.status}</span>
                      {!resolved && <span className={sla.className} style={{ fontSize: '0.8125rem' }}>{sla.label}</span>}
                      {assignee && (
                        <span className="ball-in-court" style={{ marginLeft: 'auto' }}>
                          <div className="avatar-tiny">{assignee.name.charAt(0)}</div>
                          {assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{formatDateTime(e.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
