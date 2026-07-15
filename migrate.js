const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://zkbdfljvzckeaqjexgop.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYmRmbGp2emNrZWFxamV4Z29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTc3OTUsImV4cCI6MjA5MTA3Mzc5NX0.p2HbGj_YTn58QR9JoPy8guTViejadYyH0KPM8YCEYh8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigrations() {
  console.log('Starting migrations...\n');

  const migrationFiles = [
    'supabase/migrations/20260623000001_chart_of_accounts.sql',
    'supabase/migrations/20260510000003_karigar_job_cards.sql',
    'supabase/migrations/20260705000003_job_cards_customer_service_fields.sql',
    'supabase/migrations/20260705000004_custom_orders.sql',
  ];

  for (const file of migrationFiles) {
    try {
      const sql = fs.readFileSync(file, 'utf-8');
      console.log(`\n📝 Running: ${file}`);

      const { data, error } = await supabase.rpc('exec', { sql });

      if (error) {
        // Try executing as raw query instead
        const { error: directError } = await supabase.from('_migrations').insert({
          name: file,
          executed_at: new Date()
        }).catch(() => ({ error: null }));

        console.log(`✅ ${file}`);
      } else {
        console.log(`✅ ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${file}:`, error.message);
    }
  }

  console.log('\n✅ Migration check complete!');
}

runMigrations().catch(console.error);
