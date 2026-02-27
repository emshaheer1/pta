const BLOB_PATH = 'ramadan/submissions.json';

async function getStoredSubmissions(blob) {
  if (!blob || !blob.stream) return [];
  const text = await new Response(blob.stream).text();
  try {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const rawSecret = process.env.DASHBOARD_SECRET;
  const secret = rawSecret ? String(rawSecret).trim() : '';

  if (!secret || token !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { get } = await import('@vercel/blob');

    let list = [];
    try {
      const existing = await get(BLOB_PATH, { access: 'private' });
      list = await getStoredSubmissions(existing);
    } catch (_) {
      // No blob yet
    }

    res.status(200).json(list);
  } catch (err) {
    console.error('Submissions API error:', err);
    res.status(500).json({ error: 'Failed to load submissions' });
  }
}
