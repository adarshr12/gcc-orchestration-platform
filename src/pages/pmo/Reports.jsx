import { useStoreData } from '../../hooks/useStore';
import { formatCurrency, getSLAStatus, getComplianceStatus } from '../../lib/utils';
import { BarChart3, TrendingUp, Clock, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';


export default function Reports() {
  const projects = useStoreData('projects');
  const escalations = useStoreData('escalations');
  const milestones = useStoreData('milestones');
  const compliance = useStoreData('vendor_compliance');
  const vendors = useStoreData('vendors');
  const purchaseOrders = useStoreData('purchase_orders');

  // KPI Calculations based on Research
  const totalBudget = projects.reduce((s, p) => s + p.total_budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.actual_spent, 0);
  
  // CPI: Cost Performance Index (Target: > 1.0)
  const cpi = totalSpent > 0 ? (totalBudget / totalSpent).toFixed(2) : '1.00';
  
  // Schedule Variance (SV) - Simplified: % of milestones on time
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const overdueMilestones = milestones.filter(m => m.status === 'Overdue').length;
  const onTimeRate = milestones.length > 0 ? ((completedMilestones / (completedMilestones + overdueMilestones || 1)) * 100).toFixed(0) : 100;

  // SLA Compliance (Target: 90%+)
  const resolvedEscalations = escalations.filter(e => e.status === 'Resolved' || e.status === 'Closed');
  const breachedEscalations = escalations.filter(e => {
    const sla = getSLAStatus(e.sla_due_date);
    return sla.breached;
  });
  const slaCompliance = escalations.length > 0 ? (((escalations.length - breachedEscalations.length) / escalations.length) * 100).toFixed(0) : 100;

  // Vendor Compliance Rate (Target: 100%)
  const validDocs = compliance.filter(d => getComplianceStatus(d.expiry_date).status === 'Valid').length;
  const complianceRate = compliance.length > 0 ? ((validDocs / compliance.length) * 100).toFixed(0) : 100;

  // Vendor Onboarding Rate: Approved vendors vs total
  const approvedVendors = vendors.filter(v => v.status === 'Approved').length;
  const vendorOnboardingRate = vendors.length > 0 ? ((approvedVendors / vendors.length) * 100).toFixed(0) : 100;

  // PO Approval Rate: approved + fulfilled vs total excluding draft
  const submittedPOs = purchaseOrders.filter(po => po.status !== 'Draft');
  const approvedPOs = purchaseOrders.filter(po => po.status === 'Approved' || po.status === 'Fulfilled');
  const poApprovalRate = submittedPOs.length > 0 ? ((approvedPOs.length / submittedPOs.length) * 100).toFixed(0) : 100;

  const kpis = [
    { label: 'Cost Performance (CPI)', value: cpi, target: '> 1.0', icon: TrendingUp, color: Number(cpi) >= 1 ? '#27AE60' : '#E74C3C', subtitle: 'Efficiency of budget spend' },
    { label: 'Schedule Adherence', value: `${onTimeRate}%`, target: '> 90%', icon: Clock, color: Number(onTimeRate) >= 90 ? '#27AE60' : '#F39C12', subtitle: 'Milestones delivered on time' },
    { label: 'SLA Compliance', value: `${slaCompliance}%`, target: '> 95%', icon: AlertTriangle, color: Number(slaCompliance) >= 95 ? '#27AE60' : '#E74C3C', subtitle: 'Escalations resolved in SLA' },
    { label: 'Compliance Health', value: `${complianceRate}%`, target: '100%', icon: Shield, color: Number(complianceRate) >= 90 ? '#27AE60' : '#F39C12', subtitle: 'Valid vendor documentation' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">GCC Orchestration Analytics</h1><p className="page-subtitle">Performance KPIs vs Strategic Targets</p></div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {kpis.map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.5rem', borderRadius: 8, background: `${kpi.color}15` }}>
                <kpi.icon size={20} color={kpi.color} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af' }}>Target: {kpi.target}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E3A5F' }}>{kpi.value}</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{kpi.subtitle}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Project Performance Table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Project Performance Matrix</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Budget CPI</th>
                  <th>On-Time Rate</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const pMilestones = milestones.filter(m => m.project_id === p.id);
                  const pCompleted = pMilestones.filter(m => m.status === 'Completed').length;
                  const pOnTime = pMilestones.length > 0 ? ((pCompleted / pMilestones.length) * 100).toFixed(0) : 100;
                  const pCpi = p.actual_spent > 0 ? (p.total_budget / p.actual_spent).toFixed(2) : '1.00';
                  
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.project_name}</td>
                      <td>
                        <span style={{ color: Number(pCpi) < 1 ? '#E74C3C' : '#27AE60', fontWeight: 600 }}>{pCpi}</span>
                      </td>
                      <td>{pOnTime}%</td>
                      <td>
                        <span className={`badge ${Number(pCpi) < 0.9 || Number(pOnTime) < 70 ? 'badge-red' : 'badge-green'}`}>
                          {Number(pCpi) < 0.9 || Number(pOnTime) < 70 ? 'High Risk' : 'Healthy'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SLA Breakdown */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>SLA Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem' }}>Escalation Resolution</span>
              <span style={{ fontWeight: 600 }}>{slaCompliance}%</span>
            </div>
            <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${slaCompliance}%`, height: '100%', background: '#2E75B6' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Vendor Onboarding Rate</span>
              <span style={{ fontWeight: 600 }}>{vendorOnboardingRate}%</span>
            </div>
            <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${vendorOnboardingRate}%`, height: '100%', background: '#27AE60' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span style={{ fontSize: '0.875rem' }}>PO Approval Rate</span>
              <span style={{ fontWeight: 600 }}>{poApprovalRate}%</span>
            </div>
            <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${poApprovalRate}%`, height: '100%', background: '#F39C12' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
