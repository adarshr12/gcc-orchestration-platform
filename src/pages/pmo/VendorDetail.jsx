import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useStore, useStoreData } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { getStatusBadgeClass, getComplianceStatus, formatDate, formatCurrency } from '../../lib/utils';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, FileText, Star, Briefcase, Phone, Mail, Globe, MapPin } from 'lucide-react';

export default function VendorDetail() {
  const { id } = useParams();
  const store = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showActionModal, setShowActionModal] = useState(false);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState('');

  const vendor = store.getById('vendors', Number(id));
  const docs = useStoreData('vendor_compliance', d => d.vendor_id === Number(id));
  const projects = useStoreData('projects');
  const pos = useStoreData('purchase_orders', p => p.vendor_id === Number(id));

  if (!vendor) return <div className="empty-state">Vendor profile not found</div>;

  const project = projects.find(p => p.id === vendor.project_id);

  const handleAction = (type) => { setActionType(type); setShowActionModal(true); };

  const submitAction = async () => {
    if (actionType === 'approve') {
      await store.update('vendors', vendor.id, { 
        status: 'Approved', 
        approved_by: currentUser.id, 
        approved_at: new Date().toISOString(),
        onboarding_date: new Date().toISOString().split('T')[0] 
      });
    } else {
      await store.update('vendors', vendor.id, { status: 'Inactive' });
    }
    setShowActionModal(false);
    setComment('');
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/vendors')}>
          <ArrowLeft size={16} /> Back to Vendor List
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
           {vendor.status === 'Pending' && (
             <>
               <button className="btn btn-ghost" style={{ border: '1px solid #ef4444', color: '#ef4444' }} onClick={() => handleAction('reject')}>Reject</button>
               <button className="btn btn-primary" onClick={() => handleAction('approve')}>Approve Onboarding</button>
             </>
           )}
           <span className={`badge ${getStatusBadgeClass(vendor.status)}`} style={{ padding: '0.5rem 1rem' }}>{vendor.status}</span>
        </div>
      </div>

      <div className="grid-stack grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Identity Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 }}>
                {vendor.vendor_name[0]}
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{vendor.vendor_name}</h1>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span className="badge badge-blue">{vendor.vendor_type}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> Global Vendor</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={14} /> {vendor.contact_email ? vendor.contact_email.split('@')[1] : 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance & Compliance Grid */}
          <div className="grid-stack grid-2">
            <div className="card" style={{ padding: '1.5rem' }}>
               <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Performance KPIs</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[
                    { label: 'Quality of Delivery', score: 4.8 },
                    { label: 'SLA Adherence', score: 4.5 },
                    { label: 'Policy Compliance', score: 5.0 },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{kpi.label}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= kpi.score ? '#f59e0b' : 'none'} color="#f59e0b" />)}
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
               <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Compliance Vault</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 {docs.map(d => {
                   const cs = getComplianceStatus(d.expiry_date);
                   return (
                     <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                       <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <ShieldCheck size={18} color={cs.status === 'Valid' ? '#10b981' : '#f59e0b'} />
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{d.document_name}</div>
                       </div>
                       <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: cs.status === 'Valid' ? '#10b981' : '#ef4444' }}>{cs.status}</span>
                     </div>
                   );
                 })}
                 {docs.length === 0 && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No documents verified</div>}
               </div>
            </div>
          </div>

          {/* Engagement: POs */}
          <div className="card" style={{ padding: '1.5rem' }}>
             <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Active Purchase Orders</h3>
             <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="data-table" style={{ minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Phase</th>
                      <th className="amount">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700 }}>{p.po_number}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{p.phase}</td>
                        <td className="amount" style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                        <td><span className={`badge ${getStatusBadgeClass(p.status)}`}>{p.status}</span></td>
                      </tr>
                    ))}
                    {pos.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No POs issued to this vendor yet.</td></tr>}
                  </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
             <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Relationship Metadata</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <Briefcase size={18} color="var(--brand-primary)" />
                   <div>
                     <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GCC Mandate</div>
                     <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{project?.project_name || 'N/A'}</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <Mail size={18} color="var(--brand-primary)" />
                   <div>
                     <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Point of Contact</div>
                     <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{vendor.contact_email || 'N/A'}</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <Phone size={18} color="var(--brand-primary)" />
                   <div>
                     <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Support Line</div>
                     <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{vendor.contact_phone || 'N/A'}</div>
                   </div>
                </div>
             </div>
             
             <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Onboarding Date: {formatDate(vendor.onboarding_date)}</div>
                <button className="btn btn-ghost" style={{ width: '100%', border: '1px solid var(--border-subtle)' }}>Edit Profile</button>
             </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-sidebar)', color: 'white', border: 'none' }}>
             <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>Audit Trail</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                   <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginTop: 4 }} />
                   <div>
                      <div style={{ fontWeight: 700 }}>ISO 27001 Verified</div>
                      <div style={{ opacity: 0.6 }}>Verified by System Auditor</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                   <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', marginTop: 4 }} />
                   <div>
                      <div style={{ fontWeight: 700 }}>PO-9921 Approved</div>
                      <div style={{ opacity: 0.6 }}>Approved by {currentUser.name}</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 800 }}>Confirm Vendor {actionType === 'approve' ? 'Approval' : 'Deactivation'}</h3>
              <button className="btn btn-ghost" onClick={() => setShowActionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
               <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                 Are you sure you want to {actionType === 'approve' ? 'approve' : 'deactivate'} <strong>{vendor.vendor_name}</strong>? This action will be logged in the GCC Audit Trail.
               </p>
               <textarea 
                 className="textarea-field" 
                 placeholder="Add an internal note (optional)..." 
                 value={comment} 
                 onChange={e => setComment(e.target.value)} 
               />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowActionModal(false)}>Cancel</button>
              <button className={`btn ${actionType === 'approve' ? 'btn-primary' : 'btn-danger'}`} onClick={submitAction}>
                {actionType === 'approve' ? 'Complete Onboarding' : 'Deactivate Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
