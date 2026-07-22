import { createClient } from '@supabase/supabase-js';

// Vercel serverless function — runs server-side only.
// Uses the Supabase SERVICE ROLE key (never exposed to the browser) to
// perform privileged auth actions (password reset, delete user) after
// verifying the caller is an authenticated super_admin.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY as string;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured: missing SUPABASE_SECRET_KEY env var on Vercel' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Verify the token belongs to a real, currently-authenticated user
  const { data: callerData, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !callerData?.user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // Confirm the caller is a super_admin
  const { data: roleRows } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', callerData.user.id)
    .eq('role', 'super_admin')
    .limit(1);

  if (!roleRows || roleRows.length === 0) {
    return res.status(403).json({ error: 'Only super admins can perform this action' });
  }

  const { action, targetUserId, newPassword, businessId, email } = req.body || {};

  // Paginate through auth.users to find one by email — the Admin API has no
  // direct getUserByEmail in this SDK version.
  const findAuthUserByEmail = async (targetEmail: string) => {
    const needle = String(targetEmail).trim().toLowerCase();
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const match = data.users.find(u => (u.email || '').toLowerCase() === needle);
      if (match) return match;
      if (data.users.length < 200) break; // last page
    }
    return null;
  };

  try {
    if (action === 'reset_password') {
      if (!targetUserId || !newPassword || String(newPassword).length < 6) {
        return res.status(400).json({ error: 'targetUserId and a password of 6+ characters are required' });
      }
      const { error } = await admin.auth.admin.updateUserById(targetUserId, { password: newPassword });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'delete_user') {
      if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });
      const { error } = await admin.auth.admin.deleteUser(targetUserId);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    // Reads the raw state behind a shop's login so a stuck "Pending Approval"
    // account (that shows Approved in Admin > Shops) can be diagnosed instead
    // of guessed at: does businesses.user_id even point to a real auth user,
    // does it match the expected login email, and what does user_roles hold.
    if (action === 'diagnose_shop') {
      if (!businessId) return res.status(400).json({ error: 'businessId is required' });
      const { data: business, error: bizErr } = await admin.from('businesses').select('*').eq('id', businessId).maybeSingle();
      if (bizErr) return res.status(400).json({ error: bizErr.message });
      if (!business) return res.status(404).json({ error: 'Business not found' });

      let authUser: any = null;
      let authUserError: string | null = null;
      if (business.user_id) {
        const { data, error } = await admin.auth.admin.getUserById(business.user_id);
        if (error) authUserError = error.message;
        else authUser = data.user;
      }

      const { data: roleRows2 } = await admin.from('user_roles').select('*').eq('user_id', business.user_id || '00000000-0000-0000-0000-000000000000');
      const { data: profileRow } = await admin.from('profiles').select('*').eq('user_id', business.user_id || '00000000-0000-0000-0000-000000000000').maybeSingle();

      return res.status(200).json({
        business: { id: business.id, shop_name: business.shop_name, status: business.status, user_id: business.user_id },
        authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
        authUserError,
        userRoles: roleRows2 || [],
        profile: profileRow || null,
      });
    }

    // Relinks a shop to the REAL auth user for a given email — for the case
    // where businesses.user_id itself is stale/wrong (e.g. left over from a
    // data migration), not just user_roles. Corrects businesses.user_id,
    // rebuilds user_roles, and syncs profiles in one shot.
    if (action === 'relink_owner') {
      if (!businessId || !email) return res.status(400).json({ error: 'businessId and email are required' });
      const authUser = await findAuthUserByEmail(email);
      if (!authUser) return res.status(404).json({ error: `No auth account found for ${email}` });

      const { error: bizUpdErr } = await admin.from('businesses').update({ user_id: authUser.id }).eq('id', businessId);
      if (bizUpdErr) return res.status(400).json({ error: bizUpdErr.message });

      await admin.from('user_roles').delete().eq('user_id', authUser.id);
      const { error: roleInsErr } = await admin.from('user_roles').insert({ user_id: authUser.id, business_id: businessId, role: 'business_admin' });
      if (roleInsErr) return res.status(400).json({ error: roleInsErr.message });

      await admin.from('profiles').upsert({ user_id: authUser.id, business_id: businessId, email: authUser.email }, { onConflict: 'user_id' });

      return res.status(200).json({ success: true, linkedUserId: authUser.id, email: authUser.email });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unexpected server error' });
  }
}
