import { useAuth } from '../../context/AuthContext';
import { useStore, useStoreData } from '../../hooks/useStore';
import { formatCurrency, formatDate, getStatusBadgeClass, STAGE_NAMES } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, TrendingUp, Clock, FileText } from 'lucide-react';
import { ChatPanel } from '../../components/common/ChatPanel';

export default function MyProject() {
  const { currentUser } = useAuth();
  const store = useStore();
  
  if (!currentUser?.assigned_project_id) return <div className="empty-state">No project assigned to your account.</div>;

  const project = store.getById('projects', currentUser.assigned_project_id);
  const stages = useStoreData('stages', s => s.project_id === project.id).sort((a, b) => a.stage_number - b.stage_number);
  const milestones = useStoreData('milestones', m => m.project_id === project.id);
  const budgetItems = useStoreData('budget', b => b.project_id === project.id);

  if (!project) return <div className="empty-state">Project details not found.</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.project_name}</h1>
          <p className="page-subtitle">{project.location} · {project.client_name}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Stage Progress */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1.25rem' }}>Current Status</h3>
          <div className="process-stepper">
            {stages.map((stage) => {
              const isCompleted = stage.status === 'Completed';
              const isActive = stage.status === 'In Progress';
              return (
                <div key={stage.id} className={`step-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="step-circle" style={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                    {isCompleted ? <CheckCircle2 size={16} /> : stage.stage_number}
                  </div>
                  <div className="step-label" style={{ fontSize: '0.6875rem', lineHeight: '1.2' }}>{STAGE_NAMES[stage.stage_number - 1]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Health */}
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #1E3A5F 0%, #2E75B6 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Budget Utilization</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{((project.actual_spent / project.total_budget) * 100).toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem' }}>Used of {formatCurrency(project.total_budget)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Milestones */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Key Milestones</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {milestones.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem', borderRadius: 8, background: '#f9fafb' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{m.milestone_name}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>Due: {formatDate(m.due_date)}</div>
                </div>
                <span className={`badge ${getStatusBadgeClass(m.status)}`}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collaboration */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Collaboration with PMO</h3>
          <ChatPanel entityType="project" entityId={project.id} title="Project Discussion" />
        </div>
      </div>
    </div>
  );
}
