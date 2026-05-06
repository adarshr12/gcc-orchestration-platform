import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useStore';
import { Bell, ChevronDown, User, X, CheckCheck, AlertTriangle, FileText, Clock, Shield, LogOut, Search, Command, Menu } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const NOTIF_ICONS = {
  'Escalation Raised': AlertTriangle,
  'Escalation Assigned': AlertTriangle,
  'Escalation Resolved': AlertTriangle,
  'SLA Breached': Clock,
  'Compliance Expiring': Shield,
  'Milestone Overdue': Clock,
  'PO Submitted': FileText,
  'PO Approved': FileText,
  'PO Rejected': FileText,
  'Stage Changed': CheckCheck,
};

export default function TopNavbar({ onMenuClick }) {
  const { currentUser, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(currentUser?.id);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header style={{ 
        position: 'sticky', top: 0, 
        width: '100%',
        height: 72, 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 1rem', zIndex: 100
      }}>
        {/* Left Side: Hamburger (Mobile Only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn btn-ghost lg-hidden" 
            onClick={onMenuClick}
            style={{ padding: '0.5rem', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Toggle Menu"
          >
            <Menu size={24} color="#0f172a" />
          </button>

          
          <div style={{ display: 'none', md: 'block', fontWeight: 800, fontSize: '1.25rem' }}>
            Orchestrator
          </div>
        </div>

        {/* Search Bar (Hidden on tiny screens) */}
        <div style={{ display: 'none', lg: 'flex', alignItems: 'center', flex: 1, maxWidth: 400, margin: '0 2rem' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input placeholder="Search..." className="input-field" style={{ paddingLeft: '2.75rem', background: '#f1f5f9', border: 'none' }} />
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="btn btn-ghost" style={{ position: 'relative' }}>
            <Bell size={20} />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', width: 8, height: 8, borderRadius: '50%', border: '2px solid white' }} />}
          </button>

          <button onClick={() => setShowDropdown(!showDropdown)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <User size={18} />
            </div>
          </button>
        </div>
      </header>

      {/* Notification Panel (Mobile Optimized) */}
      {showNotifs && (
        <div style={{ position: 'fixed', top: 80, right: 16, left: 16, maxWidth: 400, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 120, maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>Notifications</span>
            <button onClick={() => setShowNotifs(false)}><X size={18} /></button>
          </div>
          <div style={{ overflowY: 'auto', padding: '0.5rem' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No new notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '0.75rem', borderRadius: 10, background: n.is_read ? 'transparent' : '#f8faff', marginBottom: 4, fontSize: '0.8125rem' }}>
                  {n.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Profile Dropdown */}
      {showDropdown && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 110 }} 
            onClick={() => setShowDropdown(false)} 
          />
          <div style={{ 
            position: 'absolute', top: 76, right: 16, width: 220, 
            background: 'white', borderRadius: 16, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)', 
            border: '1px solid #e2e8f0', zIndex: 120,
            overflow: 'hidden',
            animation: 'fadeInScale 0.2s ease'
          }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>{currentUser?.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{currentUser?.role}</div>
            </div>
            <div style={{ padding: '0.5rem' }}>
              <button 
                onClick={() => { logout(); navigate('/login'); }}
                className="btn btn-ghost" 
                style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444', gap: '0.75rem', padding: '0.75rem' }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
