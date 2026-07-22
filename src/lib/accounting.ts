import { supabase } from "@/integrations/supabase/client";

// Well-known accounts from Chart of Accounts' own default seed list
// (src/pages/ChartOfAccounts.tsx) — reused by code, not re-declared, so a
// transaction always posts to the SAME account a user sees/edits there.
export const ACCOUNTS = {
  CASH: { code: "1001", name: "Cash in Hand", type: "asset" },
  RECEIVABLE: { code: "1003", name: "Accounts Receivable", type: "asset" },
  PAYABLE: { code: "2001", name: "Accounts Payable", type: "liability" },
  GOLD_SALES: { code: "4001", name: "Gold Jewellery Sales", type: "revenue" },
  GOLD_PURCHASE: { code: "5001", name: "Gold Purchase", type: "expense" },
  MISC_EXPENSE: { code: "5022", name: "Miscellaneous Expenses", type: "expense" },
} as const;

type AccountKey = keyof typeof ACCOUNTS;

const accountIdCache = new Map<string, string>(); // `${businessId}:${code}` -> account id

async function getOrCreateAccountId(businessId: string, key: AccountKey): Promise<string | null> {
  const acc = ACCOUNTS[key];
  const cacheKey = `${businessId}:${acc.code}`;
  const cached = accountIdCache.get(cacheKey);
  if (cached) return cached;

  const { data: existing } = await (supabase.from("chart_of_accounts") as any)
    .select("id").eq("business_id", businessId).eq("code", acc.code).maybeSingle();
  if (existing?.id) { accountIdCache.set(cacheKey, existing.id); return existing.id; }

  // Account doesn't exist yet (e.g. business never opened Chart of Accounts,
  // which is what normally seeds the default list) — create just this one.
  const { data: created } = await (supabase.from("chart_of_accounts") as any)
    .insert({ business_id: businessId, code: acc.code, name: acc.name, type: acc.type })
    .select("id").single();
  if (!created?.id) return null;
  accountIdCache.set(cacheKey, created.id);
  return created.id;
}

export interface AccountPosting {
  account: AccountKey;
  debit?: number;
  credit?: number;
}

// Posts debit/credit lines to the Chart of Accounts ledger for a business
// transaction (sale, purchase, expense, repayment). This is supplementary
// bookkeeping only — if an account lookup/creation fails for any line, that
// line is silently skipped rather than blocking the real transaction, which
// has already been saved by the time this runs.
export async function postAccountEntries(businessId: string, description: string, postings: AccountPosting[]) {
  for (const p of postings) {
    const amount = p.debit || p.credit || 0;
    if (amount <= 0) continue;
    const accountId = await getOrCreateAccountId(businessId, p.account);
    if (!accountId) continue;
    await (supabase.from("ledger_entries") as any).insert({
      business_id: businessId,
      entry_type: "account",
      account_id: accountId,
      reference_id: accountId,
      description,
      debit: p.debit || 0,
      credit: p.credit || 0,
      balance: 0,
    });
  }
}
