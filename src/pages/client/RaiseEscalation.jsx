import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { SEVERITY_LEVELS, ESCALATION_SLA, ESCALATION_ASSIGN } from '../../lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function RaiseEscalation() {
  const store = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  if (!currentUser) return <div className="fade-in empty-state">Loading...</div>;
  const project = store.getById('projects', currentUser.assigned_project_id);
  const [form, setForm] = useState({ title: '', description: '', severity: 'Medium' });


  const handleSubmit = async (e) => {
    e.preventDefault();
    const slaHours = SEVERITY_LEVELS.indexOf(form.severity) === 3 ? 4 : form.severity === 'High' ? 24 : form.severity === 'Medium' ? 72 : 120; // Simplified SLA lookup for robustness
    const slaDue = new Date(Date.now() + slaHours * 3600000).toISOString();
    const assignedTo = form.severity === 'Critical' || form.severity === 'High' ? 1 : 2; // Default PMO IDs

    const esc = await store.insert('escalations', {
      project_id: currentUser.assigned_project_id, raised_by: currentUser.id,
      title: form.title, description: form.description, severity: form.severity,
      status: 'Open', assigned_to: assignedTo, sla_due_date: slaDue,
    });

    // Add first comment
    await store.insert('escalation_comments', { escalation_id: esc.id, comment_by: currentUser.id, comment_text: form.description, is_internal: false });

    // Notify PMO
    const pmoUsers = store.getWhere('users', u => u.role === 'PMO');
    for (const u of pmoUsers) {
      await store.addNotification(u.id, 'Escalation Raised', `${currentUser.name} raised a ${form.severity} severity escalation on ${project?.project_name}`, 'escalation', esc.id);
    }

    await store.addAuditLog(currentUser.id, 'Raised Escalation', 'escalation', esc.id, null, { title: form.title, severity: form.severity });
    navigate('/escalations');
  };


  return (
    <div className="fade-in">
      <button className="btn btn-ghost" onClick={() => navigate('/escalations')} style={{ marginBottom: '1rem' }}><ArrowLeft size={16} /> Back</button>
      <div className="card" style={{ maxWidth: 600, padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Raise Escalation</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>Project: {project?.project_name}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="label">Title *</label><input className="input-field" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief summary of the issue" /></div>
          <div className="form-group"><label className="label">Description *</label><textarea className="textarea-field" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description..." style={{ minHeight: 120 }} /></div>
          <div className="form-group">
            <label className="label">Severity *</label>
            <select className="select-field" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {SEVERITY_LEVELS.map(s => <option key={s}>{s}</option>)}
            </select>
            <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: 4 }}>
              SLA: {form.severity === 'Critical' ? '4 hours' : form.severity === 'High' ? '24 hours' : form.severity === 'Medium' ? '3 days' : '5 days'}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/escalations')}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Escalation</button>
          </div>
        </form>
      </div>
    </div>
  );
}
