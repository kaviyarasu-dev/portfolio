// Nearest-zone detection + E/ACT trigger. Opens dialogue, downloads resume.

import { game } from '../state.js';
import { Input } from './input.js';
import { RESUME_HREF, INTERACT_RADIUS_DEFAULT } from '../config.js';
import { openDialogue, closeDialogue, showPrompt, hidePrompt, showToast, setZoneLabel, clearZoneLabel } from '../ui/hud.js';
import { cameraShake } from '../engine/camera.js';
import { onZoneEnter, onInteract } from './audio.js';

export function initInteraction() {
  Input.actionCallback = tryAction;
}

export function updateInteraction(dt) {
  if (!game.zones || !game.zones.length) return;
  const px = game.player.position.x;
  const pz = game.player.position.z;

  let nearest = null;
  let nearestD = Infinity;
  for (let i = 0; i < game.zones.length; i++) {
    const z = game.zones[i];
    const dx = px - z.x, dz = pz - z.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < (z.r + INTERACT_RADIUS_DEFAULT) && d < nearestD) {
      nearestD = d;
      nearest = z;
    }
  }
  game.nearestZone = nearest;

  if (nearest) {
    setZoneLabel(nearest.name);
    if (!game.activeZone || game.activeZone.id !== nearest.id) {
      showPrompt(nearest.prompt || 'interact');
    }
  } else {
    clearZoneLabel();
    hidePrompt();
    if (game.activeZone) {
      game.activeZoneTimer += dt;
      if (game.activeZoneTimer > 350) {
        closeDialogue();
        game.activeZone = null;
        game.activeZoneTimer = 0;
      }
    }
  }
}

export function tryAction() {
  const z = game.nearestZone;
  if (!z) return;

  if (z.id === 'notice') {
    const a = document.createElement('a');
    a.href = RESUME_HREF;
    a.download = 'Kaviyarasu_Fullstack_Engineer_Resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('RESUME DOWNLOADED');
    cameraShake(0.18, 220);
    onInteract();
    return;
  }

  if (game.activeZone && game.activeZone.id === z.id) {
    closeDialogue();
    game.activeZone = null;
    game.activeZoneTimer = 0;
    return;
  }

  openDialogue(z.id);
  game.activeZone = z;
  game.activeZoneTimer = 0;
  onZoneEnter(z.id);
  onInteract();
}
