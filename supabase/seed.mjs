import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lmajrojnrnrwlerjxatk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYWpyb2pucm5yd2xlcmp4YXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQ1MjQsImV4cCI6MjA5MzU5MDUyNH0.JiWjd8_tmM5UmnugiBbZldWSgwGpsNE0PA8_QQYlhUc';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// ─── USER IDs (match AuthContext.jsx DEMO_USERS) ─────────────────────────────
const PMO_USER_ID    = 'ad68f966-c6cf-46fc-96d1-1c4e7b0dae48'; // Sarah Jenkins
const PMO_USER_2_ID  = 'cd68f966-c6cf-46fc-96d1-1c4e7b0dae50'; // Rahul Sharma
const JPMORGAN_CLIENT_ID  = 'bd68f966-c6cf-46fc-96d1-1c4e7b0dae49'; // Michael Brown
const GOLDMAN_CLIENT_ID   = 'dd68f966-c6cf-46fc-96d1-1c4e7b0dae51'; // David Kim
const MICROSOFT_CLIENT_ID = 'ed68f966-c6cf-46fc-96d1-1c4e7b0dae52'; // Priya Mehta

// GCC 6-stage gate checklist — actual deliverables Embark PMO verifies
const STAGE_GATES = {
  1: ['India Market Feasibility Report Submitted', 'Talent Availability & Cost Analysis Approved', 'Top 5 Target Cities Shortlisted'],
  2: ['City Comparison Matrix Completed (Bangalore / Hyderabad / Pune)', 'Cost-of-Operations & Real Estate Analysis Done', 'Talent Supply-Demand Assessment Approved'],
  3: ['GCC Operating Model Decided (Captive / BOT / Co-managed)', 'Implementation Partner Shortlisted & NDA Signed', 'Legal Entity Type Agreed (WOS / LLP / Branch Office)'],
  4: ['Office Floor Plan & Space Allocation Finalized', 'IT Network Architecture Blueprint Approved', 'HR Policy Framework v1 Submitted'],
  5: ['Office Fit-Out 60% Milestone Passed', 'IT Infrastructure Rack & Stack Completed', 'First Cohort of Employees Onboarded (≥50)'],
  6: ['Final Site Walkthrough & Snagging List Closed', 'GCC Operations SOP Handover Package Signed', 'Post-Handover Review Meeting Completed with Client'],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const daysFromNow = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); };
const dateOnly = iso => iso.split('T')[0];
const ds = d => d.toISOString().split('T')[0];
const jv = v => JSON.stringify(v); // wrap value as valid JSON for JSONB columns

// ─── CLEAR ALL TABLES (reverse FK order) ─────────────────────────────────────
async function clearAllTables() {
  const order = [
    'audit_logs', 'notifications', 'attendance',
    'safety_checklist_items', 'safety_checklists',
    'escalation_comments', 'escalations',
    'purchase_orders', 'vendor_compliance', 'vendors',
    'budget', 'stage_gates', 'stages', 'milestones',
    'projects', 'users',
  ];
  for (const table of order) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) console.warn(`  Skipping clear ${table}: ${error.message}`);
  }
  console.log('  ✅ All tables cleared');
}

// ─── MAIN SEED ───────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🚀 Starting GCC Platform demo seed...\n');

  // ── 0. CLEAR ──────────────────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...');
  await clearAllTables();

  // ── 1. USERS ──────────────────────────────────────────────────────────────
  console.log('\n👤 Upserting demo users...');
  const { error: userErr } = await supabase.from('users').upsert([
    { id: PMO_USER_ID,         name: 'Sarah Jenkins',  email: 'pmo@demo.com',     role: 'PMO',    phone: '+91-9876540001' },
    { id: PMO_USER_2_ID,       name: 'Rahul Sharma',   email: 'pmo2@demo.com',    role: 'PMO',    phone: '+91-9876540002' },
    { id: JPMORGAN_CLIENT_ID,  name: 'Michael Brown',  email: 'client@demo.com',  role: 'Client', phone: '+1-212-555-0182' },
    { id: GOLDMAN_CLIENT_ID,   name: 'David Kim',      email: 'client2@demo.com', role: 'Client', phone: '+1-212-555-0183' },
    { id: MICROSOFT_CLIENT_ID, name: 'Priya Mehta',    email: 'client3@demo.com', role: 'Client', phone: '+91-9876540003' },
  ], { onConflict: 'id' });
  if (userErr) console.warn('  Users upsert warning:', userErr.message);
  else console.log('  ✅ 5 demo users ready');

  // ── 2. PROJECTS ───────────────────────────────────────────────────────────
  console.log('\n📁 Creating projects...');
  const { data: projects, error: projErr } = await supabase.from('projects').insert([
    {
      project_name: 'JPMorgan India GCC',
      location: 'Bangalore',
      client_name: 'JPMorgan Chase',
      current_stage: 3,
      stage_status: 'In Progress',
      total_budget: 80000000,
      actual_spent: 14500000,
      start_date: '2024-11-01',
      target_end_date: '2025-12-31',
      created_by: PMO_USER_ID,
    },
    {
      project_name: 'Goldman Sachs Tech Hub',
      location: 'Hyderabad',
      client_name: 'Goldman Sachs',
      current_stage: 5,
      stage_status: 'Blocked',
      total_budget: 55000000,
      actual_spent: 48000000,
      start_date: '2024-06-01',
      target_end_date: '2025-07-31',
      created_by: PMO_USER_ID,
    },
    {
      project_name: 'Microsoft Innovation Centre',
      location: 'Pune',
      client_name: 'Microsoft Corporation',
      current_stage: 1,
      stage_status: 'In Progress',
      total_budget: 45000000,
      actual_spent: 800000,
      start_date: '2025-03-01',
      target_end_date: '2026-06-30',
      created_by: PMO_USER_2_ID,
    },
  ]).select();
  if (projErr) return console.error('❌ Projects error:', projErr);
  const [jpmorgan, goldman, microsoft] = projects;
  console.log(`  ✅ Created ${projects.length} projects`);

  // Assign each client user to their project
  await supabase.from('users').update({ assigned_project_id: jpmorgan.id  }).eq('id', JPMORGAN_CLIENT_ID);
  await supabase.from('users').update({ assigned_project_id: goldman.id   }).eq('id', GOLDMAN_CLIENT_ID);
  await supabase.from('users').update({ assigned_project_id: microsoft.id }).eq('id', MICROSOFT_CLIENT_ID);
  console.log('  ✅ Client users assigned to their projects');

  // ── 3. STAGES & GATES ─────────────────────────────────────────────────────
  console.log('\n🔢 Creating stages and gate checklists...');
  for (const project of projects) {
    for (let n = 1; n <= 6; n++) {
      let status = 'Not Started', pct = 0, startedAt = null, completedAt = null;
      if (n < project.current_stage) {
        status = 'Completed'; pct = 100;
        startedAt  = daysAgo(120 - n * 18);
        completedAt = daysAgo(90 - n * 15);
      } else if (n === project.current_stage) {
        status = project.stage_status === 'Blocked' ? 'Blocked' : 'In Progress';
        pct = project.stage_status === 'Blocked' ? 65 : 40;
        startedAt = daysAgo(30);
      }

      const { data: stage, error: stageErr } = await supabase.from('stages').insert({
        project_id: project.id,
        stage_number: n,
        stage_name: ['Discovery', 'Evaluation', 'Model Selection', 'Design & Planning', 'Construction & Execution', 'Handover & Post-Construction'][n - 1],
        status,
        completion_percentage: pct,
        started_at: startedAt,
        completed_at: completedAt,
      }).select().single();
      if (stageErr) { console.warn(`  Stage ${n} error:`, stageErr.message); continue; }

      const gates = (STAGE_GATES[n] || []).map(item => ({
        stage_id: stage.id,
        gate_item: item,
        is_required: true,
        is_completed: status === 'Completed',
        verified_by: status === 'Completed' ? PMO_USER_ID : null,
        verified_at: status === 'Completed' ? completedAt : null,
      }));
      const { error: gateErr } = await supabase.from('stage_gates').insert(gates);
      if (gateErr) console.warn(`  Gates for stage ${n} warning:`, gateErr.message);
    }
  }
  console.log('  ✅ Stages and gates created');

  // ── 4. MILESTONES ─────────────────────────────────────────────────────────
  console.log('\n🎯 Creating milestones...');
  // Status values: 'Upcoming' | 'Completed' | 'Delayed' | 'Overdue'
  const MILESTONES = [
    // JPMorgan — Stage 3 active
    { project_id: jpmorgan.id, milestone_name: 'India Feasibility Report',               due_date: dateOnly(daysAgo(80)),     status: 'Completed', owner_id: PMO_USER_ID,   priority: 'High'   },
    { project_id: jpmorgan.id, milestone_name: 'Bangalore City Selection Approved',      due_date: dateOnly(daysAgo(50)),     status: 'Completed', owner_id: PMO_USER_ID,   priority: 'High'   },
    { project_id: jpmorgan.id, milestone_name: 'BOT Partner RFQ Responses Received',    due_date: dateOnly(daysAgo(5)),      status: 'Overdue',   owner_id: PMO_USER_ID,   priority: 'High'   },
    { project_id: jpmorgan.id, milestone_name: 'Legal Entity Incorporation Filing',      due_date: dateOnly(daysFromNow(20)), status: 'Upcoming',  owner_id: PMO_USER_2_ID, priority: 'High'   },
    { project_id: jpmorgan.id, milestone_name: 'Office Location Shortlist (Top 3)',      due_date: dateOnly(daysFromNow(35)), status: 'Upcoming',  owner_id: PMO_USER_2_ID, priority: 'Medium' },

    // Goldman — Stage 5 blocked
    { project_id: goldman.id, milestone_name: 'Office Fit-Out Structural Work Complete', due_date: dateOnly(daysAgo(30)),     status: 'Completed', owner_id: PMO_USER_ID,   priority: 'High'   },
    { project_id: goldman.id, milestone_name: 'IT Network Cabling & Rack Installation',  due_date: dateOnly(daysAgo(10)),     status: 'Overdue',   owner_id: PMO_USER_ID,   priority: 'High'   },
    { project_id: goldman.id, milestone_name: 'First 100 Employees Onboarded',           due_date: dateOnly(daysFromNow(15)), status: 'Upcoming',  owner_id: PMO_USER_2_ID, priority: 'High'   },
    { project_id: goldman.id, milestone_name: 'GCC Go-Live & Handover',                  due_date: dateOnly(daysFromNow(45)), status: 'Upcoming',  owner_id: PMO_USER_ID,   priority: 'High'   },

    // Microsoft — Stage 1 just started
    { project_id: microsoft.id, milestone_name: 'India GCC Entry Strategy Workshop',           due_date: dateOnly(daysFromNow(10)), status: 'Upcoming', owner_id: PMO_USER_2_ID, priority: 'High' },
    { project_id: microsoft.id, milestone_name: 'City Feasibility Report: Pune vs Hyderabad',  due_date: dateOnly(daysFromNow(25)), status: 'Upcoming', owner_id: PMO_USER_2_ID, priority: 'High' },
  ];
  const { error: msErr } = await supabase.from('milestones').insert(MILESTONES);
  if (msErr) console.warn('  Milestones warning:', msErr.message);
  else console.log(`  ✅ ${MILESTONES.length} milestones created`);

  // ── 5. VENDORS ────────────────────────────────────────────────────────────
  console.log('\n🏢 Creating vendors...');
  // Status values: 'Pending' | 'Approved' | 'Inactive'
  const { data: vendors, error: vendorErr } = await supabase.from('vendors').insert([
    { project_id: jpmorgan.id, vendor_name: 'Prestige Constructions Pvt Ltd', vendor_type: 'Construction', contact_email: 'procurement@prestigeconstructions.in', contact_phone: '+91-80-4120-3344', status: 'Approved', onboarding_date: dateOnly(daysAgo(90)),  approved_by: PMO_USER_ID, approved_at: daysAgo(90)  },
    { project_id: jpmorgan.id, vendor_name: 'Khaitan & Co LLP',               vendor_type: 'Legal',        contact_email: 'bangalore@khaitanco.com',              contact_phone: '+91-80-4617-9600', status: 'Approved', onboarding_date: dateOnly(daysAgo(100)), approved_by: PMO_USER_ID, approved_at: daysAgo(100) },
    { project_id: jpmorgan.id, vendor_name: 'Aon Hewitt India',               vendor_type: 'HR',           contact_email: 'info.india@aon.com',                   contact_phone: '+91-80-4653-7700', status: 'Pending',  onboarding_date: null,                   approved_by: null,        approved_at: null         },
    { project_id: goldman.id,  vendor_name: 'L&T Construction India',          vendor_type: 'Construction', contact_email: 'hyderabad@lntecc.com',                 contact_phone: '+91-40-4030-5500', status: 'Approved', onboarding_date: dateOnly(daysAgo(150)), approved_by: PMO_USER_ID, approved_at: daysAgo(150) },
    { project_id: goldman.id,  vendor_name: 'Cisco Systems India',             vendor_type: 'IT',           contact_email: 'procurement@cisco.com',                contact_phone: '+91-40-6700-1234', status: 'Approved', onboarding_date: dateOnly(daysAgo(120)), approved_by: PMO_USER_ID, approved_at: daysAgo(120) },
    { project_id: goldman.id,  vendor_name: 'CBRE India Pvt Ltd',              vendor_type: 'Facilities',   contact_email: 'facilities.hyd@cbre.com',              contact_phone: '+91-40-6630-8800', status: 'Approved', onboarding_date: dateOnly(daysAgo(140)), approved_by: PMO_USER_ID, approved_at: daysAgo(140) },
    { project_id: microsoft.id, vendor_name: 'JLL India Pvt Ltd',             vendor_type: 'Real Estate',  contact_email: 'pune@jll.com',                         contact_phone: '+91-20-4100-5500', status: 'Approved', onboarding_date: dateOnly(daysAgo(20)),  approved_by: PMO_USER_2_ID, approved_at: daysAgo(20) },
  ]).select();
  if (vendorErr) console.warn('  Vendors warning:', vendorErr.message);
  else console.log(`  ✅ ${vendors.length} vendors created`);
  const [prestige, khaitan, aon, lnt, cisco, cbre, jll] = vendors;

  // ── 6. VENDOR COMPLIANCE DOCS ─────────────────────────────────────────────
  console.log('\n📄 Creating vendor compliance documents...');
  const today = new Date();
  const exp20  = new Date(today); exp20.setDate(today.getDate() + 20);
  const expPast = new Date(today); expPast.setDate(today.getDate() - 15);
  const val1yr  = new Date(today); val1yr.setFullYear(today.getFullYear() + 1);
  const val2yr  = new Date(today); val2yr.setFullYear(today.getFullYear() + 2);

  const COMPLIANCE_DOCS = [
    { vendor_id: prestige.id, document_name: 'GST Registration Certificate',    document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(90)),  expiry_date: ds(val2yr),  status: 'Valid',          file_name: 'Prestige_GST.pdf',         uploaded_by: PMO_USER_ID },
    { vendor_id: prestige.id, document_name: 'Contractor All-Risk Insurance',   document_type: 'Insurance',       upload_date: dateOnly(daysAgo(90)),  expiry_date: ds(val1yr),  status: 'Valid',          file_name: 'Prestige_Insurance.pdf',   uploaded_by: PMO_USER_ID },
    { vendor_id: prestige.id, document_name: 'ISO 9001:2015 Certification',     document_type: 'Quality Cert',    upload_date: dateOnly(daysAgo(90)),  expiry_date: ds(exp20),   status: 'Expiring Soon',  file_name: 'Prestige_ISO9001.pdf',     uploaded_by: PMO_USER_ID },
    { vendor_id: khaitan.id,  document_name: 'GST Registration Certificate',    document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(100)), expiry_date: ds(val2yr),  status: 'Valid',          file_name: 'Khaitan_GST.pdf',          uploaded_by: PMO_USER_ID },
    { vendor_id: khaitan.id,  document_name: 'Professional Indemnity Insurance',document_type: 'Insurance',       upload_date: dateOnly(daysAgo(100)), expiry_date: ds(val1yr),  status: 'Valid',          file_name: 'Khaitan_PI_Insurance.pdf', uploaded_by: PMO_USER_ID },
    { vendor_id: aon.id,      document_name: 'GST Registration Certificate',    document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(400)), expiry_date: ds(expPast), status: 'Expired',        file_name: 'Aon_GST_EXPIRED.pdf',      uploaded_by: PMO_USER_ID },
    { vendor_id: lnt.id,      document_name: 'GST Registration Certificate',    document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(150)), expiry_date: ds(val2yr),  status: 'Valid',          file_name: 'LnT_GST.pdf',              uploaded_by: PMO_USER_ID },
    { vendor_id: lnt.id,      document_name: 'Workmen Compensation Insurance',  document_type: 'Insurance',       upload_date: dateOnly(daysAgo(150)), expiry_date: ds(val1yr),  status: 'Valid',          file_name: 'LnT_WC_Insurance.pdf',     uploaded_by: PMO_USER_ID },
    { vendor_id: lnt.id,      document_name: 'ISO 14001 Environment Cert',      document_type: 'Quality Cert',    upload_date: dateOnly(daysAgo(150)), expiry_date: ds(val1yr),  status: 'Valid',          file_name: 'LnT_ISO14001.pdf',         uploaded_by: PMO_USER_ID },
    { vendor_id: cisco.id,    document_name: 'GST Registration Certificate',    document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(120)), expiry_date: ds(val2yr),  status: 'Valid',          file_name: 'Cisco_GST.pdf',            uploaded_by: PMO_USER_ID },
    { vendor_id: cisco.id,    document_name: 'Cyber Liability Insurance',       document_type: 'Insurance',       upload_date: dateOnly(daysAgo(120)), expiry_date: ds(val1yr),  status: 'Valid',          file_name: 'Cisco_CyberLiability.pdf', uploaded_by: PMO_USER_ID },
    { vendor_id: cbre.id,     document_name: 'GST Registration Certificate',    document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(140)), expiry_date: ds(val2yr),  status: 'Valid',          file_name: 'CBRE_GST.pdf',             uploaded_by: PMO_USER_ID },
    { vendor_id: cbre.id,     document_name: 'Facility Management License',     document_type: 'Other',           upload_date: dateOnly(daysAgo(140)), expiry_date: ds(exp20),   status: 'Expiring Soon',  file_name: 'CBRE_FM_License.pdf',      uploaded_by: PMO_USER_ID },
    { vendor_id: jll.id,      document_name: 'GST Registration Certificate',    document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(20)),  expiry_date: ds(val2yr),  status: 'Valid',          file_name: 'JLL_GST.pdf',              uploaded_by: PMO_USER_2_ID },
    { vendor_id: jll.id,      document_name: 'RERA Registration Certificate',   document_type: 'Other',           upload_date: dateOnly(daysAgo(20)),  expiry_date: ds(val1yr),  status: 'Valid',          file_name: 'JLL_RERA.pdf',             uploaded_by: PMO_USER_2_ID },
  ];
  const { error: compErr } = await supabase.from('vendor_compliance').insert(COMPLIANCE_DOCS);
  if (compErr) console.warn('  Compliance docs warning:', compErr.message);
  else console.log(`  ✅ ${COMPLIANCE_DOCS.length} compliance documents created`);

  // ── 7. BUDGET ─────────────────────────────────────────────────────────────
  console.log('\n💰 Creating phase-wise budget entries...');
  const BUDGET_ROWS = [
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
  ];
  const { error: budgetErr } = await supabase.from('budget').insert(BUDGET_ROWS);
  if (budgetErr) console.warn('  Budget warning:', budgetErr.message);
  else console.log(`  ✅ ${BUDGET_ROWS.length} budget phase rows created`);

  // ── 8. PURCHASE ORDERS ────────────────────────────────────────────────────
  console.log('\n🧾 Creating purchase orders...');
  const slaBreach = new Date(); slaBreach.setHours(slaBreach.getHours() - 72);
  const { data: purchaseOrders, error: poErr } = await supabase.from('purchase_orders').insert([
    { project_id: jpmorgan.id, vendor_id: khaitan.id,  po_number: 'PO-2025-001', amount: 4200000,  description: 'WOS incorporation, ROC filing, and regulatory advisory for JPMorgan India GCC',          phase: 'Legal & Entity Setup',    status: 'Approved',         created_by: PMO_USER_ID, approved_by: PMO_USER_ID,   approval_date: daysAgo(70),  sla_due_date: daysAgo(75)               },
    { project_id: jpmorgan.id, vendor_id: prestige.id, po_number: 'PO-2025-002', amount: 2800000,  description: 'Pre-construction consultancy: site survey, feasibility, space planning — Bangalore GCC',  phase: 'Discovery & Advisory',    status: 'Approved',         created_by: PMO_USER_ID, approved_by: PMO_USER_ID,   approval_date: daysAgo(85),  sla_due_date: daysAgo(90)               },
    { project_id: jpmorgan.id, vendor_id: aon.id,      po_number: 'PO-2025-003', amount: 1500000,  description: 'HR policy framework, compensation benchmarking, and talent acquisition strategy',          phase: 'HR, Talent & Onboarding', status: 'Rejected',         created_by: PMO_USER_ID, approved_by: PMO_USER_ID,   approval_date: daysAgo(20),  sla_due_date: daysAgo(22), rejection_reason: 'Vendor compliance documents expired. Aon Hewitt must renew GST certificate before PO can be raised.' },
    { project_id: goldman.id,  vendor_id: lnt.id,      po_number: 'PO-2025-004', amount: 28500000, description: 'Complete office fit-out and civil construction — Goldman Sachs Tech Hub Hyderabad, 45,000 sqft', phase: 'Office Fit-Out & Civil',  status: 'Approved',         created_by: PMO_USER_ID, approved_by: PMO_USER_ID,   approval_date: daysAgo(120), sla_due_date: daysAgo(125)              },
    { project_id: goldman.id,  vendor_id: cisco.id,    po_number: 'PO-2025-005', amount: 14450000, description: 'IT infrastructure: structured cabling, server racks, Cisco Catalyst switch stack, Meraki Wi-Fi, firewall', phase: 'IT Infrastructure',       status: 'Pending Approval', created_by: PMO_USER_ID, approved_by: null,           approval_date: null,         sla_due_date: slaBreach.toISOString()   },
    { project_id: goldman.id,  vendor_id: cbre.id,     po_number: 'PO-2025-006', amount: 3600000,  description: '12-month facility management: housekeeping, security, cafeteria, maintenance — Hyderabad office', phase: 'Discovery & Advisory',    status: 'Approved',         created_by: PMO_USER_ID, approved_by: PMO_USER_2_ID, approval_date: daysAgo(100), sla_due_date: daysAgo(105)              },
    { project_id: microsoft.id, vendor_id: jll.id,     po_number: 'PO-2025-007', amount: 800000,   description: 'Pune market feasibility study and shortlisting of 3 office micro-markets for Microsoft Innovation Centre', phase: 'Discovery & Advisory',    status: 'Approved',         created_by: PMO_USER_2_ID, approved_by: PMO_USER_ID, approval_date: daysAgo(18),  sla_due_date: daysAgo(20)               },
  ]).select();
  if (poErr) console.warn('  POs warning:', poErr.message);
  else console.log(`  ✅ ${purchaseOrders.length} purchase orders created`);

  // ── 9. ESCALATIONS ────────────────────────────────────────────────────────
  console.log('\n⚠️  Creating escalations...');
  const critSLA   = new Date(); critSLA.setHours(critSLA.getHours() - 2);
  const highBreach = new Date(); highBreach.setHours(highBreach.getHours() - 30);
  const medSLA    = new Date(); medSLA.setDate(medSLA.getDate() + 2);
  const microsoftSLA = new Date(); microsoftSLA.setDate(microsoftSLA.getDate() + 4);

  const { data: escalations, error: escErr } = await supabase.from('escalations').insert([
    {
      // Michael Brown (JPMorgan client) raises — construction delay
      project_id: jpmorgan.id, raised_by: JPMORGAN_CLIENT_ID,
      title: 'Civil Fit-Out Behind Schedule — Risking Go-Live Date',
      description: 'The office civil work is running 3 weeks behind the agreed Gantt plan. False ceiling and flooring on floors 2 and 3 are incomplete. At current pace we risk missing our December go-live date. Need a recovery plan from the contractor within 48 hours.',
      severity: 'High', status: 'In Progress', assigned_to: PMO_USER_ID,
      sla_due_date: highBreach.toISOString(), created_at: daysAgo(2),
    },
    {
      // Sarah Jenkins (PMO) raises — vendor compliance
      project_id: jpmorgan.id, raised_by: PMO_USER_ID,
      title: 'Aon Hewitt GST Certificate Expired — PO Blocked',
      description: 'Aon Hewitt India GST registration expired 15 days ago. Cannot raise the HR advisory PO (PO-2025-003) until renewed. Aon notified twice, no response. HR policy framework milestone is at risk.',
      severity: 'Medium', status: 'Open', assigned_to: PMO_USER_2_ID,
      sla_due_date: medSLA.toISOString(), created_at: daysAgo(1),
    },
    {
      // David Kim (Goldman client) raises — IT budget overrun
      project_id: goldman.id, raised_by: GOLDMAN_CLIENT_ID,
      title: 'IT Infrastructure Budget Overrun — Urgent Approval Needed',
      description: 'IT infrastructure phase exceeded approved budget by Rs 24.5 lakh (20.4% variance). Additional cost driven by higher-spec firewalls required for Goldman InfoSec standards. PO-2025-005 pending for 3 days — SLA breached. Requesting urgent sign-off to unblock the contractor.',
      severity: 'Critical', status: 'In Progress', assigned_to: PMO_USER_ID,
      sla_due_date: critSLA.toISOString(), created_at: daysAgo(1),
    },
    {
      // Sarah Jenkins (PMO) raises, assigned to Rahul — safety resolved
      project_id: goldman.id, raised_by: PMO_USER_ID,
      title: 'Safety Inspection Non-Compliance — Floor 1 Electrical',
      description: 'Site inspection on Floor 1 flagged exposed electrical conduits near the server room entry. Non-compliance under IS:732 electrical safety standards. L&T site supervisor notified and remediation in progress.',
      severity: 'High', status: 'Resolved', assigned_to: PMO_USER_2_ID,
      sla_due_date: daysAgo(8), resolved_at: daysAgo(6), created_at: daysAgo(10),
    },
    {
      // Priya Mehta (Microsoft client) raises — first touch point
      project_id: microsoft.id, raised_by: MICROSOFT_CLIENT_ID,
      title: 'Strategy Workshop Date Confirmation Needed',
      description: 'The India GCC Entry Strategy Workshop is scheduled for next week but we have not received a calendar invite, venue confirmation, or attendee list from Embark. Our CHRO is travelling internationally after this week. Please confirm dates urgently.',
      severity: 'Medium', status: 'Open', assigned_to: PMO_USER_2_ID,
      sla_due_date: microsoftSLA.toISOString(), created_at: daysAgo(1),
    },
  ]).select();
  if (escErr) console.warn('  Escalations warning:', escErr.message);
  else console.log(`  ✅ ${escalations.length} escalations created`);
  const [esc1, esc2, esc3, esc4, esc5] = escalations;

  // ── 10. ESCALATION COMMENTS ───────────────────────────────────────────────
  console.log('\n💬 Creating escalation comment threads...');
  const COMMENTS = [
    // Esc 1 — Civil delay (JPMorgan) — Michael <-> Sarah thread
    { escalation_id: esc1.id, comment_by: JPMORGAN_CLIENT_ID, comment_text: 'This is becoming a serious concern. Our CHRO is tracking the go-live date closely. Can Embark confirm a recovery plan by EOD tomorrow?', is_internal: false, created_at: daysAgo(2) },
    { escalation_id: esc1.id, comment_by: PMO_USER_ID, comment_text: 'Acknowledged, Michael. I have called an urgent site meeting with Prestige Constructions for tomorrow 9 AM. Will share the recovery plan and revised Gantt by 5 PM.', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc1.id, comment_by: PMO_USER_ID, comment_text: '[Internal] Prestige site manager mentioned they are short on tiling workers. May need a second sub-contractor. Need director approval if cost impact > Rs 5L.', is_internal: true, created_at: daysAgo(1) },
    { escalation_id: esc1.id, comment_by: JPMORGAN_CLIENT_ID, comment_text: 'Thank you Sarah. Please also include an impact assessment on the IT installation schedule — if civil is delayed, Cisco cannot begin rack work either.', is_internal: false, created_at: daysAgo(1) },

    // Esc 2 — Vendor compliance — Sarah raises, Rahul assigned
    { escalation_id: esc2.id, comment_by: PMO_USER_ID, comment_text: 'Sent formal notice to Aon Hewitt procurement on 2 May. Awaiting renewal confirmation. Will follow up by phone tomorrow.', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc2.id, comment_by: PMO_USER_2_ID, comment_text: 'Called Aon Hewitt account manager. They confirmed GST renewal is in process — expect document by end of week. Will update once received.', is_internal: false, created_at: daysAgo(0) },

    // Esc 3 — IT budget overrun (Goldman) — David <-> Sarah thread
    { escalation_id: esc3.id, comment_by: GOLDMAN_CLIENT_ID, comment_text: 'We understand the InfoSec requirement but a 20% variance needs CFO sign-off on our end. Can Embark share the technical justification document to fast-track internal approval?', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc3.id, comment_by: PMO_USER_ID, comment_text: 'Sharing Cisco technical specification sheet and budget variance breakdown. The Firepower 2100 series was mandated by Goldman InfoSec during the last audit. Happy to schedule a call if that helps.', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc3.id, comment_by: PMO_USER_ID, comment_text: '[Internal] If client does not approve by end of day, PO SLA hits at 6 PM. Loop in director for priority escalation path.', is_internal: true, created_at: daysAgo(1) },

    // Esc 4 — Safety resolved — Rahul resolved
    { escalation_id: esc4.id, comment_by: PMO_USER_2_ID, comment_text: 'L&T site engineer confirmed remediation complete. All exposed conduits enclosed per IS:732. Re-inspection passed. Closing this escalation.', is_internal: false, created_at: daysAgo(6) },

    // Esc 5 — Microsoft workshop — Priya <-> Rahul
    { escalation_id: esc5.id, comment_by: PMO_USER_2_ID, comment_text: 'Priya, apologies for the delay. The workshop is confirmed for Thursday 10 AM at JW Marriott Pune. Calendar invite with agenda and attendee list going out within the hour.', is_internal: false, created_at: daysAgo(0) },
  ];
  const { error: commErr } = await supabase.from('escalation_comments').insert(COMMENTS);
  if (commErr) console.warn('  Comments warning:', commErr.message);
  else console.log(`  ✅ ${COMMENTS.length} escalation comments created`);

  // ── 11. SAFETY CHECKLISTS ─────────────────────────────────────────────────
  console.log('\n🦺 Creating safety checklists...');
  const { data: checklists, error: safetyErr } = await supabase.from('safety_checklists').insert([
    { project_id: goldman.id, inspection_date: dateOnly(daysAgo(10)), inspector_name: 'Rajesh Kumar (L&T Safety Officer)', overall_status: 'Non-Compliant', created_by: PMO_USER_ID },
    { project_id: goldman.id, inspection_date: dateOnly(daysAgo(3)),  inspector_name: 'Sarah Jenkins (Embark PMO)',          overall_status: 'Completed',     created_by: PMO_USER_ID },
  ]).select();
  if (safetyErr) { console.warn('  Safety checklists warning:', safetyErr.message); }
  else {
    const [cl1, cl2] = checklists;
    const ITEMS = [
      { checklist_id: cl1.id, item_name: 'Fire exits clearly marked and unobstructed',     is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'PPE available and in use on site',                is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Emergency contact numbers posted',                is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Electrical panel and conduits safely enclosed',   is_compliant: false, notes: 'Exposed conduits found near server room entry on Floor 1. Non-compliant per IS:732.',          checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'First aid kit stocked and accessible',            is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Hazardous material areas marked and segregated',  is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Contractor site induction records up to date',    is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Fire exits clearly marked and unobstructed',     is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'PPE available and in use on site',                is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Emergency contact numbers posted',                is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Electrical panel and conduits safely enclosed',   is_compliant: true,  notes: 'Remediation complete. All conduits enclosed. Verified with L&T site engineer.',               checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'First aid kit stocked and accessible',            is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Hazardous material areas marked and segregated',  is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Contractor site induction records up to date',    is_compliant: true,  notes: null,                                                                                           checked_by: PMO_USER_ID },
    ];
    await supabase.from('safety_checklist_items').insert(ITEMS);
    console.log('  ✅ Safety checklists and items created');
  }

  // ── 12. NOTIFICATIONS ─────────────────────────────────────────────────────
  console.log('\n🔔 Creating notifications...');
  const NOTIFICATIONS = [
    // Michael Brown — JPMorgan client
    { user_id: JPMORGAN_CLIENT_ID, notification_type: 'Escalation Update', message: 'Sarah Jenkins replied on: "Civil Fit-Out Behind Schedule" — recovery plan attached', related_entity_type: 'Escalation', related_entity_id: esc1.id, is_read: false, created_at: daysAgo(1) },
    { user_id: JPMORGAN_CLIENT_ID, notification_type: 'SLA Alert',         message: 'SLA BREACHED: Escalation "Civil Fit-Out Behind Schedule" is overdue by 6 hours', related_entity_type: 'Escalation', related_entity_id: esc1.id, is_read: false, created_at: daysAgo(1) },
    { user_id: JPMORGAN_CLIENT_ID, notification_type: 'Stage Update',      message: 'JPMorgan India GCC has advanced to Stage 3: Model Selection', related_entity_type: 'Project', related_entity_id: jpmorgan.id, is_read: true, created_at: daysAgo(30) },
    { user_id: JPMORGAN_CLIENT_ID, notification_type: 'PO Update',         message: 'PO-2025-001 (Khaitan & Co, Rs 42L) has been approved', related_entity_type: 'Project', related_entity_id: jpmorgan.id, is_read: true, created_at: daysAgo(70) },

    // David Kim — Goldman client
    { user_id: GOLDMAN_CLIENT_ID, notification_type: 'Escalation Update',  message: 'Sarah Jenkins replied on: "IT Infrastructure Budget Overrun" — technical justification shared', related_entity_type: 'Escalation', related_entity_id: esc3.id, is_read: false, created_at: daysAgo(1) },
    { user_id: GOLDMAN_CLIENT_ID, notification_type: 'SLA Alert',          message: 'CRITICAL SLA: "IT Infrastructure Budget Overrun" escalation is approaching breach — action needed', related_entity_type: 'Escalation', related_entity_id: esc3.id, is_read: false, created_at: daysAgo(1) },
    { user_id: GOLDMAN_CLIENT_ID, notification_type: 'Milestone Alert',    message: 'Milestone OVERDUE: "IT Network Cabling & Rack Installation" — blocking go-live timeline', related_entity_type: 'Project', related_entity_id: goldman.id, is_read: false, created_at: daysAgo(2) },
    { user_id: GOLDMAN_CLIENT_ID, notification_type: 'Stage Update',       message: 'Goldman Sachs Tech Hub has advanced to Stage 5: Construction & Execution', related_entity_type: 'Project', related_entity_id: goldman.id, is_read: true, created_at: daysAgo(30) },

    // Priya Mehta — Microsoft client
    { user_id: MICROSOFT_CLIENT_ID, notification_type: 'Escalation Update', message: 'Rahul Sharma replied on: "Strategy Workshop Date Confirmation" — calendar invite sent', related_entity_type: 'Escalation', related_entity_id: esc5.id, is_read: false, created_at: daysAgo(0) },
    { user_id: MICROSOFT_CLIENT_ID, notification_type: 'Stage Update',      message: 'Microsoft Innovation Centre has entered Stage 1: Discovery — your GCC setup journey begins', related_entity_type: 'Project', related_entity_id: microsoft.id, is_read: true, created_at: daysAgo(10) },
    { user_id: MICROSOFT_CLIENT_ID, notification_type: 'Vendor Update',     message: 'JLL India Pvt Ltd has been approved as your Real Estate partner', related_entity_type: 'Project', related_entity_id: microsoft.id, is_read: true, created_at: daysAgo(18) },

    // Sarah Jenkins — PMO
    { user_id: PMO_USER_ID, notification_type: 'Escalation',      message: 'David Kim raised a Critical escalation: "IT Infrastructure Budget Overrun" — Goldman Sachs Tech Hub', related_entity_type: 'Escalation', related_entity_id: esc3.id, is_read: false, created_at: daysAgo(1) },
    { user_id: PMO_USER_ID, notification_type: 'Escalation',      message: 'Michael Brown raised a High escalation: "Civil Fit-Out Behind Schedule" — JPMorgan India GCC', related_entity_type: 'Escalation', related_entity_id: esc1.id, is_read: false, created_at: daysAgo(2) },
    { user_id: PMO_USER_ID, notification_type: 'Compliance Alert', message: 'Aon Hewitt India — GST Certificate EXPIRED. Vendor blocked from PO issuance.', related_entity_type: 'Vendor', related_entity_id: aon.id, is_read: false, created_at: daysAgo(1) },
    { user_id: PMO_USER_ID, notification_type: 'Compliance Alert', message: 'Prestige Constructions — ISO 9001 Certificate expiring in 20 days. Renewal required.', related_entity_type: 'Vendor', related_entity_id: prestige.id, is_read: false, created_at: daysAgo(1) },
    { user_id: PMO_USER_ID, notification_type: 'SLA Alert',        message: 'PO-2025-005 (Cisco, Rs 1.44 crore) approval SLA BREACHED — pending for 72 hours', related_entity_type: 'Project', related_entity_id: goldman.id, is_read: false, created_at: daysAgo(1) },

    // Rahul Sharma — PMO2
    { user_id: PMO_USER_2_ID, notification_type: 'Escalation',    message: 'Assigned to you: "Aon Hewitt GST Certificate Expired" — JPMorgan India GCC', related_entity_type: 'Escalation', related_entity_id: esc2.id, is_read: false, created_at: daysAgo(1) },
    { user_id: PMO_USER_2_ID, notification_type: 'Escalation',    message: 'Assigned to you: "Strategy Workshop Date Confirmation" — Microsoft Innovation Centre', related_entity_type: 'Escalation', related_entity_id: esc5.id, is_read: false, created_at: daysAgo(1) },
    { user_id: PMO_USER_2_ID, notification_type: 'Milestone',     message: 'Milestone due in 10 days: "India GCC Entry Strategy Workshop" — Microsoft Innovation Centre', related_entity_type: 'Project', related_entity_id: microsoft.id, is_read: false, created_at: daysAgo(0) },
  ];
  const { error: notifErr } = await supabase.from('notifications').insert(NOTIFICATIONS);
  if (notifErr) console.warn('  Notifications warning:', notifErr.message);
  else console.log(`  ✅ ${NOTIFICATIONS.length} notifications created`);

  // ── 13. AUDIT LOG ─────────────────────────────────────────────────────────
  console.log('\n📋 Creating audit log entries...');
  // new_value must be valid JSON — wrap strings as JSON string literals
  const AUDIT_ENTRIES = [
    { user_id: PMO_USER_ID,    action: 'Created Project',    entity_type: 'Project',    entity_id: String(jpmorgan.id),    old_value: null, new_value: jv('JPMorgan India GCC — Bangalore'),              created_at: daysAgo(100) },
    { user_id: PMO_USER_ID,    action: 'Advanced Stage',     entity_type: 'Stage',      entity_id: String(jpmorgan.id),    old_value: jv('Discovery'),    new_value: jv('Evaluation'),                   created_at: daysAgo(80)  },
    { user_id: PMO_USER_ID,    action: 'Advanced Stage',     entity_type: 'Stage',      entity_id: String(jpmorgan.id),    old_value: jv('Evaluation'),   new_value: jv('Model Selection'),              created_at: daysAgo(45)  },
    { user_id: PMO_USER_ID,    action: 'Approved Vendor',    entity_type: 'Vendor',     entity_id: String(prestige.id),   old_value: null, new_value: jv('Prestige Constructions — Approved'),           created_at: daysAgo(90)  },
    { user_id: PMO_USER_ID,    action: 'Approved PO',        entity_type: 'PO',         entity_id: String(purchaseOrders[0].id), old_value: null, new_value: jv('PO-2025-001 — Rs 42L approved'),     created_at: daysAgo(70)  },
    { user_id: PMO_USER_ID,    action: 'Rejected PO',        entity_type: 'PO',         entity_id: String(purchaseOrders[2].id), old_value: null, new_value: jv('PO-2025-003 — Rejected: vendor compliance expired'), created_at: daysAgo(20) },
    { user_id: PMO_USER_ID,    action: 'Created Project',    entity_type: 'Project',    entity_id: String(goldman.id),    old_value: null, new_value: jv('Goldman Sachs Tech Hub — Hyderabad'),           created_at: daysAgo(180) },
    { user_id: PMO_USER_2_ID,  action: 'Created Project',    entity_type: 'Project',    entity_id: String(microsoft.id),  old_value: null, new_value: jv('Microsoft Innovation Centre — Pune'),          created_at: daysAgo(10)  },
    { user_id: JPMORGAN_CLIENT_ID, action: 'Raised Escalation', entity_type: 'Escalation', entity_id: String(esc1.id),  old_value: null, new_value: jv('High: Civil Fit-Out Behind Schedule'),          created_at: daysAgo(2)   },
    { user_id: GOLDMAN_CLIENT_ID,  action: 'Raised Escalation', entity_type: 'Escalation', entity_id: String(esc3.id),  old_value: null, new_value: jv('Critical: IT Infrastructure Budget Overrun'),   created_at: daysAgo(1)   },
    { user_id: PMO_USER_2_ID,  action: 'Resolved Escalation', entity_type: 'Escalation', entity_id: String(esc4.id),   old_value: jv('In Progress'), new_value: jv('Resolved: Safety Non-Compliance Floor 1'), created_at: daysAgo(6) },
    { user_id: PMO_USER_2_ID,  action: 'Approved Vendor',    entity_type: 'Vendor',     entity_id: String(jll.id),        old_value: null, new_value: jv('JLL India Pvt Ltd — Approved'),                created_at: daysAgo(18)  },
  ];
  const { error: auditErr } = await supabase.from('audit_logs').insert(AUDIT_ENTRIES);
  if (auditErr) console.warn('  Audit log warning:', auditErr.message);
  else console.log(`  ✅ ${AUDIT_ENTRIES.length} audit entries created`);

  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n✅ GCC Platform demo seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log('   Users        : 5 (Sarah PMO, Rahul PMO2, Michael/David/Priya Clients)');
  console.log('   Projects     : 3 (JPMorgan Stage 3, Goldman Stage 5 Blocked, Microsoft Stage 1)');
  console.log('   Vendors      : 7 (6 approved/pending, 1 with expired doc)');
  console.log('   POs          : 7 (4 approved, 1 pending-SLA-breached, 1 rejected, 1 new)');
  console.log('   Escalations  : 5 (1 breached High, 1 open Medium, 1 Critical, 1 Resolved, 1 Open)');
  console.log('   Milestones   : 11 across 3 projects');
  console.log('   Notifications: 19 (4 Michael, 4 David, 3 Priya, 5 Sarah, 3 Rahul)');
  console.log('   Audit Logs   : 12 entries across all users');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Login credentials:');
  console.log('   PMO   : pmo@demo.com      / pmo     → Sarah Jenkins (all 3 projects)');
  console.log('   PMO2  : pmo2@demo.com     / pmo2    → Rahul Sharma  (all 3 projects)');
  console.log('   Client: client@demo.com   / client  → Michael Brown (JPMorgan India GCC)');
  console.log('   Client: client2@demo.com  / client2 → David Kim     (Goldman Sachs Tech Hub)');
  console.log('   Client: client3@demo.com  / client3 → Priya Mehta   (Microsoft Innovation Centre)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch(console.error);
