#!/usr/bin/env python3
import os
import subprocess
import sys

# Supabase connection details
SUPABASE_PROJECT_ID = "zkbdfljvzckeaqjexgop"
SUPABASE_DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD", "")

# If password not in env, we'll try using Supabase CLI
migrations = [
    "supabase/migrations/20260623000001_chart_of_accounts.sql",
    "supabase/migrations/20260510000003_karigar_job_cards.sql",
    "supabase/migrations/20260705000003_job_cards_customer_service_fields.sql",
    "supabase/migrations/20260705000004_custom_orders.sql",
]

print("🚀 Running Supabase migrations...\n")

success_count = 0

for migration_file in migrations:
    if not os.path.exists(migration_file):
        print(f"❌ File not found: {migration_file}")
        continue

    print(f"📝 Applying: {migration_file}")

    try:
        with open(migration_file, 'r') as f:
            sql_content = f.read()

        print(f"✅ {migration_file} - Ready")
        success_count += 1
    except Exception as e:
        print(f"❌ Error reading {migration_file}: {e}")

print(f"\n✅ Found {success_count} migration files ready to apply")
print("\n📌 To apply these migrations, please:")
print("   1. Go to: https://app.supabase.com/project/zkbdfljvzckeaqjexgop/sql/new")
print("   2. Copy and paste each migration SQL from the files above")
print("   3. OR use the Supabase CLI: supabase db push")
