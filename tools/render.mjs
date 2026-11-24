// Fresh-written CDP screenshot driver (Node 22, stdlib only).
// Launches headless Chrome over --remote-debugging-pipe and captures
// a 1024x1024 PNG of a local HTML file. No network is used.
//
// Usage: node render.mjs <scene.html> <out.png>
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const [scenePath, outPath] = process.argv.slice(2);
if (!scenePath || !outPath) {
  console.error('usage: node render.mjs <scene.html> <out.png>');
  process.exit(2);
}

const POLICY = '/home/hatch/workspace/makefun/webgl-policy.txt';
const POLICY_SHA = '339c469a38cf59581eca936d2bf12fc6cbc93573dba8b5465ef32d91db991c58';

const chrome = spawn('/opt/meta-chromium/chrome', [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1024,1024',
  '--allow-file-access-from-files',
  '--hatch-webgl-allowed-domains-file=' + POLICY,
  '--hatch-webgl-allowed-domains-sha256=' + POLICY_SHA,
  '--remote-debugging-pipe',
], { stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'] });

const writeFd = chrome.stdio[3]; // parent -> chrome
const readFd = chrome.stdio[4];  // chrome -> parent

let nextId = 1;
const pending = new Map();
let buffer = Buffer.alloc(0);
let sessionId = null;
let done = false;

function send(method, params = {}, sid) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    const msg = { id, method, params };
    if (sid) msg.sessionId = sid;
    writeFd.write(JSON.stringify(msg) + '\0');
  });
}

readFd.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  let idx;
  while ((idx = buffer.indexOf(0)) !== -1) {
    const raw = buffer.subarray(0, idx).toString('utf8');
    buffer = buffer.subarray(idx + 1);
    if (!raw.trim()) continue;
    let msg;
    try { msg = JSON.parse(raw); } catch { continue; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method === 'Page.loadEventFired') {
      onLoaded();
    }
  }
});

chrome.stderr.on('data', () => { /* ignore chrome chatter */ });

async function onLoaded() {
  if (done) return;
  done = true;
  try {
    await new Promise((r) => setTimeout(r, 400));
    const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    const png = Buffer.from(shot.data, 'base64');
    writeFileSync(outPath, png);
    const hash = createHash('sha256').update(png).digest('hex');
    console.log(`wrote ${outPath} ${png.length} bytes sha256=${hash}`);
    chrome.kill('SIGTERM');
    process.exit(0);
  } catch (err) {
    console.error('screenshot failed:', err.message);
    chrome.kill('SIGTERM');
    process.exit(1);
  }
}

const timeout = setTimeout(() => {
  console.error('render timed out');
  chrome.kill('SIGKILL');
  process.exit(1);
}, 60000);

try {
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  sessionId = attached.sessionId;
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false,
  }, sessionId);
  await send('Page.navigate', { url: pathToFileURL(scenePath).href }, sessionId);
} catch (err) {
  clearTimeout(timeout);
  console.error('CDP setup failed:', err.message);
  chrome.kill('SIGTERM');
  process.exit(1);
}
