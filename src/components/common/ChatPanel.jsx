import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore, useStoreData } from '../../hooks/useStore';
import { Send, AtSign, MessageSquare, Hash } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

export function ChatPanel({ entityType, entityId, title = "Collaboration" }) {
  const { currentUser } = useAuth();
  const store = useStore();
  const [msg, setMsg] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const scrollRef = useRef(null);

  const comments = useStoreData('comments', c => c.entity_type === entityType && c.entity_id === entityId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  const allUsers = useStoreData('users');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async () => {
    if (!msg.trim()) return;
    
    const tags = msg.match(/@(\w+)/g)?.map(t => t.substring(1)) || [];
    const taggedUserIds = allUsers
      .filter(u => tags.some(t => u.name.toLowerCase().includes(t.toLowerCase())))
      .map(u => u.id);

    await store.insert('comments', {
      entity_type: entityType,
      entity_id: entityId,
      user_id: currentUser.id,
      comment_text: msg,
      tags: taggedUserIds,
      is_internal: currentUser.role === 'PMO'
    });

    for (const userId of taggedUserIds) {
      if (userId !== currentUser.id) {
        await store.addNotification(userId, 'Mention', `${currentUser.name} mentioned you in ${entityType} chat`, entityType, entityId);
      }
    }

    setMsg('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 450, background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <div style={{ padding: '1rem 1.25rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Hash size={18} color="#6366f1" />
        </div>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '4rem' }}>
            <MessageSquare size={40} style={{ margin: '0 auto 1rem', opacity: 0.1 }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>No messages in this stream yet.</div>
          </div>
        ) : (
          comments.map(c => {
            const user = allUsers.find(u => u.id === c.user_id);
            const isMe = c.user_id === currentUser.id;
            return (
              <div key={c.id} style={{ display: 'flex', gap: '0.75rem', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 8, 
                  background: isMe ? '#6366f1' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isMe ? 'white' : '#475569', fontSize: '0.75rem', fontWeight: 700,
                  flexShrink: 0
                }}>
                  {user?.name?.charAt(0)}
                </div>
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b' }}>{user?.name}</span>
                    <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>{formatDateTime(c.created_at)}</span>
                  </div>
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: 14, 
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    background: isMe ? '#6366f1' : 'white',
                    color: isMe ? 'white' : '#1e2937',
                    boxShadow: isMe ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                    borderBottomRightRadius: isMe ? 2 : 14,
                    borderBottomLeftRadius: !isMe ? 2 : 14,
                  }}>
                    {c.comment_text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: '1.25rem', background: 'white', borderTop: '1px solid #e2e8f0', position: 'relative' }}>
        {showMentions && (
          <div style={{ position: 'absolute', bottom: '100%', left: '1.25rem', right: '1.25rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 -10px 25px rgba(0,0,0,0.08)', maxHeight: 180, overflowY: 'auto', zIndex: 10 }}>
            {allUsers.map(u => (
              <div key={u.id} onClick={() => { setMsg(msg + '@' + u.name + ' '); setShowMentions(false); }} style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 600 }}>{u.name.charAt(0)}</div>
                <span>{u.name}</span>
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8', marginLeft: 'auto' }}>{u.role}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: 12, alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ padding: 8, borderRadius: 8, color: showMentions ? '#6366f1' : '#64748b' }} onClick={() => setShowMentions(!showMentions)}>
            <AtSign size={18} />
          </button>
          <input 
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', padding: '0.5rem 0' }}
            placeholder="Type your message..." 
            value={msg} 
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            className="btn btn-primary" 
            style={{ width: 36, height: 36, padding: 0, borderRadius: 10 }} 
            onClick={handleSend} 
            disabled={!msg.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
