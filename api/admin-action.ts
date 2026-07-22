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

  const { action, targetUserId, newPassword } = req.body || {};

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

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unexpected server error' });
  }
}
