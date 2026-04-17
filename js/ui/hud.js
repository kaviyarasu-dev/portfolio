// HUD: dialogue modal, prompt, zone label, toast, typewriter effect.
// Pure DOM manipulation — all nodes built via el() from dialogues.js.

import { game } from '../state.js';
import { clearChildren, el } from '../util/dom.js';
import { DIALOGUES } from '../content/dialogues.js';
import { TYPE_CPS } from '../config.js';
import { onType } from '../systems/audio.js';

export function openDialogue(zoneId) {
  const gen = DIALOGUES[zoneId];
  if (!gen || !game.dialogueEl) return;
  clearChildren(game.dialogueEl);
  const nodes = gen();
  for (const n of nodes) game.dialogueEl.appendChild(n);
  game.dialogueEl.classList.add('visible');
  game.dialogueEl.scrollTop = 0;
  startTypewriter();
}

export function closeDialogue() {
  if (!game.dialogueEl) return;
  game.dialogueEl.classList.remove('visible');
  game.typingSpans = null;
}

export function setZoneLabel(name) {
  if (!game.hudZoneEl) return;
  if (game.hudZoneEl.textContent !== name) {
    game.hudZoneEl.textContent = name;
  }
  game.hudZoneEl.classList.add('visible');
}

export function clearZoneLabel() {
  if (!game.hudZoneEl) return;
  game.hudZoneEl.classList.remove('visible');
}

let promptText = '';
export function showPrompt(text) {
  if (!game.promptEl) return;
  const keyLabel = game.touchMode ? 'ACT' : 'E';
  if (text !== promptText) {
    clearChildren(game.promptEl);
    game.promptEl.appendChild(el('span', { class: 'key' }, keyLabel));
    game.promptEl.appendChild(document.createTextNode(text));
    promptText = text;
  }
  game.promptEl.classList.add('visible');
}

export function hidePrompt() {
  if (!game.promptEl) return;
  game.promptEl.classList.remove('visible');
  promptText = '';
}

export function showToast(text) {
  if (!game.toastEl) return;
  game.toastEl.textContent = text;
  game.toastEl.classList.add('visible');
  game.toastTimer = 1800;
}

export function updateToast(dt) {
  if (!game.toastEl) return;
  if (game.toastTimer > 0) {
    game.toastTimer -= dt;
    if (game.toastTimer <= 0) game.toastEl.classList.remove('visible');
  }
}

// Typewriter — walks all text nodes inside the dialogue and fades characters in.
export function startTypewriter() {
  if (!game.dialogueEl) return;
  const walker = document.createTreeWalker(game.dialogueEl, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let tn;
  while ((tn = walker.nextNode())) textNodes.push(tn);
  game.typingSpans = [];
  game.typingProgress = 0;
  game.typedSoFar = 0;
  for (const node of textNodes) {
    const text = node.textContent;
    if (!text) continue;
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.opacity = '0';
      frag.appendChild(s);
      game.typingSpans.push(s);
    }
    node.parentNode.replaceChild(frag, node);
  }
}

export function advanceTyping(dt) {
  if (!game.typingSpans || game.typedSoFar >= game.typingSpans.length) return;
  game.typingProgress += (TYPE_CPS * dt) / 1000;
  const target = Math.min(game.typingSpans.length, Math.floor(game.typingProgress));
  let typedThisFrame = 0;
  for (let i = game.typedSoFar; i < target; i++) {
    game.typingSpans[i].style.opacity = '1';
    typedThisFrame++;
  }
  if (typedThisFrame > 0) onType();
  game.typedSoFar = target;
}
