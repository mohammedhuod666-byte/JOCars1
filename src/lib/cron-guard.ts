// Day-of-week gate for the weekly cron job, compensating for Workers cron's grammar.
//
// WHY THIS EXISTS
// The three schedules were migrated from Vercel to Cloudflare Workers. Vercel cron
// accepts a day-of-week field; Workers rejects it outright — verified on the real API,
// not inferred from documentation:
//
//   PUT /accounts/:id/workers/scripts/:name/schedules
//   { "crons": [{ "cron": "0 4 * * 0" }] }
//   -> 400  { "code": 10100, "message": "invalid cron string: 0 4 * * 0" }
//
// The first deployment failed on that rejection, and every deploy since has failed
// the same way, leaving all three schedules unattached — so database backups and
// price recalculation were silently not running.
//
// Workers cron has no day-of-week field at all, so "Sunday 04:00" cannot be expressed
// as a schedule. The available grammar gives only "every day at 04:00", which would
// run the weekly job seven times too often. A weekly database backup running daily is
// a real cost and a real operational surprise, so it is not acceptable as a
// workaround.
//
// Instead the schedule fires daily and the handler decides. `isWeeklyJob()` returns
// true only on Sunday (UTC), and the weekly route calls it before doing any work. The
// invocations on other days are cheap no-ops: one date comparison, no database access,
// no outbound requests.
//
// WHY NOT SIMPLY MOVE THE WEEKLY JOB
// Changing the schedule to "every day" and accepting seven weekly reports would also
// email users or write seven times as many rows. Gating in the handler keeps the
// external schedule visible and simple while making the weekday rule explicit and
// testable in code.
//
// CRON TIMEZONE
// Cloudflare cron expressions are UTC. Vercel's were UTC as well, so the instants are
// unchanged. The comparison below is therefore in UTC, and must stay that way: if the
// Worker ever ran with a different TZ this would silently shift a backup by hours.
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * True when `now` falls on the day the weekly job is meant to run.
 *
 * @param nowMs  current time. Defaults to Date.now().
 * @param targetDay  0 = Sunday … 6 = Saturday, matching Date.prototype.getUTCDay.
 */
export function isWeeklyJob(nowMs: number = Date.now(), targetDay: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0): boolean {
  const now = new Date(nowMs);
  if (Number.isNaN(now.getTime())) return false;
  return now.getUTCDay() === targetDay;
}

/**
 * Human-readable UTC stamp for logs, so a skipped invocation is auditable rather
 * than invisible. An operator seeing "skipped, not Sunday" can distinguish a
 * deliberate no-op from a crash.
 */
export function describeSchedule(nowMs: number = Date.now()): string {
  const now = new Date(nowMs);
  if (Number.isNaN(now.getTime())) return 'invalid time';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getUTCDay()];
  return `${day} ${now.toISOString().slice(0, 19)}Z`;
}

void DAY_MS;