import { supabase } from "@/integrations/supabase/client";

// Calls the /api/admin-action serverless function, which uses the
// service role key server-side (never exposed to the browser) after
// verifying the caller is a super_admin.
async function callAdminAction(body: Record<string, any>): Promise<{ error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not logged in" };

  const res = await fetch("/api/admin-action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error || `Request failed (${res.status})` };
  return {};
}

export const adminResetPassword = (targetUserId: string, newPassword: string) =>
  callAdminAction({ action: "reset_password", targetUserId, newPassword });

export const adminDeleteUser = (targetUserId: string) =>
  callAdminAction({ action: "delete_user", targetUserId });

async function callAdminActionData(body: Record<string, any>): Promise<{ data?: any; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not logged in" };

  const res = await fetch("/api/admin-action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error || `Request failed (${res.status})` };
  return { data: json };
}

export const adminDiagnoseShop = (businessId: string) =>
  callAdminActionData({ action: "diagnose_shop", businessId });

export const adminRelinkOwner = (businessId: string, email: string) =>
  callAdminActionData({ action: "relink_owner", businessId, email });
