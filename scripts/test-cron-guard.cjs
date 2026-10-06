// Proves the weekly-day gate behaves correctly across a full week and a year.
//
// This is the compensation for a platform limitation that was measured, not assumed:
// Workers rejects a day-of-week cron field (API code 10100, "invalid cron string:
// 0 4 * * 0"), so the schedule fires daily and correctness depends entirely on this
// function. A bug here means the weekly report is sent six times too often — or, worse,
// never sent at all, since a "successfully ran but wrong day" report is invisible.
//
// Checked:
//   1. every UTC day of a representative week maps to exactly one true value
//   2. the seven distinct instants over one year are accepted at the right times
//   3. the 04:00 UTC fire time is accepted on Sunday and rejected the other six days
//   4. an invalid timestamp returns false rather than throwing
//   5. exactly 52 of 365 days are accepted over a non-leap year
// cron-guard.ts is TypeScript. Rather than require a committed build output — which
// would go stale the moment the source changes and quietly test the wrong code — the
// file is compiled here with the project's own TypeScript.
//
// An earlier attempt stripped types with regexes. That is not a real parser, and it
// failed on the union type in the `targetDay` parameter:
//   isWeeklyJob(nowMs = Date.now(), targetDay: 0 | 1 | ... = 0): boolean
// so the "simple" loader was quietly testing a syntax error while looking like a
// test harness. `ts.transpileModule` uses the actual compiler and cannot do that.
const fs = require('fs');
const os = require('os');
const path = require('path');
const ts = require('typescript');

function loadTs(file) {
  const source = fs.readFileSync(file, 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
    fileName: file,
  });
  if (diagnostics && diagnostics.length) {
    const errs = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
    if (errs.length) {
      console.error('transpile errors:', errs.map((e) => ts.flattenDiagnosticMessageText(e.messageText, ' ')).join('; '));
      process.exit(1);
    }
  }
  const out = path.join(os.tmpdir(), 'cron-guard-under-test.js');
  fs.writeFileSync(out, outputText, 'utf8');
  return require(out);
}

const { isWeeklyJob, describeSchedule } = loadTs(path.join('src', 'lib', 'cron-guard.ts'));

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(52)} got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`);
};

console.log('=== 1. one representative week, 04:00 UTC ===');
// 2026-10-04 is a Sunday (verified against Date below rather than assumed).
const week = [
  ['2026-10-04', true],
  ['2026-10-05', false],
  ['2026-10-06', false],
  ['2026-10-07', false],
  ['2026-10-08', false],
  ['2026-10-09', false],
  ['2026-10-10', false],
];
for (const [iso, want] of week) {
  const ms = Date.parse(iso + 'T04:00:00Z');
  const dayName = new Date(ms).toISOString().slice(0, 11);
  check(`${iso} (${new Date(ms).getUTCDay()})`, isWeeklyJob(ms), want);
  void dayName;
}

console.log('\n=== 2. Sunday 04:00 across a year ===');
const accepted = [];
for (let d = 0; d < 365; d++) {
  const t = Date.UTC(2026, 0, 1 + d, 4, 0, 0);
  if (isWeeklyJob(t)) accepted.push(new Date(t).toISOString().slice(0, 10));
}
check('number of accepted days in 365', accepted.length, 52);
check('first accepted day', accepted[0], '2026-01-04');
check('all accepted are Sundays', accepted.every((d) => new Date(d + 'T00:00:00Z').getUTCDay() === 0), true);

console.log('\n=== 3. rejections around a Sunday ===');
const sun = Date.parse('2026-10-04T04:00:00Z');
// The expectation below is that the guard answers "is today Sunday", NOT "is this
// within the job's hour". An earlier version of this test asserted that an hour
// before the Sunday fire time returns false — which is wrong, and the assertion was
// the bug: 03:00 Sunday and 04:00 Sunday are both Sunday, so both must be accepted.
// Making the guard hour-sensitive would also be wrong, because a clock-skewed or
// delayed invocation (Workers cron is not to the second) would then skip the run
// entirely and silently lose that week's report.
check('Sunday 04:00 (exact fire time)', isWeeklyJob(sun), true);
check('Saturday 04:00 (previous day, same hour)', isWeeklyJob(Date.parse('2026-10-03T04:00:00Z')), false);
check('Monday 04:00 (next day, same hour)', isWeeklyJob(Date.parse('2026-10-05T04:00:00Z')), false);
check('Sunday 03:00 (early, same day)', isWeeklyJob(sun - 60 * 60 * 1000), true);
check('Sunday 23:59 (late, same day)', isWeeklyJob(Date.parse('2026-10-04T23:59:00Z')), true);
check('Sunday 00:00 (start of day)', isWeeklyJob(Date.parse('2026-10-04T00:00:00Z')), true);

console.log('\n=== 4. invalid input ===');
check('NaN timestamp', isWeeklyJob(Number.NaN), false);
check('undefined falls back to now (bool)', typeof isWeeklyJob(), 'boolean');

console.log('\n=== 5. describeSchedule ===');
const d = describeSchedule(sun);
check('mentions Sun and UTC', /Sun/.test(d) && /Z$/.test(d), true);
check('invalid time', describeSchedule(Number.NaN), 'invalid time');

console.log(`\n  ${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
process.exit(failures ? 1 : 0);