import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lmajrojnrnrwlerjxatk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYWpyb2pucm5yd2xlcmp4YXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQ1MjQsImV4cCI6MjA5MzU5MDUyNH0.JiWjd8_tmM5UmnugiBbZldWSgwGpsNE0PA8_QQYlhUc';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// These IDs match the hardcoded demo users in AuthContext.jsx
const PMO_USER_ID = 'ad68f966-c6cf-46fc-96d1-1c4e7b0dae48';   // Sarah Jenkins - PMO
const CLIENT_USER_ID = 'bd68f966-c6cf-46fc-96d1-1c4e7b0dae49'; // Michael Brown - Client (JPMorgan)

const STAGE_NAMES = [
  'Discovery',
  'Evaluation',
  'Model Selection',
  'Design & Planning',
  'Construction & Execution',
  'Handover & Post-Construction',
];

// GCC-specific stage gates — what Embark's PMO actually verifies before advancing a stage
const STAGE_GATES = {
  1: [
    'India Market Feasibility Report Submitted',
    'Talent Availability & Cost Analysis Approved',
    'Top 5 Target Cities Shortlisted',
  ],
  2: [
    'City Comparison Matrix Completed (Bangalore / Hyderabad / Pune)',
    'Cost-of-Operations & Real Estate Analysis Done',
    'Talent Supply-Demand Assessment Approved',
  ],
  3: [
    'GCC Operating Model Decided (Captive / BOT / Co-managed)',
    'Implementation Partner Shortlisted & NDA Signed',
    'Legal Entity Type Agreed (WOS / LLP / Branch Office)',
  ],
  4: [
    'Office Floor Plan & Space Allocation Finalized',
    'IT Network Architecture Blueprint Approved',
    'HR Policy Framework v1 Submitted',
  ],
  5: [
    'Office Fit-Out 60% Milestone Passed',
    'IT Infrastructure Rack & Stack Completed',
    'First Cohort of Employees Onboarded (≥50)',
  ],
  6: [
    'Final Site Walkthrough & Snagging List Closed',
    'GCC Operations SOP Handover Package Signed',
    'Post-Handover Review Meeting Completed with Client',
  ],
};

// ─── HELPER ──────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function dateOnly(isoString) {
  return isoString.split('T')[0];
}

// ─── MAIN SEED ───────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🚀 Starting GCC Platform demo seed...\n');

  // ── 1. USERS ──────────────────────────────────────────────────────────────
  console.log('👤 Upserting demo users...');
  const { error: userErr } = await supabase.from('users').upsert([
    {
      id: PMO_USER_ID,
      name: 'Sarah Jenkins',
      email: 'pmo@demo.com',
      role: 'PMO',
      phone: '+91-9876540001',
    },
    {
      id: CLIENT_USER_ID,
      name: 'Michael Brown',
      email: 'client@demo.com',
      role: 'Client',
      phone: '+1-212-555-0182',
    },
  ], { onConflict: 'id' });
  if (userErr) console.warn('  Users upsert warning:', userErr.message);
  else console.log('  ✅ Demo users ready');

  // ── 2. PROJECTS ───────────────────────────────────────────────────────────
  // Three projects at different lifecycle stages to showcase the full portfolio view
  console.log('\n📁 Creating projects...');
  const { data: projects, error: projErr } = await supabase.from('projects').insert([
    {
      // Stage 3 — Model Selection (in progress, on track)
      project_name: 'JPMorgan India GCC',
      location: 'Bangalore',
      client_name: 'JPMorgan Chase',
      current_stage: 3,
      stage_status: 'In Progress',
      total_budget: 80000000,   // ₹8 crore — typical GCC fit-out for a 500-seat financial services GCC
      actual_spent: 14500000,   // ₹1.45 crore — discovery + evaluation fees + legal retainer
      start_date: '2024-11-01',
      target_end_date: '2025-12-31',
      created_by: PMO_USER_ID,
    },
    {
      // Stage 5 — Construction (blocked — IT vendor delay)
      project_name: 'Goldman Sachs Tech Hub',
      location: 'Hyderabad',
      client_name: 'Goldman Sachs',
      current_stage: 5,
      stage_status: 'Blocked',
      total_budget: 55000000,   // ₹5.5 crore
      actual_spent: 48000000,   // ₹4.8 crore — almost done, blocked on IT rack installation
      start_date: '2024-06-01',
      target_end_date: '2025-07-31',
      created_by: PMO_USER_ID,
    },
    {
      // Stage 1 — Discovery (just kicked off)
      project_name: 'Microsoft Innovation Centre',
      location: 'Pune',
      client_name: 'Microsoft Corporation',
      current_stage: 1,
      stage_status: 'In Progress',
      total_budget: 45000000,   // ₹4.5 crore
      actual_spent: 800000,     // ₹8 lakh — initial consultancy spend
      start_date: '2025-03-01',
      target_end_date: '2026-06-30',
      created_by: PMO_USER_ID,
    },
  ]).select();
  if (projErr) return console.error('❌ Projects error:', projErr);
  console.log(`  ✅ Created ${projects.length} projects`);

  const [jpmorgan, goldman, microsoft] = projects;

  // Assign Michael Brown (client demo user) to JPMorgan project
  await supabase.from('users').update({ assigned_project_id: jpmorgan.id }).eq('id', CLIENT_USER_ID);

  // ── 3. STAGES & GATES ─────────────────────────────────────────────────────
  console.log('\n🔢 Creating stages and gate checklists...');

  for (const project of projects) {
    for (let stageNum = 1; stageNum <= 6; stageNum++) {
      let status = 'Not Started';
      let completionPct = 0;
      let startedAt = null;
      let completedAt = null;

      if (stageNum < project.current_stage) {
        status = 'Completed';
        completionPct = 100;
        startedAt = daysAgo(120 - stageNum * 18);
        completedAt = daysAgo(90 - stageNum * 15);
      } else if (stageNum === project.current_stage) {
        status = project.stage_status === 'Blocked' ? 'Blocked' : 'In Progress';
        completionPct = project.stage_status === 'Blocked' ? 65 : 40;
        startedAt = daysAgo(30);
      }

      const { data: stage, error: stageErr } = await supabase.from('stages').insert({
        project_id: project.id,
        stage_number: stageNum,
        stage_name: STAGE_NAMES[stageNum - 1],
        status,
        completion_percentage: completionPct,
        started_at: startedAt,
        completed_at: completedAt,
      }).select().single();

      if (stageErr) { console.warn(`  Stage ${stageNum} error:`, stageErr.message); continue; }

      // Insert gate items for this stage
      const gateItems = STAGE_GATES[stageNum] || [];
      const gates = gateItems.map(item => ({
        stage_id: stage.id,
        gate_item: item,
        required: true,
        completed: status === 'Completed',
        completed_by: status === 'Completed' ? PMO_USER_ID : null,
        completed_at: status === 'Completed' ? completedAt : null,
      }));
      await supabase.from('stage_gates').insert(gates);
    }
  }
  console.log('  ✅ Stages and gates created');

  // ── 4. MILESTONES ─────────────────────────────────────────────────────────
  console.log('\n🎯 Creating milestones...');

  const MILESTONES = [
    // JPMorgan — Stage 3 active
    { project_id: jpmorgan.id, milestone_name: 'India Feasibility Report', description: 'Comprehensive feasibility report covering talent, cost, and regulatory landscape for India GCC entry', due_date: dateOnly(daysAgo(80)), completion_date: dateOnly(daysAgo(82)), status: 'Completed', owner_id: PMO_USER_ID, priority: 'High' },
    { project_id: jpmorgan.id, milestone_name: 'Bangalore City Selection Approved', description: 'Final city selection signed off — Bangalore chosen over Hyderabad based on tech talent density and real estate cost', due_date: dateOnly(daysAgo(50)), completion_date: dateOnly(daysAgo(48)), status: 'Completed', owner_id: PMO_USER_ID, priority: 'High' },
    { project_id: jpmorgan.id, milestone_name: 'BOT Partner RFQ Responses Received', description: 'Collect and shortlist Build-Operate-Transfer partner proposals from 3 shortlisted firms', due_date: dateOnly(daysAgo(5)), completion_date: null, status: 'Overdue', owner_id: PMO_USER_ID, priority: 'High' },
    { project_id: jpmorgan.id, milestone_name: 'Legal Entity Incorporation Filing', description: 'File Wholly Owned Subsidiary (WOS) incorporation documents with ROC Bangalore', due_date: dateOnly(daysFromNow(20)), completion_date: null, status: 'In Progress', owner_id: PMO_USER_ID, priority: 'High' },
    { project_id: jpmorgan.id, milestone_name: 'Office Location Shortlist (Top 3)', description: 'Shortlist 3 office locations in Outer Ring Road, Whitefield, and Electronic City corridors', due_date: dateOnly(daysFromNow(35)), completion_date: null, status: 'Not Started', owner_id: PMO_USER_ID, priority: 'Medium' },

    // Goldman — Stage 5 blocked
    { project_id: goldman.id, milestone_name: 'Office Fit-Out Structural Work Complete', description: 'Civil and structural work for the 45,000 sq ft Hyderabad office complete', due_date: dateOnly(daysAgo(30)), completion_date: dateOnly(daysAgo(28)), status: 'Completed', owner_id: PMO_USER_ID, priority: 'High' },
    { project_id: goldman.id, milestone_name: 'IT Network Cabling & Rack Installation', description: 'Structured cabling, server rack installation, and network backbone deployment', due_date: dateOnly(daysAgo(10)), completion_date: null, status: 'Overdue', owner_id: PMO_USER_ID, priority: 'High' },
    { project_id: goldman.id, milestone_name: 'First 100 Employees Onboarded', description: 'Hire and onboard the first cohort — 60 technology, 25 operations, 15 finance roles', due_date: dateOnly(daysFromNow(15)), completion_date: null, status: 'In Progress', owner_id: PMO_USER_ID, priority: 'High' },
    { project_id: goldman.id, milestone_name: 'GCC Go-Live & Handover', description: 'Full GCC operations go-live, handover to Goldman Sachs ops team with SOP documentation', due_date: dateOnly(daysFromNow(45)), completion_date: null, status: 'Not Started', owner_id: PMO_USER_ID, priority: 'High' },

    // Microsoft — Stage 1 just started
    { project_id: microsoft.id, milestone_name: 'India GCC Entry Strategy Workshop', description: 'Two-day strategy workshop with Microsoft leadership to define GCC objectives, target functions, and 3-year roadmap', due_date: dateOnly(daysFromNow(10)), completion_date: null, status: 'In Progress', owner_id: PMO_USER_ID, priority: 'High' },
    { project_id: microsoft.id, milestone_name: 'City Feasibility Report: Pune vs Hyderabad', description: 'Comparative analysis of Pune and Hyderabad for Microsoft Innovation Centre — talent, cost, and ecosystem factors', due_date: dateOnly(daysFromNow(25)), completion_date: null, status: 'Not Started', owner_id: PMO_USER_ID, priority: 'High' },
  ];

  const { error: msErr } = await supabase.from('milestones').insert(MILESTONES);
  if (msErr) console.warn('  Milestones warning:', msErr.message);
  else console.log('  ✅ Milestones created');

  // ── 5. VENDORS ────────────────────────────────────────────────────────────
  console.log('\n🏢 Creating vendors...');

  const { data: vendors, error: vendorErr } = await supabase.from('vendors').insert([
    // JPMorgan vendors
    {
      project_id: jpmorgan.id,
      vendor_name: 'Prestige Constructions Pvt Ltd',
      vendor_type: 'Construction',
      contact_email: 'procurement@prestigeconstructions.in',
      contact_phone: '+91-80-4120-3344',
      status: 'Active',
      onboarding_date: dateOnly(daysAgo(90)),
      approved_by: PMO_USER_ID,
      approved_at: daysAgo(90),
    },
    {
      project_id: jpmorgan.id,
      vendor_name: 'Khaitan & Co LLP',
      vendor_type: 'Legal',
      contact_email: 'bangalore@khaitanco.com',
      contact_phone: '+91-80-4617-9600',
      status: 'Active',
      onboarding_date: dateOnly(daysAgo(100)),
      approved_by: PMO_USER_ID,
      approved_at: daysAgo(100),
    },
    {
      project_id: jpmorgan.id,
      vendor_name: 'Aon Hewitt India',
      vendor_type: 'HR',
      contact_email: 'info.india@aon.com',
      contact_phone: '+91-80-4653-7700',
      status: 'Pending',  // Pending — compliance doc expired
      onboarding_date: null,
      approved_by: null,
      approved_at: null,
    },
    // Goldman vendors
    {
      project_id: goldman.id,
      vendor_name: 'L&T Construction India',
      vendor_type: 'Construction',
      contact_email: 'hyderabad@lntecc.com',
      contact_phone: '+91-40-4030-5500',
      status: 'Active',
      onboarding_date: dateOnly(daysAgo(150)),
      approved_by: PMO_USER_ID,
      approved_at: daysAgo(150),
    },
    {
      project_id: goldman.id,
      vendor_name: 'Cisco Systems India',
      vendor_type: 'IT',
      contact_email: 'procurement@cisco.com',
      contact_phone: '+91-40-6700-1234',
      status: 'Active',
      onboarding_date: dateOnly(daysAgo(120)),
      approved_by: PMO_USER_ID,
      approved_at: daysAgo(120),
    },
    {
      project_id: goldman.id,
      vendor_name: 'CBRE India Pvt Ltd',
      vendor_type: 'Facilities',
      contact_email: 'facilities.hyd@cbre.com',
      contact_phone: '+91-40-6630-8800',
      status: 'Active',
      onboarding_date: dateOnly(daysAgo(140)),
      approved_by: PMO_USER_ID,
      approved_at: daysAgo(140),
    },
  ]).select();
  if (vendorErr) console.warn('  Vendors warning:', vendorErr.message);
  else console.log(`  ✅ Created ${vendors.length} vendors`);

  const [prestige, khaitan, aon, lnt, cisco, cbre] = vendors;

  // ── 6. VENDOR COMPLIANCE DOCS ─────────────────────────────────────────────
  console.log('\n📄 Creating vendor compliance documents...');

  const today = new Date();
  const expiring20 = new Date(today); expiring20.setDate(today.getDate() + 20);
  const expiredPast = new Date(today); expiredPast.setDate(today.getDate() - 15);
  const valid1yr = new Date(today); valid1yr.setFullYear(today.getFullYear() + 1);
  const valid2yr = new Date(today); valid2yr.setFullYear(today.getFullYear() + 2);

  function ds(d) { return d.toISOString().split('T')[0]; }

  const COMPLIANCE_DOCS = [
    // Prestige — all valid
    { vendor_id: prestige.id, document_name: 'GST Registration Certificate', document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(90)), expiry_date: ds(valid2yr), status: 'Valid', file_name: 'Prestige_GST_Cert.pdf', uploaded_by: PMO_USER_ID },
    { vendor_id: prestige.id, document_name: 'Contractor All-Risk Insurance', document_type: 'Insurance', upload_date: dateOnly(daysAgo(90)), expiry_date: ds(valid1yr), status: 'Valid', file_name: 'Prestige_Insurance_2025.pdf', uploaded_by: PMO_USER_ID },
    { vendor_id: prestige.id, document_name: 'ISO 9001:2015 Quality Certification', document_type: 'Quality Cert', upload_date: dateOnly(daysAgo(90)), expiry_date: ds(expiring20), status: 'Expiring Soon', file_name: 'Prestige_ISO9001.pdf', uploaded_by: PMO_USER_ID },

    // Khaitan — valid
    { vendor_id: khaitan.id, document_name: 'GST Registration Certificate', document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(100)), expiry_date: ds(valid2yr), status: 'Valid', file_name: 'Khaitan_GST.pdf', uploaded_by: PMO_USER_ID },
    { vendor_id: khaitan.id, document_name: 'Professional Indemnity Insurance', document_type: 'Insurance', upload_date: dateOnly(daysAgo(100)), expiry_date: ds(valid1yr), status: 'Valid', file_name: 'Khaitan_PI_Insurance.pdf', uploaded_by: PMO_USER_ID },

    // Aon — expired doc (reason vendor is Pending)
    { vendor_id: aon.id, document_name: 'GST Registration Certificate', document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(400)), expiry_date: ds(expiredPast), status: 'Expired', file_name: 'Aon_GST_EXPIRED.pdf', uploaded_by: PMO_USER_ID },

    // L&T — valid
    { vendor_id: lnt.id, document_name: 'GST Registration Certificate', document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(150)), expiry_date: ds(valid2yr), status: 'Valid', file_name: 'LnT_GST.pdf', uploaded_by: PMO_USER_ID },
    { vendor_id: lnt.id, document_name: 'Workmen Compensation Insurance', document_type: 'Insurance', upload_date: dateOnly(daysAgo(150)), expiry_date: ds(valid1yr), status: 'Valid', file_name: 'LnT_WC_Insurance.pdf', uploaded_by: PMO_USER_ID },
    { vendor_id: lnt.id, document_name: 'ISO 14001 Environment Certification', document_type: 'Quality Cert', upload_date: dateOnly(daysAgo(150)), expiry_date: ds(valid1yr), status: 'Valid', file_name: 'LnT_ISO14001.pdf', uploaded_by: PMO_USER_ID },

    // Cisco — valid
    { vendor_id: cisco.id, document_name: 'GST Registration Certificate', document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(120)), expiry_date: ds(valid2yr), status: 'Valid', file_name: 'Cisco_GST.pdf', uploaded_by: PMO_USER_ID },
    { vendor_id: cisco.id, document_name: 'Cyber Liability Insurance', document_type: 'Insurance', upload_date: dateOnly(daysAgo(120)), expiry_date: ds(valid1yr), status: 'Valid', file_name: 'Cisco_CyberLiability.pdf', uploaded_by: PMO_USER_ID },

    // CBRE — expiring soon
    { vendor_id: cbre.id, document_name: 'GST Registration Certificate', document_type: 'GST Certificate', upload_date: dateOnly(daysAgo(140)), expiry_date: ds(valid2yr), status: 'Valid', file_name: 'CBRE_GST.pdf', uploaded_by: PMO_USER_ID },
    { vendor_id: cbre.id, document_name: 'Facility Management License', document_type: 'Other', upload_date: dateOnly(daysAgo(140)), expiry_date: ds(expiring20), status: 'Expiring Soon', file_name: 'CBRE_FM_License.pdf', uploaded_by: PMO_USER_ID },
  ];

  const { error: compErr } = await supabase.from('vendor_compliance').insert(COMPLIANCE_DOCS);
  if (compErr) console.warn('  Compliance docs warning:', compErr.message);
  else console.log(`  ✅ Created ${COMPLIANCE_DOCS.length} compliance documents`);

  // ── 7. BUDGET (PHASE-WISE) ─────────────────────────────────────────────────
  console.log('\n💰 Creating phase-wise budget entries...');

  const BUDGET_ROWS = [
    // JPMorgan — Stage 3, only Discovery + Evaluation phases have actuals
    { project_id: jpmorgan.id, phase: 'Discovery & Advisory', planned_amount: 3000000, actual_amount: 2800000 },
    { project_id: jpmorgan.id, phase: 'Legal & Entity Setup', planned_amount: 5000000, actual_amount: 4200000 },
    { project_id: jpmorgan.id, phase: 'Office Fit-Out & Civil', planned_amount: 40000000, actual_amount: 0 },
    { project_id: jpmorgan.id, phase: 'IT Infrastructure', planned_amount: 20000000, actual_amount: 0 },
    { project_id: jpmorgan.id, phase: 'HR, Talent & Onboarding', planned_amount: 12000000, actual_amount: 7500000 },

    // Goldman — Stage 5 (near completion, over budget on IT)
    { project_id: goldman.id, phase: 'Discovery & Advisory', planned_amount: 2000000, actual_amount: 1950000 },
    { project_id: goldman.id, phase: 'Legal & Entity Setup', planned_amount: 3000000, actual_amount: 3100000 },   // slightly over
    { project_id: goldman.id, phase: 'Office Fit-Out & Civil', planned_amount: 28000000, actual_amount: 28500000 }, // over
    { project_id: goldman.id, phase: 'IT Infrastructure', planned_amount: 12000000, actual_amount: 14450000 },      // 20% over — blocked
    { project_id: goldman.id, phase: 'HR, Talent & Onboarding', planned_amount: 10000000, actual_amount: 0 },       // not started

    // Microsoft — Stage 1, only advisory spend
    { project_id: microsoft.id, phase: 'Discovery & Advisory', planned_amount: 2500000, actual_amount: 800000 },
    { project_id: microsoft.id, phase: 'Legal & Entity Setup', planned_amount: 4000000, actual_amount: 0 },
    { project_id: microsoft.id, phase: 'Office Fit-Out & Civil', planned_amount: 22000000, actual_amount: 0 },
    { project_id: microsoft.id, phase: 'IT Infrastructure', planned_amount: 10000000, actual_amount: 0 },
    { project_id: microsoft.id, phase: 'HR, Talent & Onboarding', planned_amount: 6500000, actual_amount: 0 },
  ];

  const { error: budgetErr } = await supabase.from('budget').insert(BUDGET_ROWS);
  if (budgetErr) console.warn('  Budget warning:', budgetErr.message);
  else console.log('  ✅ Phase-wise budget created');

  // ── 8. PURCHASE ORDERS ────────────────────────────────────────────────────
  console.log('\n🧾 Creating purchase orders...');

  const slaBreachedDate = new Date(); slaBreachedDate.setHours(slaBreachedDate.getHours() - 72); // 3 days ago

  const { data: purchaseOrders, error: poErr } = await supabase.from('purchase_orders').insert([
    // JPMorgan POs
    {
      project_id: jpmorgan.id,
      vendor_id: khaitan.id,
      po_number: 'PO-2025-001',
      amount: 4200000,       // ₹42L — legal retainer, WOS incorporation
      description: 'Legal retainer for Wholly Owned Subsidiary (WOS) incorporation, ROC filing, and regulatory advisory — JPMorgan India GCC',
      phase: 'Legal & Entity Setup',
      status: 'Approved',
      created_by: PMO_USER_ID,
      approved_by: PMO_USER_ID,
      approval_date: daysAgo(70),
      sla_due_date: daysAgo(75),
    },
    {
      project_id: jpmorgan.id,
      vendor_id: prestige.id,
      po_number: 'PO-2025-002',
      amount: 2800000,       // ₹28L — discovery advisory
      description: 'Pre-construction consultancy: site survey, feasibility, space planning for JPMorgan GCC Bangalore office',
      phase: 'Discovery & Advisory',
      status: 'Approved',
      created_by: PMO_USER_ID,
      approved_by: PMO_USER_ID,
      approval_date: daysAgo(85),
      sla_due_date: daysAgo(90),
    },
    {
      project_id: jpmorgan.id,
      vendor_id: aon.id,
      po_number: 'PO-2025-003',
      amount: 1500000,       // ₹15L — HR advisory
      description: 'HR policy framework, compensation benchmarking, and talent acquisition strategy for JPMorgan GCC',
      phase: 'HR, Talent & Onboarding',
      status: 'Rejected',   // Rejected — Aon vendor not approved (expired GST)
      created_by: PMO_USER_ID,
      approved_by: PMO_USER_ID,
      approval_date: daysAgo(20),
      rejection_reason: 'Vendor compliance documents expired. Aon Hewitt must renew GST certificate before PO can be raised.',
      sla_due_date: daysAgo(22),
    },
    // Goldman POs
    {
      project_id: goldman.id,
      vendor_id: lnt.id,
      po_number: 'PO-2025-004',
      amount: 28500000,      // ₹2.85 crore — full civil fit-out
      description: 'Complete office fit-out and civil construction for Goldman Sachs Tech Hub, Hyderabad — 45,000 sq ft across 3 floors',
      phase: 'Office Fit-Out & Civil',
      status: 'Approved',
      created_by: PMO_USER_ID,
      approved_by: PMO_USER_ID,
      approval_date: daysAgo(120),
      sla_due_date: daysAgo(125),
    },
    {
      project_id: goldman.id,
      vendor_id: cisco.id,
      po_number: 'PO-2025-005',
      amount: 14450000,      // ₹1.44 crore — IT infra (over budget)
      description: 'IT infrastructure: structured cabling, server racks, Cisco Catalyst switching stack, Meraki Wi-Fi, and firewall deployment',
      phase: 'IT Infrastructure',
      status: 'Pending Approval',  // Awaiting approval — SLA breached
      created_by: PMO_USER_ID,
      approved_by: null,
      approval_date: null,
      sla_due_date: slaBreachedDate.toISOString(), // SLA already breached
    },
    {
      project_id: goldman.id,
      vendor_id: cbre.id,
      po_number: 'PO-2025-006',
      amount: 3600000,       // ₹36L — facility management
      description: '12-month facility management contract: housekeeping, security, cafeteria operations, and maintenance for Goldman Sachs Hyderabad office',
      phase: 'Discovery & Advisory',
      status: 'Approved',
      created_by: PMO_USER_ID,
      approved_by: PMO_USER_ID,
      approval_date: daysAgo(100),
      sla_due_date: daysAgo(105),
    },
  ]).select();
  if (poErr) console.warn('  POs warning:', poErr.message);
  else console.log(`  ✅ Created ${purchaseOrders.length} purchase orders`);

  // ── 9. ESCALATIONS ────────────────────────────────────────────────────────
  console.log('\n⚠️  Creating escalations...');

  // SLA due dates based on severity at time of creation
  const criticalSLA = new Date(); criticalSLA.setHours(criticalSLA.getHours() - 2);  // 2h left (critical = 4h window)
  const highSLA_breached = new Date(); highSLA_breached.setHours(highSLA_breached.getHours() - 30); // breached (high = 24h)
  const mediumSLA = new Date(); mediumSLA.setDate(mediumSLA.getDate() + 2); // 2 days remaining
  const lowSLA = new Date(); lowSLA.setDate(lowSLA.getDate() + 4);

  const { data: escalations, error: escErr } = await supabase.from('escalations').insert([
    {
      // Client raises this — construction delay, SLA breached
      project_id: jpmorgan.id,
      raised_by: CLIENT_USER_ID,
      title: 'Civil Fit-Out Behind Schedule — Risking Go-Live Date',
      description: 'The office civil work is running 3 weeks behind the agreed Gantt plan. The false ceiling and flooring on floors 2 and 3 are incomplete. At current pace, we risk missing our December go-live date. We need an updated recovery plan from the contractor within 48 hours.',
      severity: 'High',
      status: 'In Progress',
      assigned_to: PMO_USER_ID,
      sla_due_date: highSLA_breached.toISOString(),
      created_at: daysAgo(2),
    },
    {
      // PMO raises this — vendor compliance expired
      project_id: jpmorgan.id,
      raised_by: PMO_USER_ID,
      title: 'Aon Hewitt GST Certificate Expired — PO Blocked',
      description: 'Aon Hewitt India\'s GST registration certificate expired 15 days ago. We cannot raise the HR advisory PO (PO-2025-003) until this is renewed. Aon has been notified twice but has not responded. Escalating for client awareness as HR policy framework milestone is at risk.',
      severity: 'Medium',
      status: 'Open',
      assigned_to: PMO_USER_ID,
      sla_due_date: mediumSLA.toISOString(),
      created_at: daysAgo(1),
    },
    {
      // Client raises this — IT budget overrun, needs approval
      project_id: goldman.id,
      raised_by: CLIENT_USER_ID,
      title: 'IT Infrastructure Budget Overrun — Approval Needed',
      description: 'The IT infrastructure phase (Cisco deployment) has exceeded the approved budget by ₹24.5 lakh (20.4% variance). The additional cost is driven by higher-spec firewalls required for Goldman\'s InfoSec standards. PO-2025-005 for ₹1.44 crore is pending approval for 3 days — SLA breached. Requesting urgent sign-off to unblock the contractor.',
      severity: 'Critical',
      status: 'In Progress',
      assigned_to: PMO_USER_ID,
      sla_due_date: criticalSLA.toISOString(),
      created_at: daysAgo(1),
    },
    {
      // PMO internal — safety non-compliance, resolved
      project_id: goldman.id,
      raised_by: PMO_USER_ID,
      title: 'Safety Inspection Non-Compliance — Floor 1 Electrical',
      description: 'Site inspection on Floor 1 flagged exposed electrical conduits near the server room entry. This is a non-compliance under IS:732 electrical safety standards. L&T site supervisor was notified and remediation is in progress.',
      severity: 'High',
      status: 'Resolved',
      assigned_to: PMO_USER_ID,
      sla_due_date: daysAgo(8),
      resolved_at: daysAgo(6),
      created_at: daysAgo(10),
    },
  ]).select();
  if (escErr) console.warn('  Escalations warning:', escErr.message);
  else console.log(`  ✅ Created ${escalations.length} escalations`);

  const [esc1, esc2, esc3, esc4] = escalations;

  // ── 10. ESCALATION COMMENTS ───────────────────────────────────────────────
  console.log('\n💬 Creating escalation comment threads...');

  const COMMENTS = [
    // Esc 1 — Construction delay thread (JPMorgan)
    { escalation_id: esc1.id, comment_by: CLIENT_USER_ID, comment_text: 'This is becoming a serious concern. Our CHRO is tracking the go-live date closely. Can Embark confirm a recovery plan by EOD tomorrow?', is_internal: false, created_at: daysAgo(2) },
    { escalation_id: esc1.id, comment_by: PMO_USER_ID, comment_text: 'Acknowledged, Michael. I\'ve called an urgent site meeting with Prestige Constructions for tomorrow 9 AM. Will share the recovery plan and revised Gantt by 5 PM tomorrow.', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc1.id, comment_by: PMO_USER_ID, comment_text: '[Internal] Prestige\'s site manager mentioned they\'re short on tiling workers this week. May need to bring in a second sub-contractor to accelerate. Need director approval if cost impact > ₹5L.', is_internal: true, created_at: daysAgo(1) },
    { escalation_id: esc1.id, comment_by: CLIENT_USER_ID, comment_text: 'Thank you Sarah. Please also include an impact assessment on the IT installation schedule — if civil is delayed, Cisco cannot begin their rack work either.', is_internal: false, created_at: daysAgo(1) },

    // Esc 2 — Vendor compliance thread
    { escalation_id: esc2.id, comment_by: PMO_USER_ID, comment_text: 'Sent formal notice to Aon Hewitt procurement team on 2 May. Awaiting renewal confirmation. Will follow up by phone tomorrow.', is_internal: false, created_at: daysAgo(1) },

    // Esc 3 — IT budget overrun thread (Goldman)
    { escalation_id: esc3.id, comment_by: CLIENT_USER_ID, comment_text: 'We understand the InfoSec requirement but a 20% variance needs CFO sign-off on our end. Can Embark share the technical justification document so we can fast-track internal approval?', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc3.id, comment_by: PMO_USER_ID, comment_text: 'Attached: Cisco\'s technical specification sheet and budget variance breakdown. The higher-spec Firepower 2100 series was mandated by Goldman\'s InfoSec team during the last audit. I\'ll also schedule a call with our IT lead if helpful.', is_internal: false, created_at: daysAgo(1) },
    { escalation_id: esc3.id, comment_by: PMO_USER_ID, comment_text: '[Internal] If client doesn\'t approve by end of day, we will hit the PO SLA at 6 PM. Loop in director for priority escalation.', is_internal: true, created_at: daysAgo(1) },

    // Esc 4 — Safety, resolved
    { escalation_id: esc4.id, comment_by: PMO_USER_ID, comment_text: 'L&T site engineer confirmed remediation complete as of this morning. All exposed conduits are now enclosed per IS:732. Re-inspection passed. Closing this escalation.', is_internal: false, created_at: daysAgo(6) },
  ];

  const { error: commErr } = await supabase.from('escalation_comments').insert(COMMENTS);
  if (commErr) console.warn('  Comments warning:', commErr.message);
  else console.log(`  ✅ Created ${COMMENTS.length} escalation comments`);

  // ── 11. SAFETY CHECKLISTS ─────────────────────────────────────────────────
  console.log('\n🦺 Creating safety checklists...');

  const { data: checklists, error: safetyErr } = await supabase.from('safety_checklists').insert([
    {
      project_id: goldman.id,
      inspection_date: dateOnly(daysAgo(10)),
      inspector_name: 'Rajesh Kumar (L&T Safety Officer)',
      overall_status: 'Non-Compliant',
      created_by: PMO_USER_ID,
    },
    {
      project_id: goldman.id,
      inspection_date: dateOnly(daysAgo(3)),
      inspector_name: 'Sarah Jenkins (Embark PMO)',
      overall_status: 'Completed',
      created_by: PMO_USER_ID,
    },
  ]).select();
  if (safetyErr) console.warn('  Safety checklists warning:', safetyErr.message);
  else {
    const [cl1, cl2] = checklists;

    await supabase.from('safety_checklist_items').insert([
      // First inspection — non-compliant (one failure)
      { checklist_id: cl1.id, item_name: 'Fire exits clearly marked and unobstructed', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'PPE available and in use on site', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Emergency contact numbers posted', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Electrical panel and conduits safely enclosed', is_compliant: false, notes: 'Exposed conduits found near server room entry on Floor 1. Non-compliant per IS:732.', checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'First aid kit stocked and accessible', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Hazardous material areas marked and segregated', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl1.id, item_name: 'Contractor site induction records up to date', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      // Second inspection — all clear
      { checklist_id: cl2.id, item_name: 'Fire exits clearly marked and unobstructed', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'PPE available and in use on site', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Emergency contact numbers posted', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Electrical panel and conduits safely enclosed', is_compliant: true, notes: 'Remediation complete. All conduits enclosed. Verified with L&T site engineer.', checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'First aid kit stocked and accessible', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Hazardous material areas marked and segregated', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
      { checklist_id: cl2.id, item_name: 'Contractor site induction records up to date', is_compliant: true, notes: null, checked_by: PMO_USER_ID },
    ]);
    console.log('  ✅ Safety checklists and items created');
  }

  // ── 12. NOTIFICATIONS ─────────────────────────────────────────────────────
  console.log('\n🔔 Creating notifications...');

  const NOTIFICATIONS = [
    // Michael Brown (client) notifications
    { user_id: CLIENT_USER_ID, notification_type: 'Escalation Update', message: 'Sarah Jenkins replied to your escalation: "Civil Fit-Out Behind Schedule"', related_entity_type: 'Escalation', related_entity_id: esc1.id, is_read: false, created_at: daysAgo(1) },
    { user_id: CLIENT_USER_ID, notification_type: 'Escalation Update', message: 'Sarah Jenkins replied to your escalation: "IT Infrastructure Budget Overrun"', related_entity_type: 'Escalation', related_entity_id: esc3.id, is_read: false, created_at: daysAgo(1) },
    { user_id: CLIENT_USER_ID, notification_type: 'SLA Alert', message: 'SLA BREACHED: Escalation "Civil Fit-Out Behind Schedule" is overdue by 6 hours', related_entity_type: 'Escalation', related_entity_id: esc1.id, is_read: false, created_at: daysAgo(1) },
    { user_id: CLIENT_USER_ID, notification_type: 'Stage Update', message: 'Your JPMorgan India GCC project has advanced to Stage 3: Model Selection', related_entity_type: 'Project', related_entity_id: jpmorgan.id, is_read: true, created_at: daysAgo(30) },

    // Sarah Jenkins (PMO) notifications
    { user_id: PMO_USER_ID, notification_type: 'Escalation', message: 'Michael Brown raised a Critical escalation: "IT Infrastructure Budget Overrun — Approval Needed"', related_entity_type: 'Escalation', related_entity_id: esc3.id, is_read: false, created_at: daysAgo(1) },
    { user_id: PMO_USER_ID, notification_type: 'Compliance Alert', message: 'Aon Hewitt India — GST Certificate EXPIRED. Vendor approval blocked.', related_entity_type: 'Vendor', related_entity_id: aon.id, is_read: false, created_at: daysAgo(1) },
    { user_id: PMO_USER_ID, notification_type: 'Compliance Alert', message: 'Prestige Constructions — ISO 9001 Certificate expiring in 20 days. Renewal required.', related_entity_type: 'Vendor', related_entity_id: prestige.id, is_read: false, created_at: daysAgo(1) },
    { user_id: PMO_USER_ID, notification_type: 'SLA Alert', message: 'PO-2025-005 (Cisco Systems, ₹1.44 crore) approval SLA BREACHED — pending for 72 hours', related_entity_type: 'PO', related_entity_id: purchaseOrders?.[4]?.id || null, is_read: false, created_at: daysAgo(1) },
    { user_id: PMO_USER_ID, notification_type: 'Milestone Alert', message: 'Milestone OVERDUE: "BOT Partner RFQ Responses Received" — JPMorgan India GCC', related_entity_type: 'Project', related_entity_id: jpmorgan.id, is_read: true, created_at: daysAgo(5) },
  ];

  const { error: notifErr } = await supabase.from('notifications').insert(NOTIFICATIONS);
  if (notifErr) console.warn('  Notifications warning:', notifErr.message);
  else console.log(`  ✅ Created ${NOTIFICATIONS.length} notifications`);

  // ── 13. AUDIT LOG ─────────────────────────────────────────────────────────
  console.log('\n📋 Creating audit log entries...');

  const AUDIT_ENTRIES = [
    { user_id: PMO_USER_ID, action: 'Created Project', entity_type: 'Project', entity_id: jpmorgan.id, new_value: 'JPMorgan India GCC — Bangalore', created_at: daysAgo(100) },
    { user_id: PMO_USER_ID, action: 'Advanced Stage', entity_type: 'Stage', entity_id: jpmorgan.id, old_value: 'Discovery', new_value: 'Evaluation', created_at: daysAgo(80) },
    { user_id: PMO_USER_ID, action: 'Advanced Stage', entity_type: 'Stage', entity_id: jpmorgan.id, old_value: 'Evaluation', new_value: 'Model Selection', created_at: daysAgo(45) },
    { user_id: PMO_USER_ID, action: 'Approved Vendor', entity_type: 'Vendor', entity_id: prestige.id, new_value: 'Prestige Constructions — Active', created_at: daysAgo(90) },
    { user_id: PMO_USER_ID, action: 'Approved PO', entity_type: 'PO', entity_id: purchaseOrders?.[0]?.id || null, new_value: 'PO-2025-001 — ₹42,00,000 approved', created_at: daysAgo(70) },
    { user_id: PMO_USER_ID, action: 'Rejected PO', entity_type: 'PO', entity_id: purchaseOrders?.[2]?.id || null, new_value: 'PO-2025-003 — Rejected. Vendor compliance expired.', created_at: daysAgo(20) },
    { user_id: PMO_USER_ID, action: 'Created Project', entity_type: 'Project', entity_id: goldman.id, new_value: 'Goldman Sachs Tech Hub — Hyderabad', created_at: daysAgo(180) },
    { user_id: CLIENT_USER_ID, action: 'Raised Escalation', entity_type: 'Escalation', entity_id: esc1.id, new_value: 'High: Civil Fit-Out Behind Schedule', created_at: daysAgo(2) },
    { user_id: PMO_USER_ID, action: 'Resolved Escalation', entity_type: 'Escalation', entity_id: esc4.id, new_value: 'Safety Non-Compliance — Floor 1 Electrical — Resolved', created_at: daysAgo(6) },
    { user_id: PMO_USER_ID, action: 'Created Project', entity_type: 'Project', entity_id: microsoft.id, new_value: 'Microsoft Innovation Centre — Pune', created_at: daysAgo(10) },
  ];

  const { error: auditErr } = await supabase.from('audit_logs').insert(AUDIT_ENTRIES);
  if (auditErr) console.warn('  Audit log warning:', auditErr.message);
  else console.log(`  ✅ Created ${AUDIT_ENTRIES.length} audit entries`);

  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n✅ Demo seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log('   Users     : 2 (Sarah Jenkins — PMO, Michael Brown — Client)');
  console.log('   Projects  : 3 (JPMorgan Stage 3, Goldman Stage 5 Blocked, Microsoft Stage 1)');
  console.log('   Vendors   : 6 (2 active, 1 pending/expired, 3 active with expiring docs)');
  console.log('   POs       : 6 (3 approved, 1 pending-SLA-breached, 1 rejected, 1 approved)');
  console.log('   Escalations: 4 (1 breached High, 1 open Medium, 1 Critical in-progress, 1 Resolved)');
  console.log('   Budget    : 15 phase-wise rows across 3 projects');
  console.log('   Safety    : 2 checklists (1 Non-Compliant, 1 Completed)');
  console.log('   Notifications: 9 (4 for client, 5 for PMO)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Login credentials:');
  console.log('   PMO  : pmo@demo.com     / pmo');
  console.log('   Client: client@demo.com / client');
  console.log('\n💡 Run: node supabase/setup.mjs first to verify tables exist.');
}

seed().catch(console.error);
