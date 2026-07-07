/**
 * Local dev cron runner.
 *
 * `npm run dev` me koi cron scheduler NAHI hota — automatic hits sirf EC2 crontab
 * ya Vercel crons par chalte hain. Ye script local par wahi kaam karti hai: har
 * INTERVAL_MIN (default 1) minute me automation endpoints hit karti hai, taaki
 * test-mode flow (generate → publish) bina manual Postman ke local par chale.
 *
 * Usage (ek alag terminal me, jabki dusre me `npm run dev` chal raha ho):
 *   node scripts/dev-cron.mjs
 *   npm run dev:cron
 *
 * Env overrides:
 *   BASE=http://localhost:3000   app URL
 *   INTERVAL_MIN=1               kitne minute me ek baar hit kare
 */

const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/$/, '');
const INTERVAL_MIN = Math.max(1, Number(process.env.INTERVAL_MIN) || 1);
const INTERVAL_MS = INTERVAL_MIN * 60 * 1000;

const ENDPOINTS = [
  '/api/cron/automation-fill-queue', // generate: pending → scheduled
  '/api/publish-scheduled',          // publish: scheduled → posted
];

const stamp = () => new Date().toISOString();

async function hit(path) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    const summary = path.includes('fill-queue')
      ? `found=${data.found ?? '-'} filled=${data.filled ?? '-'} failed=${data.failed ?? '-'}`
      : `posted=${data.stats?.posted ?? '-'} failed=${data.stats?.failed ?? '-'} skipped=${data.stats?.skipped ?? '-'}`;
    console.log(`[${stamp()}] ${path} → ${res.status} | ${summary}`);
  } catch (e) {
    console.log(`[${stamp()}] ${path} → ERROR ${e.message}`);
  }
}

async function tick() {
  for (const p of ENDPOINTS) {
    await hit(p);
  }
}

console.log(
  `dev-cron started → ${BASE} | every ${INTERVAL_MIN} min | endpoints: ${ENDPOINTS.join(', ')}`
);
console.log('(Ctrl+C to stop)\n');

tick();                       // ek baar turant
setInterval(tick, INTERVAL_MS); // phir har INTERVAL_MIN minute
