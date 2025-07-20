const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS for all origins
app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Specific route for test files
app.get('/test-files', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>JustSpeak Test Files</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #0c0c0c;
          color: #f8f8f8;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { color: #0066ff; }
        a {
          display: block;
          padding: 10px 20px;
          margin: 10px 0;
          background: #1a1a1a;
          color: #0066ff;
          text-decoration: none;
          border-radius: 5px;
          border: 1px solid #2c2c2c;
        }
        a:hover {
          background: #2c2c2c;
        }
        .info {
          background: #1a1a1a;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>JustSpeak Test Files</h1>
      <div class="info">
        <p><strong>Next.js Dev Server:</strong> Running on http://localhost:3000</p>
        <p><strong>Test File Server:</strong> Running on http://localhost:${PORT}</p>
      </div>
      <h2>Available Test Pages:</h2>
      <a href="/debug-voice.html">Voice Debug Page</a>
      <a href="/test-real-api.html">API Integration Test</a>
      <a href="/test-user-experience.html">User Experience Demo</a>
      <a href="http://localhost:3000" target="_blank">Open Main App →</a>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Test file server running at http://localhost:${PORT}`);
  console.log(`Access test files at http://localhost:${PORT}/test-files`);
  console.log('\nAvailable test pages:');
  console.log(`- Voice Debug: http://localhost:${PORT}/debug-voice.html`);
  console.log(`- API Test: http://localhost:${PORT}/test-real-api.html`);
  console.log(`- UX Demo: http://localhost:${PORT}/test-user-experience.html`);
});