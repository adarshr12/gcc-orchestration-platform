import { useNavigate } from 'react-router-dom';
import { useStoreData } from '../../hooks/useStore';
import { formatCurrency, getStatusBadgeClass, STAGE_NAMES } from '../../lib/utils';
import { Plus, ArrowRight } from 'lucide-react';

export default function ProjectList() {
  const projects = useStoreData('projects');
  const escalations = useStoreData('escalations');
  const navigate = useNavigate();

  const getHealth = (p) => {
    if (p.stage_status === 'Blocked') return { color: '#E74C3C', label: 'At Risk' };
    const variance = p.total_budget > 0 ? (p.actual_spent / p.total_budget) * 100 : 0;
    if (variance > 80) return { color: '#F39C12', label: 'Warning' };
    return { color: '#27AE60', label: 'On Track' };
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} GCC projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
          <Plus size={16} /> Create Project
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Client</th>
              <th>Location</th>
              <th>Current Stage</th>
              <th>Health</th>
              <th>Budget</th>
              <th>Variance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => {
              const health = getHealth(p);
              const variance = p.actual_spent - p.total_budget;
              const varPct = p.total_budget > 0 ? ((p.actual_spent / p.total_budget) * 100).toFixed(0) : 0;
              const openEsc = escalations.filter(e => e.project_id === p.id && e.status !== 'Resolved' && e.status !== 'Closed').length;
              return (
                <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.project_name}</div>
                    {openEsc > 0 && <div style={{ fontSize: '0.6875rem', color: '#E74C3C', marginTop: 2 }}>{openEsc} open escalation{openEsc > 1 ? 's' : ''}</div>}
                  </td>
                  <td>{p.client_name}</td>
                  <td>{p.location}</td>
                  <td><span className={`badge ${getStatusBadgeClass(p.stage_status)}`}>{STAGE_NAMES[p.current_stage - 1]}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: health.color }} />
                      <span style={{ fontSize: '0.8125rem', color: health.color, fontWeight: 500 }}>{health.label}</span>
                    </div>
                  </td>
                  <td className="amount">{formatCurrency(p.total_budget)}</td>
                  <td>
                    <span style={{ color: p.actual_spent <= p.total_budget ? '#27AE60' : '#E74C3C', fontWeight: 600, fontSize: '0.8125rem' }}>
                      {varPct}% used
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm"><ArrowRight size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
