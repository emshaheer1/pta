const BLOB_PATH = 'ramadan/submissions.json';

async function fetchExistingSubmissions(list) {
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
  return submissions;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { put, list } = await import('@vercel/blob');

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      firstName,
      lastName,
      email,
      phone,
      businessOwner,
      businessType,
      w2Income,
      createdAt
    } = body;

    if (!firstName || !lastName || !email || !phone || !businessOwner) {
      return res.status(400).json({
        error: 'Missing required fields: firstName, lastName, email, phone, businessOwner'
      });
    }

    const entry = {
      id: body.id || Date.now().toString(36) + Math.random().toString(36).slice(2),
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      businessOwner: String(businessOwner).trim(),
      businessType: businessOwner === 'yes' ? String(businessType || '').trim() : '',
      w2Income: businessOwner === 'no' ? String(w2Income || '').trim() : '',
      createdAt: createdAt || new Date().toISOString()
    };

    let listArr = await fetchExistingSubmissions(list);
    listArr.push(entry);

    await put(BLOB_PATH, JSON.stringify(listArr), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false
    });

    res.status(201).json({ ok: true, id: entry.id });
  } catch (err) {
    console.error('Submit API error:', err);
    res.status(500).json({ error: 'Failed to save submission' });
  }
}
