// Plan renderer (planner tool, not part of the app).
// Reads _planning/manifest.base.json and _planning/defs/*.mjs (each exports default: array of plan definitions),
// writes NNN-name.md for every plan and manifest.json. Run: node docs/plans/realistic-world-overhaul/_planning/gen.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '..');
const repoRoot = path.resolve(dir, '..', '..', '..');
const ws = path.dirname(repoRoot);
const REPO = path.basename(repoRoot);
const ARCH = `${REPO}/docs/plans/realistic-world-overhaul/ARCHITECTURE.md`;
const INSTR = `${REPO}/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`;

const base = JSON.parse(fs.readFileSync(path.join(here, 'manifest.base.json'), 'utf8'));
const defFiles = fs.readdirSync(path.join(here, 'defs')).filter((f) => f.endsWith('.mjs')).sort();
const plans = [];
for (const f of defFiles) {
  const mod = await import(pathToFileURL(path.join(here, 'defs', f)).href);
  plans.push(...mod.default);
}

const cmdOf = (c) => (typeof c === 'string' ? c : c.cmd);
const toManifestCmd = (c) => (typeof c === 'string' ? c : { repo: REPO, cmd: c.cmd, ...(c.timeout_min ? { timeout_min: c.timeout_min } : {}) });
const bt = (s) => '`' + s + '`';

const existsRel = (rel) => fs.existsSync(path.join(ws, rel)) || fs.existsSync(path.join(dir, rel));
const refLine = (item) => {
  const p = typeof item === 'string' ? item : item.p;
  const note = typeof item === 'string' ? '' : item.note ? ` - ${item.note}` : '';
  const rel = p.startsWith(REPO + '/') ? p : `${REPO}/${p}`;
  return existsRel(rel) && /\.[A-Za-z0-9]+$/.test(rel) ? `- ${bt(rel)}${note}` : `- ${p}${note}`;
};

const ids = new Set();
const manifestPlans = [];
const epicLast = {};
let prev = null;

const out = [];
for (const p of plans) {
  if (ids.has(p.id)) throw new Error('duplicate id ' + p.id);
  ids.add(p.id);
  const file = `${p.id}-${p.name}.md`;
  const lines = [];
  lines.push(`# Plan ${p.id}: ${p.title}`, '');
  lines.push(`Epic ${p.epic}. Estimated turns: ${p.est}.${p.model ? ` Model: ${p.model}.` : ''}`, '');
  lines.push('## Goal', '');
  for (const g of [].concat(p.goal)) lines.push(g, '');
  lines.push('## Read first', '');
  lines.push(`- ${bt(ARCH)} (section 10 is final${p.arch ? '; most relevant: ' + p.arch : ''})`);
  lines.push(`- ${bt(INSTR)}`);
  lines.push('- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist');
  for (const r of p.read || []) lines.push(refLine(r));
  lines.push('');
  if (p.risks && p.risks.length) {
    lines.push('High-risk assumptions that touch this plan (each has a step that checks it):');
    for (const r of p.risks) lines.push(`- ${r}`);
    lines.push('');
  }
  lines.push('## Steps', '', 'Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.', '');
  p.steps.forEach((s, i) => {
    lines.push(`### Step ${i + 1}: ${s.title}`, '');
    lines.push('Deliver:');
    for (const it of s.items) lines.push(`- ${it}`);
    lines.push('', 'Check for this step (the runner runs it too; it fails before the work and passes after):');
    for (const v of s.verify) lines.push(`- ${bt(cmdOf(v))}`);
    lines.push('');
  });
  lines.push('## Do not touch', '');
  lines.push('- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).');
  lines.push('- Frozen tests and test configs of earlier plans (a refused write means frozen).');
  for (const d of p.donttouch || []) lines.push(`- ${d}`);
  lines.push('', '## Acceptance', '', 'Run every command below before the final report. All must exit 0.', '');
  for (const a of p.accept) lines.push(`- ${bt(cmdOf(a))}`);
  if (p.human) lines.push('', `Human check (goes in the report, never blocks): ${p.human}`);
  lines.push('', '## If blocked', '');
  lines.push('Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.');
  for (const b of p.blocked || []) lines.push(`- ${b}`);
  lines.push('', '## Report back', '');
  lines.push('End with the runner\'s final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).');
  for (const r of p.report || []) lines.push(`- ${r}`);
  lines.push('');
  fs.writeFileSync(path.join(dir, file), lines.join('\n'));

  const deps = p.deps !== undefined ? p.deps : prev ? [prev] : [];
  const entry = {
    id: p.id, file, epic: p.epic, repos: [REPO], depends_on: deps, est_turns: p.est,
    ...(p.maxTurns ? { max_turns: p.maxTurns } : {}),
    ...(p.model ? { model: p.model } : {}),
    allowed_paths: p.allowed,
    allow_extra: [],
    ...(p.freeze ? { freeze: p.freeze } : {}),
    ...(p.unfreeze ? { unfreeze: p.unfreeze } : {}),
    verify: p.accept.map(toManifestCmd),
    steps: p.steps.map((s, i) => ({ n: i + 1, title: s.title, verify: s.verify.map(toManifestCmd) })),
    ...(p.human ? { human_check: p.human } : {}),
  };
  manifestPlans.push(entry);
  epicLast[p.epic] = p.id;
  prev = p.id;
  out.push(file);
}

// remove plan files that are no longer in the set
for (const f of fs.readdirSync(dir)) if (/^\d{3}-.+\.md$/.test(f) && !out.includes(f)) fs.rmSync(path.join(dir, f));

const manifest = { ...base, pause_after: Object.values(epicLast), plans: manifestPlans };
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote ${plans.length} plans, epics: ${Object.entries(epicLast).map(([e, i]) => `${e}->${i}`).join(' ')}`);
