/**
 * Simple append-only file logger for the automation post pipeline.
 *
 * Writes one human-readable line per GENERATE / PUBLISH event to
 *   <project-root>/logs/automation-posts.log   (override with AUTOMATION_LOG_FILE)
 * so you can `tail -f logs/automation-posts.log` and instantly see what happened.
 *
 * Safe by design: all writes are wrapped in try/catch and never throw — on a
 * read-only filesystem (e.g. serverless) it silently no-ops so the cron keeps
 * working. On EC2/PM2 the file persists.
 */

import fs from 'fs';
import path from 'path';

const LOG_FILE =
  process.env.AUTOMATION_LOG_FILE ||
  path.join(process.cwd(), 'logs', 'automation-posts.log');

/** Append a raw pre-formatted line (timestamp is added automatically). */
export function logAutomationLine(line) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${line}\n`);
  } catch {
    // read-only FS — ignore, cron must not fail because of logging
  }
}

const q = (v) => `"${String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 160)}"`;

/** GENERATE event — content + image created for a queued post. */
export function logGenerate({ ok, userId, postId, keyword, imageUrl, whatsapp, error }) {
  const parts = [
    `GENERATE ${ok ? 'OK  ' : 'FAIL'}`,
    `user=${userId || '-'}`,
    `post=${postId || '-'}`,
    `kw=${q(keyword)}`,
  ];
  if (ok) {
    parts.push(`img=${imageUrl ? String(imageUrl).slice(0, 80) : '-'}`);
    parts.push(`wa=${whatsapp || 'skipped'}`);
  } else {
    parts.push(`err=${q(error)}`);
  }
  logAutomationLine(parts.join(' '));
}

/** PUBLISH event — stored content pushed live to the connected platforms. */
export function logPublish({ ok, userId, postId, status, gmb, fb, ig, error }) {
  const parts = [
    `PUBLISH  ${ok ? 'OK  ' : 'FAIL'}`,
    `user=${userId || '-'}`,
    `post=${postId || '-'}`,
    `status=${status || '-'}`,
  ];
  if (gmb) parts.push(`gmb=${gmb}`);
  if (fb) parts.push(`fb=${fb}`);
  if (ig) parts.push(`ig=${ig}`);
  if (!ok && error) parts.push(`err=${q(error)}`);
  logAutomationLine(parts.join(' '));
}
