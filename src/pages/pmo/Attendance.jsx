import { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../lib/store';
import { UserCheck, UserX, Plus, Trash2, CalendarDays, Users, TrendingUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const WORKER_ROLES = ['Construction Lead', 'Site Engineer', 'Electrician', 'Plumber', 'Civil Worker', 'IT Technician', 'Safety Officer', 'Facility Manager', 'Project Coordinator', 'Other'];

export default function Attendance() {
  const { currentUser } = useAuth();
  const { data } = useStore();
  const projects = data.projects || [];

  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceRows, setAttendanceRows] = useState([
    { id: 1, worker_name: '', role: 'Construction Lead', status: 'present', notes: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [savedRecords, setSavedRecords] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const addRow = () => {
    setAttendanceRows(prev => [
      ...prev,
      { id: Date.now(), worker_name: '', role: 'Construction Lead', status: 'present', notes: '' }
    ]);
  };

  const removeRow = (id) => {
    if (attendanceRows.length === 1) return;
    setAttendanceRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setAttendanceRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const presentCount = attendanceRows.filter(r => r.status === 'present').length;
  const absentCount = attendanceRows.filter(r => r.status === 'absent').length;
  const attendancePct = attendanceRows.length > 0 ? Math.round((presentCount / attendanceRows.length) * 100) : 0;

  const handleSave = async () => {
    if (!selectedProject) {
      alert('Please select a project first.');
      return;
    }
    const invalid = attendanceRows.filter(r => !r.worker_name.trim());
    if (invalid.length > 0) {
      alert('Please fill in all worker names before saving.');
      return;
    }

    setSaving(true);
    try {
      const records = attendanceRows.map(r => ({
        project_id: selectedProject,
        worker_name: r.worker_name.trim(),
        role: r.role,
        date: selectedDate,
        status: r.status,
        notes: r.notes.trim() || null,
        logged_by: currentUser?.id || null,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('attendance').insert(records);
      if (error) throw error;

      await store.addAuditLog(
        currentUser?.id,
        'Logged Attendance',
        'attendance',
        selectedProject,
        null,
        { workers: attendanceRows.length, date: selectedDate }
      );

      alert(`Attendance saved! ${presentCount} present, ${absentCount} absent.`);
      setAttendanceRows([{ id: 1, worker_name: '', role: 'Construction Lead', status: 'present', notes: '' }]);
    } catch (err) {
      console.error('Failed to save attendance:', err);
      alert('Failed to save attendance. Please check that the attendance table exists in your database.');
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedProject) return;
    setHistoryLoading(true);
    try {
      const { data: rows } = await supabase
        .from('attendance')
        .select('*')
        .eq('project_id', selectedProject)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      setSavedRecords(rows || []);
      setShowHistory(true);
    } catch {
      setSavedRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectedProjectName = projects.find(p => String(p.id) === String(selectedProject))?.project_name || '';

  const groupedHistory = savedRecords.reduce((acc, rec) => {
    if (!acc[rec.date]) acc[rec.date] = [];
    acc[rec.date].push(rec);
    return acc;
  }, {});

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
          Attendance Tracking
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
          Log daily workforce attendance per project — replaces manual registers and WhatsApp updates.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Project *
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); setShowHistory(false); }}
              style={{
                width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem',
                border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9375rem',
                background: '#fff', color: '#0f172a', appearance: 'none', cursor: 'pointer',
              }}
            >
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name} — {p.location}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Date *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            style={{
              width: '100%', padding: '0.75rem 1rem',
              border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: '0.9375rem', color: '#0f172a', background: '#fff',
            }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Workers', value: attendanceRows.length, icon: Users, color: '#6366f1', bg: '#ede9fe' },
          { label: 'Present', value: presentCount, icon: UserCheck, color: '#10b981', bg: '#d1fae5' },
          { label: 'Attendance Rate', value: `${attendancePct}%`, icon: TrendingUp, color: attendancePct >= 80 ? '#10b981' : attendancePct >= 60 ? '#f59e0b' : '#ef4444', bg: attendancePct >= 80 ? '#d1fae5' : attendancePct >= 60 ? '#fef3c7' : '#fee2e2' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <card.icon size={22} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            <CalendarDays size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: '#6366f1' }} />
            {selectedDate ? format(new Date(selectedDate + 'T00:00:00'), 'dd MMM yyyy') : 'Select a date'}
            {selectedProjectName && <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>— {selectedProjectName}</span>}
          </h2>
          <button
            onClick={addRow}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#6366f1', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.875rem',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Worker
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Worker Name', 'Role', 'Status', 'Notes', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((row, idx) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={row.worker_name}
                      onChange={e => updateRow(row.id, 'worker_name', e.target.value)}
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem',
                        border: '1.5px solid #e2e8f0', borderRadius: 8,
                        fontSize: '0.9rem', color: '#0f172a', minWidth: 160,
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select
                      value={row.role}
                      onChange={e => updateRow(row.id, 'role', e.target.value)}
                      style={{
                        padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0',
                        borderRadius: 8, fontSize: '0.875rem', color: '#0f172a',
                        background: '#fff', cursor: 'pointer', minWidth: 160,
                      }}
                    >
                      {WORKER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['present', 'absent'].map(s => (
                        <button
                          key={s}
                          onClick={() => updateRow(row.id, 'status', s)}
                          style={{
                            padding: '0.4rem 0.875rem',
                            borderRadius: 8,
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            border: '1.5px solid',
                            cursor: 'pointer',
                            background: row.status === s
                              ? (s === 'present' ? '#d1fae5' : '#fee2e2')
                              : '#f8fafc',
                            borderColor: row.status === s
                              ? (s === 'present' ? '#10b981' : '#ef4444')
                              : '#e2e8f0',
                            color: row.status === s
                              ? (s === 'present' ? '#065f46' : '#991b1b')
                              : '#94a3b8',
                          }}
                        >
                          {s === 'present' ? '✓ Present' : '✗ Absent'}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <input
                      type="text"
                      placeholder="Optional note..."
                      value={row.notes}
                      onChange={e => updateRow(row.id, 'notes', e.target.value)}
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem',
                        border: '1.5px solid #e2e8f0', borderRadius: 8,
                        fontSize: '0.875rem', color: '#0f172a', minWidth: 140,
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={attendanceRows.length === 1}
                      style={{
                        background: 'transparent', border: 'none', cursor: attendanceRows.length === 1 ? 'not-allowed' : 'pointer',
                        color: attendanceRows.length === 1 ? '#cbd5e1' : '#ef4444', padding: '0.25rem',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        {selectedProject && (
          <button
            onClick={loadHistory}
            disabled={historyLoading}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: 10,
              border: '1.5px solid #6366f1', background: '#fff',
              color: '#6366f1', fontWeight: 600, cursor: 'pointer', fontSize: '0.9375rem',
            }}
          >
            {historyLoading ? 'Loading...' : 'View History'}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !selectedProject}
          style={{
            padding: '0.75rem 2rem', borderRadius: 10,
            background: saving || !selectedProject ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', border: 'none', fontWeight: 700,
            cursor: saving || !selectedProject ? 'not-allowed' : 'pointer',
            fontSize: '0.9375rem',
          }}
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* History */}
      {showHistory && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Attendance History — {selectedProjectName}
            </h2>
          </div>
          {Object.keys(groupedHistory).length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              No attendance records found for this project.
            </div>
          ) : (
            Object.entries(groupedHistory).map(([date, records]) => {
              const pct = Math.round((records.filter(r => r.status === 'present').length / records.length) * 100);
              return (
                <div key={date} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                      {format(new Date(date + 'T00:00:00'), 'dd MMM yyyy, EEEE')}
                    </span>
                    <span style={{
                      fontSize: '0.8125rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: 20,
                      background: pct >= 80 ? '#d1fae5' : pct >= 60 ? '#fef3c7' : '#fee2e2',
                      color: pct >= 80 ? '#065f46' : pct >= 60 ? '#92400e' : '#991b1b',
                    }}>
                      {records.filter(r => r.status === 'present').length}/{records.length} present ({pct}%)
                    </span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {records.map(rec => (
                        <tr key={rec.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>{rec.worker_name}</td>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.8125rem', color: '#64748b' }}>{rec.role}</td>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            <span style={{
                              fontSize: '0.8125rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 20,
                              background: rec.status === 'present' ? '#d1fae5' : '#fee2e2',
                              color: rec.status === 'present' ? '#065f46' : '#991b1b',
                            }}>
                              {rec.status === 'present' ? '✓ Present' : '✗ Absent'}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem 1rem', fontSize: '0.8125rem', color: '#94a3b8' }}>{rec.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
