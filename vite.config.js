import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Import this

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Add this to plugins
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
    },
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

              // Construct the multipart body manually for Catbox (avoids native Node FormData/Blob issues)
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

              const catboxResponse = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                headers: {
                  'Content-Type': `multipart/form-data; boundary=${boundary}`,
                  'Content-Length': catboxBuffer.length.toString(),
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                body: catboxBuffer
              });

              const url = await catboxResponse.text();
              res.setHeader('Content-Type', 'application/json');
              if (url && url.startsWith('http')) {
                res.statusCode = 200;
                res.end(JSON.stringify({ url }));
              } else {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Catbox did not return a valid URL', message: url }));
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
})