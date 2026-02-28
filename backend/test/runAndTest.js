const { spawn } = require('child_process');
const http = require('http');

const child = spawn('node', ['src/server.js'], { stdio: ['ignore', 'pipe', 'pipe'] });

child.stdout.on('data', (d) => {
  const s = d.toString();
  process.stdout.write(s);
  if (s.includes('Server listening on port')) {
    // give a small delay then query
    setTimeout(() => {
      http.get('http://127.0.0.1:5000/api/products', (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log('\n--- API response (truncated) ---\n', body.substring(0, 500));
          child.kill();
        });
      }).on('error', (err) => {
        console.error('Error querying API:', err.message);
        child.kill();
      });
    }, 500);
  }
});

child.stderr.on('data', (d) => process.stderr.write(d.toString()));
child.on('exit', (code) => console.log('Server process exited with code', code));
