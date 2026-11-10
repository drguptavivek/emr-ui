# Redraw an anatomy annotation background SVG

You are redrawing ONE (or one L/R pair of) anatomy outline SVG(s) used as the background image clinicians annotate on in an EMR (marking lesions, fractures, incisions, block sites, etc.). The current drawings are crude: tubes and blobs with labels on them. A clinician must look at the redrawn image and recognise every structure **without reading the labels**, the way they would recognise a figure in a clinical textbook or a standard proforma diagram. Take your time. Quality matters far more than speed.

Repo root: /Users/vivekgupta/workspace/EMR
Assets dir: packages/emr-ui/src/lib/recipes/anatomy/assets/
Recipe file for group G: packages/emr-ui/src/lib/recipes/anatomy/G.recipes.ts

## Steps

1. Read the existing SVG(s). Read the matching recipe entry (grep the asset path in the group's `.recipes.ts`) — its `description`, `laterality`, `view`, `width`, `height` are your spec. Every structure named in the description must appear and be recognisable. Also read the doc comment at the top of that recipe file (orientation conventions).
2. BEFORE drawing, write down (in your reasoning) at least 6 concrete proportion/relationship facts for this view, e.g. "fibula shaft ≈ 1/3 tibial shaft width", "fibular head articulates under lateral tibial condyle, no gap", "LV wall ~3× RV wall thickness". Then check every render against that list. The most common failure is structures drawn as uniform tubes/blobs with wrong widths, floating apart, or lumpy joins. Real anatomy has tapering, flaring, asymmetry and contact.
   Think through the real anatomy: proportions, relative positions, how structures overlap, which landmarks a clinician of that specialty expects (e.g. a knee AP needs condylar flare, intercondylar notch, tibial plateau with spines, fibular head lateral and BELOW the plateau, patella overlying the distal femur). Recall the standard textbook/proforma depiction of this view and draw that.
3. Write the SVG by hand with smooth cubic/quadratic Bézier paths. Plan in a coordinate grid. Keep it symmetric where anatomy is symmetric.
4. Render and LOOK at it:
   `rsvg-convert -w 700 <file.svg> -o <SCRATCHPAD>/r/<name>-vN.png`
   then Read the PNG. Critique it hard as a consultant in that specialty would: wrong proportions? structures floating or overlapping wrongly? kinks, lumps, self-intersections, unclosed or doubled lines? labels colliding with lines or each other? Would this embarrass you on a ward proforma?
   If you use a generator script, name it uniquely after your file (e.g. `scratchpad/gen-<svgname>.py`) — other agents share the scratchpad. Name PNGs `<svgname>-vN.png`.
5. Revise and re-render. Do AT LEAST four render→critique rounds; in each, list specific defects before fixing them. Stop only when every structure is recognisable without labels and the drawing looks clean and professional.

## Drawing standard (enforced by recipes.spec.ts — do not break)

- Root exactly `<svg xmlns="http://www.w3.org/2000/svg" width="W" height="H" viewBox="0 0 W H" role="img">` with a `<title>`. Keep W/H equal to the recipe's width/height (do not change them).
- White background `<rect width="W" height="H" fill="#ffffff"/>`. Main contour stroke `#475569` width 6; internal landmarks and region dividers `#94a3b8` width 3 (dividers dashed `stroke-dasharray="12 10"`); optional light fill `#cbd5e1` (use sparingly, e.g. a device, a cuff, cut bone surface). Text uses `#475569` or `#94a3b8`. NO other colours. `fill="none"` on outline paths.
- `stroke-linecap="round" stroke-linejoin="round"` on paths.
- No scripts, `<style>`, event handlers, images, external refs, gradients, filters, masks, patterns, `<use>` of external files. File under 40 KB (check with `wc -c`). `<g transform>` is fine.
- Anatomical position: on anterior views the patient's right is on the viewer's left. Mark sides `R`/`L` (or `OD`/`OS`) as the existing file does. Keep the view label (e.g. "Anterior").
- Each side is drawn as its own picture. Do NOT produce the other side by a mirror transform (`scale(-1,1)`) — draw it, though you may reuse your own path design reflected by computing coordinates.
- Text: only orientation and standard anatomical names/landmarks, `font-family="system-ui, sans-serif"`, size ~24–30 for labels. Prefer few, well-placed labels with short thin `#94a3b8` leader lines that do not cross structures needlessly. Leave clear empty space inside regions — clinicians will draw there. No numbering schemes that are config choices (e.g. tooth numbers).
- Line drawing style, not shaded illustration. Clean, consistent, calm.

## Constraints

- Edit ONLY the SVG file(s) you were assigned. Do not edit any `.ts` file or other SVG.
- Don't run git commands that change state.

## Return (short)

- File(s) redrawn, byte size of each.
- 1–2 lines on what you changed.
- Any mismatch between your drawing and the recipe `description` that the description should be updated for (quote the suggested new wording), or "none".
- Path of your final PNG render(s).

## Artistic stance (added by the user)

Draw as a medical illustrator in the tradition of Leonardo da Vinci's anatomical studies and the Renaissance anatomists (Vesalius, the Fabrica plates): observation over formula. Every structure is drawn as something that has real volume, weight and attachment, never as a tube, blob or schematic icon.
- Confident, economical contour: one decisive line per edge, thicker where a form turns away or overlaps, with natural taper and flare at shafts, joints and junctions. No wobble, no hairy doubled strokes.
- Show structure and mechanism: where tendon meets bone, how a lobe overlaps another, where a vessel crosses, the angle of a joint. Leonardo drew the thing as it works.
- Proportion from dissection-room fact (ratios, angles, contacts), not from decoration. Recall the textbook plate of this view.
- Plate-like restraint: a few well-chosen labels with short fine leader lines, generous empty space on the figure for the clinician's annotations.
- Allowed only within the drawing standard above: NO shading, hatching, tone, or extra colours. At most a few short #94a3b8 stroke-3 contour lines to describe form (a fold, a fissure, a tendon edge) where they help recognition.
