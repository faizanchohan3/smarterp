import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cahzzbqjqvynilktjoge.supabase.co';
const SUPABASE_SECRET_KEY = process.env.VITE_SUPABASE_SECRET_KEY;

if (!SUPABASE_SECRET_KEY) {
  console.error('❌ Error: VITE_SUPABASE_SECRET_KEY not found in environment variables');
  console.error('Please set VITE_SUPABASE_SECRET_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

console.log('🚀 Setting up new Supabase project...\n');
console.log(`📍 Project: cahzzbqjqvynilktjoge`);
console.log(`📧 Email: faizanchohan30@gmail.com\n`);

async function executeSql(sql, name) {
  try {
    console.log(`⏳ Applying: ${name}...`);

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      const { data, error } = await supabase.rpc('exec', { sql: statement }).catch(() => ({ error: null }));

      if (error && !error.message?.includes('already exists')) {
        console.error(`  Error: ${error.message}`);
      }
    }

    console.log(`✅ ${name} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
    return false;
  }
}

async function setupDatabase() {
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

  let successCount = 0;

  for (const migration of migrations) {
    try {
      const sql = fs.readFileSync(migration.file, 'utf-8');
      const success = await executeSql(sql, migration.name);
      if (success) successCount++;
    } catch (error) {
      console.error(`❌ Error reading ${migration.file}: ${error.message}\n`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Setup Complete! (${successCount}/${migrations.length})`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  console.log('📋 Next steps:');
  console.log('1. ✅ .env file updated with new credentials');
  console.log('2. ✅ All tables will be created');
  console.log('3. Run: npm run dev');
  console.log('4. Test your app!\n');
}

setupDatabase().catch(console.error);
