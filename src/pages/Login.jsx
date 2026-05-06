import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, TrendingUp, Users } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Client');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, { name, role });
        setSuccess('Verification Email Sent! Please check your inbox and confirm your email before signing in.');
        setIsSignUp(false);
        setPassword('');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: "'Inter', sans-serif",
      color: 'white'
    }}>
      {/* Left Side: Branding */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '4rem',
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 12, 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)'
          }}>
            <LayoutDashboard size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GCC Orchestrator
          </h1>
        </div>
        
        <h2 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Orchestrate your <br />
          <span style={{ color: '#3b82f6' }}>Global Capability Center</span> <br />
          with Precision.
        </h2>
        
        <p style={{ fontSize: '1.125rem', color: '#94a3b8', maxWidth: 480, lineHeight: 1.6, marginBottom: '3rem' }}>
          The enterprise-grade platform for tracking stages, managing vendors, and ensuring compliance across your global setup mandates.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ color: '#3b82f6' }}><ShieldCheck size={20} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Full Compliance</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>SLA-driven monitoring</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ color: '#3b82f6' }}><TrendingUp size={20} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Real-time KPIs</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Strategic SV & CPI tracking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div style={{ 
        width: 500, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ 
          width: '100%',
          maxWidth: 400,
          padding: '2.5rem', 
          background: 'rgba(255,255,255,0.03)', 
          backdropFilter: 'blur(20px)',
          borderRadius: 24, 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '2rem' }}>
            {isSignUp ? 'Start your GCC orchestration journey today.' : 'Sign in to manage your setup mandates.'}
          </p>

          {success && (
            <div style={{ 
              padding: '1.25rem', 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.2)', 
              borderRadius: 12, 
              color: '#60a5fa', 
              fontSize: '0.875rem', 
              textAlign: 'center',
              lineHeight: 1.5,
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', fontSize: '0.75rem' }}>Next Step: Verify Email</div>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Full Name</label>
                <input 
                  className="input-field login-input" 
                  placeholder="John Doe" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Email Address</label>
              <input 
                type="email" 
                className="input-field login-input" 
                placeholder="name@company.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Password</label>
              <input 
                type="password" 
                className="input-field login-input" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Your Persona</label>
                <select 
                  className="select-field login-input" 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="Client" style={{ background: '#0f172a' }}>Client (Project Visibility)</option>
                  <option value="PMO" style={{ background: '#0f172a' }}>PMO (Project Governance)</option>
                </select>
              </div>
            )}

            {error && <div style={{ color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem' }}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <button 
            className="btn btn-ghost" 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ width: '100%', marginTop: '1.5rem', fontSize: '0.875rem', color: '#94a3b8' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
