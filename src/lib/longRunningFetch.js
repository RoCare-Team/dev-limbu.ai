import { Agent, fetch as undiciFetch } from "undici";

/*
 * Node's built-in fetch (undici) aborts if the response headers don't arrive
 * within 300s (`headersTimeout`) or the body stalls for 300s (`bodyTimeout`), and
 * reports it only as a bare "fetch failed". Synchronous render APIs hold the
 * request open for 5–15 min before sending anything back, so every render
 * longer than 5 min used to fail that way.
 *
 * This agent disables those two timers. Callers MUST still bound the wait with
 * their own AbortController signal — that is the real timeout now.
 */
const longRunningAgent = new Agent({
  headersTimeout: 0,
  bodyTimeout: 0,
});

/** Drop-in for fetch() on calls that legitimately take longer than 5 minutes. */
export function fetchLongRunning(url, init = {}) {
  return undiciFetch(url, { ...init, dispatcher: longRunningAgent });
}
