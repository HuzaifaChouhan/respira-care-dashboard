import https from 'https';

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

  if (req.query.debug === 'true') {
    try {
      const mockBase64 = "iVBORw0KGgoAAAASUVORK5CYII=";
      const buffer = Buffer.from(mockBase64, 'base64');
      
      let uguuUrl = null;
      let uguuErr = null;
      try {
        uguuUrl = await uploadToUguu(buffer, 'png', 'image/png');
      } catch (e) {
        uguuErr = e.message;
      }

      let stUrl = null;
      let stErr = null;
      try {
        stUrl = await uploadTo0x0(buffer, 'png', 'image/png');
      } catch (e) {
        stErr = e.message;
      }

      return res.status(200).json({
        nodeVersion: process.version,
        env: process.env.NODE_ENV,
        uguu: { url: uguuUrl, error: uguuErr },
        st: { url: stUrl, error: stErr }
      });
    } catch (err) {
      return res.status(500).json({ error: 'Debug test failed', message: err.message });
    }
  }

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
      const base64Content = base64Data.substring(base64Data.indexOf(",") + 1).replace(/ /g, '+');
      const buffer = Buffer.from(base64Content, 'base64');
      const ext = (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

      // Try Uguu.se first, fallback to 0x0.st if it fails
      try {
        let url = null;
        let uploadErrors = [];

        try {
          url = await uploadToUguu(buffer, ext, mimeType);
        } catch (err) {
          console.error("Uguu upload failed, trying 0x0.st:", err.message);
          uploadErrors.push(`Uguu.se: ${err.message}`);
          try {
            url = await uploadTo0x0(buffer, ext, mimeType);
          } catch (err2) {
            console.error("0x0.st upload failed:", err2.message);
            uploadErrors.push(`0x0.st: ${err2.message}`);
          }
        }

        if (url && url.startsWith('http')) {
          return res.status(200).json({ url });
        }
        return res.status(500).json({ error: 'All upload providers failed', message: uploadErrors.join(' | ') });
      } catch (err) {
        console.error("Upload proxy routine crashed:", err);
        return res.status(500).json({ error: 'Upload proxy routine crashed', message: err.message });
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

function uploadToUguu(buffer, ext, mimeType) {
  return new Promise((resolve, reject) => {
    const boundary = `----VercelUploadBoundary${Math.random().toString(36).substring(2)}`;
    const part1 = `--${boundary}\r\nContent-Disposition: form-data; name="files[]"; filename="image.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const part2 = `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(part1, 'utf-8'),
      buffer,
      Buffer.from(part2, 'utf-8')
    ]);

    const options = {
      hostname: 'uguu.se',
      port: 443,
      path: '/upload?output=json',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length,
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const resObj = JSON.parse(data);
          if (resObj.success && resObj.files && resObj.files[0]) {
            resolve(resObj.files[0].url);
          } else {
            reject(new Error(resObj.description || 'Uguu.se upload unsuccessful'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Uguu response: ${data}`));
        }
      });
    });

    request.on('error', (err) => {
      reject(err);
    });

    request.write(bodyBuffer);
    request.end();
  });
}

function uploadTo0x0(buffer, ext, mimeType) {
  return new Promise((resolve, reject) => {
    const boundary = `----VercelUploadBoundary${Math.random().toString(36).substring(2)}`;
    const part1 = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="image.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const part2 = `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(part1, 'utf-8'),
      buffer,
      Buffer.from(part2, 'utf-8')
    ]);

    const options = {
      hostname: '0x0.st',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length,
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        const trimmed = data.trim();
        if (trimmed.startsWith('http')) {
          resolve(trimmed);
        } else {
          reject(new Error(`0x0.st returned invalid response: ${trimmed}`));
        }
      });
    });

    request.on('error', (err) => {
      reject(err);
    });

    request.write(bodyBuffer);
    request.end();
  });
}
