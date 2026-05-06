import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, useStoreData } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { getStatusBadgeClass, getSeverityBadgeClass, getSLAStatus, formatDateTime } from '../../lib/utils';
import { ArrowLeft, Send, Clock, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function EscalationDetail() {
  const { id } = useParams();
  const store = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [refresh, setRefresh] = useState(0);

  // Update timer every minute
  useEffect(() => {
    const timer = setInterval(() => setRefresh(prev => prev + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const escalation = store.getById('escalations', Number(id));
  const comments = useStoreData('escalation_comments', c => c.escalation_id === Number(id) && !c.is_internal).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const internalNotes = useStoreData('escalation_comments', c => c.escalation_id === Number(id) && c.is_internal).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const users = useStoreData('users');
  const projects = useStoreData('projects');

  if (!escalation) return <div className="empty-state">Escalation not found</div>;

  const project = projects.find(p => p.id === escalation.project_id);
  const raiser = users.find(u => u.id === escalation.raised_by);
  const assignee = users.find(u => u.id === escalation.assigned_to);
  const sla = getSLAStatus(escalation.sla_due_date);
  const resolved = escalation.status === 'Resolved' || escalation.status === 'Closed';

  const addComment = async () => {
    if (!newComment.trim()) return;
    await store.insert('escalation_comments', { escalation_id: escalation.id, comment_by: currentUser.id, comment_text: newComment, is_internal: false });
    if (currentUser.role === 'PMO' && raiser?.role === 'Client') {
      await store.addNotification(raiser.id, 'Escalation Assigned', `${currentUser.name} replied to your escalation`, 'escalation', escalation.id);
    }
    setNewComment('');
  };

  const addInternalNote = async () => {
    if (!internalNote.trim()) return;
    await store.insert('escalation_comments', { escalation_id: escalation.id, comment_by: currentUser.id, comment_text: internalNote, is_internal: true });
    setInternalNote('');
  };

  const updateStatus = async (status) => {
    const oldStatus = escalation.status;
    await store.update('escalations', escalation.id, { status, ...(status === 'Resolved' ? { resolved_at: new Date().toISOString() } : {}) });
    await store.addAuditLog(currentUser.id, `Changed Escalation Status`, 'escalation', escalation.id, { status: oldStatus }, { status });
    if (status === 'Resolved' && raiser?.role === 'Client') {
      await store.addNotification(raiser.id, 'Escalation Resolved', `Your escalation '${escalation.title}' has been resolved`, 'escalation', escalation.id);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/escalations')}>
          <ArrowLeft size={16} /> Back to Queue
        </button>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Ticket ID: <strong>#ESC-{escalation.id.toString().padStart(4, '0')}</strong></span>
          <span className={`badge ${getSeverityBadgeClass(escalation.severity)}`}>{escalation.severity}</span>
        </div>
      </div>

      <div className="grid-stack grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Main Discussion Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{escalation.title}</h2>
              <span className={`badge ${getStatusBadgeClass(escalation.status)}`} style={{ height: 'fit-content' }}>{escalation.status}</span>
            </div>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '1.25rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              {escalation.description}
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Discussion Thread</h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem', maxHeight: 500, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {comments.map(c => {
                const user = users.find(u => u.id === c.comment_by);
                const isPMO = user?.role === 'PMO';
                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isPMO ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{user?.name}</span>
                      <span className={`badge ${isPMO ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.625rem', padding: '1px 8px' }}>{user?.role}</span>
                    </div>
                    <div style={{ 
                      maxWidth: '85%', 
                      padding: '0.875rem 1.25rem', 
                      borderRadius: isPMO ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background: isPMO ? 'var(--brand-primary)' : '#f1f5f9',
                      color: isPMO ? 'white' : 'var(--text-primary)',
                      fontSize: '0.9375rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {c.comment_text}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 6 }}>{formatDateTime(c.created_at)}</span>
                  </div>
                );
              })}
            </div>
            
            {!resolved && (
              <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'white', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
                <input 
                  className="input-field" 
                  style={{ border: 'none', background: 'transparent' }} 
                  placeholder="Type a response..." 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && addComment()} 
                />
                <button className="btn btn-primary" style={{ padding: '0.75rem' }} onClick={addComment} disabled={!newComment.trim()}>
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Internal PMO Workspace */}
          {currentUser.role === 'PMO' && (
            <div className="card" style={{ padding: '1.5rem', background: '#fffbeb', border: '1px dashed #fcd34d' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} /> Internal PMO Notes (Private)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {internalNotes.map(n => {
                  const user = users.find(u => u.id === n.comment_by);
                  return (
                    <div key={n.id} style={{ fontSize: '0.8125rem', color: '#78350f' }}>
                      <span style={{ fontWeight: 700 }}>{user?.name}: </span>
                      {n.comment_text}
                    </div>
                  );
                })}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input className="input-field" style={{ background: 'white' }} placeholder="Add note..." value={internalNote} onChange={e => setInternalNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addInternalNote()} />
                  <button className="btn btn-ghost" style={{ background: '#fef3c7' }} onClick={addInternalNote}>Add</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Rail: SLAs & Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>SLA Discipline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span>Resolution Goal</span>
                  <span className={`sla-badge ${sla.className}`}>
                    <Clock size={12} /> {sla.label}
                  </span>
                </div>
                {!resolved && (
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: sla.breached ? '100%' : '65%', height: '100%', background: sla.breached ? '#ef4444' : '#10b981' }} />
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Action Owner</div>
                <div className="ball-in-court" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <div className="avatar-tiny">{assignee?.name?.[0]}</div>
                  <span><strong>{assignee?.name}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Metadata</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Project</span><div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{project?.project_name}</div></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Workstream</span><div style={{ fontWeight: 600 }}>Construction & IT</div></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Reporter</span><div style={{ fontWeight: 600 }}>{raiser?.name}</div></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Created</span><div style={{ fontWeight: 500 }}>{formatDateTime(escalation.created_at)}</div></div>
            </div>

            {currentUser.role === 'PMO' && !resolved && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <label className="label" style={{ fontSize: '0.75rem' }}>Transition Status</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '0.8125rem' }} onClick={() => updateStatus('In Progress')}>
                    <Clock size={14} /> Mark In Progress
                  </button>
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '0.8125rem', color: '#10b981' }} onClick={() => updateStatus('Resolved')}>
                    <CheckCircle2 size={14} /> Resolve Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
