import { useAuth } from '../../context/AuthContext';
import { useStore, useStoreData } from '../../hooks/useStore';
import { formatCurrency, getStatusBadgeClass } from '../../lib/utils';
import { TrendingUp, AlertCircle, FileText, ChevronRight, PieChart } from 'lucide-react';

export default function BudgetSummary() {
  const { currentUser } = useAuth();
  const store = useStore();
  
  if (!currentUser) return <div className="fade-in empty-state">Loading financial data...</div>;

  const project = store.getById('projects', currentUser.assigned_project_id);
  const budgetItems = useStoreData('budget', b => b.project_id === currentUser.assigned_project_id);
  const purchaseOrders = useStoreData('purchase_orders', po => po.project_id === currentUser.assigned_project_id);

  if (!project) return <div className="empty-state">No financial records found for your account.</div>;

  // Procore-style aggregation logic
  const ledgerData = budgetItems.map(item => {
    const posForPhase = purchaseOrders.filter(po => po.phase === item.phase);
    const committed = posForPhase.filter(po => po.status === 'Approved').reduce((s, p) => s + p.amount, 0);
    const pending = posForPhase.filter(po => po.status === 'Pending Approval').reduce((s, p) => s + p.amount, 0);
    const original = item.planned_amount;
    
    // Forecast: If committed+pending exceeds original, forecast is the higher sum. 
    // Otherwise, it stays as the original baseline.
    const forecast = Math.max(original, committed + pending);
    const variance = forecast - original;
    const variancePct = original > 0 ? ((variance / original) * 100).toFixed(1) : 0;

    return {
      ...item,
      committed,
      pending,
      original,
      forecast,
      variance,
      variancePct
    };
  });

  const totalOriginal = ledgerData.reduce((s, i) => s + i.original, 0);
  const totalCommitted = ledgerData.reduce((s, i) => s + i.committed, 0);
  const totalPending = ledgerData.reduce((s, i) => s + i.pending, 0);
  const totalForecast = ledgerData.reduce((s, i) => s + i.forecast, 0);
  const totalVariance = totalForecast - totalOriginal;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Portfolio</h1>
          <p className="page-subtitle">{project.project_name} · Real-time CapEx Tracking</p>
        </div>
        <div className="header-actions">
           <button className="btn btn-ghost" style={{ background: 'white', border: '1px solid var(--border-subtle)' }}>Export Ledger (XLS)</button>
        </div>
      </div>

      {/* Strategic Rollup Cards */}
      <div className="grid-stack grid-4" style={{ marginBottom: '2.5rem' }}>
        {[
          { label: 'Original Budget', value: totalOriginal, icon: FileText, color: 'var(--text-secondary)' },
          { label: 'Committed Spend', value: totalCommitted, icon: TrendingUp, color: 'var(--brand-primary)' },
          { label: 'Pending Approval', value: totalPending, icon: PieChart, color: '#f59e0b' },
          { label: 'Variance to Date', value: totalVariance, icon: AlertCircle, color: totalVariance > 0 ? '#ef4444' : '#10b981' },
        ].map((stat, i) => (
          <div key={i} className="card card-stat" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <stat.icon size={16} color={stat.color} />
              </div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.75rem', color: stat.color === '#ef4444' ? '#ef4444' : 'var(--text-primary)' }}>
               {formatCurrency(stat.value)}
            </div>
          </div>
        ))}
      </div>

      {/* The Procore Ledger */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Budget Workstream</th>
              <th className="amount">Original Budget</th>
              <th className="amount">Committed</th>
              <th className="amount">Pending</th>
              <th className="amount" style={{ background: '#f8fafc' }}>Forecast</th>
              <th className="amount">Variance</th>
            </tr>
          </thead>
          <tbody>
            {ledgerData.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700 }}>{item.phase}</td>
                <td className="amount" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.original)}</td>
                <td className="amount" style={{ fontWeight: 600 }}>{formatCurrency(item.committed)}</td>
                <td className="amount" style={{ color: '#f59e0b' }}>{formatCurrency(item.pending)}</td>
                <td className="amount" style={{ background: '#f8fafc', fontWeight: 800, color: 'var(--brand-primary)' }}>
                   {formatCurrency(item.forecast)}
                </td>
                <td className="amount">
                   {item.variance > 0 ? (
                     <span style={{ color: '#ef4444', fontWeight: 700 }}>
                        +{formatCurrency(item.variance)} ({item.variancePct}%)
                     </span>
                   ) : (
                     <span style={{ color: '#10b981', fontWeight: 600 }}>In Budget</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ background: '#0f172a', color: 'white' }}>
             <tr>
                <td style={{ padding: '1.25rem', fontWeight: 800 }}>Portfolio Total</td>
                <td className="amount" style={{ padding: '1.25rem' }}>{formatCurrency(totalOriginal)}</td>
                <td className="amount" style={{ padding: '1.25rem' }}>{formatCurrency(totalCommitted)}</td>
                <td className="amount" style={{ padding: '1.25rem' }}>{formatCurrency(totalPending)}</td>
                <td className="amount" style={{ padding: '1.25rem', fontWeight: 800 }}>{formatCurrency(totalForecast)}</td>
                <td className="amount" style={{ padding: '1.25rem' }}>
                   {totalVariance > 0 ? `+${formatCurrency(totalVariance)}` : 'In Budget'}
                </td>
             </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
