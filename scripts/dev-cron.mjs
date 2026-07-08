/**
 * Local dev cron runner + logger.
 *
 * `npm run dev` me koi cron scheduler NAHI hota — automatic hits sirf EC2 crontab
 * ya Vercel crons par chalte hain. Ye script local par wahi kaam karti hai: har
 * INTERVAL_MIN (default 1) minute me automation endpoints hit karti hai, aur har
 * run ka summary `logs/automation-posts.log` me likhti hai — taaki aap VS Code me
 * wahi file khol kar live activity dekh sako (generate + publish + WhatsApp).
 *
 * Usage (ek alag terminal me, jabki dusre me `npm run dev` chal raha ho):
 *   node scripts/dev-cron.mjs
 *   npm run dev:cron
 *
 * Env overrides:
 *   BASE=http://localhost:3000   app URL
 *   INTERVAL_MIN=1               kitne minute me ek baar hit kare
 */

import fs from 'fs';
import path from 'path';

const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/$/, '');
const INTERVAL_MIN = Math.max(1, Number(process.env.INTERVAL_MIN) || 1);
const INTERVAL_MS = INTERVAL_MIN * 60 * 1000;

const LOG_FILE = path.join(process.cwd(), 'logs', 'automation-posts.log');

const ENDPOINTS = [
  { path: '/api/cron/automation-fill-queue', label: 'GENERATE-CRON' }, // pending → Ready (+ WhatsApp)
  { path: '/api/publish-scheduled',          label: 'PUBLISH-CRON'  }, // Ready → posted
];

function writeLog(line) {
  const stamped = `[${new Date().toISOString()}] ${line}\n`;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, stamped);
  } catch (e) {
    console.error('log write failed:', e.message);
  }
  process.stdout.write(stamped);
}

async function hit(ep) {
  const url = `${BASE}${ep.path}`;
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    const summary = ep.path.includes('fill-queue')
      ? `found=${data.found ?? '-'} filled=${data.filled ?? '-'} failed=${data.failed ?? '-'}`
      : `posted=${data.stats?.posted ?? '-'} failed=${data.stats?.failed ?? '-'} skipped=${data.stats?.skipped ?? '-'}`;
    writeLog(`${ep.label} ${res.status} | ${summary}`);
  } catch (e) {
    writeLog(`${ep.label} ERROR | ${e.message}`);
  }
}

async function tick() {
  for (const ep of ENDPOINTS) {
    await hit(ep);
  }
}

writeLog(`dev-cron STARTED → ${BASE} | every ${INTERVAL_MIN} min | logging to ${LOG_FILE}`);
tick();                          // ek baar turant
setInterval(tick, INTERVAL_MS);  // phir har INTERVAL_MIN minute
