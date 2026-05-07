import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { LOCATIONS, STAGE_NAMES } from '../../lib/utils';
import { ArrowLeft, Rocket, Shield, Landmark, Settings, ChevronRight, Check } from 'lucide-react';

export default function CreateProject() {
  const store = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ 
    project_name: '', 
    client_name: '', 
    location: 'Bangalore', 
    total_budget: '', 
    start_date: '', 
    target_end_date: '',
    template: 'Strategic Hub'
  });

  const templates = [
    { id: 'Accelerated', name: 'Accelerated Setup', icon: Rocket, duration: '12 Weeks', desc: 'Optimized for 50-100 seats, pre-built vendor ecosystem.' },
    { id: 'Strategic Hub', name: 'Strategic Mandate', icon: Shield, duration: '24 Weeks', desc: 'Standard GCC model with full legal & entity compliance.' },
    { id: 'Enterprise', name: 'Enterprise Mandate', icon: Landmark, duration: '48 Weeks', desc: 'Large scale (500+ seats), custom construction & IT.' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const project = await store.insert('projects', {
      ...form, 
      total_budget: Number(form.total_budget), 
      actual_spent: 0,
      current_stage: 1, 
      status: 'Active', 
      created_by: currentUser.id,
    });

    const DEFAULT_GATES = {
      1: ['Feasibility Report Submitted', 'Budget Estimate Approved', 'City Shortlist Finalized'],
      2: ['City Comparison Report Done', 'Cost Analysis Complete', 'Talent Assessment Done'],
      3: ['BOT Partner Shortlisted', 'Legal Framework Agreed', 'Vendor List Approved'],
      4: ['Office Layout Finalized', 'IT Architecture Approved', 'HR Plan Submitted'],
      5: ['Construction 50% Complete', 'IT Infrastructure Installed', 'Safety Inspection Passed'],
      6: ['Final Walkthrough Done', 'Handover Documents Signed', 'Post-Construction Review'],
    };

    for (let i = 1; i <= 6; i++) {
      const stage = await store.insert('stages', {
        project_id: project.id, 
        stage_number: i, 
        status: i === 1 ? 'In Progress' : 'Not Started', 
        completion_percentage: 0,
      });
      for (const gate of DEFAULT_GATES[i]) {
        await store.insert('stage_gates', { 
          stage_id: stage.id, 
          gate_item: gate, 
          is_required: true, 
          is_completed: false 
        });
      }
    }

    const phases = ['Discovery & Evaluation', 'Design & Planning', 'Construction & Fit-Out', 'IT Infrastructure', 'HR & Legal Setup'];
    for (const phase of phases) {
      await store.insert('budget', { 
        project_id: project.id, 
        phase, 
        planned_amount: Number(form.total_budget) / phases.length, 
        actual_amount: 0 
      });
    }

    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="fade-in">
      <button className="btn btn-ghost" onClick={() => navigate('/projects')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to List
      </button>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="card" style={{ padding: '3rem' }}>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', 
                  background: step >= s ? 'var(--brand-primary)' : '#f1f5f9',
                  color: step >= s ? 'white' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem'
                }}>
                  {step > s ? <Check size={16} /> : s}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: step >= s ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {s === 1 ? 'Framework' : s === 2 ? 'Details' : 'Timeline'}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="fade-in">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Select GCC Framework</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Choose a methodology template for your setup mandate.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {templates.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => setForm({ ...form, template: t.id })}
                      style={{ 
                        display: 'flex', gap: '1.5rem', padding: '1.5rem', borderRadius: 16, cursor: 'pointer',
                        border: `2px solid ${form.template === t.id ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                        background: form.template === t.id ? '#f8faff' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: form.template === t.id ? 'var(--brand-primary)' : '#f1f5f9', color: form.template === t.id ? 'white' : 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <t.icon size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem' }}>{t.name}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{t.duration}</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="fade-in">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Core Mandate Details</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="label">Project Name *</label>
                    <input className="input-field" required value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} placeholder="e.g. JPMorgan India GCC" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">Client Name *</label>
                      <input className="input-field" required value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Company name" />
                    </div>
                    <div className="form-group">
                      <label className="label">Location *</label>
                      <select className="select-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>
                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Total CapEx Budget (INR) *</label>
                    <input className="input-field" type="number" required min="0" value={form.total_budget} onChange={e => setForm({ ...form, total_budget: e.target.value })} placeholder="e.g. 50000000" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="fade-in">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Timeline Orchestration</h2>
                <div className="grid-stack grid-2">
                  <div className="form-group">
                    <label className="label">Mandate Kickoff *</label>
                    <input className="input-field" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="label">Target Go-Live *</label>
                    <input className="input-field" type="date" required value={form.target_end_date} onChange={e => setForm({ ...form, target_end_date: e.target.value })} />
                  </div>
                </div>
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8faff', borderRadius: 16, border: '1px solid #eef2ff' }}>
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <Settings size={20} color="var(--brand-primary)" />
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <strong>Automated Setup:</strong> This will create 6 stages, 18 mandatory gates, and 5 budget workstreams based on the <strong>{form.template}</strong> playbook.
                      </div>
                   </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
              {step > 1 ? (
                <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>
              ) : <div />}
              
              {step < 3 ? (
                <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
                  Continue <ChevronRight size={18} />
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>
                   Initiate GCC Mandate
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
