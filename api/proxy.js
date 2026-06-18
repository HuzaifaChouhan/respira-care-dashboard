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

      // Try Catbox first, then Telegra.ph as a fallback
      try {
        let uploadUrl = null;
        
        // 1. Catbox attempt
        try {
          let catboxResponse;
          if (typeof FormData !== 'undefined' && typeof Blob !== 'undefined') {
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', new Blob([buffer], { type: mimeType }), `image.${ext}`);

            catboxResponse = await fetch('https://catbox.moe/user/api.php', {
              method: 'POST',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
              },
              body: formData
            });
          } else {
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

            catboxResponse = await fetch('https://catbox.moe/user/api.php', {
              method: 'POST',
              headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
              },
              body: catboxBuffer
            });
          }

          const catboxUrl = await catboxResponse.text();
          if (catboxUrl && catboxUrl.startsWith('http')) {
            uploadUrl = catboxUrl;
          }
        } catch (catboxErr) {
          console.warn("Serverless Catbox upload failed:", catboxErr);
        }

        // 2. Telegraph attempt if Catbox failed
        if (!uploadUrl) {
          try {
            let telegraphResponse;
            if (typeof FormData !== 'undefined' && typeof Blob !== 'undefined') {
              const formData = new FormData();
              formData.append('file', new Blob([buffer], { type: mimeType }), `image.${ext}`);

              telegraphResponse = await fetch('https://telegra.ph/upload', {
                method: 'POST',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                body: formData
              });
            } else {
              const boundary = `----VercelUploadBoundary${Math.random().toString(36).substring(2)}`;
              const part = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="image.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
              const partEnd = `\r\n--${boundary}--\r\n`;

              const telegraphBuffer = Buffer.concat([
                Buffer.from(part, 'utf-8'),
                buffer,
                Buffer.from(partEnd, 'utf-8')
              ]);

              telegraphResponse = await fetch('https://telegra.ph/upload', {
                method: 'POST',
                headers: {
                  'Content-Type': `multipart/form-data; boundary=${boundary}`,
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                body: telegraphBuffer
              });
            }

            if (telegraphResponse.ok) {
              const json = await telegraphResponse.json();
              if (Array.isArray(json) && json[0] && json[0].src) {
                uploadUrl = `https://telegra.ph${json[0].src}`;
              }
            }
          } catch (telegraphErr) {
            console.warn("Serverless Telegraph upload failed:", telegraphErr);
          }
        }

        if (uploadUrl) {
          return res.status(200).json({ url: uploadUrl });
        }
        return res.status(500).json({ error: 'All upload providers failed', message: 'Unable to upload image to Catbox or Telegra.ph' });
      } catch (err) {
        console.error("Catbox/Telegraph upload handler failed:", err);
        return res.status(500).json({ error: 'Catbox/Telegraph upload failed', message: err.message });
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
