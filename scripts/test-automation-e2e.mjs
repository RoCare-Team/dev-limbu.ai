#!/usr/bin/env node
/**
 * End-to-end automation checker.
 *
 * Verifies the WHOLE chain: content generate → post create → publish (GMB/FB/IG),
 * and reads the per-step AutomationLog so you see EXACTLY where it stops.
 *
 * SAFE BY DEFAULT: runs dryRun (generates image + caption, saves a "pending"
 * post, does NOT post live). Add --live to actually publish to GMB/FB/IG.
 *
 * Usage:
 *   node scripts/test-automation-e2e.mjs --user USR_123
 *   node scripts/test-automation-e2e.mjs --user USR_123 --base https://your-ec2-domain
 *   node scripts/test-automation-e2e.mjs --user USR_123 --live          # real post
 *   node scripts/test-automation-e2e.mjs --user USR_123 --mode delay     # delay pipeline
 *   node scripts/test-automation-e2e.mjs --user USR_123 --secret <CRON_SECRET>
 *
 * Flags:
 *   --user    USR-format userId (required)
 *   --base    app URL (default http://localhost:3000)
 *   --live    actually publish (omit = dryRun, no live post)
 *   --mode    legacy | delay | auto  (default auto — tries legacy, falls back to delay)
 *   --secret  CRON_SECRET if your server requires it
 */

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : true;
}
const has = (name) => args.includes(`--${name}`);

if (has("help") || !arg("user")) {
  console.log(`
End-to-end automation checker

  node scripts/test-automation-e2e.mjs --user USR_123 [--base URL] [--live] [--mode legacy|delay|auto] [--secret CRON_SECRET]

  Default = dryRun (safe, no live post). --live actually posts to GMB/FB/IG.
`);
  process.exit(arg("user") ? 0 : 1);
}

const BASE = String(arg("base", "http://localhost:3000")).replace(/\/$/, "");
const USER = String(arg("user"));
const LIVE = has("live");
const MODE = String(arg("mode", "auto"));
const SECRET = arg("secret", null);

const ICON = { pass: "✅", success: "🎯", fail: "❌", skip: "⏭️ ", info: "•" };
const C = {
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

function headers() {
  return SECRET ? { Authorization: `Bearer ${SECRET}` } : {};
}

async function getJson(url) {
  try {
    const res = await fetch(url, { headers: headers() });
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    return { status: res.status, ok: res.ok, json };
  } catch (e) {
    return { status: 0, ok: false, json: {}, networkError: e.message };
  }
}

function printSteps(logDocs) {
  for (const d of logDocs) {
    const verdict =
      d.outcome === "success" ? C.g("SUCCESS")
      : d.outcome === "failed" ? C.r("FAILED")
      : d.outcome === "skipped" ? C.y("SKIPPED")
      : d.outcome;
    console.log(`  ${C.b(`[${d.phase}]`)} post=${d.postId || "-"} → ${verdict}`);
    for (const s of d.steps || []) {
      let line = `    ${ICON[s.status] || "•"} ${s.name}`;
      if (s.message) line += C.dim(` — ${s.message}`);
      console.log(line);
      if (s.error) console.log(`        ${C.r("ERROR:")} ${s.error}`);
    }
    if (d.error) console.log(`    ${C.r("▶ reason:")} ${d.error}`);
  }
}

async function fetchLogsByRun(runId) {
  if (!runId) return [];
  const { json } = await getJson(`${BASE}/api/automation-logs?runId=${encodeURIComponent(runId)}&limit=50`);
  return Array.isArray(json.logs) ? json.logs : [];
}

let overallPass = true;
const note = (s) => console.log(s);

async function step(title, fn) {
  console.log("\n" + C.b("━".repeat(60)));
  console.log(C.b(`▶ ${title}`));
  console.log(C.b("━".repeat(60)));
  try {
    return await fn();
  } catch (e) {
    overallPass = false;
    console.log(C.r(`✗ step crashed: ${e.message}`));
    return null;
  }
}

async function runLegacy(live) {
  const q = live ? "force=true" : "dryRun=1";
  const url = `${BASE}/api/cron/automation-plans?phase=manual&userId=${encodeURIComponent(USER)}&${q}`;
  note(C.dim(`GET ${url}`));
  const { status, json } = await getJson(url);

  if (status === 404) {
    note(C.y(`↪ 404 "${json.error || "no plan"}" — not a legacy plan. Trying delay pipeline…`));
    return "not-legacy";
  }
  note(`  processed=${json.processed} successful=${C.g(json.successful)} skipped=${C.y(json.skipped)} failed=${C.r(json.failed)}`);
  if (json.runId) {
    note(C.dim(`  runId=${json.runId} (logs saved: ${json.automationLogsSaved})`));
    printSteps(await fetchLogsByRun(json.runId));
  }
  if (Array.isArray(json.errors) && json.errors.length) {
    note(C.r(`  errors: ${JSON.stringify(json.errors).slice(0, 500)}`));
  }
  const good = (json.successful || 0) >= 1;
  if (!good) overallPass = false;
  return good ? "ok" : "fail";
}

async function runDelay(live) {
  // 1) Generate content for queued posts
  note(C.dim(`GET ${BASE}/api/cron/automation-fill-queue`));
  const fill = await getJson(`${BASE}/api/cron/automation-fill-queue`);
  note(`  fill-queue: found=${fill.json.found} filled=${C.g(fill.json.filled)} failed=${C.r(fill.json.failed)} skipped=${C.y(fill.json.skipped)}`);
  if (fill.json.runId) printSteps(await fetchLogsByRun(fill.json.runId));

  if (!live) {
    note(C.y("\n  dryRun mode — stopping before live publish. Run with --live to publish scheduled posts."));
    note(C.dim("  (Delay posts publish at scheduledDate = generate +12h. To publish now you must move scheduledDate to the past in DB, then run --live.)"));
    return fill.json.filled >= 1 ? "ok" : "fail";
  }

  // 2) Publish anything already due (scheduledDate <= now)
  note(C.dim(`\nGET ${BASE}/api/publish-scheduled`));
  const pub = await getJson(`${BASE}/api/publish-scheduled`);
  const st = pub.json.stats || {};
  note(`  publish-scheduled: total=${st.total} posted=${C.g(st.posted)} failed=${C.r(st.failed)} skipped=${C.y(st.skipped)}`);
  if (pub.json.runId) printSteps(await fetchLogsByRun(pub.json.runId));
  const good = (st.posted || 0) >= 1;
  if (!good) overallPass = false;
  return good ? "ok" : "fail";
}

(async () => {
  console.log(C.b(`\nAutomation E2E check`));
  console.log(`  base : ${BASE}`);
  console.log(`  user : ${USER}`);
  console.log(`  mode : ${LIVE ? C.r("LIVE (will post to GMB/FB/IG)") : C.g("dryRun (safe, no live post)")}`);
  console.log(`  pipe : ${MODE}`);

  // Reachability
  const reach = await getJson(`${BASE}/api/automation-logs?limit=1`);
  if (!reach.ok && reach.status !== 200) {
    const why = reach.networkError ? `network error: ${reach.networkError}` : `status ${reach.status}`;
    console.log(C.r(`\n✗ Cannot reach ${BASE} (${why}). Is the server running / base URL correct?`));
    process.exit(2);
  }

  await step(`Generate + ${LIVE ? "PUBLISH" : "save (dryRun)"} via automation pipeline`, async () => {
    if (MODE === "delay") return runDelay(LIVE);
    const r = await runLegacy(LIVE);
    if (r === "not-legacy" && MODE === "auto") return runDelay(LIVE);
    return r;
  });

  await step("Recent logs for this user (last 10)", async () => {
    const { json } = await getJson(`${BASE}/api/automation-logs?userId=${encodeURIComponent(USER)}&limit=10`);
    if (json.summary) {
      note(`  summary: success=${C.g(json.summary.success || 0)} skipped=${C.y(json.summary.skipped || 0)} failed=${C.r(json.summary.failed || 0)}`);
    }
    note(C.dim(`  Full readable trail: ${BASE}/api/automation-logs?userId=${USER}&format=text`));
  });

  console.log("\n" + C.b("━".repeat(60)));
  console.log(overallPass ? C.g(C.b("✅ E2E RESULT: PASS")) : C.r(C.b("❌ E2E RESULT: FAIL — check the failed step above")));
  console.log(C.b("━".repeat(60)) + "\n");
  process.exit(overallPass ? 0 : 1);
})();
