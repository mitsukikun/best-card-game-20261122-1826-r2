// Ember Pact — a tiny static server for local playtesting.
// Serves the game directory on http://localhost:8080 — nothing else.
// Node 22 standard library only.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const gameDir = join(dirname(fileURLToPath(import.meta.url)), 'game');
const PORT = 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const path = normalize(join(gameDir, decodeURIComponent(req.url ?? '/').split('?')[0]));
    if (!path.startsWith(gameDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const file = path.endsWith('/') ? join(path, 'index.html') : path;
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Ember Pact: serving the game at http://localhost:${PORT}/`);
});
