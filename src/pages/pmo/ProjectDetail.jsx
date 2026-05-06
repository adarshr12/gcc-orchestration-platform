import { useParams, useNavigate } from 'react-router-dom';
import { useStore, useStoreData } from '../../hooks/useStore';
import { formatCurrency, formatDate, getStatusBadgeClass, STAGE_NAMES } from '../../lib/utils';
import { ArrowLeft, CheckCircle2, Lock, Users, FileText, AlertTriangle, TrendingUp, ChevronRight, User } from 'lucide-react';
import { ChatPanel } from '../../components/common/ChatPanel';

export default function ProjectDetail() {
  const { id } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const project = store.getById('projects', Number(id));
  const stages = useStoreData('stages', s => s.project_id === Number(id)).sort((a, b) => a.stage_number - b.stage_number);
  const milestones = useStoreData('milestones', m => m.project_id === Number(id));
  const vendors = useStoreData('vendors', v => v.project_id === Number(id));
  const escalations = useStoreData('escalations', e => e.project_id === Number(id));
  const budgetItems = useStoreData('budget', b => b.project_id === Number(id));
  
  if (!project) return <div className="empty-state">Project not found</div>;

  const currentStage = stages.find(s => s.status === 'In Progress') || stages[0];
  const nextStage = stages.find(s => s.stage_number === (currentStage?.stage_number + 1));
  const openEscalations = escalations.filter(e => e.status !== 'Resolved' && e.status !== 'Closed');
  
  // Logic: Check if all gates for current stage are done
  const gates = useStoreData('stage_gates', g => g.stage_id === currentStage?.id);
  const gatesCompleted = gates.length > 0 && gates.every(g => g.is_completed);
  const canProgress = gatesCompleted && project.status !== 'Blocked';

  // Ball-in-Court logic
  const ballInCourt = project.status === 'Blocked' ? 'Client Lead' : (gatesCompleted ? 'PMO Manager' : 'Operations Lead');

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft size={16} /> Back to Projects
        </button>
        
        <div className="ball-in-court">
          <div className="avatar-tiny"><User size={10} /></div>
          <span>Ball-in-Court: <strong>{ballInCourt}</strong></span>
        </div>
      </div>

      {/* Header Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>{project.project_name}</h1>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{project.client_name}</span>
              <span>·</span>
              <span>{project.location}</span>
              <span>·</span>
              <span>Kickoff: {formatDate(project.start_date)}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {canProgress && (
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/projects/${id}/stages/${currentStage.id}`)}
                style={{ background: '#10b981' }}
              >
                Approve Stage Gate <ChevronRight size={16} />
              </button>
            )}
            {!gatesCompleted && (
              <button 
                className="btn btn-ghost"
                onClick={() => navigate(`/projects/${id}/stages/${currentStage.id}`)}
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                View Stage Gates
              </button>
            )}
            <span className={`badge ${getStatusBadgeClass(project.status)}`}>{project.status}</span>
          </div>
        </div>

        {/* ServiceNow Process Stepper */}
        <div className="process-stepper">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'Completed';
            const isActive = stage.status === 'In Progress';
            return (
              <div key={stage.id} className={`step-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                <div className="step-circle">
                  {isCompleted ? <CheckCircle2 size={18} /> : stage.stage_number}
                </div>
                <div className="step-label">{STAGE_NAMES[stage.stage_number - 1]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid-stack grid-2">
        {/* Left Column: Milestones & Vendors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Active Milestones</h3>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {milestones.filter(m => m.status === 'Completed').length} / {milestones.length} Done
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {milestones.filter(m => m.status !== 'Completed').slice(0, 5).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{m.milestone_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Due: {formatDate(m.due_date)}</div>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(m.status)}`}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Onboarded Vendors</h3>
            <div className="grid-stack grid-2">
              {vendors.slice(0, 4).map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 10, background: '#f8fafc' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} color="var(--brand-primary)" />
                  </div>
                  <div style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.vendor_name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Budget & Collaboration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Financial Utilization</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {budgetItems.map(b => {
                const percent = Math.min((b.actual_amount / b.planned_amount) * 100, 100);
                const isOver = b.actual_amount > b.planned_amount;
                return (
                  <div key={b.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 600 }}>{b.phase}</span>
                      <span style={{ color: isOver ? '#ef4444' : 'var(--text-secondary)' }}>
                        {formatCurrency(b.actual_amount)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/ {formatCurrency(b.planned_amount)}</span>
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: isOver ? '#ef4444' : 'var(--brand-primary)', borderRadius: 10 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <ChatPanel entityType="project" entityId={Number(id)} title="Stakeholder Coordination" />
        </div>
      </div>
    </div>
  );
}
