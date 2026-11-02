// Template for the landmark building plans of epic 4 (planner tool). One call renders one plan definition.
import { has, exists, vt, pw, npm, node } from './lib.mjs';

export function buildingPlan(s) {
  const z = s.zone;
  const T = `tests/unit/buildings/${z}`;
  const steps = [];

  steps.push({
    title: `Structure manifest for the ${s.display}`,
    items: [
      `Create \`src/world/buildings/${z}/manifest.json\` (schema of \`docs/building-manifest.md\`): \`id: "${z}"\`, \`displayName: "${s.display}"\`, \`prompt: "${s.prompt}"\`, footprint taken from the \`${z}\` anchor in \`src/world/layout/town.json\` (${s.footprint}), floors ${s.floors}, style: ${s.style}.`,
      `Rooms (ids fixed): ${s.rooms.map((r) => `\`${r.id}\` (${r.desc})`).join('; ')}. Room count between 3 and 6.`,
      `Doors: ${s.doors}. At least one unlocked exterior door that is not decorative. Windows: ${s.windows}. Stairs and lifts: ${s.stairs}.`,
      `\`exteriorDetails\` counts (all seven classes, window at least 4): ${s.details}. \`interactables\`: declare only \`${s.read.id}\` now (kind \`read\`, room \`${s.read.room}\`, \`dialogueKey\` \`main\`, prompt "${s.read.prompt}").`,
      `\`${T}.test.js\` first: \`checkBuilding(manifest, { stage: "structure" })\` passes; the room ids above exist exactly; the exterior door is unlocked; ${s.structureTest}; the CLI \`check:buildings --only ${z} --stage structure\` exits 0.`,
    ],
    verify: [vt(`${T}.test.js`), node(`scripts/check-buildings.mjs --only ${z} --stage structure`), exists(`src/world/buildings/${z}/manifest.json`)],
  });

  steps.push({
    title: 'Exterior: shell look, details, signage',
    items: [
      `\`src/world/buildings/${z}/build.js\` exports \`decorate${z[0].toUpperCase()}${z.slice(1)}(instance, ctx)\` (the kit calls it through the decorate hook) using the shared exterior kit (\`src/world/kit/exterior.js\`): ${s.exterior}`,
      `Signage from \`src/content/signage.js\`: add the keys ${s.signs} (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).`,
      `Counts of built detail objects must reach the manifest counts (\`checkDetails\`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.`,
      `\`${T}Exterior.test.js\` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.`,
    ],
    verify: [vt(`${T}Exterior.test.js`), node(`scripts/check-buildings.mjs --only ${z} --stage structure`), exists(`src/world/buildings/${z}/build.js`)],
  });

  const interiorItems = [
    ...(s.newProps ? [`New props first (category \`${s.newProps.cat}\`, file \`src/world/props/sets/${s.newProps.file}.js\`, same quality bar and metadata rules as plans 019 and 022): ${s.newProps.types.map((t) => '`' + t + '`').join(', ')}${s.newProps.note ? '. ' + s.newProps.note : ''}. Register them in \`src/world/props/index.js\` and add \`tests/unit/props/${s.newProps.file}.test.js\` (exact list, sizes within 20 percent of the bounding box, categories, ${s.newProps.test}).`] : []),
    ...s.rooms.map((r) => `Room \`${r.id}\` (floor material ${r.floor}): ${r.objects}. Lights: ${r.lights}.`),
    `Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. ${s.interiorExtra || ''}`,
    `Interactables: ${s.read.id} (\`read\`, the object is ${s.read.object}); light switches per room; seats ${s.seats}.`,
    `\`${T}Interior.test.js\` first: \`checkBuilding\` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; ${s.interiorTest}.`,
  ];
  steps.push({
    title: 'Interior: rooms, objects, lights, interactables',
    items: interiorItems,
    verify: [vt(`${T}Interior.test.js`, ...(s.newProps ? [`tests/unit/props/${s.newProps.file}.test.js`, 'tests/unit/props/allProps.test.js'] : [])), node(`scripts/check-buildings.mjs --only ${z}`)],
  });

  steps.push({
    title: 'Convert the zone, stream it, Playwright and shots',
    items: [
      ...(s.extra4 || []),
      `\`src/world/zones.js\`: \`${z}\` becomes \`name: "${s.display}"\`, \`prompt: "${s.prompt}"\`, \`mode: "object"\` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in \`src/content/dialogues.js\` for \`${z}\` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for \`${z}\` from \`src/world/buildings.js\` (and its collider and animation hooks).`,
      `Register the building as a streamed area \`${z}\` (priority 30, \`loadRadius\` 120, \`unloadRadius\` 170, \`interior: true\`) in \`src/world/areas/index.js\`; register the \`read\` interactable (${s.read.object}) so \`E\` opens the existing dialogue for \`${z}\` (A5); ${s.readExtra || 'the content stays exactly as v1'}.`,
      ...(z === 'notice' ? [] : [`Add \`${z}\` to \`tests/fixtures/zoneExpect.json\` ONLY if it is missing (plan 043 created all 14 entries).`]),
      `\`tests/e2e/${z}.spec.js\`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), \`e\` opens it, walk in with no loading screen (the \`#loader\` stays hidden), \`listBuildings()\` shows \`${z}\` with \`interiorVisible\` true and empty \`problems\`; walk to the ${s.read.object} and press \`e\`: \`#dialogue\` is visible and contains every string of \`zoneExpect.json[${z}].mustInclude\` and the display name; Escape closes; ${s.e2eExtra}; zero console errors.`,
      `Add budget spots \`${z}-outside\` and \`${z}-inside\` to \`src/budgets.json\` (inside = the main room) and shot spots to \`src/shots.json\`; \`npm run check:budget\` passes; run \`npm run shots -- --plan ${s.id} --spots ${z}-outside,${z}-inside${s.extraShots || ''}\`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).`,
    ],
    verify: [pw(`tests/e2e/${z}.spec.js`, 20), { cmd: 'npm run check:budget', timeout_min: 15 }, node(`scripts/check-buildings.mjs --only ${z}`), ...(s.verify4 || [])],
  });

  return {
    id: s.id, name: s.slug, title: s.title, epic: 'E4', est: s.est || 55, ...(s.model ? { model: s.model } : {}),
    arch: 'sections 3, 10.6 and requirement R6, R8, decision D4, D9, D18, A5, A30',
    goal: [s.goal, `This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (\`npm run check:buildings -- --only ${z}\`).`],
    read: ['docs/building-manifest.md', 'src/world/buildings/plaza/manifest.json', 'src/world/buildings/plaza/build.js', 'src/world/kit/exterior.js', 'src/world/kit/building.js', 'src/world/layout/town.json', 'src/world/zones.js', 'src/content/dialogues.js', 'src/content/signage.js', 'scripts/check-buildings.mjs', ...(s.read2 || [])],
    steps,
    accept: [npm('lint'), vt(`${T}.test.js`, `${T}Exterior.test.js`, `${T}Interior.test.js`), node(`scripts/check-buildings.mjs --only ${z}`), pw(`tests/e2e/${z}.spec.js`, 20), { cmd: 'npm run check:budget', timeout_min: 15 }, npm('check:ledger')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/**'],
    freeze: [`portfolio/${T}.test.js`, `portfolio/${T}Exterior.test.js`, `portfolio/${T}Interior.test.js`, `portfolio/tests/e2e/${z}.spec.js`, ...(s.newProps ? [`portfolio/tests/unit/props/${s.newProps.file}.test.js`] : []), ...(s.freezeExtra || [])],
    human: s.human || `Walk the ${s.display} inside and out and judge the realism.`,
    risks: s.risks,
  };
}
