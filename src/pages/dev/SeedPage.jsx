import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const daysFromNow = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); };
const dateOnly = iso => iso.split('T')[0];
const ds = d => d.toISOString().split('T')[0];
const jv = v => JSON.stringify(v);

const STAGE_GATES = {
  1: ['India Market Feasibility Report Submitted', 'Talent Availability & Cost Analysis Approved', 'Top 5 Target Cities Shortlisted'],
  2: ['City Comparison Matrix Completed', 'Cost-of-Operations & Real Estate Analysis Done', 'Talent Supply-Demand Assessment Approved'],
  3: ['GCC Operating Model Decided (Captive / BOT / Co-managed)', 'Implementation Partner Shortlisted & NDA Signed', 'Legal Entity Type Agreed (WOS / LLP / Branch Office)'],
  4: ['Office Floor Plan & Space Allocation Finalized', 'IT Network Architecture Blueprint Approved', 'HR Policy Framework v1 Submitted'],
  5: ['Office Fit-Out 60% Milestone Passed', 'IT Infrastructure Rack & Stack Completed', 'First Cohort of Employees Onboarded (50+)'],
  6: ['Final Site Walkthrough & Snagging List Closed', 'GCC Operations SOP Handover Package Signed', 'Post-Handover Review Meeting Completed with Client'],
};

// Creates or retrieves the Supabase Auth record for a demo user.
// Returns the auth user's UUID which satisfies the users.id FK constraint.
async function getOrCreateAuthUserId(email) {
  // Use a deterministic long password for the auth record (demo login bypasses this anyway)
  const pw = email.replace('@demo.com', '').replace(/[^a-zA-Z0-9]/g, '') + '_EmbarkGCC2025!';

  const { data: signUpData } = await supabase.auth.signUp({ email, password: pw });
  if (signUpData?.user?.id) {
    return signUpData.user.id;
  }

  // User already exists in auth — sign in to retrieve their ID
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pw });
  if (signInData?.user?.id) {
    return signInData.user.id;
  }

  throw new Error(
    `Auth setup failed for ${email}: ${signInErr?.message}. ` +
    `If re-seeding with email confirmation enabled, delete these 5 users in the Supabase Auth dashboard first, then re-run.`
  );
}

async function runSeed(log) {
  // ── AUTH USERS ─────────────────────────────────────────────────────────────
  log('Setting up Supabase Auth users (needed for FK constraint)...');
  const PMO_USER_ID         = await getOrCreateAuthUserId('pmo@demo.com');
  const PMO_USER_2_ID       = await getOrCreateAuthUserId('pmo2@demo.com');
  const JPMORGAN_CLIENT_ID  = await getOrCreateAuthUserId('client@demo.com');
  const GOLDMAN_CLIENT_ID   = await getOrCreateAuthUserId('client2@demo.com');
  const MICROSOFT_CLIENT_ID = await getOrCreateAuthUserId('client3@demo.com');
  log(`✅ Auth user IDs obtained`);

  // ── CLEAR ──────────────────────────────────────────────────────────────────
  log('Clearing existing data...');
  const clearOrder = ['audit_logs','notifications','attendance','safety_checklist_items','safety_checklists','escalation_comments','escalations','purchase_orders','vendor_compliance','vendors','budget','stage_gates','stages','milestones','projects','users'];
  for (const t of clearOrder) {
    await supabase.from(t).delete().not('id', 'is', null);
  }
  log('✅ Tables cleared');

  // ── USERS ──────────────────────────────────────────────────────────────────
  log('Inserting users...');
  const { error: uErr } = await supabase.from('users').upsert([
    { id: PMO_USER_ID,         name: 'Sarah Jenkins',  email: 'pmo@demo.com',     role: 'PMO',    phone: '+91-9876540001' },
    { id: PMO_USER_2_ID,       name: 'Rahul Sharma',   email: 'pmo2@demo.com',    role: 'PMO',    phone: '+91-9876540002' },
    { id: JPMORGAN_CLIENT_ID,  name: 'Michael Brown',  email: 'client@demo.com',  role: 'Client', phone: '+1-212-555-0182' },
    { id: GOLDMAN_CLIENT_ID,   name: 'David Kim',      email: 'client2@demo.com', role: 'Client', phone: '+1-212-555-0183' },
    { id: MICROSOFT_CLIENT_ID, name: 'Priya Mehta',    email: 'client3@demo.com', role: 'Client', phone: '+91-9876540003' },
  ], { onConflict: 'id' });
  if (uErr) throw new Error('Users: ' + uErr.message);
  log('✅ 5 users created');

  // ── PROJECTS ───────────────────────────────────────────────────────────────
  log('Inserting projects...');
  const { data: projects, error: pErr } = await supabase.from('projects').insert([
    { project_name: 'JPMorgan India GCC',          location: 'Bangalore', client_name: 'JPMorgan Chase',         current_stage: 3, stage_status: 'In Progress', total_budget: 80000000, actual_spent: 14500000, start_date: '2024-11-01', target_end_date: '2025-12-31', created_by: PMO_USER_ID   },
    { project_name: 'Goldman Sachs Tech Hub',       location: 'Hyderabad', client_name: 'Goldman Sachs',          current_stage: 5, stage_status: 'Blocked',     total_budget: 55000000, actual_spent: 48000000, start_date: '2024-06-01', target_end_date: '2025-07-31', created_by: PMO_USER_ID   },
    { project_name: 'Microsoft Innovation Centre',  location: 'Pune',      client_name: 'Microsoft Corporation',  current_stage: 1, stage_status: 'In Progress', total_budget: 45000000, actual_spent:   800000, start_date: '2025-03-01', target_end_date: '2026-06-30', created_by: PMO_USER_2_ID },
  ]).select();
  if (pErr) throw new Error('Projects: ' + pErr.message);
  const [jpmorgan, goldman, microsoft] = projects;
  log(`✅ 3 projects created (IDs: ${jpmorgan.id}, ${goldman.id}, ${microsoft.id})`);

  await supabase.from('users').update({ assigned_project_id: jpmorgan.id  }).eq('id', JPMORGAN_CLIENT_ID);
  await supabase.from('users').update({ assigned_project_id: goldman.id   }).eq('id', GOLDMAN_CLIENT_ID);
  await supabase.from('users').update({ assigned_project_id: microsoft.id }).eq('id', MICROSOFT_CLIENT_ID);
  log('✅ Clients assigned to their projects');

  // ── STAGES & GATES ─────────────────────────────────────────────────────────
  log('Inserting stages and gate checklists...');
  const stageNames = ['Discovery','Evaluation','Model Selection','Design & Planning','Construction & Execution','Handover & Post-Construction'];
  for (const project of projects) {
    for (let n = 1; n <= 6; n++) {
      let status = 'Not Started', pct = 0, startedAt = null, completedAt = null;
      if (n < project.current_stage) { status = 'Completed'; pct = 100; startedAt = daysAgo(120 - n * 18); completedAt = daysAgo(90 - n * 15); }
      else if (n === project.current_stage) { status = project.stage_status === 'Blocked' ? 'Blocked' : 'In Progress'; pct = project.stage_status === 'Blocked' ? 65 : 40; startedAt = daysAgo(30); }
      const { data: stage, error: sErr } = await supabase.from('stages').insert({ project_id: project.id, stage_number: n, stage_name: stageNames[n-1], status, completion_percentage: pct, started_at: startedAt, completed_at: completedAt }).select().single();
      if (sErr) { log('⚠️ Stage warn: ' + sErr.message); continue; }
      const gates = (STAGE_GATES[n] || []).map(item => ({ stage_id: stage.id, gate_item: item, is_required: true, is_completed: status === 'Completed', verified_by: status === 'Completed' ? PMO_USER_ID : null, verified_at: status === 'Completed' ? completedAt : null }));
      const { error: gErr } = await supabase.from('stage_gates').insert(gates);
      if (gErr) log('⚠️ Gates warn: ' + gErr.message);
    }
  }
  log('✅ 18 stages + 54 gates created');

  // ── MILESTONES ─────────────────────────────────────────────────────────────
  log('Inserting milestones...');
  const { error: mErr } = await supabase.from('milestones').insert([
    { project_id: jpmorgan.id,  milestone_name: 'India Feasibility Report',               due_date: dateOnly(daysAgo(80)),      status: 'Completed', owner_id: PMO_USER_ID,    priority: 'High'   },
    { project_id: jpmorgan.id,  milestone_name: 'Bangalore City Selection Approved',       due_date: dateOnly(daysAgo(50)),      status: 'Completed', owner_id: PMO_USER_ID,    priority: 'High'   },
    { project_id: jpmorgan.id,  milestone_name: 'BOT Partner RFQ Responses Received',     due_date: dateOnly(daysAgo(5)),       status: 'Overdue',   owner_id: PMO_USER_ID,    priority: 'High'   },
    { project_id: jpmorgan.id,  milestone_name: 'Legal Entity Incorporation Filing',       due_date: dateOnly(daysFromNow(20)),  status: 'Upcoming',  owner_id: PMO_USER_2_ID,  priority: 'High'   },
    { project_id: jpmorgan.id,  milestone_name: 'Office Location Shortlist (Top 3)',       due_date: dateOnly(daysFromNow(35)),  status: 'Upcoming',  owner_id: PMO_USER_2_ID,  priority: 'Medium' },
    { project_id: goldman.id,   milestone_name: 'Office Fit-Out Structural Work Complete', due_date: dateOnly(daysAgo(30)),      status: 'Completed', owner_id: PMO_USER_ID,    priority: 'High'   },
    { project_id: goldman.id,   milestone_name: 'IT Network Cabling & Rack Installation',  due_date: dateOnly(daysAgo(10)),      status: 'Overdue',   owner_id: PMO_USER_ID,    priority: 'High'   },
    { project_id: goldman.id,   milestone_name: 'First 100 Employees Onboarded',           due_date: dateOnly(daysFromNow(15)),  status: 'Upcoming',  owner_id: PMO_USER_2_ID,  priority: 'High'   },
    { project_id: goldman.id,   milestone_name: 'GCC Go-Live & Handover',                  due_date: dateOnly(daysFromNow(45)),  status: 'Upcoming',  owner_id: PMO_USER_ID,    priority: 'High'   },
    { project_id: microsoft.id, milestone_name: 'India GCC Entry Strategy Workshop',       due_date: dateOnly(daysFromNow(10)),  status: 'Upcoming',  owner_id: PMO_USER_2_ID,  priority: 'High'   },
    { project_id: microsoft.id, milestone_name: 'City Feasibility Report: Pune vs Hyderabad', due_date: dateOnly(daysFromNow(25)), status: 'Upcoming', owner_id: PMO_USER_2_ID,  priority: 'High'  },
  ]);
  if (mErr) log('⚠️ Milestones warn: ' + mErr.message);
  else log('✅ 11 milestones created');

  // ── VENDORS ────────────────────────────────────────────────────────────────
  log('Inserting vendors...');
  const { data: vendors, error: vErr } = await supabase.from('vendors').insert([
    { project_id: jpmorgan.id,  vendor_name: 'Prestige Constructions Pvt Ltd', vendor_type: 'Construction', contact_email: 'procurement@prestigeconstructions.in', contact_phone: '+91-80-4120-3344', status: 'Approved', onboarding_date: dateOnly(daysAgo(90)),  approved_by: PMO_USER_ID,   approved_at: daysAgo(90)  },
    { project_id: jpmorgan.id,  vendor_name: 'Khaitan & Co LLP',               vendor_type: 'Legal',        contact_email: 'bangalore@khaitanco.com',              contact_phone: '+91-80-4617-9600', status: 'Approved', onboarding_date: dateOnly(daysAgo(100)), approved_by: PMO_USER_ID,   approved_at: daysAgo(100) },
    { project_id: jpmorgan.id,  vendor_name: 'Aon Hewitt India',               vendor_type: 'HR',           contact_email: 'info.india@aon.com',                   contact_phone: '+91-80-4653-7700', status: 'Pending',  onboarding_date: null,                   approved_by: null,          approved_at: null         },
    { project_id: goldman.id,   vendor_name: 'L&T Construction India',          vendor_type: 'Construction', contact_email: 'hyderabad@lntecc.com',                 contact_phone: '+91-40-4030-5500', status: 'Approved', onboarding_date: dateOnly(daysAgo(150)), approved_by: PMO_USER_ID,   approved_at: daysAgo(150) },
    { project_id: goldman.id,   vendor_name: 'Cisco Systems India',             vendor_type: 'IT',           contact_email: 'procurement@cisco.com',                contact_phone: '+91-40-6700-1234', status: 'Approved', onboarding_date: dateOnly(daysAgo(120)), approved_by: PMO_USER_ID,   approved_at: daysAgo(120) },
    { project_id: goldman.id,   vendor_name: 'CBRE India Pvt Ltd',              vendor_type: 'Facilities',   contact_email: 'facilities.hyd@cbre.com',              contact_phone: '+91-40-6630-8800', status: 'Approved', onboarding_date: dateOnly(daysAgo(140)), approved_by: PMO_USER_ID,   approved_at: daysAgo(140) },
    { project_id: microsoft.id, vendor_name: 'JLL India Pvt Ltd',              vendor_type: 'Real Estate',  contact_email: 'pune@jll.com',                         contact_phone: '+91-20-4100-5500', status: 'Approved', onboarding_date: dateOnly(daysAgo(20)),  approved_by: PMO_USER_2_ID, approved_at: daysAgo(20)  },
  ]).select();
  if (vErr) throw new Error('Vendors: ' + vErr.message);
  const [prestige, khaitan, aon, lnt, cisco, cbre, jll] = vendors;
  log('✅ 7 vendors created');

  // ── COMPLIANCE DOCS ────────────────────────────────────────────────────────
  log('Inserting vendor compliance documents...');
  const today = new Date();
  const exp20   = new Date(today); exp20.setDate(today.getDate() + 20);
  const expPast = new Date(today); expPast.setDate(today.getDate() - 15);
  const val1yr  = new Date(today); val1yr.setFullYear(today.getFullYear() + 1);
  const val2yr  = new Date(today); val2yr.setFullYear(today.getFullYear() + 2);

  const { error: cErr } = await supabase.from('vendor_compliance').insert([
    { vendor_id: prestige.id, document_name: 'GST Registration Certificate',     document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(90)),  expiry_date: ds(val2yr),  status: 'Valid',         file_name: 'Prestige_GST.pdf',         uploaded_by: PMO_USER_ID   },
    { vendor_id: prestige.id, document_name: 'Contractor All-Risk Insurance',    document_type: 'Insurance',       upload_date: dateOnly(daysAgo(90)),  expiry_date: ds(val1yr),  status: 'Valid',         file_name: 'Prestige_Insurance.pdf',   uploaded_by: PMO_USER_ID   },
    { vendor_id: prestige.id, document_name: 'ISO 9001:2015 Certification',      document_type: 'Quality Cert',    upload_date: dateOnly(daysAgo(90)),  expiry_date: ds(exp20),   status: 'Expiring Soon', file_name: 'Prestige_ISO9001.pdf',     uploaded_by: PMO_USER_ID   },
    { vendor_id: khaitan.id,  document_name: 'GST Registration Certificate',     document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(100)), expiry_date: ds(val2yr),  status: 'Valid',         file_name: 'Khaitan_GST.pdf',          uploaded_by: PMO_USER_ID   },
    { vendor_id: khaitan.id,  document_name: 'Professional Indemnity Insurance', document_type: 'Insurance',       upload_date: dateOnly(daysAgo(100)), expiry_date: ds(val1yr),  status: 'Valid',         file_name: 'Khaitan_PI.pdf',           uploaded_by: PMO_USER_ID   },
    { vendor_id: aon.id,      document_name: 'GST Registration Certificate',     document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(400)), expiry_date: ds(expPast), status: 'Expired',       file_name: 'Aon_GST_EXPIRED.pdf',      uploaded_by: PMO_USER_ID   },
    { vendor_id: lnt.id,      document_name: 'GST Registration Certificate',     document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(150)), expiry_date: ds(val2yr),  status: 'Valid',         file_name: 'LnT_GST.pdf',              uploaded_by: PMO_USER_ID   },
    { vendor_id: lnt.id,      document_name: 'Workmen Compensation Insurance',   document_type: 'Insurance',       upload_date: dateOnly(daysAgo(150)), expiry_date: ds(val1yr),  status: 'Valid',         file_name: 'LnT_WC_Insurance.pdf',     uploaded_by: PMO_USER_ID   },
    { vendor_id: lnt.id,      document_name: 'ISO 14001 Environment Cert',       document_type: 'Quality Cert',    upload_date: dateOnly(daysAgo(150)), expiry_date: ds(val1yr),  status: 'Valid',         file_name: 'LnT_ISO14001.pdf',         uploaded_by: PMO_USER_ID   },
    { vendor_id: cisco.id,    document_name: 'GST Registration Certificate',     document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(120)), expiry_date: ds(val2yr),  status: 'Valid',         file_name: 'Cisco_GST.pdf',            uploaded_by: PMO_USER_ID   },
    { vendor_id: cisco.id,    document_name: 'Cyber Liability Insurance',        document_type: 'Insurance',       upload_date: dateOnly(daysAgo(120)), expiry_date: ds(val1yr),  status: 'Valid',         file_name: 'Cisco_Cyber.pdf',          uploaded_by: PMO_USER_ID   },
    { vendor_id: cbre.id,     document_name: 'GST Registration Certificate',     document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(140)), expiry_date: ds(val2yr),  status: 'Valid',         file_name: 'CBRE_GST.pdf',             uploaded_by: PMO_USER_ID   },
    { vendor_id: cbre.id,     document_name: 'Facility Management License',      document_type: 'Other',           upload_date: dateOnly(daysAgo(140)), expiry_date: ds(exp20),   status: 'Expiring Soon', file_name: 'CBRE_FM_License.pdf',      uploaded_by: PMO_USER_ID   },
    { vendor_id: jll.id,      document_name: 'GST Registration Certificate',     document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(20)),  expiry_date: ds(val2yr),  status: 'Valid',         file_name: 'JLL_GST.pdf',              uploaded_by: PMO_USER_2_ID },
    { vendor_id: jll.id,      document_name: 'RERA Registration Certificate',    document_type: 'Other',           upload_date: dateOnly(daysAgo(20)),  expiry_date: ds(val1yr),  status: 'Valid',         file_name: 'JLL_RERA.pdf',             uploaded_by: PMO_USER_2_ID },
  ]);
  if (cErr) log('⚠️ Compliance docs warn: ' + cErr.message);
  else log('✅ 15 compliance documents created');

  // ── BUDGET ─────────────────────────────────────────────────────────────────
  log('Inserting budget phases...');
  const { error: bErr } = await supabase.from('budget').insert([
    { project_id: jpmorgan.id,  phase: 'Discovery & Advisory',    planned_amount: 3000000,  actual_amount: 2800000  },
    { project_id: jpmorgan.id,  phase: 'Legal & Entity Setup',    planned_amount: 5000000,  actual_amount: 4200000  },
    { project_id: jpmorgan.id,  phase: 'Office Fit-Out & Civil',  planned_amount: 40000000, actual_amount: 0        },
    { project_id: jpmorgan.id,  phase: 'IT Infrastructure',       planned_amount: 20000000, actual_amount: 0        },
    { project_id: jpmorgan.id,  phase: 'HR, Talent & Onboarding', planned_amount: 12000000, actual_amount: 7500000  },
    { project_id: goldman.id,   phase: 'Discovery & Advisory',    planned_amount: 2000000,  actual_amount: 1950000  },
    { project_id: goldman.id,   phase: 'Legal & Entity Setup',    planned_amount: 3000000,  actual_amount: 3100000  },
    { project_id: goldman.id,   phase: 'Office Fit-Out & Civil',  planned_amount: 28000000, actual_amount: 28500000 },
    { project_id: goldman.id,   phase: 'IT Infrastructure',       planned_amount: 12000000, actual_amount: 14450000 },
    { project_id: goldman.id,   phase: 'HR, Talent & Onboarding', planned_amount: 10000000, actual_amount: 0        },
    { project_id: microsoft.id, phase: 'Discovery & Advisory',    planned_amount: 2500000,  actual_amount: 800000   },
    { project_id: microsoft.id, phase: 'Legal & Entity Setup',    planned_amount: 4000000,  actual_amount: 0        },
    { project_id: microsoft.id, phase: 'Office Fit-Out & Civil',  planned_amount: 22000000, actual_amount: 0        },
    { project_id: microsoft.id, phase: 'IT Infrastructure',       planned_amount: 10000000, actual_amount: 0        },
    { project_id: microsoft.id, phase: 'HR, Talent & Onboarding', planned_amount: 6500000,  actual_amount: 0        },
  ]);
  if (bErr) log('⚠️ Budget warn: ' + bErr.message);
  else log('✅ 15 budget phase rows created');

  // ── PURCHASE ORDERS ────────────────────────────────────────────────────────
  log('Inserting purchase orders...');
  const slaBreach = new Date(); slaBreach.setHours(slaBreach.getHours() - 72);
  const { data: pos, error: poErr } = await supabase.from('purchase_orders').insert([
    { project_id: jpmorgan.id,  vendor_id: khaitan.id,  po_number: 'PO-2025-001', amount: 4200000,  description: 'WOS incorporation, ROC filing, regulatory advisory — JPMorgan India GCC',               phase: 'Legal & Entity Setup',    status: 'Approved',         created_by: PMO_USER_ID,   approved_by: PMO_USER_ID,   approval_date: daysAgo(70),  sla_due_date: daysAgo(75)              },
    { project_id: jpmorgan.id,  vendor_id: prestige.id, po_number: 'PO-2025-002', amount: 2800000,  description: 'Pre-construction consultancy, site survey, feasibility and space planning',               phase: 'Discovery & Advisory',    status: 'Approved',         created_by: PMO_USER_ID,   approved_by: PMO_USER_ID,   approval_date: daysAgo(85),  sla_due_date: daysAgo(90)              },
    { project_id: jpmorgan.id,  vendor_id: aon.id,      po_number: 'PO-2025-003', amount: 1500000,  description: 'HR policy framework, compensation benchmarking, talent acquisition strategy',              phase: 'HR, Talent & Onboarding', status: 'Rejected',         created_by: PMO_USER_ID,   approved_by: PMO_USER_ID,   approval_date: daysAgo(20),  sla_due_date: daysAgo(22), rejection_reason: 'Vendor compliance documents expired. Aon Hewitt must renew GST certificate first.' },
    { project_id: goldman.id,   vendor_id: lnt.id,      po_number: 'PO-2025-004', amount: 28500000, description: 'Complete office fit-out and civil construction — Goldman Sachs Hyderabad, 45,000 sqft',    phase: 'Office Fit-Out & Civil',  status: 'Approved',         created_by: PMO_USER_ID,   approved_by: PMO_USER_ID,   approval_date: daysAgo(120), sla_due_date: daysAgo(125)             },
    { project_id: goldman.id,   vendor_id: cisco.id,    po_number: 'PO-2025-005', amount: 14450000, description: 'IT infrastructure: structured cabling, server racks, Cisco Catalyst switch stack, Meraki', phase: 'IT Infrastructure',       status: 'Pending Approval', created_by: PMO_USER_ID,   approved_by: null,          approval_date: null,         sla_due_date: slaBreach.toISOString() },
    { project_id: goldman.id,   vendor_id: cbre.id,     po_number: 'PO-2025-006', amount: 3600000,  description: '12-month facility management: housekeeping, security, cafeteria, maintenance',              phase: 'Discovery & Advisory',    status: 'Approved',         created_by: PMO_USER_ID,   approved_by: PMO_USER_2_ID, approval_date: daysAgo(100), sla_due_date: daysAgo(105)             },
    { project_id: microsoft.id, vendor_id: jll.id,      po_number: 'PO-2025-007', amount: 800000,   description: 'Pune market feasibility study, 3 office micro-market shortlisting — Microsoft',             phase: 'Discovery & Advisory',    status: 'Approved',         created_by: PMO_USER_2_ID, approved_by: PMO_USER_ID,   approval_date: daysAgo(18),  sla_due_date: daysAgo(20)              },
  ]).select();
  if (poErr) throw new Error('POs: ' + poErr.message);
  log('✅ 7 purchase orders created');

  // ── ESCALATIONS ────────────────────────────────────────────────────────────
  log('Inserting escalations...');
  const critSLA    = new Date(); critSLA.setHours(critSLA.getHours() - 2);
  const highBreach = new Date(); highBreach.setHours(highBreach.getHours() - 30);
  const medSLA     = new Date(); medSLA.setDate(medSLA.getDate() + 2);
  const lowSLA     = new Date(); lowSLA.setDate(lowSLA.getDate() + 4);

  const { data: escs, error: eErr } = await supabase.from('escalations').insert([
    { project_id: jpmorgan.id,  raised_by: JPMORGAN_CLIENT_ID,  title: 'Civil Fit-Out Behind Schedule — Risking Go-Live Date',      description: 'The office civil work is running 3 weeks behind the agreed Gantt plan. False ceiling and flooring on floors 2 and 3 are incomplete. At current pace we risk missing the December go-live date.',                                                                        severity: 'High',     status: 'In Progress', assigned_to: PMO_USER_ID,   sla_due_date: highBreach.toISOString(), created_at: daysAgo(2)  },
    { project_id: jpmorgan.id,  raised_by: PMO_USER_ID,          title: 'Aon Hewitt GST Certificate Expired — PO Blocked',          description: 'Aon Hewitt India GST registration expired 15 days ago. Cannot raise the HR advisory PO until renewed. Aon has been notified twice with no response. HR policy framework milestone is at risk.',                                                             severity: 'Medium',   status: 'Open',        assigned_to: PMO_USER_2_ID, sla_due_date: medSLA.toISOString(),     created_at: daysAgo(1)  },
    { project_id: goldman.id,   raised_by: GOLDMAN_CLIENT_ID,    title: 'IT Infrastructure Budget Overrun — Urgent Approval Needed', description: 'IT infrastructure phase exceeded approved budget by Rs 24.5 lakh (20.4% variance). Higher-spec firewalls required for Goldman InfoSec standards. PO-2025-005 pending for 3 days — SLA breached. Requesting urgent sign-off to unblock contractor.',   severity: 'Critical', status: 'In Progress', assigned_to: PMO_USER_ID,   sla_due_date: critSLA.toISOString(),    created_at: daysAgo(1)  },
    { project_id: goldman.id,   raised_by: PMO_USER_ID,          title: 'Safety Inspection Non-Compliance — Floor 1 Electrical',    description: 'Site inspection on Floor 1 flagged exposed electrical conduits near the server room entry. Non-compliance under IS:732 electrical safety standards. L&T site supervisor notified and remediation in progress.',                                                 severity: 'High',     status: 'Resolved',    assigned_to: PMO_USER_2_ID, sla_due_date: daysAgo(8),               resolved_at: daysAgo(6), created_at: daysAgo(10) },
    { project_id: microsoft.id, raised_by: MICROSOFT_CLIENT_ID,  title: 'Strategy Workshop Date Confirmation Needed',                description: 'The India GCC Entry Strategy Workshop is scheduled for next week but we have not received a calendar invite, venue, or attendee list. Our CHRO is travelling internationally after this week. Please confirm urgently.',                                   severity: 'Medium',   status: 'Open',        assigned_to: PMO_USER_2_ID, sla_due_date: lowSLA.toISOString(),     created_at: daysAgo(1)  },
  ]).select();
  if (eErr) throw new Error('Escalations: ' + eErr.message);
  const [esc1, esc2, esc3, esc4, esc5] = escs;
  log('✅ 5 escalations created');

  // ── ESCALATION COMMENTS ────────────────────────────────────────────────────
  log('Inserting escalation comments...');
  const { error: cmtErr } = await supabase.from('escalation_comments').insert([
    { escalation_id: esc1.id, comment_by: JPMORGAN_CLIENT_ID, comment_text: 'This is becoming a serious concern. Our CHRO is tracking the go-live date closely. Can Embark confirm a recovery plan by EOD tomorrow?', is_internal: false, created_at: daysAgo(2) },
    { escalation_id: esc1.id, comment_by: PMO_USER_ID,        comment_text: 'Acknowledged, Michael. I have called an urgent site meeting with Prestige Constructions for tomorrow 9 AM. Recovery plan and revised Gantt by 5 PM.', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc1.id, comment_by: PMO_USER_ID,        comment_text: '[Internal] Prestige site manager mentioned they are short on tiling workers. May need a second sub-contractor. Need director approval if cost impact > Rs 5L.', is_internal: true, created_at: daysAgo(1) },
    { escalation_id: esc1.id, comment_by: JPMORGAN_CLIENT_ID, comment_text: 'Thank you Sarah. Please also include an impact assessment on the IT installation schedule — if civil is delayed, Cisco cannot begin rack work either.', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc2.id, comment_by: PMO_USER_ID,        comment_text: 'Sent formal notice to Aon Hewitt procurement on 2 May. Awaiting renewal confirmation. Will follow up by phone tomorrow.', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc2.id, comment_by: PMO_USER_2_ID,      comment_text: 'Called Aon Hewitt account manager. GST renewal is in process — document expected by end of week. Will update once received.', is_internal: false, created_at: daysAgo(0) },
    { escalation_id: esc3.id, comment_by: GOLDMAN_CLIENT_ID,  comment_text: 'We understand the InfoSec requirement but a 20% variance needs CFO sign-off on our end. Can Embark share the technical justification to fast-track internal approval?', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc3.id, comment_by: PMO_USER_ID,        comment_text: 'Sharing Cisco technical spec sheet and budget variance breakdown. The Firepower 2100 series was mandated by Goldman InfoSec during the last audit. Happy to schedule a call if helpful.', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc3.id, comment_by: PMO_USER_ID,        comment_text: '[Internal] If client does not approve by end of day, PO SLA hits at 6 PM. Loop in director for priority escalation path.', is_internal: true, created_at: daysAgo(1) },
    { escalation_id: esc4.id, comment_by: PMO_USER_2_ID,      comment_text: 'L&T site engineer confirmed remediation complete. All exposed conduits enclosed per IS:732. Re-inspection passed. Closing this escalation.', is_internal: false, created_at: daysAgo(6) },
    { escalation_id: esc5.id, comment_by: PMO_USER_2_ID,      comment_text: 'Priya, apologies for the delay. Workshop confirmed for Thursday 10 AM at JW Marriott Pune. Calendar invite with agenda going out within the hour.', is_internal: false, created_at: daysAgo(0) },
  ]);
  if (cmtErr) log('⚠️ Comments warn: ' + cmtErr.message);
  else log('✅ 11 escalation comments created');

  // ── SAFETY CHECKLISTS ──────────────────────────────────────────────────────
  log('Inserting safety checklists...');
  const { data: cls, error: sclErr } = await supabase.from('safety_checklists').insert([
    { project_id: goldman.id, inspection_date: dateOnly(daysAgo(10)), inspector_name: 'Rajesh Kumar (L&T Safety Officer)', overall_status: 'Non-Compliant', created_by: PMO_USER_ID },
    { project_id: goldman.id, inspection_date: dateOnly(daysAgo(3)),  inspector_name: 'Sarah Jenkins (Embark PMO)',         overall_status: 'Completed',     created_by: PMO_USER_ID },
  ]).select();
  if (!sclErr && cls) {
    const [cl1, cl2] = cls;
    await supabase.from('safety_checklist_items').insert([
      { checklist_id: cl1.id, item_name: 'Fire exits clearly marked and unobstructed',   is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'PPE available and in use on site',              is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Emergency contact numbers posted',              is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Electrical panel and conduits safely enclosed', is_compliant: false, notes: 'Exposed conduits near server room entry on Floor 1. Non-compliant per IS:732.',   checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'First aid kit stocked and accessible',          is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Hazardous material areas marked',               is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Contractor site induction records up to date',  is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Fire exits clearly marked and unobstructed',    is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'PPE available and in use on site',              is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Emergency contact numbers posted',              is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Electrical panel and conduits safely enclosed', is_compliant: true,  notes: 'Remediation complete. All conduits enclosed. Verified with L&T site engineer.',  checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'First aid kit stocked and accessible',          is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Hazardous material areas marked',               is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Contractor site induction records up to date',  is_compliant: true,  notes: null,                                                                              checked_by: PMO_USER_ID },
    ]);
    log('✅ 2 safety checklists + 14 items created');
  } else if (sclErr) log('⚠️ Safety warn: ' + sclErr.message);

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  log('Inserting notifications...');
  const { error: nErr } = await supabase.from('notifications').insert([
    { user_id: JPMORGAN_CLIENT_ID,  notification_type: 'Escalation Update', message: 'Sarah Jenkins replied on: "Civil Fit-Out Behind Schedule" — recovery plan attached',              related_entity_type: 'Escalation', related_entity_id: esc1.id,     is_read: false, created_at: daysAgo(1)  },
    { user_id: JPMORGAN_CLIENT_ID,  notification_type: 'SLA Alert',         message: 'SLA BREACHED: "Civil Fit-Out Behind Schedule" — overdue by 6 hours',                              related_entity_type: 'Escalation', related_entity_id: esc1.id,     is_read: false, created_at: daysAgo(1)  },
    { user_id: JPMORGAN_CLIENT_ID,  notification_type: 'Stage Update',      message: 'JPMorgan India GCC has advanced to Stage 3: Model Selection',                                      related_entity_type: 'Project',    related_entity_id: jpmorgan.id,  is_read: true,  created_at: daysAgo(30) },
    { user_id: JPMORGAN_CLIENT_ID,  notification_type: 'PO Update',         message: 'PO-2025-001 (Khaitan & Co, Rs 42L) has been approved',                                            related_entity_type: 'Project',    related_entity_id: jpmorgan.id,  is_read: true,  created_at: daysAgo(70) },
    { user_id: GOLDMAN_CLIENT_ID,   notification_type: 'Escalation Update', message: 'Sarah Jenkins replied on: "IT Infrastructure Budget Overrun" — Cisco technical spec shared',      related_entity_type: 'Escalation', related_entity_id: esc3.id,     is_read: false, created_at: daysAgo(1)  },
    { user_id: GOLDMAN_CLIENT_ID,   notification_type: 'SLA Alert',         message: 'CRITICAL SLA: "IT Infrastructure Budget Overrun" — approaching breach, action needed',            related_entity_type: 'Escalation', related_entity_id: esc3.id,     is_read: false, created_at: daysAgo(1)  },
    { user_id: GOLDMAN_CLIENT_ID,   notification_type: 'Milestone Alert',   message: 'Milestone OVERDUE: "IT Network Cabling & Rack Installation" — blocking go-live',                  related_entity_type: 'Project',    related_entity_id: goldman.id,   is_read: false, created_at: daysAgo(2)  },
    { user_id: GOLDMAN_CLIENT_ID,   notification_type: 'Stage Update',      message: 'Goldman Sachs Tech Hub has advanced to Stage 5: Construction & Execution',                         related_entity_type: 'Project',    related_entity_id: goldman.id,   is_read: true,  created_at: daysAgo(30) },
    { user_id: MICROSOFT_CLIENT_ID, notification_type: 'Escalation Update', message: 'Rahul Sharma replied on: "Strategy Workshop Date Confirmation" — calendar invite sent',            related_entity_type: 'Escalation', related_entity_id: esc5.id,     is_read: false, created_at: daysAgo(0)  },
    { user_id: MICROSOFT_CLIENT_ID, notification_type: 'Stage Update',      message: 'Microsoft Innovation Centre has entered Stage 1: Discovery — your GCC setup journey begins',       related_entity_type: 'Project',    related_entity_id: microsoft.id, is_read: true,  created_at: daysAgo(10) },
    { user_id: MICROSOFT_CLIENT_ID, notification_type: 'Vendor Update',     message: 'JLL India Pvt Ltd has been approved as your Real Estate partner',                                  related_entity_type: 'Project',    related_entity_id: microsoft.id, is_read: true,  created_at: daysAgo(18) },
    { user_id: PMO_USER_ID,         notification_type: 'Escalation',        message: 'David Kim raised a Critical escalation: "IT Infrastructure Budget Overrun" — Goldman Sachs',      related_entity_type: 'Escalation', related_entity_id: esc3.id,     is_read: false, created_at: daysAgo(1)  },
    { user_id: PMO_USER_ID,         notification_type: 'Escalation',        message: 'Michael Brown raised a High escalation: "Civil Fit-Out Behind Schedule" — JPMorgan India GCC',   related_entity_type: 'Escalation', related_entity_id: esc1.id,     is_read: false, created_at: daysAgo(2)  },
    { user_id: PMO_USER_ID,         notification_type: 'Compliance Alert',  message: 'Aon Hewitt India — GST Certificate EXPIRED. Vendor blocked from PO issuance.',                   related_entity_type: 'Vendor',     related_entity_id: aon.id,      is_read: false, created_at: daysAgo(1)  },
    { user_id: PMO_USER_ID,         notification_type: 'Compliance Alert',  message: 'Prestige Constructions — ISO 9001 Certificate expiring in 20 days. Renewal required.',           related_entity_type: 'Vendor',     related_entity_id: prestige.id,  is_read: false, created_at: daysAgo(1)  },
    { user_id: PMO_USER_ID,         notification_type: 'SLA Alert',         message: 'PO-2025-005 (Cisco, Rs 1.44 crore) approval SLA BREACHED — pending for 72 hours',                related_entity_type: 'Project',    related_entity_id: goldman.id,   is_read: false, created_at: daysAgo(1)  },
    { user_id: PMO_USER_2_ID,       notification_type: 'Escalation',        message: 'Assigned to you: "Aon Hewitt GST Certificate Expired" — JPMorgan India GCC',                     related_entity_type: 'Escalation', related_entity_id: esc2.id,     is_read: false, created_at: daysAgo(1)  },
    { user_id: PMO_USER_2_ID,       notification_type: 'Escalation',        message: 'Assigned to you: "Strategy Workshop Date Confirmation" — Microsoft Innovation Centre',            related_entity_type: 'Escalation', related_entity_id: esc5.id,     is_read: false, created_at: daysAgo(1)  },
    { user_id: PMO_USER_2_ID,       notification_type: 'Milestone',         message: 'Milestone due in 10 days: "India GCC Entry Strategy Workshop" — Microsoft Innovation Centre',    related_entity_type: 'Project',    related_entity_id: microsoft.id, is_read: false, created_at: daysAgo(0)  },
  ]);
  if (nErr) log('⚠️ Notifications warn: ' + nErr.message);
  else log('✅ 19 notifications created');

  // ── AUDIT LOG ──────────────────────────────────────────────────────────────
  log('Inserting audit log...');
  const { error: aErr } = await supabase.from('audit_logs').insert([
    { user_id: PMO_USER_ID,         action: 'Created Project',     entity_type: 'Project',    entity_id: String(jpmorgan.id),  old_value: null,              new_value: jv('JPMorgan India GCC — Bangalore'),              created_at: daysAgo(100) },
    { user_id: PMO_USER_ID,         action: 'Advanced Stage',      entity_type: 'Stage',      entity_id: String(jpmorgan.id),  old_value: jv('Discovery'),   new_value: jv('Evaluation'),                                  created_at: daysAgo(80)  },
    { user_id: PMO_USER_ID,         action: 'Advanced Stage',      entity_type: 'Stage',      entity_id: String(jpmorgan.id),  old_value: jv('Evaluation'),  new_value: jv('Model Selection'),                             created_at: daysAgo(45)  },
    { user_id: PMO_USER_ID,         action: 'Approved Vendor',     entity_type: 'Vendor',     entity_id: String(prestige.id),  old_value: null,              new_value: jv('Prestige Constructions — Approved'),           created_at: daysAgo(90)  },
    { user_id: PMO_USER_ID,         action: 'Approved PO',         entity_type: 'PO',         entity_id: String(pos[0].id),    old_value: null,              new_value: jv('PO-2025-001 Rs 42L — Approved'),               created_at: daysAgo(70)  },
    { user_id: PMO_USER_ID,         action: 'Rejected PO',         entity_type: 'PO',         entity_id: String(pos[2].id),    old_value: null,              new_value: jv('PO-2025-003 — Rejected: vendor compliance expired'), created_at: daysAgo(20) },
    { user_id: PMO_USER_ID,         action: 'Created Project',     entity_type: 'Project',    entity_id: String(goldman.id),   old_value: null,              new_value: jv('Goldman Sachs Tech Hub — Hyderabad'),          created_at: daysAgo(180) },
    { user_id: PMO_USER_2_ID,       action: 'Created Project',     entity_type: 'Project',    entity_id: String(microsoft.id), old_value: null,              new_value: jv('Microsoft Innovation Centre — Pune'),          created_at: daysAgo(10)  },
    { user_id: JPMORGAN_CLIENT_ID,  action: 'Raised Escalation',   entity_type: 'Escalation', entity_id: String(esc1.id),      old_value: null,              new_value: jv('High: Civil Fit-Out Behind Schedule'),         created_at: daysAgo(2)   },
    { user_id: GOLDMAN_CLIENT_ID,   action: 'Raised Escalation',   entity_type: 'Escalation', entity_id: String(esc3.id),      old_value: null,              new_value: jv('Critical: IT Infrastructure Budget Overrun'),  created_at: daysAgo(1)   },
    { user_id: PMO_USER_2_ID,       action: 'Resolved Escalation', entity_type: 'Escalation', entity_id: String(esc4.id),      old_value: jv('In Progress'), new_value: jv('Resolved: Safety Non-Compliance Floor 1'),     created_at: daysAgo(6)   },
    { user_id: PMO_USER_2_ID,       action: 'Approved Vendor',     entity_type: 'Vendor',     entity_id: String(jll.id),       old_value: null,              new_value: jv('JLL India Pvt Ltd — Approved'),                created_at: daysAgo(18)  },
  ]);
  if (aErr) log('⚠️ Audit log warn: ' + aErr.message);
  else log('✅ 12 audit log entries created');

  // Sign out to leave browser in a clean state
  await supabase.auth.signOut();

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('Seed complete! Login credentials:');
  log('  PMO:    pmo@demo.com  / pmo');
  log('  PMO2:   pmo2@demo.com / pmo2');
  log('  Client: client@demo.com  / client  → JPMorgan');
  log('  Client: client2@demo.com / client2 → Goldman Sachs');
  log('  Client: client3@demo.com / client3 → Microsoft');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

export default function SeedPage() {
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);

  const log = msg => setLogs(prev => [...prev, msg]);

  const handleRun = async () => {
    setStatus('running');
    setLogs([]);
    try {
      await runSeed(log);
      setStatus('done');
    } catch (err) {
      log('❌ ERROR: ' + err.message);
      setStatus('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 680, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
            Embark — Database Seed
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9375rem' }}>
            Clears all tables and populates fresh demo data for all 5 users across 3 GCC projects.
          </p>
        </div>

        <div style={{ background: '#1e293b', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'PMO Users', value: '2', sub: 'Sarah, Rahul' },
              { label: 'Client Users', value: '3', sub: 'Michael, David, Priya' },
              { label: 'GCC Projects', value: '3', sub: 'JPM · GS · MSFT' },
            ].map(c => (
              <div key={c.label} style={{ background: '#0f172a', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1' }}>{c.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 700, marginTop: 2 }}>{c.label}</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 2 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleRun}
            disabled={status === 'running'}
            style={{
              width: '100%', padding: '1rem', borderRadius: 12, border: 'none',
              background: status === 'running' ? '#334155' : status === 'done' ? '#10b981' : '#6366f1',
              color: 'white', fontSize: '1rem', fontWeight: 700, cursor: status === 'running' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'idle'    ? '▶ Run Seed — Clear & Re-populate All Tables' :
             status === 'running' ? '⏳ Seeding in progress...' :
             status === 'done'    ? '✅ Seed Complete — Go to Login (/ or refresh)' :
                                    '❌ Error — Check logs below and retry'}
          </button>

          {status === 'done' && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              {[['pmo@demo.com','pmo'],['pmo2@demo.com','pmo2'],['client@demo.com','client'],['client2@demo.com','client2'],['client3@demo.com','client3']].map(([e, p]) => (
                <div key={e} style={{ flex: 1, background: '#0f172a', borderRadius: 8, padding: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{e}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 700 }}>{p}</div>
                </div>
              ))}
            </div>
          )}

          {status === 'error' && (
            <div style={{ marginTop: '1rem', background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '0.75rem', fontSize: '0.8125rem', color: '#fca5a5' }}>
              <strong>Re-seeding tip:</strong> If the error mentions auth users already exist, go to your{' '}
              <strong>Supabase dashboard → Authentication → Users</strong> and delete the 5 demo users, then run again.
              Or disable email confirmation in <strong>Auth → Email → Confirm email</strong>.
            </div>
          )}
        </div>

        {logs.length > 0 && (
          <div style={{ background: '#0f172a', borderRadius: 12, padding: '1.25rem', fontFamily: 'monospace', fontSize: '0.8125rem', color: '#94a3b8', maxHeight: 400, overflowY: 'auto', border: '1px solid #1e293b' }}>
            {logs.map((l, i) => (
              <div key={i} style={{ color: l.startsWith('✅') ? '#10b981' : l.startsWith('⚠️') ? '#f59e0b' : l.startsWith('❌') ? '#ef4444' : l.startsWith('━') ? '#475569' : '#94a3b8', marginBottom: 2 }}>
                {l}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
