// Input: keyboard, mouse (with optional pointer lock), touch joystick + look pad.

import { game } from '../state.js';
import { applyLookInput, applyZoomInput } from '../engine/camera.js';

export const Input = {
  actionCallback: null   // set by interaction.js
};

export function wireInput() {
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    game.keys[k] = true;
    if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(k)) e.preventDefault();
    if (k === 'shift') game.player.sprinting = true;
    if (k === 'e' && Input.actionCallback) Input.actionCallback();
    if (k === 'escape' && document.pointerLockElement) document.exitPointerLock();
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    game.keys[k] = false;
    if (k === 'shift') game.player.sprinting = false;
  });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(game.keys)) game.keys[k] = false;
    game.player.sprinting = false;
  });

  if (!game.touchMode) {
    const canvas = game.canvas;
    canvas.addEventListener('click', () => {
      if (!document.pointerLockElement) canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      game.pointer.locked = document.pointerLockElement === canvas;
      if (game.crosshairEl) {
        game.crosshairEl.classList.toggle('visible', game.pointer.locked);
      }
    });
    document.addEventListener('mousemove', e => {
      if (game.pointer.locked) applyLookInput(e.movementX, e.movementY, false);
    });
    // Wheel zoom — works whether or not pointer is locked. preventDefault stops
    // the page from scrolling underneath the canvas.
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      applyZoomInput(e.deltaY, false);
    }, { passive: false });
  }

  if (game.touchMode) {
    document.getElementById('joystick').classList.add('active');
    document.getElementById('action-btn').classList.add('active');
    document.getElementById('run-btn').classList.add('active');
    document.getElementById('look-pad').classList.add('active');
    wireTouch();
    const helpEl = document.getElementById('help');
    if (helpEl) helpEl.style.display = 'none';
  }
}

function wireTouch() {
  const joystick = document.getElementById('joystick');
  const knob = joystick.querySelector('.knob');
  const lookPad = document.getElementById('look-pad');
  const actBtn = document.querySelector('#action-btn button');
  const runBtn = document.querySelector('#run-btn button');

  const jCx = () => {
    const r = joystick.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: r.width / 2 };
  };
  function resetJoystick() {
    knob.style.transform = 'translate(0, 0)';
    game.touch.moveVec.x = 0;
    game.touch.moveVec.y = 0;
  }
  function updateJoystick(t) {
    const c = jCx();
    let dx = t.clientX - c.cx;
    let dy = t.clientY - c.cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    const max = c.radius * 0.9;
    if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
    knob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    game.touch.moveVec.x = dx / max;
    game.touch.moveVec.y = dy / max;
  }

  joystick.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    game.touch.joystickId = t.identifier;
    updateJoystick(t);
  }, { passive: false });
  joystick.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === game.touch.joystickId) updateJoystick(t);
    }
  }, { passive: false });
  const endJoystick = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === game.touch.joystickId) {
        game.touch.joystickId = null;
        resetJoystick();
      }
    }
  };
  joystick.addEventListener('touchend', endJoystick);
  joystick.addEventListener('touchcancel', endJoystick);

  lookPad.addEventListener('touchstart', e => {
    for (const t of e.changedTouches) {
      if (game.touch.lookId == null) {
        game.touch.lookId = t.identifier;
        game.touch.lookLastX = t.clientX;
        game.touch.lookLastY = t.clientY;
      }
    }
  }, { passive: true });
  lookPad.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === game.touch.lookId) {
        const dx = t.clientX - game.touch.lookLastX;
        const dy = t.clientY - game.touch.lookLastY;
        game.touch.lookLastX = t.clientX;
        game.touch.lookLastY = t.clientY;
        applyLookInput(dx, dy, true);
      }
    }
  }, { passive: true });
  const endLook = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === game.touch.lookId) game.touch.lookId = null;
    }
  };
  lookPad.addEventListener('touchend', endLook);
  lookPad.addEventListener('touchcancel', endLook);

  actBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (Input.actionCallback) Input.actionCallback();
  }, { passive: false });
  actBtn.addEventListener('click', () => {
    if (Input.actionCallback) Input.actionCallback();
  });

  runBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    const on = runBtn.classList.toggle('on');
    game.player.sprinting = on;
  }, { passive: false });
  runBtn.addEventListener('click', () => {
    const on = runBtn.classList.toggle('on');
    game.player.sprinting = on;
  });
}

export function getMoveIntent() {
  let dx = 0, dy = 0;
  if (game.keys['w'] || game.keys['arrowup'])    dy += 1;
  if (game.keys['s'] || game.keys['arrowdown'])  dy -= 1;
  if (game.keys['a'] || game.keys['arrowleft'])  dx -= 1;
  if (game.keys['d'] || game.keys['arrowright']) dx += 1;
  if (game.touch.moveVec.x || game.touch.moveVec.y) {
    dx += game.touch.moveVec.x;
    dy += -game.touch.moveVec.y;
  }
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  return { dx, dy };
}
