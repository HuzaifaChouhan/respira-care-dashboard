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
      let bodyObj = req.body;
      if (Buffer.isBuffer(bodyObj)) {
        bodyObj = bodyObj.toString('utf-8');
      }
      if (typeof bodyObj === 'string') {
        try {
          bodyObj = JSON.parse(bodyObj);
        } catch (e) {
          console.error("JSON parse error on req.body string:", e);
        }
      }

      const base64Data = bodyObj ? bodyObj.file : null;
      if (!base64Data) {
        return res.status(400).json({ error: 'Missing file parameter' });
      }

      const mimeType = base64Data.substring(base64Data.indexOf(":") + 1, base64Data.indexOf(";"));
      const base64Content = base64Data.substring(base64Data.indexOf(",") + 1);
      const buffer = Buffer.from(base64Content, 'base64');
      const ext = (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

      // Try Catbox for reliable permanent image uploads (bypassing Telegraph timeouts/blocks)
      try {
        const boundary = `----VercelUploadBoundary${Math.random().toString(36).substring(2)}`;
        const part1 = `--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`;
        const part2 = `--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="image.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
        const part3 = `\r\n--${boundary}--\r\n`;

        const catboxBuffer = Buffer.concat([
          Buffer.from(part1, 'utf-8'),
          Buffer.from(part2, 'utf-8'),
          buffer,
          Buffer.from(part3, 'utf-8')
        ]);

        const response = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': catboxBuffer.length.toString(),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          },
          body: catboxBuffer
        });

        const url = await response.text();
        if (url && url.startsWith('http')) {
          return res.status(200).json({ url });
        }
        return res.status(500).json({ error: 'Catbox did not return a valid URL', message: url });
      } catch (err) {
        console.error("Catbox upload failed:", err);
        return res.status(500).json({ error: 'Catbox upload failed', message: err.message });
      }
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
