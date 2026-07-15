#!/bin/bash

# Supabase details
PROJECT_ID="zkbdfljvzckeaqjexgop"
SUPABASE_URL="https://zkbdfljvzckeaqjexgop.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYmRmbGp2emNrZWFxamV4Z29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTc3OTUsImV4cCI6MjA5MTA3Mzc5NX0.p2HbGj_YTn58QR9JoPy8guTViejadYyH0KPM8YCEYh8"

echo "🚀 Checking migration files..."

# Create a temporary SQL file combining all migrations
TEMP_SQL="/tmp/migrations.sql"

# Chart of Accounts
cat supabase/migrations/20260623000001_chart_of_accounts.sql >> $TEMP_SQL
echo "" >> $TEMP_SQL

# Karigars & Job Cards
cat supabase/migrations/20260510000003_karigar_job_cards.sql >> $TEMP_SQL
echo "" >> $TEMP_SQL

# Job Cards Service Fields
cat supabase/migrations/20260705000003_job_cards_customer_service_fields.sql >> $TEMP_SQL
echo "" >> $TEMP_SQL

# Custom Orders
cat supabase/migrations/20260705000004_custom_orders.sql >> $TEMP_SQL

echo "✅ Combined migrations into: $TEMP_SQL"
echo ""
echo "📝 Migration files ready to be applied to Supabase"
echo ""
echo "To apply migrations manually:"
echo "1. Open: ${SUPABASE_URL}/projects/${PROJECT_ID}/sql"
echo "2. Copy and paste the SQL from each migration file"
echo ""
echo "Migrations to apply:"
echo "  ✓ Chart of Accounts (20260623000001)"
echo "  ✓ Karigars & Job Cards (20260510000003)"
echo "  ✓ Job Cards Service Fields (20260705000003)"
echo "  ✓ Custom Orders (20260705000004)"

rm $TEMP_SQL
