import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStoreData, useStore } from '../../hooks/useStore';
import { formatCurrency, getStatusBadgeClass, getSLAStatus, STAGE_NAMES } from '../../lib/utils';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, MessageCircle, FileText, ChevronRight, Briefcase, ShieldCheck, Building2, Terminal, Scale, ArrowUpRight } from 'lucide-react';
import { ChatPanel } from '../../components/common/ChatPanel';

export default function ClientDashboard() {
  const { currentUser } = useAuth();
  const store = useStore();
  const navigate = useNavigate();
  
  if (!currentUser) return <div className="fade-in empty-state">Loading user profile...</div>;

  const project = store.getById('projects', currentUser.assigned_project_id);
  const milestones = useStoreData('milestones', m => m.project_id === currentUser.assigned_project_id);
  const escalations = useStoreData('escalations', e => e.project_id === currentUser.assigned_project_id);
  const stages = useStoreData('stages', s => s.project_id === currentUser.assigned_project_id).sort((a, b) => a.stage_number - b.stage_number);
  const purchaseOrders = useStoreData('purchase_orders', po => po.project_id === currentUser.assigned_project_id);

  if (!project) return <div className="empty-state">No GCC Mandate assigned to your profile.</div>;

  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const budgetPct = project.total_budget > 0 ? ((project.actual_spent / project.total_budget) * 100).toFixed(0) : 0;
  
  // Moxo-style Decisions Needed
  const decisionsNeeded = [
    ...purchaseOrders.filter(po => po.status === 'Pending Approval').map(po => ({ id: `po-${po.id}`, title: `Approve PO for ${po.phase}`, type: 'PO', sub: formatCurrency(po.amount), link: '/my-project/budget' })),
    ...milestones.filter(m => m.status === 'In Progress' && new Date(m.due_date) < new Date()).map(m => ({ id: `m-${m.id}`, title: `Review ${m.milestone_name}`, type: 'Milestone', sub: `Due ${formatDate(m.due_date)}`, link: '/my-project' }))
  ];

  const openEscalationsByWorkstream = {
    'Legal & Entity': escalations.filter(e => e.status !== 'Resolved' && e.status !== 'Closed' && /legal|entity|incorporat/i.test(e.title)).length,
    'Real Estate': escalations.filter(e => e.status !== 'Resolved' && e.status !== 'Closed' && /real estate|lease|property|office/i.test(e.title)).length,
    'Talent Acquisition': escalations.filter(e => e.status !== 'Resolved' && e.status !== 'Closed' && /talent|hiring|recruit|HR/i.test(e.title)).length,
    'IT Infrastructure': escalations.filter(e => e.status !== 'Resolved' && e.status !== 'Closed' && /IT|infra|network|tech/i.test(e.title)).length,
    'Compliance': escalations.filter(e => e.status !== 'Resolved' && e.status !== 'Closed' && /compliance|regulat|audit/i.test(e.title)).length,
  };
  const workstreams = [
    { name: 'Legal & Entity', icon: Scale },
    { name: 'Real Estate', icon: Building2 },
    { name: 'Talent Acquisition', icon: Briefcase },
    { name: 'IT Infrastructure', icon: Terminal },
    { name: 'Compliance', icon: ShieldCheck },
  ].map(w => {
    const hasIssue = openEscalationsByWorkstream[w.name] > 0;
    return { ...w, status: hasIssue ? 'At Risk' : 'On Track', color: hasIssue ? '#f59e0b' : '#10b981' };
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Overview</h1>
          <p className="page-subtitle">{project.project_name} · GCC Setup in {project.location}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/escalations/new')}>
             Raise Priority Issue
          </button>
        </div>
      </div>

      {/* Decisions Needed From Me - MOXO STYLE */}
      {decisionsNeeded.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--brand-primary)', marginBottom: '2.5rem', background: '#f8faff' }}>
           <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-primary)', marginBottom: '1.25rem' }}>Decisions Needed From You</h3>
           <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {decisionsNeeded.map(d => (
                <div key={d.id} className="card" style={{ minWidth: 280, padding: '1.25rem', background: 'white', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }} onClick={() => navigate(d.link)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{d.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{d.sub}</div>
                    </div>
                    <ArrowUpRight size={18} color="var(--brand-primary)" />
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Top Level RAGs */}
      <div className="grid-stack grid-2" style={{ marginBottom: '3rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>GCC Setup Progress</h3>
            <span className="badge badge-success">On Track for Go-Live</span>
          </div>
          <div className="process-stepper">
            {stages.map((stage) => {
              const isCompleted = stage.status === 'Completed';
              const isActive = stage.status === 'In Progress';
              return (
                <div key={stage.id} className={`step-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="step-circle" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                    {isCompleted ? <CheckCircle2 size={14} /> : stage.stage_number}
                  </div>
                  <div className="step-label" style={{ fontSize: '0.625rem' }}>{STAGE_NAMES[stage.stage_number - 1].split(' ')[0]}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: '2rem', background: 'var(--bg-sidebar)', color: 'white', border: 'none' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase' }}>Budget Burn</div>
                <div style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0' }}>{budgetPct}%</div>
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>{formatCurrency(project.actual_spent)} utilized of plan</div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} color="var(--brand-primary-light)" />
              </div>
           </div>
           <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 100, marginTop: '2rem', overflow: 'hidden' }}>
              <div style={{ width: `${budgetPct}%`, height: '100%', background: 'var(--brand-primary)', borderRadius: 100 }} />
           </div>
        </div>
      </div>

      {/* Workstream RAG Indicators */}
      <div className="grid-stack grid-5" style={{ marginBottom: '3rem', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {workstreams.map(w => (
          <div key={w.name} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
             <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <w.icon size={20} color={w.color} />
             </div>
             <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{w.name}</div>
             <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: w.color }}>{w.status}</div>
          </div>
        ))}
      </div>

      {/* Milestone Progress & Discussion */}
      <div className="grid-stack grid-2">
         <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '2rem' }}>Setup Milestone Progress</h3>
            {milestones.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <CheckCircle2 size={36} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No milestones configured yet</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Your PMO will add milestones during planning.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {milestones.slice(0, 5).map(m => {
                  const colors = { Completed: '#10b981', Delayed: '#f59e0b', Overdue: '#ef4444', Upcoming: '#6366f1' };
                  const color = colors[m.status] || '#6366f1';
                  return (
                    <div key={m.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 5 }}>
                        <span style={{ fontWeight: 600 }}>{m.milestone_name}</span>
                        <span style={{ fontWeight: 700, color }}>{m.status}</span>
                      </div>
                      <div style={{ height: 8, background: '#f8fafc', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: m.status === 'Completed' ? '100%' : m.status === 'Delayed' ? '60%' : m.status === 'Overdue' ? '80%' : '20%', height: '100%', background: color, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
         </div>

         <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={20} color="var(--brand-primary)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Mandate Coordination</h3>
            </div>
            <div style={{ flex: 1 }}>
              <ChatPanel entityType="project" entityId={project.id} title="PMO Updates" />
            </div>
         </div>
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}
