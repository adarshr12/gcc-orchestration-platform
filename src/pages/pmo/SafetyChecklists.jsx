import { useState } from 'react';
import { useStore, useStoreData } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusBadgeClass } from '../../lib/utils';
import { ShieldCheck, CheckCircle, XCircle, Plus } from 'lucide-react';

export default function SafetyChecklists() {
  const store = useStore();
  const { currentUser } = useAuth();
  const checklists = useStoreData('safety_checklists');
  const items = useStoreData('safety_checklist_items');
  const projects = useStoreData('projects');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ project_id: projects[0]?.id || '', inspector_name: '', inspection_date: new Date().toISOString().split('T')[0] });

  const DEFAULT_ITEMS = ['Fire exits clearly marked and unobstructed', 'PPE (hard hats, vests) available for all workers', 'Emergency contact numbers posted on site', 'Electrical wiring inspection completed', 'First aid kit present and stocked', 'Hazardous areas marked with warning signs', 'Contractor induction completed for all workers'];

  const createChecklist = async () => {
    const cl = await store.insert('safety_checklists', { ...form, project_id: Number(form.project_id), overall_status: 'Pending', created_by: currentUser.id });
    for (const item of DEFAULT_ITEMS) {
      await store.insert('safety_checklist_items', { checklist_id: cl.id, item_name: item, is_compliant: false, notes: '', checked_by: null });
    }
    setShowCreate(false);
    setForm({ project_id: projects[0]?.id || '', inspector_name: '', inspection_date: new Date().toISOString().split('T')[0] });
  };

  const toggleItem = async (itemId, current) => {
    await store.update('safety_checklist_items', itemId, { is_compliant: !current, checked_by: currentUser.id });
    // Recalculate overall status
    const item = store.getById('safety_checklist_items', itemId);
    const allItems = store.getWhere('safety_checklist_items', i => i.checklist_id === item.checklist_id);
    const allDone = allItems.every(i => (i.id === itemId ? !current : i.is_compliant));
    const anyFailed = allItems.some(i => (i.id === itemId ? current : !i.is_compliant));
    const checklist = store.getById('safety_checklists', item.checklist_id);
    if (allDone) await store.update('safety_checklists', checklist.id, { overall_status: 'Completed' });
    else if (anyFailed) await store.update('safety_checklists', checklist.id, { overall_status: 'Non-Compliant' });
  };

  const updateNotes = async (itemId, notes) => await store.update('safety_checklist_items', itemId, { notes });


  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Safety Inspections</h1><p className="page-subtitle">{checklists.length} inspections</p></div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> New Inspection</button>
      </div>

      {checklists.map(cl => {
        const project = projects.find(p => p.id === cl.project_id);
        const clItems = items.filter(i => i.checklist_id === cl.id);
        const compliant = clItems.filter(i => i.is_compliant).length;
        return (
          <div key={cl.id} className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={18} /> {project?.project_name}</h3>
                <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: 4 }}>Inspector: {cl.inspector_name} · Date: {formatDate(cl.inspection_date)} · {compliant}/{clItems.length} items compliant</div>
              </div>
              <span className={`badge ${getStatusBadgeClass(cl.overall_status)}`}>{cl.overall_status}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {clItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 6, background: item.is_compliant ? '#f0fdf4' : '#fef2f2' }}>
                  <button onClick={() => toggleItem(item.id, item.is_compliant)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {item.is_compliant ? <CheckCircle size={20} color="#27AE60" /> : <XCircle size={20} color="#E74C3C" />}
                  </button>
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>{item.item_name}</span>
                  <input style={{ width: 200, fontSize: '0.75rem', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 4, background: 'white' }} placeholder="Notes..." value={item.notes || ''} onChange={e => updateNotes(item.id, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 style={{ fontWeight: 600 }}>New Safety Inspection</h3><button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="label">Project</label><select className="select-field" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>{projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}</select></div>
              <div className="form-group"><label className="label">Inspector Name</label><input className="input-field" value={form.inspector_name} onChange={e => setForm({ ...form, inspector_name: e.target.value })} /></div>
              <div className="form-group"><label className="label">Date</label><input className="input-field" type="date" value={form.inspection_date} onChange={e => setForm({ ...form, inspection_date: e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={createChecklist} disabled={!form.inspector_name}>Create</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
