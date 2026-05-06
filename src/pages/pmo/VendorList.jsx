import { useNavigate } from 'react-router-dom';
import { useStoreData } from '../../hooks/useStore';
import { getStatusBadgeClass, getComplianceStatus } from '../../lib/utils';
import { Plus, ArrowRight } from 'lucide-react';

export default function VendorList() {
  const vendors = useStoreData('vendors');
  const compliance = useStoreData('vendor_compliance');
  const projects = useStoreData('projects');
  const navigate = useNavigate();

  const getComplianceSummary = (vendorId) => {
    const docs = compliance.filter(d => d.vendor_id === vendorId);
    if (docs.length === 0) return { label: 'No Docs', className: 'badge-neutral' };
    const expired = docs.some(d => getComplianceStatus(d.expiry_date).status === 'Expired');
    const expiring = docs.some(d => getComplianceStatus(d.expiry_date).status === 'Expiring Soon');
    if (expired) return { label: 'Expired', className: 'badge-danger' };
    if (expiring) return { label: 'Expiring Soon', className: 'badge-warning' };
    return { label: 'All Valid', className: 'badge-success' };
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">{vendors.length} registered vendors</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/vendors/new')}><Plus size={16} /> Add Vendor</button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Vendor Name</th><th>Type</th><th>Project</th><th>Status</th><th>Compliance</th><th>Documents</th><th>Actions</th></tr></thead>
          <tbody>
            {vendors.map(v => {
              const cs = getComplianceSummary(v.id);
              const docCount = compliance.filter(d => d.vendor_id === v.id).length;
              const project = projects.find(p => p.id === v.project_id);
              return (
                <tr key={v.id} onClick={() => navigate(`/vendors/${v.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{v.vendor_name}</td>
                  <td><span className="badge badge-neutral">{v.vendor_type}</span></td>
                  <td style={{ fontSize: '0.8125rem' }}>{project?.project_name}</td>
                  <td><span className={`badge ${getStatusBadgeClass(v.status)}`}>{v.status}</span></td>
                  <td><span className={`badge ${cs.className}`}>{cs.label}</span></td>
                  <td style={{ fontSize: '0.8125rem' }}>{docCount} docs</td>
                  <td><button className="btn btn-ghost btn-sm"><ArrowRight size={16} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
