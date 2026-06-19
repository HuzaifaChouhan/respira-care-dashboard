import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Import this

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Add this to plugins
    {
      name: 'upload-proxy-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/upload')) {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let bodyChunks = [];
            req.on('data', (chunk) => bodyChunks.push(chunk));
            req.on('end', async () => {
              try {
                const rawBody = Buffer.concat(bodyChunks).toString('utf-8');
                const bodyObj = JSON.parse(rawBody);
                const base64Data = bodyObj.file;
                
                if (!base64Data) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing file parameter' }));
                  return;
                }

                const mimeType = base64Data.substring(base64Data.indexOf(":") + 1, base64Data.indexOf(";"));
                const base64Content = base64Data.substring(base64Data.indexOf(",") + 1);
                const buffer = Buffer.from(base64Content, 'base64');
                const ext = (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

                // Try Uguu.se first, fallback to 0x0.st
                let url = null;
                let uploadErrors = [];

                try {
                  const boundary = `----VercelUploadBoundary${Math.random().toString(36).substring(2)}`;
                  const part1 = `--${boundary}\r\nContent-Disposition: form-data; name="files[]"; filename="image.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
                  const part2 = `\r\n--${boundary}--\r\n`;

                  const uguuBuffer = Buffer.concat([
                    Buffer.from(part1, 'utf-8'),
                    buffer,
                    Buffer.from(part2, 'utf-8')
                  ]);

                  const uguuResponse = await fetch('https://uguu.se/upload?output=json', {
                    method: 'POST',
                    headers: {
                      'Content-Type': `multipart/form-data; boundary=${boundary}`,
                      'Content-Length': uguuBuffer.length.toString(),
                      'User-Agent': 'Mozilla/5.0'
                    },
                    body: uguuBuffer
                  });

                  const resObj = await uguuResponse.json();
                  if (resObj.success && resObj.files && resObj.files[0]) {
                    url = resObj.files[0].url;
                  } else {
                    throw new Error(resObj.description || 'Uguu.se upload unsuccessful');
                  }
                } catch (err) {
                  console.error("Local Uguu upload failed, trying 0x0.st:", err.message);
                  uploadErrors.push(`Uguu.se: ${err.message}`);

                  try {
                    const boundary = `----VercelUploadBoundary${Math.random().toString(36).substring(2)}`;
                    const part1 = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="image.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
                    const part2 = `\r\n--${boundary}--\r\n`;

                    const stBuffer = Buffer.concat([
                      Buffer.from(part1, 'utf-8'),
                      buffer,
                      Buffer.from(part2, 'utf-8')
                    ]);

                    const stResponse = await fetch('https://0x0.st', {
                      method: 'POST',
                      headers: {
                        'Content-Type': `multipart/form-data; boundary=${boundary}`,
                        'Content-Length': stBuffer.length.toString(),
                        'User-Agent': 'Mozilla/5.0'
                      },
                      body: stBuffer
                    });

                    const resText = await stResponse.text();
                    const trimmed = resText.trim();
                    if (trimmed.startsWith('http')) {
                      url = trimmed;
                    } else {
                      throw new Error(`0x0.st returned: ${trimmed}`);
                    }
                  } catch (err2) {
                    console.error("Local 0x0.st upload failed:", err2.message);
                    uploadErrors.push(`0x0.st: ${err2.message}`);
                  }
                }

                res.setHeader('Content-Type', 'application/json');
                if (url && url.startsWith('http')) {
                  res.statusCode = 200;
                  res.end(JSON.stringify({ url }));
                } else {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'All upload providers failed', message: uploadErrors.join(' | ') }));
                }
              } catch (err) {
                console.error("Local upload middleware error:", err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Local upload failed', message: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.husnoorinfotech.in',
        changeOrigin: true,
        secure: false,
        bypass: (req, res, proxyOptions) => {
          if (req.url && req.url.startsWith('/api/upload')) {
            return req.url;
          }
        }
      }
    }
  }
})