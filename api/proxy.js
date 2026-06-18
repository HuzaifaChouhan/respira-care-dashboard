export default async function handler(req, res) {
  // Set CORS headers so client browsers can access this endpoint cleanly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // req.url contains "/api/subpath?query=..."
  const targetUrl = `https://api.husnoorinfotech.in${req.url}`;

  try {
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body
    });

    const contentType = response.headers.get('content-type') || '';
    
    // Copy the response status code
    res.status(response.status);

    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (error) {
    console.error('Serverless Proxy Error:', error);
    res.status(500).json({ error: 'Proxy request failed', message: error.message });
  }
}
