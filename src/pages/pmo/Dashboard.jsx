import { useNavigate } from 'react-router-dom';
import { useStoreData } from '../../hooks/useStore';
import { formatCurrency, getSLAStatus, getStatusBadgeClass, getComplianceStatus } from '../../lib/utils';
import { FolderKanban, AlertTriangle, Clock, Shield, TrendingUp, ChevronRight, FileWarning, CheckCircle2 } from 'lucide-react';

export default function PMODashboard() {
  const projects = useStoreData('projects');
  const escalations = useStoreData('escalations');
  const milestones = useStoreData('milestones');
  const vendors = useStoreData('vendors');
  const compliance = useStoreData('vendor_compliance');
  const purchaseOrders = useStoreData('purchase_orders');
  const navigate = useNavigate();

  // Portfolio Aggregates
  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
  const blockedProjects = projects.filter(p => p.status === 'Blocked').length;
  const openEscalations = escalations.filter(e => e.status !== 'Resolved' && e.status !== 'Closed');
  const breachedEscalations = openEscalations.filter(e => getSLAStatus(e.sla_due_date).breached);
  const overdueMilestones = milestones.filter(m => m.status === 'Overdue');
  const totalBudget = projects.reduce((s, p) => s + (p.total_budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.actual_spent || 0), 0);
  const budgetVariance = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;
  
  const cpi = totalSpent > 0 ? (totalBudget / totalSpent).toFixed(2) : '1.00';
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const scheduleAdherence = milestones.length > 0 ? ((completedMilestones / milestones.length) * 100).toFixed(0) : 100;

  const pendingPOs = purchaseOrders.filter(po => po.status === 'Pending Approval');
  const expiringDocs = compliance.filter(d => {
    const s = getComplianceStatus(d.expiry_date);
    return s.status === 'Expiring Soon' || s.status === 'Expired';
  });

  const stageDistribution = [
    { name: 'Discovery', count: projects.filter(p => p.current_stage === 1).length, color: '#6366f1' },
    { name: 'Evaluation', count: projects.filter(p => p.current_stage === 2).length, color: '#818cf8' },
    { name: 'Model Selection', count: projects.filter(p => p.current_stage === 3).length, color: '#f59e0b' },
    { name: 'Design & Plan', count: projects.filter(p => p.current_stage === 4).length, color: '#4f46e5' },
    { name: 'Construction', count: projects.filter(p => p.current_stage === 5).length, color: '#10b981' },
    { name: 'Handover', count: projects.filter(p => p.current_stage === 6).length, color: '#06b6d4' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio Control Center</h1>
          <p className="page-subtitle">Real-time governance over all GCC mandates and setup workflows</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" style={{ background: 'white', border: '1px solid var(--border-subtle)' }}>Generate Portfolio Deck</button>
          <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>Initiate New GCC</button>
        </div>
      </div>

      {/* Critical Alerts Strip - SURFACES BREACHES INSTANTLY */}
      {(breachedEscalations.length > 0 || expiringDocs.length > 0) && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {breachedEscalations.map(e => (
            <div key={e.id} className="card" style={{ minWidth: 320, padding: '1.25rem', borderLeft: '4px solid #ef4444', background: '#fef2f2' }} onClick={() => navigate(`/escalations/${e.id}`)}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <FileWarning size={20} color="#ef4444" />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>SLA BREACH DETECTED</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>{e.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.25rem' }}>Ball-in-Court: PMO Manager</div>
                </div>
              </div>
            </div>
          ))}
          {expiringDocs.map(d => (
            <div key={d.id} className="card" style={{ minWidth: 320, padding: '1.25rem', borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Shield size={20} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>COMPLIANCE RISK</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>{d.document_name} Expiring</div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.25rem' }}>Action required in {getComplianceStatus(d.expiry_date).days} days</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strategic KPIs Section */}
      <div className="grid-stack grid-2" style={{ marginBottom: '3rem' }}>
        <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 300, height: 300, background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', filter: 'blur(60px)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>Financial Health (Portfolio)</div>
                <div style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0.5rem 0' }}>{cpi} <span style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.4)' }}>CPI</span></div>
                <div className="badge" style={{ background: Number(cpi) >= 1 ? '#10b981' : '#f43f5e', color: 'white', border: 'none' }}>
                   {Number(cpi) >= 1 ? 'Efficiency above baseline' : 'Variance alert triggered'}
                </div>
              </div>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={32} color="#6366f1" />
              </div>
            </div>
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '2.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Planned CapEx</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(totalBudget)}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Actual Spent</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(totalSpent)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Schedule Adherence</div>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0.5rem 0', color: '#0f172a' }}>{scheduleAdherence}%</div>
              <div className="badge badge-blue">
                 <Clock size={14} /> Go-Live Predictability: HIGH
              </div>
            </div>
          </div>
          <div style={{ marginTop: '2.5rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 10 }}>
                <span style={{ color: '#64748b' }}>Milestone Progression</span>
                <span style={{ fontWeight: 700 }}>{completedMilestones} / {milestones.length} Completed</span>
             </div>
             <div style={{ height: 12, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ width: `${scheduleAdherence}%`, height: '100%', background: 'var(--brand-primary)', borderRadius: 100 }} />
             </div>
          </div>
        </div>
      </div>

      {/* Operational Scorecards */}
      <div className="grid-stack grid-2 grid-4" style={{ marginBottom: '3rem' }}>
        {[
          { label: 'Active Projects', value: activeProjects, sub: `${blockedProjects} Blocked`, icon: FolderKanban, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Open Escalations', value: openEscalations.length, sub: `${breachedEscalations.length} Breached`, icon: AlertTriangle, color: '#f43f5e', bg: '#fff1f2' },
          { label: 'Portfolio Variance', value: `${budgetVariance}%`, sub: '±5% Target', icon: TrendingUp, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Pending Approvals', value: pendingPOs.length, sub: 'Ball-in-Court: You', icon: CheckCircle2, color: '#f59e0b', bg: '#fffbeb' },
        ].map((stat, i) => (
          <div key={i} className="card card-stat" style={{ padding: '1.5rem', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={24} color={stat.color} />
              </div>
              <ChevronRight size={18} color="#cbd5e1" />
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>{stat.value}</div>
              <div style={{ fontSize: '0.8125rem', color: stat.color, fontWeight: 600 }}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-stack grid-2">
        {/* Stage Distribution */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '2rem' }}>Lifecycle Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stageDistribution.map(s => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>{s.name}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>{s.count} GCCs</span>
                </div>
                <div style={{ height: 10, background: '#f8fafc', borderRadius: 5, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: `${(s.count / Math.max(projects.length, 1)) * 100}%`, height: '100%', background: s.color, borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Compliance Map */}
        <div className="card" style={{ padding: '2rem' }}>
           <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '2rem' }}>Compliance & Risk Posture</h3>
           <div className="grid-stack" style={{ gap: '1rem' }}>
              {expiringDocs.length === 0 && (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <Shield size={48} color="#10b981" style={{ marginBottom: '1rem', opacity: 0.2 }} />
                  <div style={{ fontWeight: 600 }}>All vendor documents are compliant</div>
                </div>
              )}
              {expiringDocs.map(d => (
                <div key={d.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{d.document_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vendor: {vendors.find(v => v.id === d.vendor_id)?.vendor_name}</div>
                  </div>
                  <span className={`badge ${getComplianceStatus(d.expiry_date).className}`}>
                    {getComplianceStatus(d.expiry_date).status}
                  </span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
