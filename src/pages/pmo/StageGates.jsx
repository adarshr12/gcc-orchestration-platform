import { useParams, useNavigate } from 'react-router-dom';
import { useStore, useStoreData } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle2, Circle, ArrowRight, FileText, Upload, ShieldCheck, Info } from 'lucide-react';
import { STAGE_NAMES } from '../../lib/utils';

export default function StageGates() {
  const { id, stageId } = useParams();
  const store = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const stage = store.getById('stages', Number(stageId));
  const gates = useStoreData('stage_gates', g => g.stage_id === Number(stageId));
  const project = store.getById('projects', Number(id));
  const allStages = useStoreData('stages', s => s.project_id === Number(id)).sort((a, b) => a.stage_number - b.stage_number);

  if (!stage || !project) return <div className="empty-state">Verification Stage not found</div>;

  const completedCount = gates.filter(g => g.is_completed).length;
  const requiredCount = gates.filter(g => g.is_required).length;
  const requiredCompleted = gates.filter(g => g.is_required && g.is_completed).length;
  const allRequiredDone = requiredCompleted === requiredCount;
  const progressPct = gates.length > 0 ? Math.round((completedCount / gates.length) * 100) : 0;

  const toggleGate = async (gateId, isCompleted) => {
    await store.update('stage_gates', gateId, {
      is_completed: !isCompleted,
      verified_by: !isCompleted ? currentUser.id : null,
      verified_at: !isCompleted ? new Date().toISOString() : null,
    });
  };

  const approveAndAdvance = async () => {
    if (!allRequiredDone) return;

    // Complete current stage
    await store.update('stages', stage.id, { 
      status: 'Completed', 
      completion_percentage: 100, 
      completed_at: new Date().toISOString() 
    });

    // Find and activate next stage
    const nextStage = allStages.find(s => s.stage_number === stage.stage_number + 1);
    if (nextStage) {
      await store.update('stages', nextStage.id, { 
        status: 'In Progress', 
        started_at: new Date().toISOString() 
      });
      await store.update('projects', project.id, { 
        current_stage: nextStage.stage_number, 
        status: 'In Progress' 
      });

      // Notify relevant stakeholders
      await store.addNotification(project.client_id, 'Stage Advancement', `Your project has progressed to: ${STAGE_NAMES[nextStage.stage_number - 1]}`, 'project', project.id);
      await store.addAuditLog(currentUser.id, `Advanced Stage to ${nextStage.stage_number}`, 'project', project.id);
    } else {
      // Last stage complete
      await store.update('projects', project.id, { status: 'Completed' });
    }

    navigate(`/projects/${id}`);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate(`/projects/${id}`)}>
          <ArrowLeft size={16} /> Back to Project Center
        </button>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
           <span className="badge badge-blue">Audit Trail: Active</span>
        </div>
      </div>

      <div className="grid-stack grid-2" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
        {/* Main Checklist */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Stage {stage.stage_number} Verification</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {STAGE_NAMES[stage.stage_number - 1]} · {project.project_name}
              </p>
            </div>
            <span className={`badge ${stage.status === 'Completed' ? 'badge-success' : 'badge-blue'}`}>{stage.status}</span>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Gate Compliance</span>
              <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>{progressPct}% Verified</span>
            </div>
            <div style={{ height: 10, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--brand-primary)', borderRadius: 100, transition: 'width 0.6s ease' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {gates.map(gate => {
              const verifiedBy = store.getById('users', gate.verified_by);
              return (
                <div key={gate.id} style={{ 
                  display: 'flex', 
                  gap: '1.25rem', 
                  padding: '1.25rem', 
                  borderRadius: 16, 
                  background: gate.is_completed ? '#f0fdf4' : 'white', 
                  border: `1px solid ${gate.is_completed ? '#bbf7d0' : 'var(--border-subtle)'}`,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ cursor: 'pointer' }} onClick={() => stage.status !== 'Completed' && toggleGate(gate.id, gate.is_completed)}>
                    {gate.is_completed ? <CheckCircle2 size={24} color="#10b981" /> : <Circle size={24} color="#cbd5e1" />}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: gate.is_completed ? '#166534' : 'var(--text-primary)' }}>{gate.gate_item}</div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: 8 }}>
                          <span style={{ fontSize: '0.6875rem', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                            <FileText size={12} /> Verifiable Artifact Required
                          </span>
                          {gate.is_required && (
                            <span style={{ fontSize: '0.6875rem', color: '#ef4444', fontWeight: 700 }}>CRITICAL GATE</span>
                          )}
                        </div>
                      </div>
                      
                      {!gate.is_completed && (
                        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--border-subtle)' }}>
                          <Upload size={14} /> Upload Evidence
                        </button>
                      )}
                    </div>
                    
                    {gate.is_completed && (
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #bbf7d0', fontSize: '0.75rem', color: '#166534', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Verified by {verifiedBy?.name || 'System Auditor'}</span>
                        <span>{new Date(gate.verified_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Audit Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                 <span>Required Gates</span>
                 <span style={{ fontWeight: 700 }}>{requiredCompleted} / {requiredCount}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                 <span>Optional Gates</span>
                 <span style={{ fontWeight: 700 }}>{completedCount - requiredCompleted}</span>
               </div>
               
               <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                 <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                   <Info size={16} style={{ flexShrink: 0 }} />
                   <p style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                     All <strong>Critical Gates</strong> must be verified with uploaded artifacts before the PMO can advance the GCC mandate to the next phase.
                   </p>
                 </div>
               </div>
            </div>

            {stage.status !== 'Completed' && (
              <div style={{ marginTop: '2rem' }}>
                <button 
                  className="btn btn-primary" 
                  disabled={!allRequiredDone} 
                  onClick={approveAndAdvance}
                  style={{ width: '100%', padding: '1rem' }}
                >
                  <ShieldCheck size={18} /> Approve Stage Advance <ArrowRight size={18} />
                </button>
                {!allRequiredDone && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center', marginTop: 12, fontWeight: 600 }}>
                    {requiredCount - requiredCompleted} Critical Gates Remaining
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Recent Evidence</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={16} color="var(--brand-primary)" />
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Entity_Incorporation_Cert.pdf</div>
              </div>
              <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={16} color="var(--brand-primary)" />
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Signed_MOU_Bangalore.pdf</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
