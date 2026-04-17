// 14 zones placed across the island. Each has a world position + interaction radius.
// The buildings layer consumes ZONE_LAYOUT to place landmarks.

export const ZONE_LAYOUT = [
  { id: 'plaza',      name: 'Plaza of Kaviyarasu',     x:   0, z:   3, r: 4.5, prompt: 'read intro' },
  { id: 'notice',     name: 'Notice Board · Resume',    x:   4, z:   8, r: 3.2, prompt: 'take resume' },
  { id: 'forge',      name: 'Skill Forge',              x: -28, z: -34, r: 4.8, prompt: 'inspect forge' },
  { id: 'citadel',    name: 'GravityWrite Citadel',     x:   0, z: -58, r: 6.5, prompt: 'enter citadel' },
  { id: 'broadcast',  name: 'GravitySocial Broadcast',  x:  34, z: -42, r: 5.0, prompt: 'tune in' },
  { id: 'gateway',    name: 'GravityAuth Gateway',      x: -44, z:   6, r: 4.5, prompt: 'cross gateway' },
  { id: 'transport',  name: 'TransGenie Transport Hub', x:  48, z:  12, r: 5.0, prompt: 'enter hub' },
  { id: 'temple',     name: 'Open-Source Temple',       x: -32, z:  42, r: 5.0, prompt: 'read runes' },
  { id: 'workshop',   name: '1CLX Workshop',            x:  36, z:  40, r: 4.6, prompt: 'tinker' },
  { id: 'freshnote',  name: 'Freshnote Studio',         x: -12, z:  56, r: 4.2, prompt: 'visit studio' },
  { id: 'library',    name: 'Library of Experience',    x: -60, z: -16, r: 5.0, prompt: 'read archives' },
  { id: 'academy',    name: 'Academy',                  x:  56, z: -22, r: 4.5, prompt: 'attend class' },
  { id: 'lighthouse', name: 'Lighthouse · Contact',     x:  66, z: -68, r: 4.5, prompt: 'signal' },
  { id: 'milestones', name: 'Milestones Monument',      x:   0, z:  28, r: 4.5, prompt: 'see numbers' }
];

export function zoneById(zones, id) {
  return zones.find(z => z.id === id) || null;
}
