import express from 'express';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const app = express();
app.use(express.json({ limit: '6mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', engine: 'C++17' }));
app.post('/api/analyze', (req, res) => {
  const { queries, caseSensitive = false } = req.body ?? {};
  if (typeof queries !== 'string' || typeof caseSensitive !== 'boolean') return res.status(400).json({ error: 'Provide query text and a boolean caseSensitive option.' });
  const lines = queries.split('\n');
  if (lines.length > 10000 || lines.some(line => Buffer.byteLength(line) > 500)) return res.status(400).json({ error: 'Use at most 10,000 lines, with at most 500 bytes per line.' });
  const child = spawn(path.join(root, 'build/analyzer'), ['--json', ...(caseSensitive ? ['--case-sensitive'] : [])]);
  let output = '', errors = '', timedOut = false;
  const timer = setTimeout(() => { timedOut = true; child.kill(); }, 15000);
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { errors += data; });
  child.stdin.on('error', () => {});
  child.on('error', () => { clearTimeout(timer); if (!res.headersSent) res.status(500).json({ error: 'C++ engine unavailable. Run npm run build:cpp.' }); });
  child.on('close', code => {
    clearTimeout(timer);
    if (res.headersSent) return;
    if (code !== 0) return res.status(500).json({ error: timedOut ? 'Analysis timed out. Try fewer queries.' : errors || 'Analysis failed.' });
    try { res.json(JSON.parse(output)); } catch { res.status(500).json({ error: 'Invalid response from the analysis engine.' }); }
  });
  child.stdin.end(queries);
});
if (process.argv.includes('--production')) {
  app.use(express.static(path.join(root, 'dist')));
  app.get('/', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
}
app.use((err, _req, res, _next) => res.status(err.status || 500).json({ error: err.type === 'entity.too.large' ? 'Input is too large.' : 'Invalid request.' }));
app.listen(process.env.PORT || 3001, '0.0.0.0', () => console.log(`QueryLens API: http://localhost:${process.env.PORT || 3001}`));
