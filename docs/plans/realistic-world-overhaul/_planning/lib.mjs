// Helpers for plan definitions (planner tool). All commands run in the repo folder through the system shell (cmd.exe on Windows):
// use double quotes only, no single-quoted arguments, no && chains inside a check.
const AS = 'node "{{runner}}/assert.mjs"';

export const has = (file, re, flags) => `${AS} has ${file} "${re}"${flags ? ' ' + flags : ''}`;
export const none = (file, re, flags) => `${AS} none ${file} "${re}"${flags ? ' ' + flags : ''}`;
export const count = (file, re, n) => `${AS} count ${file} "${re}" ${n}`;
export const exists = (...files) => `${AS} exists ${files.join(' ')}`;
export const json = (file, key, expected) => `${AS} json ${file} ${key}${expected === undefined ? '' : ' ' + expected}`;
export const absent = (...paths) =>
  `node -e "const fs=require('fs');process.exit([${paths.map((p) => `'${p}'`).join(',')}].some(p=>fs.existsSync(p))?1:0)"`;
export const vt = (...files) => `npx vitest run ${files.join(' ')}`;
export const pw = (file, timeout_min = 15) => ({ cmd: `npx playwright test ${file}`, timeout_min });
export const npm = (script, timeout_min) => (timeout_min ? { cmd: `npm run ${script}`, timeout_min } : `npm run ${script}`);
export const node = (script, timeout_min) => (timeout_min ? { cmd: `node ${script}`, timeout_min } : `node ${script}`);
export const BRANCH =
  'node -e "process.exit(require(\'child_process\').execSync(\'git branch --show-current\').toString().trim()===\'world-v2\'?0:1)"';

// path groups that most plans share
export const DOCS = ['portfolio/docs/world-conventions.md', 'portfolio/docs/shots/**'];
export const TESTS = ['portfolio/tests/**'];
