import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useStoreData } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getStatusBadgeClass, getSLAStatus } from '../../lib/utils';
import { Plus, CheckCircle, XCircle } from 'lucide-react';

export default function PurchaseOrders() {
  const store = useStore();
  const { currentUser } = useAuth();
  const pos = useStoreData('purchase_orders');
  const vendors = useStoreData('vendors');
  const projects = useStoreData('projects');
  const navigate = useNavigate();
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const approvePO = async (po) => {
    await store.update('purchase_orders', po.id, { status: 'Approved', approved_by: currentUser.id, approval_date: new Date().toISOString() });
    // Update budget
    const budgetItems = store.getWhere('budget', b => b.project_id === po.project_id && b.phase === po.phase);
    if (budgetItems.length > 0) {
      await store.update('budget', budgetItems[0].id, { actual_amount: budgetItems[0].actual_amount + po.amount });
    }
    const project = store.getById('projects', po.project_id);
    await store.update('projects', po.project_id, { actual_spent: (project?.actual_spent || 0) + po.amount });
    await store.addNotification(po.created_by, 'PO Approved', `Your PO ${po.po_number} has been approved by ${currentUser.name}`, 'po', po.id);
    await store.addAuditLog(currentUser.id, 'Approved PO', 'po', po.id, { status: 'Pending Approval' }, { status: 'Approved' });
  };

  const rejectPO = async () => {
    if (!rejectModal || !rejectReason) return;
    await store.update('purchase_orders', rejectModal.id, { status: 'Rejected', approved_by: currentUser.id, rejection_reason: rejectReason });
    await store.addNotification(rejectModal.created_by, 'PO Rejected', `Your PO ${rejectModal.po_number} has been rejected. Reason: ${rejectReason}`, 'po', rejectModal.id);
    await store.addAuditLog(currentUser.id, 'Rejected PO', 'po', rejectModal.id, { status: 'Pending Approval' }, { status: 'Rejected', reason: rejectReason });
    setRejectModal(null);
    setRejectReason('');
  };


  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Purchase Orders</h1><p className="page-subtitle">{pos.length} total orders</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/purchase-orders/new')}><Plus size={16} /> Create PO</button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>PO Number</th><th>Project</th><th>Vendor</th><th>Amount</th><th>Phase</th><th>Status</th><th>SLA</th><th>Actions</th></tr></thead>
          <tbody>
            {pos.map(po => {
              const vendor = vendors.find(v => v.id === po.vendor_id);
              const project = projects.find(p => p.id === po.project_id);
              const sla = getSLAStatus(po.sla_due_date);
              return (
                <tr key={po.id}>
                  <td style={{ fontWeight: 600 }}>{po.po_number}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{project?.project_name}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{vendor?.vendor_name}</td>
                  <td className="amount">{formatCurrency(po.amount)}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{po.phase}</td>
                  <td><span className={`badge ${getStatusBadgeClass(po.status)}`}>{po.status}</span></td>
                  <td>{po.status === 'Pending Approval' ? <span className={sla.className}>{sla.label}</span> : <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{po.status === 'Approved' ? 'Met' : '—'}</span>}</td>
                  <td>
                    {po.status === 'Pending Approval' && (
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button className="btn btn-success btn-sm" onClick={() => approvePO(po)}><CheckCircle size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => setRejectModal(po)}><XCircle size={14} /></button>
                      </div>
                    )}
                    {po.status === 'Rejected' && po.rejection_reason && (
                      <span style={{ fontSize: '0.6875rem', color: '#E74C3C' }}>{po.rejection_reason}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 style={{ fontWeight: 600 }}>Reject PO {rejectModal.po_number}</h3><button className="btn btn-ghost btn-sm" onClick={() => setRejectModal(null)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="label">Rejection Reason *</label><textarea className="textarea-field" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setRejectModal(null)}>Cancel</button><button className="btn btn-danger" disabled={!rejectReason} onClick={rejectPO}>Reject PO</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
