import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, useStoreData } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { getStatusBadgeClass, getSeverityBadgeClass, getSLAStatus, formatDateTime } from '../../lib/utils';
import { ArrowLeft, Send, Clock } from 'lucide-react';

export default function ClientEscalationDetail() {
  const { id } = useParams();
  const store = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');

  const escalation = store.getById('escalations', Number(id));
  const comments = useStoreData('escalation_comments', c => c.escalation_id === Number(id) && !c.is_internal).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const users = useStoreData('users');

  if (!escalation) return <div className="empty-state">Escalation not found</div>;

  const assignee = users.find(u => u.id === escalation.assigned_to);
  const sla = getSLAStatus(escalation.sla_due_date);
  const resolved = escalation.status === 'Resolved' || escalation.status === 'Closed';

  const addComment = async () => {
    if (!newComment.trim()) return;
    await store.insert('escalation_comments', { escalation_id: escalation.id, comment_by: currentUser.id, comment_text: newComment, is_internal: false });
    if (escalation.assigned_to) {
      await store.addNotification(escalation.assigned_to, 'Escalation Raised', `${currentUser.name} commented on escalation: ${escalation.title}`, 'escalation', escalation.id);
    }
    setNewComment('');
  };

  const closeEscalation = async () => {
    await store.update('escalations', escalation.id, { status: 'Closed' });
  };


  return (
    <div className="fade-in">
      <button className="btn btn-ghost" onClick={() => navigate('/escalations')} style={{ marginBottom: '1rem' }}><ArrowLeft size={16} /> Back</button>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{escalation.title}</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`badge ${getSeverityBadgeClass(escalation.severity)}`}>{escalation.severity}</span>
          <span className={`badge ${getStatusBadgeClass(escalation.status)}`}>{escalation.status}</span>
          {!resolved && <span className={sla.className} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem' }}><Clock size={14} /> {sla.label}</span>}
          <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Assigned to: {assignee?.name}</span>
        </div>
        {escalation.status === 'Resolved' && (
          <button className="btn btn-outline" onClick={closeEscalation} style={{ marginTop: '1rem' }}>Close Escalation</button>
        )}
      </div>

      {/* Comment Thread */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Discussion</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: 400, overflowY: 'auto' }}>
          {comments.map(c => {
            const user = users.find(u => u.id === c.comment_by);
            const isPMO = user?.role === 'PMO';
            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isPMO ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{user?.name}</span>
                  <span className={`badge ${isPMO ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>{user?.role}</span>
                </div>
                <div className={`comment-bubble ${isPMO ? 'comment-bubble-pmo' : 'comment-bubble-client'}`}>{c.comment_text}</div>
                <span style={{ fontSize: '0.6875rem', color: '#9ca3af', marginTop: 4 }}>{formatDateTime(c.created_at)}</span>
              </div>
            );
          })}
        </div>
        {!resolved && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input-field" placeholder="Type a message..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} />
            <button className="btn btn-primary" onClick={addComment} disabled={!newComment.trim()}><Send size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
