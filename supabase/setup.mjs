// Supabase Connection Test & Seed Script
const SUPABASE_URL = 'https://lmajrojnrnrwlerjxatk.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYWpyb2pucm5yd2xlcmp4YXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQ1MjQsImV4cCI6MjA5MzU5MDUyNH0.JiWjd8_tmM5UmnugiBbZldWSgwGpsNE0PA8_QQYlhUc';

const headers = { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' };

async function checkTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, { headers });
  console.log(`  ${table}: ${res.status} ${res.ok ? '✅' : '❌'}`);
  if (!res.ok) {
    const text = await res.text();
    console.log(`    ${text.substring(0, 150)}`);
  }
  return res.ok;
}

async function main() {
  console.log('🔗 Testing Supabase table access...\n');
  
  const tables = ['users', 'projects', 'stages', 'stage_gates', 'milestones', 'vendors', 'vendor_compliance', 'purchase_orders', 'budget', 'escalations', 'escalation_comments', 'notifications', 'audit_log', 'safety_checklists', 'safety_checklist_items'];
  
  let allExist = true;
  for (const t of tables) {
    const exists = await checkTable(t);
    if (!exists) allExist = false;
  }

  if (!allExist) {
    console.log('\n⚠️  Some tables are missing. Please create them:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/lmajrojnrnrwlerjxatk/sql/new');
    console.log('   2. Paste contents of supabase/migration.sql');
    console.log('   3. Click "Run"');
    console.log('   4. Then re-run: node supabase/setup.mjs');
  } else {
    console.log('\n✅ All tables exist!');
    console.log('\n💡 Tip: Run "node supabase/seed.mjs" to populate the database with demo data.');
  }
}


main().catch(console.error);
