import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lmajrojnrnrwlerjxatk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYWpyb2pucm5yd2xlcmp4YXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQ1MjQsImV4cCI6MjA5MzU5MDUyNH0.JiWjd8_tmM5UmnugiBbZldWSgwGpsNE0PA8_QQYlhUc';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const STAGE_NAMES = ['Discovery', 'Evaluation', 'Model Selection', 'Design & Planning', 'Construction & Execution', 'Handover & Post-Construction'];

async function seed() {
  console.log('🚀 Seeding demo data...');

  // 1. Get the first user (the one you just created via Sign Up)
  const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
  if (userError || !users.length) {
    console.error('❌ No users found. Please SIGN UP in the web app first before running the seed script.');
    return;
  }
  const myId = users[0].id;
  console.log(`✅ Found user profile: ${myId}. Assigning demo data...`);

  // 2. Projects
  const PROJECTS = [
    { project_name: 'JPMorgan India GCC', location: 'Bangalore', client_name: 'JPMorgan Chase', current_stage: 3, stage_status: 'In Progress', total_budget: 5000000, actual_spent: 1200000, start_date: '2024-11-01', target_end_date: '2025-12-31', created_by: myId },
    { project_name: 'Goldman Sachs Hub', location: 'Hyderabad', client_name: 'Goldman Sachs', current_stage: 2, stage_status: 'In Progress', total_budget: 3500000, actual_spent: 450000, start_date: '2024-12-15', target_end_date: '2026-03-31', created_by: myId },
  ];

  const { data: insertedProjects, error: projError } = await supabase.from('projects').insert(PROJECTS).select();
  if (projError) return console.error('Error seeding projects:', projError);

  // 3. Stages & Gates
  console.log('  Generating stages & gates...');
  const DEFAULT_GATES = {
    1: ['Feasibility Report Submitted', 'Budget Estimate Approved', 'City Shortlist Finalized'],
    2: ['City Comparison Report Done', 'Cost Analysis Complete', 'Talent Assessment Done'],
    3: ['BOT Partner Shortlisted', 'Legal Framework Agreed', 'Vendor List Approved'],
    4: ['Office Layout Finalized', 'IT Architecture Approved', 'HR Plan Submitted'],
    5: ['Construction 50% Complete', 'IT Infrastructure Installed', 'Safety Inspection Passed'],
    6: ['Final Walkthrough Done', 'Handover Documents Signed', 'Post-Construction Review'],
  };

  for (const p of insertedProjects) {
    for (let s = 1; s <= 6; s++) {
      let status = s < p.current_stage ? 'Completed' : s === p.current_stage ? 'In Progress' : 'Not Started';
      
      const { data: stage } = await supabase.from('stages').insert({ 
        project_id: p.id, stage_number: s, stage_name: STAGE_NAMES[s - 1], 
        status, completion_percentage: s < p.current_stage ? 100 : s === p.current_stage ? 40 : 0
      }).select().single();

      const items = DEFAULT_GATES[s] || [];
      const gates = items.map(item => ({
        stage_id: stage.id, gate_item: item, required: true, 
        completed: status === 'Completed', completed_by: status === 'Completed' ? myId : null
      }));
      await supabase.from('stage_gates').insert(gates);
    }
  }

  console.log('✅ Demo data seeded successfully!');
}

seed().catch(console.error);
