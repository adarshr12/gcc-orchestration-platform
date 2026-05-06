import { useNavigate } from 'react-router-dom';
import { useStoreData } from '../../hooks/useStore';
import { getStatusBadgeClass, getSLAStatus, getSeverityBadgeClass, formatDateTime } from '../../lib/utils';
import { ArrowRight } from 'lucide-react';

export default function EscalationList() {
  const escalations = useStoreData('escalations');
  const projects = useStoreData('projects');
  const users = useStoreData('users');
  const navigate = useNavigate();

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Escalations</h1><p className="page-subtitle">{escalations.length} total escalations</p></div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Title</th><th>Project</th><th>Raised By</th><th>Severity</th><th>Status</th><th>SLA</th><th>Assigned To</th><th></th></tr></thead>
          <tbody>
            {escalations.map(e => {
              const project = projects.find(p => p.id === e.project_id);
              const raiser = users.find(u => u.id === e.raised_by);
              const assignee = users.find(u => u.id === e.assigned_to);
              const sla = getSLAStatus(e.sla_due_date);
              const resolved = e.status === 'Resolved' || e.status === 'Closed';
              return (
                <tr key={e.id} onClick={() => navigate(`/escalations/${e.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{e.title}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{project?.project_name}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{raiser?.name} <span className={`badge ${getStatusBadgeClass(raiser?.role)}`} style={{ marginLeft: 4 }}>{raiser?.role}</span></td>
                  <td><span className={`badge ${getSeverityBadgeClass(e.severity)}`}>{e.severity}</span></td>
                  <td><span className={`badge ${getStatusBadgeClass(e.status)}`}>{e.status}</span></td>
                  <td>{resolved ? <span style={{ fontSize: '0.8125rem', color: '#27AE60' }}>Met</span> : <span className={sla.className}>{sla.label}</span>}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{assignee?.name}</td>
                  <td><button className="btn btn-ghost btn-sm"><ArrowRight size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
