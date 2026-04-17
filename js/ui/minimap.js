// Minimap - 2D canvas rendered once per frame (cheap). Shows island silhouette,
// zones as icons, player as a glowing dot + facing wedge.

import { game } from '../state.js';
import { WORLD_RADIUS } from '../config.js';
import { ZONE_LAYOUT } from '../world/zones.js';

let ctx = null;
let cw = 160, ch = 160;

export function initMinimap() {
  if (!game.minimapCanvas) return;
  ctx = game.minimapCanvas.getContext('2d');
  cw = game.minimapCanvas.width;
  ch = game.minimapCanvas.height;
}

function worldToMap(x, z, scale) {
  return {
    mx: cw / 2 + (x / WORLD_RADIUS) * (cw / 2) * scale,
    my: ch / 2 + (z / WORLD_RADIUS) * (ch / 2) * scale
  };
}

const ZONE_COLORS = {
  plaza: '#7cc7ff',
  notice: '#b48cff',
  forge: '#f4c64e',
  citadel: '#7cc7ff',
  broadcast: '#ff8a55',
  gateway: '#5ee0a0',
  transport: '#e55a5a',
  temple: '#b48cff',
  workshop: '#f4c64e',
  freshnote: '#96a0b5',
  library: '#7cc7ff',
  academy: '#ff8a55',
  lighthouse: '#e55a5a',
  milestones: '#f4c64e'
};

export function updateMinimap() {
  if (!ctx) return;
  ctx.clearRect(0, 0, cw, ch);

  // Island silhouette
  ctx.save();
  ctx.fillStyle = 'rgba(80, 120, 70, 0.45)';
  ctx.beginPath();
  ctx.arc(cw / 2, ch / 2, Math.min(cw, ch) * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ring
  ctx.strokeStyle = 'rgba(124, 199, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cw / 2, ch / 2, Math.min(cw, ch) * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  // Zones
  for (let i = 0; i < ZONE_LAYOUT.length; i++) {
    const zn = ZONE_LAYOUT[i];
    const p = worldToMap(zn.x, zn.z, 0.85);
    ctx.fillStyle = ZONE_COLORS[zn.id] || '#ffffff';
    ctx.beginPath();
    ctx.arc(p.mx, p.my, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Player
  if (game.player && game.player.position) {
    const p = worldToMap(game.player.position.x, game.player.position.z, 0.85);
    // Facing wedge
    ctx.save();
    ctx.translate(p.mx, p.my);
    ctx.rotate(game.player.facing);
    ctx.fillStyle = 'rgba(180,140,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-7, -14);
    ctx.lineTo(7, -14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Dot
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.mx, p.my, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b48cff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Nearest zone highlight
  if (game.nearestZone) {
    const p = worldToMap(game.nearestZone.x, game.nearestZone.z, 0.85);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.mx, p.my, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}
