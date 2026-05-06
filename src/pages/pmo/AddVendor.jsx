import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useStoreData } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { VENDOR_TYPES } from '../../lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function AddVendor() {
  const store = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const projects = useStoreData('projects');
  const [form, setForm] = useState({ vendor_name: '', vendor_type: 'Construction', contact_email: '', contact_phone: '', project_id: projects[0]?.id || '' });
  const [docs, setDocs] = useState([{ document_name: '', document_type: 'GST Certificate', expiry_date: '' }]);

  const addDoc = () => setDocs([...docs, { document_name: '', document_type: 'GST Certificate', expiry_date: '' }]);
  const updateDoc = (i, field, value) => { const d = [...docs]; d[i][field] = value; setDocs(d); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vendor = await store.insert('vendors', { ...form, project_id: Number(form.project_id), status: 'Pending' });
    const validDocs = docs.filter(d => d.document_name && d.expiry_date);
    for (const d of validDocs) {
      await store.insert('vendor_compliance', { 
        vendor_id: vendor.id, 
        document_name: d.document_name, 
        document_type: d.document_type, 
        upload_date: new Date().toISOString().split('T')[0], 
        expiry_date: d.expiry_date, 
        status: 'Valid', 
        uploaded_by: currentUser.id 
      });
    }
    await store.addNotification(1, 'PO Submitted', `New vendor ${form.vendor_name} registered for review`, 'vendor', vendor.id);
    navigate('/vendors');
  };


  return (
    <div className="fade-in">
      <button className="btn btn-ghost" onClick={() => navigate('/vendors')} style={{ marginBottom: '1rem' }}><ArrowLeft size={16} /> Back to Vendors</button>
      <div className="card" style={{ maxWidth: 640, padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Add New Vendor</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="label">Vendor Name *</label><input className="input-field" required value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label className="label">Type *</label><select className="select-field" value={form.vendor_type} onChange={e => setForm({ ...form, vendor_type: e.target.value })}>{VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label className="label">Project *</label><select className="select-field" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>{projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Email</label><input className="input-field" type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div className="form-group"><label className="label">Phone</label><input className="input-field" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '1.5rem 0 1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>Compliance Documents</h3>
          {docs.map((d, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input className="input-field" placeholder="Document name" value={d.document_name} onChange={e => updateDoc(i, 'document_name', e.target.value)} />
              <select className="select-field" value={d.document_type} onChange={e => updateDoc(i, 'document_type', e.target.value)}>
                {['GST Certificate', 'Insurance', 'ISO', 'PAN', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
              <input className="input-field" type="date" value={d.expiry_date} onChange={e => updateDoc(i, 'expiry_date', e.target.value)} />
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={addDoc} style={{ marginBottom: '1rem' }}>+ Add Document</button>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/vendors')}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Vendor</button>
          </div>
        </form>
      </div>
    </div>
  );
}
