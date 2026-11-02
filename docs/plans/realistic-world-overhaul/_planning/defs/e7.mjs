import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 067
  {
    id: '067', name: 'text-mode', title: 'Text mode: skip to the full resume as a normal page', epic: 'E7', est: 45,
    arch: 'sections 7 (Accessibility) and requirement R12, decision D7(a)',
    goal: [
      'A fast, accessible way to read the resume without walking: a "Skip to resume" control opens a full-page text view built from the same content files (name, title, location, links, summary, skills, experience, projects, education, certifications, milestones). It works with the keyboard and a screen reader, prints cleanly, and `?text=1` (or `#text`) opens it directly without starting the 3D world. The email is a click-to-reveal button; there is no phone number.',
    ],
    read: ['src/content/contact.js', 'src/content/projects.js', 'src/content/experience.js', 'src/content/education.js', 'src/content/dialogues.js', 'src/ui/emailReveal.js', 'src/ui/hud.js', 'src/main.js', 'src/util/urlParams.js', 'index.html'],
    steps: [
      {
        title: 'Resume sections as data and a DOM builder',
        items: [
          '`tests/unit/ui/resumeText.test.js` first. `src/content/resumeText.js`: `buildResumeSections()` returns an ordered array of `{ id, heading, blocks }` built ONLY from the existing content modules (no new text): `about` (name, title, location, the intro paragraph that the plaza dialogue shows), `contact` (LinkedIn and GitHub links, the email reveal), `skills` (every skill name and percentage from the dialogue skills list; export that list from `dialogues.js` as `SKILLS` if it is private), `experience` (every entry: company, title, period, location, stack, bullets), `projects` (featured plus others: name, tagline, period, company, summary, stack, bullets, metrics, url), `education`, `certifications`, `milestones` (the milestone facts shown by the milestones dialogue). `src/ui/textMode.js`: `renderResume(doc, sections)` builds a semantic tree with the `el()` helper (no `innerHTML`): one `h1` (the name), `main` with `section` elements each with an `h2` and lists, links with `rel="noopener"`, no inline styles except through classes.',
          'Tests: the section ids in order; the experience section has exactly as many entries as `experience.js` and the same company names in the same order; every project name from `projects.js` appears; skills include all 8 skills with their percentages; the text contains no digit sequence matching the phone regex (reuse `scanForPhone` text matcher) and no `@` character (the email is a button); heading levels never skip (an h3 only under an h2); every link has an `href` starting with `https://`.',
        ],
        verify: [vt('tests/unit/ui/resumeText.test.js'), exists('src/content/resumeText.js', 'src/ui/textMode.js')],
      },
      {
        title: 'The overlay, the route and the entry controls',
        items: [
          '`src/ui/textMode.js`: `openTextMode()` shows `#text-mode` (role `dialog`? no: a full-page region, `role="document"` inside `<div id="text-mode" aria-label="Resume as text">`): a sticky top bar with a "Back to the 3D world" button, a "Download resume (PDF)" link (`assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` with the download name unchanged), the print button, then the sections. Focus moves to the heading; `Escape` and the back button close it and return focus; scrolling is native; styles in `index.html` use the same colour tokens with a light high-contrast variant when the user prefers `prefers-color-scheme: light` and print CSS (white background, black text, hides the bar).',
          'Entry: a visible "Skip to resume" link in the top-left of the HUD (first in tab order, also focusable by Tab as the very first stop on the page) and key `Shift+T`... NO: use key `X`? Use the key `Shift+R`; pick `Shift+R` and list it in the help panel. `?text=1` or `#text` in the URL opens the text mode at boot BEFORE the 3D world starts: `src/main.js` checks the flag, renders the text view, and starts the world only when the user presses "Back to the 3D world" (or never, when WebGL is unavailable: plan 069).',
          '`tests/e2e/text-mode.spec.js`: from the world press `Shift+R`: `#text-mode` visible, the h1 is the name, there is one `h2` per section, the number of experience entries equals the content file (import it in the test), a `button.email-reveal` exists and no `a[href^="tel:"]`; `Escape` closes it; the Tab key from page load reaches the "Skip to resume" link first; opening `?text=1` shows the text without a WebGL canvas element being created (`document.querySelector("canvas")` is null) and no console errors; `page.emulateMedia({ media: "print" })` hides the bar (computed display none).',
        ],
        verify: [pw('tests/e2e/text-mode.spec.js', 15)],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/ui/resumeText.test.js'), pw('tests/e2e/text-mode.spec.js', 15), npm('build', 15), node('scripts/check-phone.mjs')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/index.html'],
    freeze: ['portfolio/tests/unit/ui/resumeText.test.js', 'portfolio/tests/e2e/text-mode.spec.js'],
  },

  // ---------------------------------------------------------------- 068
  {
    id: '068', name: 'fast-travel-map', title: 'Fast-travel map with keyboard and touch access', epic: 'E7', est: 50,
    arch: 'sections 7 (Accessibility, Touch) and requirement R12, decision D7(a), journey 3',
    goal: [
      'A full-screen map of the island (key `M`, and a map button visible on touch and desktop) listing the 14 landmarks as markers and as a keyboard-operable list. Choosing one teleports the player to the entrance of that building with a short fade. The map is also the fast way around a 300 m island. Touch buttons for the rest arrive in plan 071.',
    ],
    read: ['src/ui/minimap.js', 'src/ui/hud.js', 'src/world/layout/town.json', 'src/world/zones.js', 'src/world/buildings/plaza/manifest.json', 'src/dev/worldHook.js', 'src/ui/settings.js', 'src/systems/input.js'],
    steps: [
      {
        title: 'Entrance points and the shared teleport',
        items: [
          '`tests/unit/map/entrance.test.js` first. `src/systems/teleport.js`: `entrancePoint(zoneId, manifest, anchor)` returns `{ x, y, z, yaw }`: 3.0 m outside the main exterior door (the first unlocked `exterior` door, not decorative) along the outward wall normal, rotated by the anchor rotation, at the terrain height there, facing the door; `teleportToZone(game, zoneId)` moves the player and camera (sets yaw), clears the interaction state (closes any dialogue, stands up from a seat), and keeps the interior visibility consistent; the hook `teleport(zoneId)` uses it (the spawn `plaza` still goes to the lobby of plan 031: `teleportToZone(game, \'plaza\')` is the lobby, the map offers the hotel entrance by an extra `entrance` flag).',
          'Tests: for all 14 manifests the point is outside the footprint, not blocked (`blockedAt` false with radius 0.35 in a headless world with that building), within 4 m of the door and not inside another anchor rectangle; the yaw faces the door within 0.1 rad; for a rotated anchor the point rotates with it.',
        ],
        verify: [vt('tests/unit/map/entrance.test.js'), exists('src/systems/teleport.js')],
      },
      {
        title: 'The map UI',
        items: [
          '`src/ui/map.js`: `openMap()` / `closeMap()` for `#map` (role `dialog`, `aria-modal`, labelled "Island map"). It draws the island from `buildMinimapLayers` (plan 040) on a canvas sized to the viewport (land, sea, harbour, roads by class, the player marker with direction), places 14 marker buttons (`<button class="map-marker" data-zone="library" aria-label="Public Library">`) over the canvas by their anchor coordinates, and shows a list on the side or below on narrow screens with the same 14 names (a `<ul>` of buttons, arrow keys move focus, Enter travels). Hover or focus shows the name and what the building shows (from the zone prompt). A "You are here" marker and a "Close" button. `M` toggles, `Escape` closes, pointer lock is released while open, movement keys are ignored while open. Selecting a zone calls `teleportToZone`, fades the screen to black and back over 400 ms (CSS, skipped when reduced motion is on) and closes the map.',
          'The HUD gets a small map button (aria-label "Open map") top-right under the settings gear that works with mouse and touch.',
          '`tests/e2e/map.spec.js`: press `m`: `#map` visible and `document.activeElement` is inside it; there are exactly 14 `.map-marker` buttons and 14 list buttons; for each zone: click its marker: the map closes, `playerState()` is within 6 m of `entrancePoint` (hook `entrancePoint(id)`) and not blocked; the map button opens it too; `Escape` closes; keyboard only: open with `m`, Tab to the list, ArrowDown twice, Enter: the player teleports to the third landmark; zero console errors.',
        ],
        verify: [pw('tests/e2e/map.spec.js', 25), exists('src/ui/map.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/map/entrance.test.js'), pw('tests/e2e/map.spec.js', 25), pw('tests/e2e/dialogues-all.spec.js', 40)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/index.html'],
    freeze: ['portfolio/tests/unit/map/entrance.test.js', 'portfolio/tests/e2e/map.spec.js'],
  },

  // ---------------------------------------------------------------- 069
  {
    id: '069', name: 'fallback-and-seo', title: 'No-WebGL fallback, static resume HTML for crawlers, SEO and share tags, journey 8', epic: 'E7', est: 55,
    arch: 'sections 7 (Resilience, Privacy) and requirement R12, decision D7(b), D26, D30, assumption A28',
    goal: [
      'A visitor without WebGL, a crawler and a share preview must all get the person: name, title, location, LinkedIn, GitHub, an email reveal button and the resume text. The built `index.html` carries a static copy of the resume (generated at build time from the content files by a Vite plugin) that stays hidden when the 3D world runs and shows when WebGL is missing or scripts fail. SEO and OpenGraph tags, a Person JSON-LD block and a share image are added. No phone number anywhere; the email is never plain text.',
    ],
    read: ['index.html', 'vite.config.js', 'src/main.js', 'src/content/resumeText.js', 'src/ui/textMode.js', 'src/ui/emailReveal.js', 'scripts/check-phone.mjs', 'scripts/check-no-cdn.mjs', 'scripts/shots.mjs'],
    steps: [
      {
        title: 'Static resume HTML at build time',
        items: [
          '`tests/unit/build/staticResume.test.js` first. `scripts/vite-plugin-static-resume.mjs`: a Vite plugin (`transformIndexHtml`) that imports `src/content/resumeText.js` (pure data, no DOM) and injects into `index.html`, inside `<div id="static-resume" hidden>`, the HTML of `renderResumeHtml(sections)` (string renderer in the same module with escaping of `& < > " \'`), plus a `<noscript>` message. The email appears only as an empty `<button class="email-reveal" type="button">Show email</button>` (wired by script). Export `renderResumeHtml` for the test.',
          'Tests: escaping (`<script>` in a text node is escaped); every experience company and every project name is in the output; no `@` and no `tel:` and no phone digits; the h1 is the name; the plugin function applied to a sample `index.html` string inserts exactly one `static-resume` block; running the real Vite build (`npm run build`) makes `dist/index.html` contain it (a test that reads `dist/index.html` is allowed to be skipped when `dist` is missing but the acceptance below runs the build first).',
        ],
        verify: [vt('tests/unit/build/staticResume.test.js'), exists('scripts/vite-plugin-static-resume.mjs'), has('vite.config.js', 'static-resume')],
      },
      {
        title: 'WebGL detection, fallback view, SEO tags and the share image',
        items: [
          '`src/boot/webglCheck.js`: `hasWebGL()` creates a throwaway canvas and requests `webgl2` then `webgl` (and `experimental-webgl`), returns false when none is available or the context is lost immediately, and never throws. `src/main.js` calls it first: when false, skip the world, un-hide `#static-resume` (class `fallback-visible`, a simple readable light style), show a short banner "Your browser could not start the 3D world. Here is the resume as text.", wire the email reveal button, and stop. No console errors in this path (use `console.warn` once).',
          '`index.html` head: `<title>Kaviyarasu M - Senior Full Stack Engineer</title>`, `<meta name="description" content="...">` (one sentence made from the existing intro text, no new facts), canonical `https://kaviyarasu-dev.github.io/portfolio/`, Open Graph (`og:title`, `og:description`, `og:type` website, `og:url`, `og:image` absolute URL to `assets/og-image.jpg`, `og:image:width` 1200, `og:image:height` 630, `og:locale`), Twitter `summary_large_image`, `<meta name="theme-color">`, and a JSON-LD `Person` block (name, jobTitle, address locality and country, `sameAs` LinkedIn and GitHub; NO telephone and NO email). `scripts/make-og-image.mjs` captures the square at dusk (1200 by 630) with the shots machinery, writes `assets/og-image.jpg` (quality 82, at most 250 KB, use `sharp`) and adds the ledger entry (source `generated:scripts/make-og-image.mjs`). Run it.',
          '`tests/unit/build/seo.test.js`: reads `index.html`: title, description, canonical, the five OG tags, the Twitter card, JSON-LD parses as JSON and has no `telephone` and no `email` key, `og:image` file exists and is under 250 KB and ledgered; no `<script src="http`.',
        ],
        verify: [vt('tests/unit/build/seo.test.js'), exists('src/boot/webglCheck.js', 'scripts/make-og-image.mjs', 'assets/og-image.jpg'), npm('check:ledger')],
      },
      {
        title: 'Journey 8 and the build checks',
        items: [
          '`tests/e2e/journey-8-no-webgl.spec.js` (journey 8): `context.addInitScript` replaces `HTMLCanvasElement.prototype.getContext` so that `webgl`, `webgl2` and `experimental-webgl` return null; open the base URL: `#static-resume` is visible, shows the h1 name, the LinkedIn and GitHub links and a `button.email-reveal`; clicking the button reveals a `mailto:` link; the page HTML (`page.content()`) contains no phone number match and no `kaviyarasu.m.dev@gmail.com` string; no `canvas#game-canvas` rendering was attempted (`window.__world` undefined); zero console errors; with WebGL available the static block is hidden (`display: none`) and the loader runs as usual.',
          '`npm run build`, then `node scripts/check-phone.mjs` and `node scripts/check-no-cdn.mjs` pass (the static block and the JSON-LD are scanned too); a unit test or script check that `dist/index.html` contains `og:image` and the static resume text of the first experience company.',
        ],
        verify: [pw('tests/e2e/journey-8-no-webgl.spec.js', 15), npm('build', 15), node('scripts/check-phone.mjs'), node('scripts/check-no-cdn.mjs')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/build/staticResume.test.js', 'tests/unit/build/seo.test.js'), npm('build', 15), node('scripts/check-phone.mjs'), node('scripts/check-no-cdn.mjs'), pw('tests/e2e/journey-8-no-webgl.spec.js', 15), pw('tests/e2e/smoke.spec.js', 15), npm('check:ledger'), npm('check:size')],
    allowed: ['portfolio/src/**', 'portfolio/scripts/**', 'portfolio/tests/**', 'portfolio/index.html', 'portfolio/vite.config.js', 'portfolio/assets/**'],
    freeze: ['portfolio/tests/unit/build/staticResume.test.js', 'portfolio/tests/unit/build/seo.test.js', 'portfolio/tests/e2e/journey-8-no-webgl.spec.js'],
    human: 'Paste the live URL into a link preview tool after deploy to check the share card.',
  },

  // ---------------------------------------------------------------- 070
  {
    id: '070', name: 'guided-tour', title: 'Skippable first-visit tour shown once per browser', epic: 'E7', est: 40,
    arch: 'section 7 (Accessibility) and requirement R12, decision D7(c), assumption A16',
    goal: [
      'A short guided tour for first-time visitors: seven small steps that point at the controls and the idea of the world, skippable at any time with a button or `Escape`, never shown again in the same browser (localStorage in try/catch), keyboard and screen-reader friendly, different text for touch, and it never blocks movement.',
    ],
    read: ['src/ui/settings.js', 'src/ui/hud.js', 'src/ui/map.js', 'src/ui/textMode.js', 'src/main.js', 'src/util/urlParams.js', 'src/engine/quality.js'],
    steps: [
      {
        title: 'Tour state machine and storage (pure)',
        items: [
          '`tests/unit/ui/tour.test.js` first. `src/ui/tourState.js`: `createTour({ storage, touch })` returns `{ steps, index, active, next(), skip(), shouldStart() }`; `shouldStart()` is true only when the storage key `portfolio.tour` is missing, and false when storage throws (private mode) AFTER one successful start in the session (so a broken storage never loops); `skip()` and finishing write `done` inside try/catch; steps (desktop text, with touch variants): 1 "Welcome to the Grand Hotel. Everything here is about Kaviyarasu: walk around." 2 "Move with W A S D, hold Shift to run." (touch: "Use the left joystick to move.") 3 "Look with the mouse; press V for first person." (touch: "Drag the right side to look; use the camera button.") 4 "Press E near glowing objects: doors, desks, boards." (touch: "Tap ACT.") 5 "Press M for the map and fast travel." 6 "Press O for settings: quality, sound, reduced motion." 7 "Prefer plain text? Press Shift+R for the resume as a page." Only text from this list; no resume facts.',
          'Tests: first visit starts, after `skip` or `next` to the end it never starts again with the same storage; a throwing storage still allows one start and does not throw; touch variants differ from desktop; the step count is 7; reaching the end calls the done callback once.',
        ],
        verify: [vt('tests/unit/ui/tour.test.js'), exists('src/ui/tourState.js')],
      },
      {
        title: 'Tour UI and Playwright',
        items: [
          '`src/ui/tour.js`: a card (`role="dialog"`, `aria-live="polite"`, labelled "Quick tour") anchored bottom-centre, with the step text, "Next" and "Skip tour" buttons, a step counter "2 of 7", a gentle pulse ring on the relevant HUD control (settings gear, map button, the E prompt) that is static when reduced motion is on; it starts 1.5 s after the world is ready and not while a dialogue or the settings or map are open; movement keys still work while it is shown (it does not trap focus) and `Escape` skips. `?tour=1` forces it (dev and production), `?tour=0` suppresses it. The automatic start is also suppressed when `navigator.webdriver` is true (automation) unless `?tour=1` is present, so every earlier Playwright spec keeps running unchanged; the tour spec uses `addInitScript` to make `navigator.webdriver` false for the real first-visit behaviour.',
          '`tests/e2e/tour.spec.js`: a fresh browser context shows `#tour` within 6 s of ready with the text of step 1; clicking Next 6 times then finishing hides it and `localStorage["portfolio.tour"]` is `done`; reload: `#tour` never appears (wait 4 s); a new context with `?tour=0` never shows it; skipping with Escape on step 3 stores `done`; with `context.addInitScript` that makes `localStorage` throw the tour still shows once and the page has no console errors; the touch variant text appears with `hasTouch`.',
        ],
        verify: [pw('tests/e2e/tour.spec.js', 20), exists('src/ui/tour.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/ui/tour.test.js'), pw('tests/e2e/tour.spec.js', 20), pw('tests/e2e/journey-1-arrive.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/index.html'],
    freeze: ['portfolio/tests/unit/ui/tour.test.js', 'portfolio/tests/e2e/tour.spec.js'],
    blocked: ['Existing frozen specs must keep passing without edits: that is why the automatic start is suppressed under automation (see step 2).'],
  },

  // ---------------------------------------------------------------- 071
  {
    id: '071', name: 'touch-controls', title: 'Touch controls: joystick, action, camera, map, run, tested at a phone viewport', epic: 'E7', est: 50,
    arch: 'section 7 (Touch) and requirement R12, assumption A25',
    goal: [
      'A phone visit works: a left joystick to move, a drag area on the right to look, an ACT button that does what `E` does (its label shows the current prompt), buttons for the camera mode (V), the map (M), run, and settings, safe-area aware, never overlapping the dialogue, with multi-touch (move and look together). Tests drive real touch events at a 390 by 844 viewport.',
    ],
    read: ['src/systems/input.js', 'src/state.js', 'index.html', 'src/ui/hud.js', 'src/ui/map.js', 'src/ui/settings.js', 'src/systems/interaction/registry.js', 'src/systems/controller.js'],
    steps: [
      {
        title: 'Touch input model (pure)',
        items: [
          '`tests/unit/input/touch.test.js` first. `src/systems/touchModel.js`: `createJoystick({ radius = 56, deadZone = 0.15 })` with `start(id, x, y)`, `move(id, x, y)`, `end(id)` returning `{ x, y }` in -1..1 (clamped to the radius, dead-zone rescaled, y up is forward), and `createLookPad({ sensitivity })` returning yaw and pitch deltas; both track their own touch identifiers so a second finger does not disturb the first; `labelFor(prompt)` returns the ACT button label (`ACT`, or the prompt verb when short). Tests: dead zone, clamping at the radius, identifier isolation, end resets, label rules, diagonal normalization (|v| at most 1).',
        ],
        verify: [vt('tests/unit/input/touch.test.js'), exists('src/systems/touchModel.js')],
      },
      {
        title: 'The touch HUD',
        items: [
          'Rework the v1 touch elements (`#joystick`, `#look-pad`, `#action-btn`, `#run-btn`) in `index.html` and `src/systems/input.js` to use the model: show them only when `game.touchMode` is true (touch capable device or width under 800); layout for portrait and landscape with `env(safe-area-inset-*)`; buttons at least 48 by 48 CSS px with `aria-label`s: ACT (right, lower), camera toggle (V), map, run toggle, settings gear (already); the joystick base fades to 35 percent when idle; the buttons do not overlap the dialogue panel (the dialogue panel is scrollable and the touch buttons hide while it is open except Close); the page uses `touch-action: none` on the canvas and the pads and prevents the browser zoom and pull-to-refresh; the prompt label shows "ACT" instead of the "E" key cap (already in `showPrompt`).',
          'The ACT button calls the same function as the `E` key (`useNearest`) and sits above the look pad; holding RUN toggles sprint; the camera button toggles `camRig.mode`; the map button opens the map; all dispatch through the existing input state so the keyboard and touch share one path.',
        ],
        verify: [has('index.html', 'safe-area-inset'), has('src/systems/input.js', 'touchModel'), npm('lint')],
      },
      {
        title: 'Playwright with touch events at a phone viewport',
        items: [
          '`tests/e2e/touch.spec.js` (journey 7 first half): context `{ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }` with `?quality=low`; helper `touchSequence(page, id, points)` using a CDP session (`Input.dispatchTouchEvent` start, move, end) in `tests/e2e/helpers/touch.js`. Assertions: the touch controls are visible and the keyboard-only hints hidden; dragging the joystick up for 1 s moves the player forward at least 2 m (`playerState()`); dragging the look pad right changes the camera yaw; a second finger on the look pad while the joystick is held works (both change); standing at a door (`teleport` with yaw) and tapping ACT opens it (`listDoors()` state `open`); tapping the camera button flips `cameraMode()`; tapping the map button opens `#map` and tapping a marker teleports; the touch HUD elements stay inside the viewport (bounding boxes within 390 by 844); zero console errors.',
        ],
        verify: [pw('tests/e2e/touch.spec.js', 25), exists('tests/e2e/helpers/touch.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/input/touch.test.js'), pw('tests/e2e/touch.spec.js', 25), pw('tests/e2e/v1-behaviour.spec.js', 15), pw('tests/e2e/map.spec.js', 25)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/index.html'],
    freeze: ['portfolio/tests/unit/input/touch.test.js', 'portfolio/tests/e2e/touch.spec.js', 'portfolio/tests/e2e/helpers/touch.js'],
    human: 'Try it on a real phone (iOS Safari and Android Chrome): moving, looking, doors, the map and the text mode.',
  },

  // ---------------------------------------------------------------- 072
  {
    id: '072', name: 'robustness', title: 'Robustness: context loss, failed chunk or area load, failed assets, global errors', epic: 'E7', est: 50,
    arch: 'sections 6, 7 (Resilience) and requirement R12, assumption A28',
    goal: [
      'The site must never end as a blank page. WebGL context loss shows a friendly message and restores the world when the browser gives the context back (or offers a reload); a failed chunk, area or model load shows the retry banner and recovers on retry; a failed texture or GLB falls back to flat materials and code-built props with one warning; an unexpected error shows a small notice instead of silence. Each case has a Playwright test.',
    ],
    read: ['src/main.js', 'src/engine/renderer.js', 'src/engine/streaming.js', 'src/ui/retryBanner.js', 'src/engine/loader.js', 'src/engine/materials.js', 'src/world/props/glbProps.js', 'src/systems/audio/engine.js'],
    steps: [
      {
        title: 'Context loss and restore',
        items: [
          '`src/engine/contextGuard.js`: listens to `webglcontextlost` on the canvas (`preventDefault()` so restoration is possible), pauses the render loop, shows `#context-lost` ("Graphics were interrupted. Restoring..." with a Reload button after 8 s), and on `webglcontextrestored` re-initialises the renderer state (`renderer.state.reset()`, composer targets re-created through the existing resize path, `needsUpdate` on textures and materials that Three does not recreate, shadow maps), hides the message and resumes. Everything through small functions with injectable canvas and callbacks so they can be unit tested (`tests/unit/engine/contextGuard.test.js`: lost then restored, lost for 8 s shows the reload button, repeated loss, listeners removed on dispose).',
          '`tests/e2e/context-loss.spec.js`: ready; get the `WEBGL_lose_context` extension in the page (`canvas.getContext("webgl2")` returns the same context), call `loseContext()`: `#context-lost` is visible within 1 s and the loop paused (the frame counter hook `frameCount()` stops); call `restoreContext()`: the message hides within 3 s, `frameCount()` advances again, `canvasLooksRendered` is true and there are no console errors other than the intentional `warn`.',
        ],
        verify: [vt('tests/unit/engine/contextGuard.test.js'), pw('tests/e2e/context-loss.spec.js', 15), exists('src/engine/contextGuard.js')],
      },
      {
        title: 'Failed chunks, areas and assets',
        items: [
          'Code splitting: load heavy optional modules through a retry wrapper `loadChunk(importFn, name)` in `src/engine/chunks.js`: audio ambience (`src/systems/audio/ambience.js`), weather rendering, nature, NPC manager and the map UI are imported lazily (`import()`), each wrapped; a rejected import shows the retry banner with the name and `Retry` re-runs the import (up to 3 automatic tries with backoff 500 ms, 1500 ms, then waits for the user); the game starts without that module when it is optional (audio, nature, weather, NPC) and the module is attached later when the retry succeeds. Required modules (renderer, world areas) failing leave the retry banner and the already loaded world.',
          'Assets: `getMaterial` texture loader and `preloadProps` log one `console.warn` per asset and fall back (flat colour, code-built prop); `audio` failures are silent beyond one warn; the area loader of plan 015 already shows the banner. A global `window.addEventListener("error")` and `unhandledrejection` handler shows `#error-toast` ("Something went wrong. The world keeps running; reload if it looks wrong.") once per 30 s, never when the error comes from an extension (script URL not from this origin) and always calls `console.error` once.',
          'Tests: `tests/unit/engine/chunks.test.js` (a flaky import that fails twice then succeeds is attempted three times; a permanently failing one stops after 3 and reports; names in messages). `tests/e2e/chunk-fail.spec.js`: with `page.route` abort the request for `**/src/systems/audio/ambience.js` (and in the preview build the matching chunk if built; run against the dev server): the world still boots, the retry banner names the module, unroute and click Retry: banner hides and `audioState().ambience` appears; blocking a texture request (`**/textures/**/color.webp`) lets the world boot with flat materials (`listObjects()` flags `textureFallback`), no blank canvas, one warning; an `Error` thrown inside `setTimeout` shows the toast once.',
        ],
        verify: [vt('tests/unit/engine/chunks.test.js'), pw('tests/e2e/chunk-fail.spec.js', 20), exists('src/engine/chunks.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/engine/contextGuard.test.js', 'tests/unit/engine/chunks.test.js'), pw('tests/e2e/context-loss.spec.js', 15), pw('tests/e2e/chunk-fail.spec.js', 20), pw('tests/e2e/smoke.spec.js', 15), npm('build', 15), node('scripts/check-prod-hook.mjs')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/index.html'],
    freeze: ['portfolio/tests/unit/engine/contextGuard.test.js', 'portfolio/tests/unit/engine/chunks.test.js', 'portfolio/tests/e2e/context-loss.spec.js', 'portfolio/tests/e2e/chunk-fail.spec.js'],
  },

  // ---------------------------------------------------------------- 073
  {
    id: '073', name: 'content-check', title: 'Content fact check: resume text fixture and the A24 token rule', epic: 'E7', est: 45,
    arch: 'section 7 (Facts) and requirement R12, decision D12, assumption A3, A24',
    goal: [
      'Before any wording is rewritten, build the guard that forbids invented facts: `npm run check:content` extracts the facts from two trusted sources (the resume PDF text and the pre-rewrite content files) and fails when the current content contains a digit, year or percent token, or a capitalised word or phrase outside a small allowlist, that is not in the sources.',
    ],
    read: ['assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf', 'src/content/contact.js', 'src/content/dialogues.js', 'src/content/projects.js', 'src/content/experience.js', 'src/content/education.js', 'src/content/resumeText.js', 'src/content/signage.js'],
    steps: [
      {
        title: 'Source fixtures',
        items: [
          '`scripts/dev/extract-resume.mjs` (dev only, uses `pdftotext` when it is on the PATH or at `C:\\Program Files\\Git\\mingw64\\bin\\pdftotext.exe`) writes `tests/fixtures/content/resume-source.txt`: first line `# source-pdf-sha256: abfe286b1bbcf14a76585f5885a1a76414d9b2113ce1eb813ea99ebb5abf5d3f`, then the extracted text with `-layout` off. Run it once. The checker never needs `pdftotext` at test time.',
          'Copy the current content files (after plan 004, before any rewrite) to `tests/fixtures/content/v1/` with the extension `.txt`: `contact.js.txt`, `projects.js.txt`, `experience.js.txt`, `education.js.txt`, `dialogues.js.txt`. These are text snapshots, not code.',
          '`tests/unit/content/fixtures.test.js`: the first line sha equals the sha256 of `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf`; the resume text contains the name, `GravityWrite`, `300,000` and the company names from `experience.js`; the snapshots exist and are non-empty; the snapshot of `contact.js` has no phone digits.',
        ],
        verify: [vt('tests/unit/content/fixtures.test.js'), exists('tests/fixtures/content/resume-source.txt', 'tests/fixtures/content/v1/dialogues.js.txt', 'scripts/dev/extract-resume.mjs')],
      },
      {
        title: 'The checker (A24 rule)',
        items: [
          '`tests/unit/scripts/checkContent.test.js` first. `scripts/check-content.mjs` exports `extractTokens(text)`, `buildSourceSet(files)` and `checkContent({ root })`; the CLI exits 1 and prints every offending token with its file and line. Rules: (1) every number token (digits with optional commas, dots, plus signs and percent signs, years `19xx` `20xx`) in the scanned content must occur in the source text; (2) every capitalised word and every run of capitalised words (and all-caps acronyms of 2 or more letters, camel-case product names such as `GravityWrite`) must occur in the source text (case sensitive, matched on the normalized text), unless it is in `scripts/content-allowlist.json`; (3) scanned files: `src/content/{contact,projects,experience,education,dialogues,resumeText}.js` (string literals only: extract with a small tokenizer that handles single, double and backtick strings and ignores code), but NOT `signage.js` (place names are placeholders, A15) and NOT `tests/`. The allowlist holds interface words and common sentence starters (`The`, `A`, `An`, `In`, `On`, `At`, `Of`, `For`, `And`, `With`, `From`, `To`, `I`, `It`, `Is`, `This`, `That`, `Press`, `Walk`, `Click`, `Tap`, `Download`, `Resume`, `Close`, `Show`, `Email`, `Back`, `Skip`, `Next`, `Welcome`, `Open`, `Hotel`, `Grand`, `Skills`, `Experience`, `Projects`, `Education`, `Certifications`, `Milestones`, `Contact`, and month names); the file is documented and covered by a test that fails when it contains a digit token or a proper noun from the resume (so the allowlist cannot be abused).',
          'Tests: a clean sample passes; a new company name fails; a new number `500K` fails; a changed percentage fails; an allowlisted word passes; tokens inside a code identifier are ignored but inside a string are checked; the real current content passes; `buildSourceSet` reads both sources; lines in the failure message.',
          '`npm run check:content` passes on the current content. If it fails on real text (for example a word that is a legitimate variant), fix by adding the exact token to the allowlist only when it is not a fact (a UI word), otherwise change the content; list every allowlist addition in the report.',
        ],
        verify: [vt('tests/unit/scripts/checkContent.test.js'), npm('check:content'), exists('scripts/check-content.mjs', 'scripts/content-allowlist.json')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/content/fixtures.test.js', 'tests/unit/scripts/checkContent.test.js'), npm('check:content')],
    allowed: ['portfolio/scripts/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/content/fixtures.test.js', 'portfolio/tests/unit/scripts/checkContent.test.js', 'portfolio/tests/fixtures/content/resume-source.txt'],
    donttouch: ['`src/content/**` (this plan only reads it).'],
  },

  // ---------------------------------------------------------------- 074
  {
    id: '074', name: 'content-rewrite', title: 'Rewrite and enrich the content from existing facts only', epic: 'E7', est: 50,
    arch: 'section 7 (Facts) and decision D12, assumption A3, A24',
    goal: [
      'Make the words as good as the world: clearer, more vivid, better structured text for the hotel reception introduction, the skills board, the experience timeline, the project dialogues, the milestones plaque and the text mode summary, using ONLY facts that are in the resume PDF text and the pre-rewrite content files. No new numbers, companies, products, technologies, titles or claims. `npm run check:content` is the judge and must pass; the structure facts (stack lists, metrics, periods) stay exactly as they are.',
    ],
    read: ['src/content/dialogues.js', 'src/content/projects.js', 'src/content/experience.js', 'src/content/education.js', 'src/content/resumeText.js', 'tests/fixtures/content/resume-source.txt', 'tests/fixtures/content/v1/dialogues.js.txt', 'scripts/check-content.mjs', 'tests/fixtures/zoneExpect.json'],
    risks: ['A3 and A24 (HIGH-RISK, facts): a rewrite may drift into invented claims. The checker catches new numbers and new proper nouns, but not a wrong sentence; the person must read the result (human check).'],
    steps: [
      {
        title: 'Rewrite guard tests first',
        items: [
          '`tests/unit/content/rewriteGuard.test.js` first (it must pass on the current content, and keeps passing after the rewrite): the stack arrays of every project and experience entry are set-equal to the v1 snapshot (parse the arrays out of the `.txt` snapshots with a regex per `stack: [...]`); every `metrics` entry (`num` and `caption`) of the projects equals the v1 set; every `period` string equals v1; the `SKILLS` names and percentages equal v1; the number of experience entries, project entries and bullets per entry is not lower than v1 (enrichment may add bullets only if each new bullet passes `check:content`); contact links equal v1; the `zoneExpect.json` strings still occur; no dialogue builder output text exceeds 1800 characters before the lists.',
        ],
        verify: [vt('tests/unit/content/rewriteGuard.test.js')],
      },
      {
        title: 'Rewrite the content',
        items: [
          'Rewrite for clarity and voice, in plain direct English, active verbs, short sentences, first person where the text speaks as the person (reception intro) and neutral elsewhere: `plaza` intro (a warm two-paragraph welcome that says who the person is and what the visitor can find in the town; only the facts of the current intro), skills board lead-in, each experience bullet (tighten, keep every fact and number; you may reorder), project summaries and bullets, milestones plaque, education and certification lines, the text-mode `about` paragraph. Keep the dialogue structure (titles with the building display names, chips, metric grids, closing hint) so the builders and tests keep working.',
          'Enrichment means better explanation of facts that exist (for example saying what a multi-provider LLM stack means in one clause, using words already in the sources), never adding a fact. Do not add skill percentages, user counts, client names, dates or links that are not already present.',
          'Run `npm run check:content` after each file you edit. Any failure is a signal that you added a fact: fix the text.',
        ],
        verify: [npm('check:content'), vt('tests/unit/content/rewriteGuard.test.js', 'tests/unit/ui/resumeText.test.js', 'tests/unit/content/zoneExpect.test.js')],
      },
      {
        title: 'Browser proof and the review list',
        items: [
          'Run the full dialogue journey `tests/e2e/dialogues-all.spec.js` and `tests/e2e/text-mode.spec.js`: all 14 dialogues still open with their expected strings, the text mode shows all sections, no console errors, `npm run check:phone` passes.',
          'Write `docs/review/content-changes.md`: for each changed content item the old line and the new line side by side (read the v1 snapshot), so the person can approve the wording quickly.',
        ],
        verify: [pw('tests/e2e/dialogues-all.spec.js', 40), pw('tests/e2e/text-mode.spec.js', 15), node('scripts/check-phone.mjs'), exists('docs/review/content-changes.md')],
      },
    ],
    accept: [npm('lint'), npm('check:content'), vt('tests/unit/content/rewriteGuard.test.js', 'tests/unit/ui/resumeText.test.js', 'tests/unit/content/zoneExpect.test.js'), pw('tests/e2e/dialogues-all.spec.js', 40), pw('tests/e2e/text-mode.spec.js', 15), node('scripts/check-phone.mjs')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/review/**'],
    freeze: ['portfolio/tests/unit/content/rewriteGuard.test.js'],
    unfreeze: ['portfolio/tests/fixtures/zoneExpect.json'],
    human: 'MILESTONE of epic 7: read `docs/review/content-changes.md` and approve every sentence; the checker cannot judge meaning.',
  },
];
