const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const { Script } = require('node:vm');

// The self-contained sandbox must authorize only this exact script, including
// whitespace. HTML parsing normalizes line endings before CSP hash checking.
const html = readFileSync(resolve(__dirname, '../dist/artwork.html'), 'utf8').replace(/\r\n?/g, '\n');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1, 'Expected one self-contained artwork script');
const source = scripts[0][1];
new Script(source, { filename: 'artwork.html' }); // Syntax check only; do not execute.
const hash = createHash('sha256').update(source).digest('base64');
assert.ok(html.includes(`script-src 'sha256-${hash}';`), 'Artwork CSP hash must match its script');
assert.ok(!/unsafe-inline|unsafe-eval|<script\s+src=/i.test(html), 'Keep the loader self-contained and hash-restricted');
console.log('PASS: artwork script syntax and restrictive CSP hash');
