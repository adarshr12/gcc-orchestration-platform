import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FolderKanban, Users, FileText, AlertTriangle, ShieldCheck, BarChart3, Bell, Briefcase, History, X, LogOut } from 'lucide-react';

const PMO_LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/vendors', icon: Users, label: 'Vendors' },
  { to: '/purchase-orders', icon: FileText, label: 'Purchase Orders' },
  { to: '/escalations', icon: AlertTriangle, label: 'Escalations' },
  { to: '/safety', icon: ShieldCheck, label: 'Safety' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/audit', icon: History, label: 'Audit History' },
];

const CLIENT_LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-project', icon: Briefcase, label: 'My Project' },
  { to: '/escalations', icon: AlertTriangle, label: 'Escalations' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { isPMO, logout } = useAuth();
  const links = isPMO ? PMO_LINKS : CLIENT_LINKS;
  const location = useLocation();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 8, 
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <LayoutDashboard size={18} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Embark</h1>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose} 
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}
          className="md-hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {links.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
          return (
            <NavLink 
              key={link.to} 
              to={link.to} 
              onClick={onClose}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button 
          onClick={() => { logout(); onClose(); }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '1rem', 
            padding: '0.875rem 1.25rem', color: '#fca5a5', 
            background: 'rgba(239, 68, 68, 0.1)', border: 'none',
            borderRadius: 12, cursor: 'pointer', width: '100%',
            fontSize: '0.9375rem', fontWeight: 600
          }}
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
