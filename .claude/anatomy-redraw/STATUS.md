# Anatomy background SVG redraw — status (2026-10-10, end of session 2)

Goal: every anatomy annotation background SVG under
`packages/emr-ui/src/lib/recipes/anatomy/assets/` must be clean and medically acceptable for annotation.
Pipeline per drawing: Sonnet drawer (BRIEF.md) -> separate Sonnet reviewer (REVIEW.md) -> defect list back to the SAME drawer
(SendMessage) -> Opus renders with rsvg-convert and LOOKS at the PNG itself. Never accept on a subagent's word.
Style (added session 2, by the user): draw as a Renaissance anatomist (Leonardo da Vinci / Vesalius). Section 'Artistic stance' at the end of BRIEF.md and REVIEW.md.
Replace `<SCRATCHPAD>` in both briefs with the session's scratchpad (copy with sed).
Spec: `npx vitest run packages/emr-ui/src/lib/recipes/recipes.spec.ts` from repo root.

## ACCEPTED by Opus (session 2) — all strokes 6/3 only, rendered and viewed
- neonatal/neonate-body-anterior, anaesthesia/mallampati-classes, bony-joints/knee-bony-ap-right+left (session 1)
- bony-joints/knee-bony-lateral-right+left (minor: narrow fibular neck)
- gi-tract/stomach-endoscopy-map
- skull-brain/brain-lateral-right+left (Opus removed two stiff form lines, lines 17-18 of each file)
- endocrine-neck/thyroid-anterior (minor: lobe upper poles end in a small finger; pyramidal lobe faint)
- cardiothoracic/heart-four-chamber-section (5 rounds; minor: boxy LA with straight edges, lateral pulmonary veins thin and hair-like)
- cardiothoracic/tracheobronchial-tree (minor: round-capped tips)
- bony-joints/shoulder-bony-right+left (minor: cap-like head, thin spine band)
- cardiothoracic/heart-great-vessels-anterior (4 rounds; minor: hooded trunk/LPA junction, two leaders cross a vessel edge, RV implied only by grooves)
- gi-tract/colon-colonoscopy-map (minor: ileocaecal valve lips read slightly hooked)
- bony-joints/hand-bones-right+left-dorsal (17.8 KB each; pisiform is a small bean, lunate/capitate/trapezoid unlabelled)
- anaesthesia/airway-ett-sagittal (rebuilt; minor: chin/mentum region minimal, tongue plain body, 10 labels)
- bony-joints/pelvis-hip-ap (Opus moved the 'Obturator foramen' leader end to (838,742))

## Batch 1: COMPLETE (20 of 20 accepted by Opus)
- cardiothoracic/heart-four-chamber-section accepted after 5 rounds (minor: boxy LA, lateral pulmonary veins read as thin strokes). Recipe description applied.

## User-supplied heart trace (added end of session 2)
The user supplied ~/Desktop/heart-diagrams-unlabelled.svg (a pixel trace of an illustration, 234 KB, black fill, two diagrams). Converted with `scratchpad/gen-heart-trace.py 1.1 50 <outdir>` (pure Python: RDP eps 1.1, corner-aware Catmull-Rom Béziers, fill #475569, cropped 680x880, R/L marks) into two NEW recipes in cardiothoracic: `heart-anterior-cutaway` (31 KB) and `heart-anterior-cutaway-chordae` (36 KB). Full vitest: 818 pass. Provenance is honest: author 'Vector trace of an AI-generated illustration (generator not recorded)', licence 'Terms of the generating tool apply: confirm before release'. The user CONFIRMED the source illustration is AI-generated (generator not recorded). Provenance now says so; the generating tool's output terms must be checked before any release. The old accepted `heart-four-chamber-section` is kept; ask the user whether to retire it.

## Lungs (resolved)
cardiothoracic/lungs-airway-overlay redrawn for lesion / bronchus+lesion annotation (user request): anatomical half-cone lungs, fissures, lingula and cardiac notch, light heart silhouette, perihilar bronchi to first segmental level, clear peripheral fields. Accepted by Opus after 8+ rounds (minor: slight lingula/diaphragm cusp, angular stubs, Cardiac-notch leader crosses the heart contour). heart-four-chamber-section was RETIRED (user decision). Version stays 1 (file was added in de71561).

## Open question for the user (RESOLVED, see above)
'Tracheobronchial tree with lungs': a separate recipe `lungs-airway-overlay` (1900x1200) already exists. Not yet redrawn; ask whether the user wants lungs added to the segmental tree or that overlay redrawn.

## Remaining after batch 1
- About 97 other uncommitted SVGs (see `git status -uall packages/emr-ui/src/lib/recipes/anatomy/assets`; many are modified-tracked from de71561).
- The 105 SVGs committed in 6064652: bump `version: 2` in the recipe when geometry changes. Verified: none of the 20 batch-1 files is among them (all were added in de71561), so batch 1 needs NO version bump. Check each file with `git log --diff-filter=A --format=%h -- <svg>`.

## Recipe descriptions
APPLIED in session 2 (stomach, thyroid, pelvis, colon, ETT, great vessels, both hands, four-chamber). knee-lateral and shoulder descriptions needed no change. `recipes.spec.ts`: 497/497 pass.

## Lessons
- Sonnet drawers produce tubes, blobs, pipes, pebbles unless given concrete coordinates, proportions and contact rules. Feed reviewer coordinates straight back.
- Hidden bone first, then front bone with fill="#ffffff" (allowed palette) for overlapping bones.
- Drawers sneak in stroke widths (4, 5, 10, 18, 34+). Grep every file: `grep -o 'stroke-width="[0-9]*"' f | sort | uniq -c`. Only 6 and 3.
- Drawers claim rounds they didn't do and often don't view the left side. Opus renders and views every file itself, both sides of pairs. Files on disk may change after a handback: view the file on disk, not the drawer's PNG.
- Use unique generator/PNG names per agent; the scratchpad is shared. At most ~8 agents at once.
- A left/right pair is a computed reflection x'=1000-x (not a transform) of the drawn right.
- For stuck drawings after ~3 rounds, give an explicit layout plan (coordinates) instead of incremental fixes.

## Uncommitted state
The 20 redrawn SVGs and the 5 edited `*.recipes.ts` files are NOT committed (the user wanted to finish redraws before merging to main). The 19+ modified SVGs were already modified-tracked from de71561. Commit them as one commit when the user says so. Branch feat/anatomy-outlines-and-components is 10 commits ahead of main; main has no new commits, so main can fast-forward (`git fetch . feat/anatomy-outlines-and-components:main`) without checkout. Plan agreed in chat: rebase 39d5dbc onto abaf6de to drop merge commit 211ba77 first, then ff main; push only on an explicit yes.

## Next work (session 3)
1. Remaining ~97 other SVGs: `git status -uall packages/emr-ui/src/lib/recipes/anatomy/assets` shows what is modified; but note the batch-1 files are the only ones with redraws; every other SVG in the 225 outlines is still the original crude drawing. Order: the user's priority list below.
2. Then the 105 SVGs committed in 6064652 (bump `version: 2` when geometry changes).
3. Ask the user the lungs question (above).
