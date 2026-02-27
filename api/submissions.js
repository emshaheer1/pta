const BLOB_PATH = 'ramadan/submissions.json';

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
    const { list } = await import('@vercel/blob');

    let submissions = [];
    try {
      const { blobs } = await list({ prefix: 'ramadan/' });
      const blob = blobs.find((b) => b.pathname === BLOB_PATH);
      if (blob && blob.downloadUrl) {
        const resp = await fetch(blob.downloadUrl);
        if (resp.ok) {
          const text = await resp.text();
          const data = JSON.parse(text);
          submissions = Array.isArray(data) ? data : [];
        }
      }
    } catch (_) {
      // No blob yet or parse error
    }

    res.status(200).json(submissions);
  } catch (err) {
    console.error('Submissions API error:', err);
    res.status(500).json({ error: 'Failed to load submissions' });
  }
}
