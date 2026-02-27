/**
 * Dashboard auth check for production (Vercel).
 * Validates that the submitted password matches DASHBOARD_SECRET.
 * Used so users can sign in on the deployed site without having created an account on localhost.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'Dashboard login not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const password = (body.password || '').trim();
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    if (password !== secret) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.status(200).json({ ok: true });
  } catch (_) {
    res.status(400).json({ error: 'Invalid request' });
  }
}
