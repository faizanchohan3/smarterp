const fs = require('fs');
const path = require('path');

async function executeSql(sql) {
  const url = 'https://zkbdfljvzckeaqjexgop.supabase.co/rest/v1/rpc/exec';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYmRmbGp2emNrZWFxamV4Z29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTc3OTUsImV4cCI6MjA5MTA3Mzc5NX0.p2HbGj_YTn58QR9JoPy8guTViejadYyH0KPM8YCEYh8';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'apikey': apiKey,
      },
      body: JSON.stringify({ sql })
    });

    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting Supabase migrations...\n');

  const migrations = [
    {
      name: 'Chart of Accounts',
      file: 'supabase/migrations/20260623000001_chart_of_accounts.sql'
    },
    {
      name: 'Karigars & Job Cards',
      file: 'supabase/migrations/20260510000003_karigar_job_cards.sql'
    },
    {
      name: 'Job Cards Service Fields',
      file: 'supabase/migrations/20260705000003_job_cards_customer_service_fields.sql'
    },
    {
      name: 'Custom Orders',
      file: 'supabase/migrations/20260705000004_custom_orders.sql'
    }
  ];

  for (const migration of migrations) {
    try {
      console.log(`\n📝 Applying: ${migration.name}`);
      const sql = fs.readFileSync(migration.file, 'utf-8');

      const result = await executeSql(sql);

      if (result.success || result.status === 201) {
        console.log(`✅ ${migration.name} - Success`);
      } else if (result.status === 409 || (result.data && result.data.message && result.data.message.includes('already exists'))) {
        console.log(`⚠️  ${migration.name} - Already exists (skipping)`);
      } else {
        console.log(`❌ ${migration.name} - Error:`);
        console.log(`   Status: ${result.status}`);
        console.log(`   ${JSON.stringify(result.data || result.error)}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${migration.name}:`, error.message);
    }
  }

  console.log('\n✅ Migration process completed!');
  console.log('📌 If you see errors about "already exists", the tables are already created - this is normal.');
}

runAllMigrations();
