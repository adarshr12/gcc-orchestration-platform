import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useStoreData } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, calculatePOApprovalType, calculatePOSLA } from '../../lib/utils';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function CreatePO() {
  const store = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const projects = useStoreData('projects');
  const vendors = useStoreData('vendors');

  const [form, setForm] = useState({ project_id: projects[0]?.id || '', vendor_id: '', amount: '', description: '', phase: 'Discovery & Evaluation' });

  const projectVendors = vendors.filter(v => v.project_id === Number(form.project_id) && (v.status === 'Approved' || v.status === 'Active'));
  const approvalType = form.amount ? calculatePOApprovalType(Number(form.amount)) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    const type = calculatePOApprovalType(amount);
    const poNum = `PO-2025-${String(store.getAll('purchase_orders').length + 1).padStart(3, '0')}`;
    const slaHours = calculatePOSLA(amount);
    const slaDue = new Date(Date.now() + slaHours * 3600000).toISOString();

    let status = 'Pending Approval';
    if (type === 'auto') status = 'Approved';
    if (type === 'blocked') status = 'Pending Approval';

    const po = await store.insert('purchase_orders', {
      ...form, project_id: Number(form.project_id), vendor_id: Number(form.vendor_id),
      amount, po_number: poNum, status, created_by: currentUser.id, sla_due_date: slaDue,
    });

    if (type === 'auto') {
      // Auto-approve: update budget
      await store.update('purchase_orders', po.id, { approved_by: 0, approval_date: new Date().toISOString() });
      const budgetItems = store.getWhere('budget', b => b.project_id === po.project_id && b.phase === form.phase);
      if (budgetItems.length > 0) await store.update('budget', budgetItems[0].id, { actual_amount: budgetItems[0].actual_amount + amount });
      const proj = store.getById('projects', po.project_id);
      if (proj) await store.update('projects', proj.id, { actual_spent: proj.actual_spent + amount });
    } else {
      await store.addNotification(1, 'PO Submitted', `New PO ${poNum} worth ${formatCurrency(amount)} submitted by ${currentUser.name}`, 'po', po.id);
    }

    navigate('/purchase-orders');
  };


  return (
    <div className="fade-in">
      <button className="btn btn-ghost" onClick={() => navigate('/purchase-orders')} style={{ marginBottom: '1rem' }}><ArrowLeft size={16} /> Back</button>
      <div className="card" style={{ maxWidth: 600, padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Create Purchase Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label className="label">Project *</label><select className="select-field" required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value, vendor_id: '' })}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}</select></div>
            <div className="form-group"><label className="label">Vendor * (Approved only)</label><select className="select-field" required value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })}><option value="">Select vendor</option>{projectVendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}</select>
              {form.project_id && projectVendors.length === 0 && <div style={{ fontSize: '0.6875rem', color: '#E74C3C', marginTop: 4 }}>No approved vendors for this project</div>}
            </div>
          </div>
          <div className="form-group"><label className="label">Amount (INR) *</label><input className="input-field" type="number" required min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>

          {approvalType && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', background: approvalType === 'auto' ? '#f0fdf4' : approvalType === 'blocked' ? '#fef2f2' : '#fffbeb', fontSize: '0.8125rem' }}>
              {approvalType === 'auto' && <span style={{ color: '#166534' }}>✓ Amount under ₹50,000 — will be auto-approved</span>}
              {approvalType === 'pmo' && <span style={{ color: '#92400e' }}>⚠ Requires PMO Manager approval (₹50K–₹5L range)</span>}
              {approvalType === 'blocked' && <span style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> Amount exceeds ₹5,00,000 — requires Director sign-off (will be held)</span>}
            </div>
          )}

          <div className="form-group"><label className="label">Phase</label><select className="select-field" value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
            {['Discovery & Evaluation', 'Design & Planning', 'Construction & Fit-Out', 'IT Infrastructure', 'HR & Legal Setup'].map(p => <option key={p}>{p}</option>)}
          </select></div>
          <div className="form-group"><label className="label">Description</label><textarea className="textarea-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="PO description..." /></div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/purchase-orders')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!form.vendor_id}>Create PO</button>
          </div>
        </form>
      </div>
    </div>
  );
}
