export default async function handler(req, res) {
  // Set CORS headers so client browsers can access this endpoint cleanly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Retrieve the original subpath from the query parameter (forwarded via vercel.json)
  const { path, ...restQuery } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter in proxy routing' });
  }

  // Intercept file uploads
  if (path === 'upload') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
      const base64Data = req.body.file;
      if (!base64Data) {
        return res.status(400).json({ error: 'Missing file parameter' });
      }

      const mimeType = base64Data.substring(base64Data.indexOf(":") + 1, base64Data.indexOf(";"));
      const base64Content = base64Data.substring(base64Data.indexOf(",") + 1);
      const buffer = Buffer.from(base64Content, 'base64');

      // 1. Try Telegraph
      try {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        formData.append('file', blob, 'image.' + mimeType.split('/')[1]);

        const response = await fetch('https://telegra.ph/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (Array.isArray(data) && data[0] && data[0].src) {
          return res.status(200).json({ url: 'https://telegra.ph' + data[0].src });
        }
      } catch (err) {
        console.error("Telegraph upload failed:", err);
      }

      // 2. Try Catbox as fallback
      try {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', blob, 'image.' + mimeType.split('/')[1]);

        const response = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: formData
        });

        const url = await response.text();
        if (url && url.startsWith('http')) {
          return res.status(200).json({ url });
        }
      } catch (err) {
        console.error("Catbox upload failed:", err);
      }

      return res.status(500).json({ error: 'Image upload failed on all providers' });
    } catch (err) {
      console.error('Upload handler error:', err);
      return res.status(500).json({ error: 'Upload handler crashed', message: err.message });
    }
  }

  // Reconstruct any other query parameters (e.g. search, pagination)
  const queryParams = new URLSearchParams(restQuery).toString();
  const targetUrl = `https://api.husnoorinfotech.in/api/${path}${queryParams ? '?' + queryParams : ''}`;

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
