export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const wrapAngle = (a) => {
  while (a > Math.PI)  a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
export const angleLerp = (a, b, t) => a + wrapAngle(b - a) * t;
export const angleDamp = (a, b, lambda, dt) => {
  const d = wrapAngle(b - a);
  return a + d * (1 - Math.exp(-lambda * dt));
};
