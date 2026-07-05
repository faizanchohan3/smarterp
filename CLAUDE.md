# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gold Jewellery ERP System** - A comprehensive business management system for gold jewellery retailers and manufacturers. Built with React, TypeScript, Tailwind CSS, Supabase, and Vite.

**Live App:** https://smarterp-cloud-main.vercel.app  
**Repository:** https://github.com/faizanchohan3/smarterp

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS + shadcn/ui components
- **Backend:** Supabase (PostgreSQL) with row-level security (RLS)
- **Authentication:** Supabase Auth (email/password)
- **Data Fetching:** TanStack React Query (for caching and server state)
- **Routing:** React Router v6
- **UI Components:** Radix UI primitives wrapped by shadcn/ui
- **Charts:** Recharts
- **Deployment:** Vercel (with GitHub auto-deploy)

## Architecture & Folder Structure

```
src/
├── components/          # Reusable React components
│   ├── layout/         # App layout wrapper (AppLayout with sidebar)
│   ├── shared/         # Shared components (DataTable, ImageUpload, etc.)
│   └── ui/             # shadcn/ui component library
├── pages/              # Page components (one per route/feature)
│   ├── admin/          # Admin-only pages (shops, users management)
│   └── reports/        # Financial & analytics reports
├── contexts/           # React Context (AuthContext for user/business state)
├── hooks/              # Custom React hooks (useBusinessData, use-toast, etc.)
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client & auto-generated types
├── lib/                # Utility functions (formatting, calculations)
├── assets/             # Static images/logos
├── test/               # Test files
├── main.tsx            # App entry point
├── App.tsx             # Router configuration
└── index.css           # Global Tailwind styles
```

## Core Patterns & Conventions

### 1. Data Fetching with `useBusinessData` Hook
All table operations use the `useBusinessData` hook. It handles:
- Automatic business_id filtering (multi-tenancy)
- CRUD operations (create, update, delete)
- Error handling with toast notifications
- Auto-refresh after mutations

**Usage Example:**
```tsx
const { data, create, update, remove } = useBusinessData("products");
```

**Supported Tables:** customers, suppliers, employees, categories, products, sales, purchases, expenses, payments, ledger_entries, salaries, sale_items, purchase_items, gold_rates, chart_of_accounts

**Note:** If adding a new table, update the `TableName` type in `src/hooks/useBusinessData.ts`.

### 2. Page Structure Pattern
Every page follows this pattern:
1. State management (useState for form state)
2. Data fetching (useBusinessData hooks)
3. UI sections with Form + DataTable
4. Dialog/Modal for create/edit forms

**Example:** See `src/pages/Products.tsx` or `src/pages/Customers.tsx`

### 3. Component Imports
Always use the `@` alias (configured in vite.config.ts):
```tsx
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
```

### 4. Styling Conventions
- Use Tailwind classes for styling
- Use `className` for styling components
- UI components from shadcn/ui already include default styling
- Theme support (light/dark mode) via CSS variables (colors in `index.css`)

### 5. Database Filtering & Multi-tenancy
Every table has a `business_id` column. The `useBusinessData` hook automatically filters by current business:
```tsx
.eq("business_id", businessId)
```

**Important:** When querying Supabase directly, always include this filter.

### 6. Authentication & Authorization
- **AuthContext** (`src/contexts/AuthContext.tsx`) stores:
  - `user` - Supabase auth user
  - `role` - "super_admin" or "business_admin" or "staff"
  - `businessId` - Current user's business
  - `businessStatus` - "pending" or "approved"
- **Role-based Routes:** See `App.tsx` for route protection by role
- **Super Admin Routes:** `/admin` (shops, users) - only for super_admin role
- **Business Routes:** `/dashboard`, `/sales`, etc. - for approved businesses

### 7. Routing Structure
```tsx
// In App.tsx - Routes are organized by user type/status:
- Unauthenticated: Auth page only
- Super Admin: /admin, /admin/shops, /admin/users
- Pending Approval: PendingApproval page
- Approved Users: Full access to business pages
```

## Database Schema Overview

**Key Tables:**
- `businesses` - Shop/business accounts (multi-tenancy)
- `profiles` - User profile data
- `user_roles` - Role assignments (super_admin, business_admin, staff)
- `customers`, `suppliers` - Business contacts
- `products`, `categories` - Inventory items
- `sales`, `sale_items` - Transaction history
- `purchases`, `purchase_items` - Purchase records
- `employees`, `salaries` - Payroll
- `expenses`, `payments` - Financial tracking
- `ledger_entries` - Accounting general ledger
- `gold_rates` - Historical gold price tracking
- `chart_of_accounts` - Account chart for accounting

**Generated Types:** `src/integrations/supabase/types.ts` (auto-generated - do NOT edit directly)

## Common Commands

### Development
```bash
npm run dev              # Start dev server (port 8080)
npm run build            # Production build
npm run build:dev        # Dev build
npm run preview          # Preview production build locally
```

### Linting & Testing
```bash
npm run lint             # ESLint check
npm test                 # Run Vitest (once)
npm run test:watch       # Vitest in watch mode
```

### Database
```bash
# Types are auto-generated from Supabase schema
# To regenerate after schema changes:
# Use Supabase CLI or manual regeneration (see Supabase docs)
```

## Adding a New Feature/Module

### 1. **Add Database Table** (if needed)
   - Create migration in Supabase
   - Regenerate types: `src/integrations/supabase/types.ts`
   - Update `TableName` type in `src/hooks/useBusinessData.ts`

### 2. **Create Page Component**
   - Add new file in `src/pages/[FeatureName].tsx`
   - Follow the pattern from existing pages (see `Products.tsx`)
   - Use `AppLayout` wrapper for consistent layout

### 3. **Add Route in App.tsx**
   ```tsx
   import NewFeature from "./pages/NewFeature";
   // Add to Routes:
   <Route path="/new-feature" element={<NewFeature />} />
   ```

### 4. **Add Sidebar Menu Item** (optional)
   - Edit `src/components/layout/AppSidebar.tsx`
   - Add link following existing patterns

### 5. **Handle Permissions** (if needed)
   - Check `useAuth()` for role/permissions
   - Conditionally render based on user role
   - Consider RLS policies in Supabase for data access

## Important Development Notes

### Environment Variables
Set these in `.env.local` (ignored by git):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### Row-Level Security (RLS)
Supabase tables use RLS policies:
- Users can only see data for their own business
- Super admins have different policies
- Verify RLS is working when adding new tables

### TypeScript
The project uses strict mode and auto-generated Supabase types. Always:
- Use proper typing for props and state
- Import types from `@/integrations/supabase/types`
- Don't use `any` unless absolutely necessary

### Images & Assets
- Product images stored in Supabase Storage (upload via `ImageUpload` component)
- Static logos in `src/assets/`
- Image URLs stored in database

### Deployment
- **Production:** https://smarterp-cloud-main.vercel.app (auto-deploys from main branch)
- **Dev Server:** http://localhost:8080 (or 8081+ if port busy)
- Favicon: Gold bar emoji from Twemoji CDN (configured in `index.html`)

## Project Status & Recent Work

**Completed Modules:** Dashboard, Sales, Purchases, Customers, Suppliers, Inventory, Accounting (Chart of Accounts, Ledger), Payroll (Employees, Salaries), Expenses, Payments, Gold Rate Tracking, Multi-location Support, Admin Panel, Reports (12+ reports)

**In Progress/Planned:**
- Item Serialization (serial numbers, barcodes for individual pieces)
- Repair & Service Module
- Custom Order System
- Enhanced Purity Tracking (24K, 22K, 18K, 14K separation)
- QR/Barcode Scanner in Sales
- Hallmarking & Certification Tracking

**Test Your Changes:** Use `/run` skill to start dev server and test in browser before committing.

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/App.tsx` | Route configuration & auth guards |
| `src/contexts/AuthContext.tsx` | User auth state management |
| `src/hooks/useBusinessData.ts` | Main CRUD hook for all tables |
| `src/components/layout/AppLayout.tsx` | App container with sidebar |
| `src/components/shared/DataTable.tsx` | Reusable table component |
| `vite.config.ts` | Build configuration & path aliases |
| `tailwind.config.ts` | Theme colors & Tailwind setup |
| `index.html` | Entry HTML & favicon |
