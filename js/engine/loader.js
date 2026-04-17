// Async preload + progress. Procedural assets don't need network,
// but we fake progress in steps so the loader feels alive.

import { game } from '../state.js';

export const Loader = {
  steps: [],
  current: 0
};

function setProgress(pct, hint) {
  if (game.loaderBarEl) game.loaderBarEl.style.width = pct + '%';
  if (hint && game.loaderHintEl) game.loaderHintEl.textContent = hint;
}

export async function runPreload(steps) {
  Loader.steps = steps;
  Loader.current = 0;
  const n = steps.length;
  setProgress(0, 'Initialising');
  for (let i = 0; i < n; i++) {
    const step = steps[i];
    if (step.hint) setProgress((i / n) * 100, step.hint);
    await new Promise(r => requestAnimationFrame(r));
    await Promise.resolve(step.run());
    setProgress(((i + 1) / n) * 100, step.hint);
  }
  setProgress(100, 'Ready');
}

export function hideLoader() {
  if (!game.loaderEl) return;
  game.loaderEl.classList.add('hidden');
  setTimeout(() => { game.loaderEl.style.display = 'none'; }, 700);
}

export function showFatalError(err) {
  if (!game.loaderEl) return;
  game.loaderEl.classList.remove('hidden');
  game.loaderEl.style.display = 'flex';
  if (game.loaderHintEl) {
    game.loaderHintEl.textContent = 'Error: ' + (err && err.message ? err.message : err);
    game.loaderHintEl.style.color = '#ff7a7a';
  }
  console.error(err);
}
