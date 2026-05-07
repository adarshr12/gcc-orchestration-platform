import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lmajrojnrnrwlerjxatk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYWpyb2pucm5yd2xlcmp4YXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQ1MjQsImV4cCI6MjA5MzU5MDUyNH0.JiWjd8_tmM5UmnugiBbZldWSgwGpsNE0PA8_QQYlhUc';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const PMO_EMAIL = 'pmo_new@demo.com';
const CLIENT_EMAIL = 'client_new@demo.com';
const PASSWORD = 'Password123!';

async function getOrCreateUser(email, password, metadata) {
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ 
    email, 
    password,
    options: { data: metadata }
  });
  if (signUpData?.user?.id && !signUpErr) return signUpData.user.id;
  
  // If user already exists or fails, sign in instead
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInData?.user?.id) return signInData.user.id;
  
  throw new Error(`Auth failed: ${signUpErr?.message || ''} / ${signInErr?.message || ''}`);
}

async function seedCustomUsersAndData() {
  console.log('🚀 Starting custom user and data seed...');

  try {
    // 1. Create PMO User in Auth
    console.log(`\n👤 Creating PMO user: ${PMO_EMAIL}`);
    const pmoUserId = await getOrCreateUser(PMO_EMAIL, PASSWORD, { name: 'Custom PMO', role: 'PMO' });

    // 2. Create Client User in Auth
    console.log(`👤 Creating Client user: ${CLIENT_EMAIL}`);
    const clientUserId = await getOrCreateUser(CLIENT_EMAIL, PASSWORD, { name: 'Custom Client', role: 'Client' });

  // 3. Insert into public.users
  console.log('\n📝 Adding users to public.users table...');
  const { error: userInsertErr } = await supabase.from('users').upsert([
    { id: pmoUserId, name: 'Custom PMO User', email: PMO_EMAIL, role: 'PMO', phone: '+1-555-0001' },
    { id: clientUserId, name: 'Custom Client User', email: CLIENT_EMAIL, role: 'Client', phone: '+1-555-0002' },
  ]);
  if (userInsertErr) {
    console.error('Error inserting into public.users:', userInsertErr.message);
    return;
  }

  // 4. Create a Project
  console.log('\n📁 Creating a project...');
  const { data: project, error: projErr } = await supabase.from('projects').insert([{
    project_name: 'Custom India GCC Project',
    location: 'Bangalore',
    client_name: 'Custom Enterprise Inc',
    current_stage: 2,
    stage_status: 'In Progress',
    total_budget: 50000000,
    actual_spent: 5000000,
    start_date: new Date().toISOString().split('T')[0],
    target_end_date: new Date(Date.now() + 31536000000).toISOString().split('T')[0], // 1 year from now
    created_by: pmoUserId,
  }]).select().single();
  if (projErr) {
    console.error('Error creating project:', projErr.message);
    return;
  }

  // Assign project to client user
  await supabase.from('users').update({ assigned_project_id: project.id }).eq('id', clientUserId);

  // 5. Add a Vendor
  console.log('🏢 Creating a vendor...');
  const { data: vendor, error: vendorErr } = await supabase.from('vendors').insert([{
    project_id: project.id,
    vendor_name: 'Custom Vendor Solutions',
    vendor_type: 'Construction',
    contact_email: 'vendor@custom.com',
    contact_phone: '+1-555-0003',
    status: 'Approved',
    approved_by: pmoUserId,
  }]).select().single();

  // 6. Add a Milestone
  console.log('🎯 Creating a milestone...');
  await supabase.from('milestones').insert([{
    project_id: project.id,
    milestone_name: 'Kickoff Meeting Completed',
    due_date: new Date().toISOString().split('T')[0],
    status: 'Completed',
    owner_id: pmoUserId,
    priority: 'High',
  }]);

  // 7. Add an Escalation from Client
  console.log('⚠️ Creating an escalation...');
  await supabase.from('escalations').insert([{
    project_id: project.id,
    raised_by: clientUserId,
    title: 'Delay in vendor onboarding',
    description: 'The construction vendor onboarding is taking longer than expected. Please expedite.',
    severity: 'Medium',
    status: 'Open',
    assigned_to: pmoUserId,
    sla_due_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
  }]);

  console.log('\n✅ Custom User and Data Seed Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PMO Login: custom_pmo@demo.com / Password123!');
  console.log('Client Login: custom_client@demo.com / Password123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('An error occurred during seeding:', err);
  }
}

seedCustomUsersAndData().catch(console.error);
