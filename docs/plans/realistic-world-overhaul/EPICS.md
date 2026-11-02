# EPICS - realistic-world-overhaul

One line per epic: id, name, spec requirements delivered, plan ids, milestone (the runner pauses after the last plan of the epic).
No research.md or audit exists, so there are no research feature ids; the spec requirement ids (R1..R13) are used.

| Epic | Name | Spec requirements | Plans | Milestone (pause_after) |
|---|---|---|---|---|
| E1 | Foundation: Vite migration, tooling, asset pipeline, ledger, quality tiers, materials, lighting, budgets, streaming | R1 R2 R3 R4, avatar part of R5, phone removal of R12 | 001-015 | 015 |
| E2 | Vertical slice: collision, interactions, building kit, props, Grand Hotel, town square, textured terrain. User approves the look. | R5 R6 R7, part of R9 | 016-031 | 031 (review pause, D17) |
| E3 | Town plan, terrain, roads, water, vegetation, houses and shops, harbour, beach, local detail | R9 | 032-040 | 040 |
| E4 | The other 13 buildings, walk-in, Rich detail | R6 R8 | 041-057 | 057 |
| E5 | Life: NPCs, animals, moving things, weather, living light | R10 | 058-063 | 063 |
| E6 | Audio: surfaces, ambience, interior acoustics, music | R11 | 064-066 | 066 |
| E7 | Elite extras: text mode, fast-travel map, fallback + SEO, tour, touch, robustness, content rewrite | R12 | 067-074 | 074 |
| E8 | Polish, performance, docs, CI and Pages workflow (production readiness) | R13 | 075-079 | 079 |

## Plan list

| Id | Epic | Name |
|---|---|---|
| 001 | E1 | tooling-skeleton |
| 002 | E1 | port-v1-to-vite |
| 003 | E1 | world-hook-and-params |
| 004 | E1 | privacy-contact |
| 005 | E1 | asset-fetch-tooling |
| 006 | E1 | asset-optimize-tooling |
| 007 | E1 | replace-nonfree-audio |
| 008 | E1 | avatar-replacement |
| 009 | E1 | fonts-self-hosted |
| 010 | E1 | ledger-size-credits |
| 011 | E1 | quality-tiers-settings |
| 012 | E1 | fixtures-and-lighting-rig |
| 013 | E1 | materials-library |
| 014 | E1 | budget-and-shots |
| 015 | E1 | streaming-core |
| 016 | E2 | collision-and-camera |
| 017 | E2 | interaction-core-doors |
| 018 | E2 | interaction-extras |
| 019 | E2 | prop-catalog-set-a |
| 020 | E2 | kit-shell |
| 021 | E2 | kit-rooms-doors-lights |
| 022 | E2 | props-set-b |
| 023 | E2 | props-set-c |
| 024 | E2 | hotel-manifest-and-building-check |
| 025 | E2 | hotel-exterior |
| 026 | E2 | hotel-interior-public |
| 027 | E2 | hotel-interior-upper |
| 028 | E2 | terrain-splat |
| 029 | E2 | town-square |
| 030 | E2 | hero-props-polyhaven |
| 031 | E2 | slice-integration-review |
| 032 | E3 | town-plan |
| 033 | E3 | terrain-from-plan |
| 034 | E3 | roads |
| 035 | E3 | water |
| 036 | E3 | vegetation |
| 037 | E3 | town-buildings |
| 038 | E3 | harbour-and-beach |
| 039 | E3 | local-detail-and-signage |
| 040 | E3 | world-integration |
| 041 | E4 | props-set-d |
| 042 | E4 | props-set-e |
| 043 | E4 | notice-post-office |
| 044 | E4 | forge-workshop |
| 045 | E4 | citadel-tower |
| 046 | E4 | citadel-floors |
| 047 | E4 | broadcast-station |
| 048 | E4 | gateway-gatehouse |
| 049 | E4 | transport-terminal |
| 050 | E4 | temple-hall |
| 051 | E4 | workshop-garage |
| 052 | E4 | freshnote-studio |
| 053 | E4 | library |
| 054 | E4 | academy |
| 055 | E4 | lighthouse |
| 056 | E4 | milestones-hall |
| 057 | E4 | all-landmarks-close |
| 058 | E5 | npc-core |
| 059 | E5 | npc-population |
| 060 | E5 | animals-nature |
| 061 | E5 | moving-things |
| 062 | E5 | weather |
| 063 | E5 | living-light |
| 064 | E6 | audio-core-surfaces |
| 065 | E6 | ambience-acoustics |
| 066 | E6 | music-per-area |
| 067 | E7 | text-mode |
| 068 | E7 | fast-travel-map |
| 069 | E7 | fallback-and-seo |
| 070 | E7 | guided-tour |
| 071 | E7 | touch-controls |
| 072 | E7 | robustness |
| 073 | E7 | content-check |
| 074 | E7 | content-rewrite |
| 075 | E8 | phone-tier |
| 076 | E8 | desktop-budget-pass |
| 077 | E8 | journeys-and-streaming-order |
| 078 | E8 | docs-credits-runbook |
| 079 | E8 | ci-and-final-gates |
