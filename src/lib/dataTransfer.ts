import { supabase } from "@/integrations/supabase/client";

// Tables in FK-dependency order (parents before children) — both export and
// import walk this list in order, so on import every foreign key a row
// needs has already been assigned its new id by the time that row is
// inserted.
// Note: purchase_sales isn't included here — its migration was never
// applied to the live database (and the app doesn't use it; resale
// tracking goes through `expenses` with category "purchase_resale"
// instead), so querying it 404s with "table not found in schema cache".
const TABLES = [
  "categories", "customers", "suppliers", "employees", "karigars",
  "chart_of_accounts", "products", "gold_rates", "sales", "purchases",
  "sale_items", "purchase_items", "expenses", "salaries",
  "job_cards", "custom_orders", "payments", "ledger_entries",
] as const;

type TableName = typeof TABLES[number];

export interface ShopDataBundle {
  version: 1;
  exported_at: string;
  shop_name: string;
  tables: Record<string, any[]>;
}

// sale_items and purchase_items have no business_id column of their own --
// they're scoped indirectly via sale_id -> sales.business_id / purchase_id
// -> purchases.business_id -- so they can't be filtered with .eq("business_id",
// ...) like every other table. Scope them via the parent ids instead (both
// parents are exported earlier in TABLES, so they're already in `tables`).
const CHILD_SCOPE: Partial<Record<TableName, { parentField: string; parentTable: TableName }>> = {
  sale_items: { parentField: "sale_id", parentTable: "sales" },
  purchase_items: { parentField: "purchase_id", parentTable: "purchases" },
};

export async function exportBusinessData(businessId: string, shopName: string): Promise<ShopDataBundle> {
  const tables: Record<string, any[]> = {};
  for (const table of TABLES) {
    const childScope = CHILD_SCOPE[table];
    if (childScope) {
      const parentIds = (tables[childScope.parentTable] || []).map((r: any) => r.id);
      if (parentIds.length === 0) { tables[table] = []; continue; }
      const { data, error } = await (supabase.from(table as any) as any)
        .select("*").in(childScope.parentField, parentIds);
      if (error) throw new Error(`Failed exporting ${table}: ${error.message}`);
      tables[table] = data || [];
      continue;
    }
    const { data, error } = await (supabase.from(table as any) as any).select("*").eq("business_id", businessId);
    if (error) throw new Error(`Failed exporting ${table}: ${error.message}`);
    tables[table] = data || [];
  }
  return { version: 1, exported_at: new Date().toISOString(), shop_name: shopName, tables };
}

export function downloadShopData(bundle: ShopDataBundle) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (bundle.shop_name || "shop").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.href = url;
  a.download = `${safeName}-data-${bundle.exported_at.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function countRecords(bundle: ShopDataBundle): number {
  return TABLES.reduce((sum, t) => sum + (bundle.tables[t]?.length || 0), 0);
}

export function recordCountsByTable(bundle: ShopDataBundle): [string, number][] {
  return TABLES.map(t => [t, bundle.tables[t]?.length || 0]).filter(([, n]) => n > 0);
}

// Foreign-key fields to remap on import, keyed by table. `table` is which
// id-map to look the old value up in. Self-referencing FKs (chart_of_accounts
// .parent_id) are patched in a second pass, once every row in that table has
// a new id.
const FK_MAP: Partial<Record<TableName, { field: string; table: TableName }[]>> = {
  chart_of_accounts: [{ field: "parent_id", table: "chart_of_accounts" }],
  products: [{ field: "category_id", table: "categories" }],
  sales: [{ field: "customer_id", table: "customers" }],
  purchases: [{ field: "supplier_id", table: "suppliers" }, { field: "customer_id", table: "customers" }],
  sale_items: [{ field: "sale_id", table: "sales" }, { field: "product_id", table: "products" }],
  purchase_items: [{ field: "purchase_id", table: "purchases" }, { field: "product_id", table: "products" }],
  salaries: [{ field: "employee_id", table: "employees" }],
  job_cards: [{ field: "karigar_id", table: "karigars" }, { field: "customer_id", table: "customers" }],
  custom_orders: [{ field: "customer_id", table: "customers" }, { field: "karigar_id", table: "karigars" }],
  payments: [{ field: "sale_id", table: "sales" }, { field: "custom_order_id", table: "custom_orders" }],
};

// payments.reference_id and ledger_entries.reference_id/account_id point at
// different tables depending on a sibling column (type / entry_type) rather
// than always the same table, so they can't go through FK_MAP.
const PAYMENT_TYPE_TABLE: Record<string, TableName> = {
  customer_payment: "customers", supplier_payment: "suppliers",
  karigar_payment: "karigars", employee_payment: "employees",
};
const LEDGER_ENTRY_TYPE_TABLE: Record<string, TableName> = {
  customer: "customers", supplier: "suppliers", employee: "employees",
  karigar: "karigars", account: "chart_of_accounts",
};

// Bulk insert is one SQL statement — a single row tripping a constraint
// (e.g. a duplicate chart-of-accounts code or product serial number) would
// otherwise fail the whole batch. Retry row-by-row so one bad record is
// skipped instead of aborting the rest of that table's import.
async function insertRows(table: TableName, rows: any[]): Promise<{ inserted: number; skipped: number }> {
  if (rows.length === 0) return { inserted: 0, skipped: 0 };
  const { error } = await (supabase.from(table as any) as any).insert(rows);
  if (!error) return { inserted: rows.length, skipped: 0 };

  let inserted = 0, skipped = 0;
  for (const row of rows) {
    const { error: rowErr } = await (supabase.from(table as any) as any).insert([row]);
    if (rowErr) skipped++; else inserted++;
  }
  return { inserted, skipped };
}

export interface ImportResult {
  inserted: Record<string, number>;
  skipped: Record<string, number>;
}

export async function importBusinessData(businessId: string, bundle: ShopDataBundle): Promise<ImportResult> {
  const idMaps: Record<TableName, Map<string, string>> = Object.fromEntries(
    TABLES.map(t => [t, new Map<string, string>()])
  ) as any;
  const inserted: Record<string, number> = {};
  const skipped: Record<string, number> = {};

  // chart_of_accounts has a UNIQUE(business_id, code) constraint — if the
  // target shop already opened Chart of Accounts it'll have the same
  // default codes (1001, 2001, ...), so re-inserting would collide. Reuse
  // the existing account for any code that already exists instead.
  const { data: existingAccounts } = await (supabase.from("chart_of_accounts") as any)
    .select("id, code").eq("business_id", businessId);
  const existingAccountByCode = new Map((existingAccounts || []).map((a: any) => [a.code, a.id]));

  for (const table of TABLES) {
    const rows: any[] = bundle.tables[table] || [];
    if (rows.length === 0) { inserted[table] = 0; skipped[table] = 0; continue; }

    const fkRules = FK_MAP[table] || [];
    const toInsert: any[] = [];
    const deferredParent: { newId: string; oldParentId: string }[] = [];
    let reused = 0;

    for (const row of rows) {
      const oldId = row.id;

      if (table === "chart_of_accounts" && existingAccountByCode.has(row.code)) {
        idMaps.chart_of_accounts.set(oldId, existingAccountByCode.get(row.code) as string);
        reused++;
        continue;
      }

      const newId = crypto.randomUUID();
      idMaps[table].set(oldId, newId);
      const clean: any = { ...row, id: newId };
      // sale_items/purchase_items have no business_id column -- they're
      // scoped only via their parent row, which already got the new
      // business_id when it was imported.
      if (!CHILD_SCOPE[table]) clean.business_id = businessId;

      for (const rule of fkRules) {
        const oldVal = row[rule.field];
        if (!oldVal) continue;
        if (rule.table === table) {
          // Target row's new id may not exist yet — patched after insert.
          delete clean[rule.field];
          deferredParent.push({ newId, oldParentId: oldVal });
          continue;
        }
        clean[rule.field] = idMaps[rule.table].get(oldVal) || null;
      }

      if (table === "payments" && row.type && row.reference_id) {
        const refTable = PAYMENT_TYPE_TABLE[row.type];
        clean.reference_id = refTable ? (idMaps[refTable].get(row.reference_id) || null) : row.reference_id;
      }
      if (table === "ledger_entries") {
        const refTable = LEDGER_ENTRY_TYPE_TABLE[row.entry_type];
        if (refTable) {
          if (row.reference_id) clean.reference_id = idMaps[refTable].get(row.reference_id) || row.reference_id;
          if ("account_id" in row && row.account_id) clean.account_id = idMaps[refTable].get(row.account_id) || row.account_id;
        }
      }

      toInsert.push(clean);
    }

    const result = await insertRows(table, toInsert);
    inserted[table] = result.inserted + reused;
    skipped[table] = result.skipped;

    if (deferredParent.length > 0) {
      for (const { newId, oldParentId } of deferredParent) {
        const newParentId = idMaps.chart_of_accounts.get(oldParentId);
        if (newParentId) {
          await (supabase.from("chart_of_accounts") as any).update({ parent_id: newParentId }).eq("id", newId);
        }
      }
    }
  }

  return { inserted, skipped };
}
