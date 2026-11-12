/**
 * Assembles the unified GitHub Pages static site into dist/gh-pages/:
 *   - dist/gh-pages/                -> Next.js static export (Interactive Showcase + Lit Tab + Shadcn Registry Explorer + OPD Form)
 *   - dist/gh-pages/lit/            -> Standalone Lit Web Components (@drguptavivek/emr-elements) Interactive Clinical Workstation & Catalog
 *   - dist/gh-pages/storybook/      -> Angular Storybook static build (when available or built with --with-storybook)
 *   - dist/gh-pages/registry/       -> Shadcn JSON registry (index.json + items/<slug>.json)
 *   - dist/gh-pages/.nojekyll       -> Ensures GitHub Pages serves _next/ assets
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(rootDir, 'dist/gh-pages');
const nextPublicLitDir = join(rootDir, 'packages/emr-react/harness/next/public/lit');
const nextOutDir = join(rootDir, 'packages/emr-react/harness/next/out');
const registryDir = join(rootDir, 'registry');
const storybookDir = join(rootDir, 'storybook-static');
const emrCssPath = join(rootDir, 'packages/emr-ui/src/lib/foundations/emr.css');
const emrPrintCssPath = join(rootDir, 'packages/emr-ui/src/lib/foundations/emr-print.css');

const withStorybook = process.argv.includes('--with-storybook');
const basePathArg = process.argv.find((a) => a.startsWith('--base-path='))?.slice('--base-path='.length);
const basePath = basePathArg ?? process.env.EMR_GH_PAGES_BASE_PATH ?? '';

function run(cmd, env = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

function buildLitIndexHtml(registry) {
  const components = registry.items
    .filter((item) => item.lit?.selector)
    .map((item) => ({ tag: item.lit.selector, categories: item.categories }));
  const directory = JSON.stringify({ categories: registry.categories, components }).replaceAll('<', '\\u003c');
  return `<!DOCTYPE html>
<html lang="en" class="emr-theme-light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EMR Lit Web Components (@drguptavivek/emr-elements) · Clinical Workstation & L1–L6 Catalog</title>
  <link rel="stylesheet" href="./emr.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--emr-background, #f6f8f9);
      color: var(--emr-text, #263847);
      font-family: var(--emr-font-family, system-ui, -apple-system, sans-serif);
      line-height: 1.45;
    }
    .lit-topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 24px;
      background: var(--emr-surface, #fffefa);
      border-bottom: 1px solid var(--emr-border, #c7d3da);
    }
    .lit-container {
      max-width: 1380px;
      margin: 0 auto;
      padding: 20px 24px 48px;
      display: grid;
      gap: 20px;
    }
    .lit-intent-bar {
      position: sticky;
      top: 61px;
      z-index: 25;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--emr-primary-border, #b2c4ce);
      background: var(--emr-surface-soft, #f1f4f5);
      font-family: var(--emr-font-mono, monospace);
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .lit-btn {
      padding: 6px 12px;
      min-height: 34px;
      border-radius: 6px;
      border: 1px solid var(--emr-border, #c7d3da);
      background: var(--emr-surface, #fffefa);
      color: var(--emr-text, #263847);
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .lit-btn--primary {
      background: var(--emr-primary, #475f70);
      border-color: var(--emr-primary, #475f70);
      color: var(--emr-surface, #fffefa);
    }
    .lit-section {
      display: grid;
      gap: 10px;
    }
    .lit-section-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: var(--emr-text, #263847);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .lit-tag {
      font-family: var(--emr-font-mono, monospace);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--emr-primary-soft, #e3ebef);
      color: var(--emr-primary-contrast, #344b5a);
      border: 1px solid var(--emr-primary-border, #b2c4ce);
    }
    .lit-grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 14px;
    }
    .lit-category-select {
      justify-self: start;
      max-width: 100%;
      min-height: 44px;
      padding: 6px 12px;
      border: 1px solid var(--emr-border, #c7d3da);
      border-radius: 6px;
      background: var(--emr-surface, #fffefa);
      color: var(--emr-text, #263847);
      font: inherit;
    }
    .lit-catalog-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 14px;
      border-radius: 10px;
      border: 1px solid var(--emr-border, #c7d3da);
      background: var(--emr-surface, #fffefa);
    }
  </style>
</head>
<body>
  <header class="lit-topbar">
    <div>
      <strong style="font-size:17px;">@drguptavivek/emr-elements · Lit Web Components Clinical Workstation</strong>
      <div style="font-size:12px;color:var(--emr-text-muted, #5c6c78);">
        121 framework-agnostic Custom Elements (&lt;emr-*&gt;) built with Lit 3 + Shadow DOM + emr.css tokens
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <button id="btn-care-setting" type="button" class="lit-btn lit-btn--primary">Switch to Inpatient (IPD Ward 4)</button>
      <button id="btn-theme" type="button" class="lit-btn">Toggle Dark / Light Theme</button>
      <a href="#lit-directory" class="lit-btn">Browse components</a>
      <a href="../index.html" class="lit-btn">← Main Catalog &amp; Registry</a>
    </div>
  </header>

  <main class="lit-container">
    <div class="lit-intent-bar">
      <span id="intent-output">⚡ Shadow DOM CustomEvent('intent') Inspector: Interact with any &lt;emr-*&gt; Web Component below…</span>
      <span class="lit-tag">Lit 3 Shadow DOM</span>
    </div>

    <!-- 1. Patient Banner -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        1. Patient Identity, Allergies, Chronic Conditions &amp; Vitals
        <span class="lit-tag">&lt;emr-patient-banner&gt;</span>
      </h2>
      <emr-patient-banner id="el-banner"></emr-patient-banner>
    </section>

    <!-- 2. Multi-Specialty 7-Column Prescribing Table (fixture values) -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        2. 7-Column Clinical Prescribing Table (Fixture dose forms + Step-Down / Step-Up)
        <span class="lit-tag">&lt;emr-prescribing-table&gt;</span>
      </h2>
      <emr-prescribing-table id="el-rx"></emr-prescribing-table>
    </section>

    <!-- 3. Multi-Viewport PACS & DICOMweb Compare Viewer -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        3. Multi-Viewport PACS &amp; DICOMweb Compare Viewer (fixture studies; no PACS connection)
        <span class="lit-tag">&lt;emr-pacs-viewer&gt;</span>
      </h2>
      <emr-pacs-viewer id="el-pacs"></emr-pacs-viewer>
    </section>

    <!-- 4. Multi-Specialty Examination & Safe Dosing Matrix -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        4. Multi-Specialty Examination &amp; Safe Dosing Matrix (Ophthalmology · Pediatrics · Dermatology · Oncology)
        <span class="lit-tag">&lt;emr-specialty-exam-matrix&gt;</span>
      </h2>
      <button type="button" id="btn-exam-lock" class="lit-btn">Lock fixture</button>
      <emr-specialty-exam-matrix id="el-exam"></emr-specialty-exam-matrix>
    </section>

    <!-- 5. Inpatient eMAR & Nursing Kardex Grid -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        5. Fixture eMAR &amp; Nursing Administration Grid (no barcode or dual-sign evidence)
        <span class="lit-tag">&lt;emr-inpatient-mar&gt;</span>
      </h2>
      <emr-inpatient-mar id="el-mar"></emr-inpatient-mar>
    </section>

    <!-- 6. Print-Ready OPD Prescription & IPD Discharge Summary -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        6. Print-Ready (.emr-print) OPD Prescription &amp; IPD Discharge Summary
        <span class="lit-tag">&lt;emr-encounter-summary-print&gt;</span>
      </h2>
      <emr-encounter-summary-print id="el-print"></emr-encounter-summary-print>
    </section>

    <!-- 7. L1-L3 Primitives & Structures -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        7. L1–L3 Primitives, Inputs, Stat Tiles &amp; Data Table
        <span class="lit-tag">&lt;emr-stat-tile&gt; · &lt;emr-data-table&gt; · &lt;emr-button&gt;</span>
      </h2>
      <div class="lit-grid-2">
        <emr-stat-tile label="BCVA Right Eye (OD)" value="6/12 (+0.30 LogMAR)" sub="3 weeks post-Phaco · CMO"></emr-stat-tile>
        <emr-stat-tile label="Intraocular Pressure (GAT)" value="22 / 15 mmHg" sub="Steroid Responder OD"></emr-stat-tile>
        <emr-stat-tile label="Glycemic Status (HbA1c)" value="7.6 %" sub="Down from 8.1% baseline"></emr-stat-tile>
      </div>
      <emr-data-table id="el-table"></emr-data-table>
    </section>

    <section id="controller-matrix-example" class="lit-section">
      <h2 class="lit-section-title">Controller integration example</h2>
      <emr-clinical-matrix></emr-clinical-matrix>
      <output>
        <span id="matrix-accepted-od"></span>
        <span id="matrix-accepted-os"></span>
      </output>
    </section>

    <section id="clinical-note-example" class="lit-section">
      <h2 class="lit-section-title">Clinical note workspace · OPD, IPD and OT</h2>
      <p>Synthetic clinical records. Signatures and edits are simulated for this session.</p>
      <div class="lit-grid-2">
        <label>Care setting
          <select data-note-setting class="lit-category-select">
            <option value="opd">OPD consultation</option>
            <option value="ipd">IPD progress note</option>
            <option value="ot">OT operative note</option>
          </select>
        </label>
        <label>Viewing as
          <select data-note-actor class="lit-category-select">
            <option value="author">Note author</option>
            <option value="reviewer">Consultant reviewer</option>
            <option value="clinician">Read-only clinician</option>
          </select>
        </label>
      </div>
      <emr-clinical-note-workspace></emr-clinical-note-workspace>
    </section>

    <!-- 8. Registered Custom Elements Directory -->
    <section id="lit-directory" class="lit-section" style="scroll-margin-top: 9rem;">
      <h2 class="lit-section-title">
        8. Lit Components by Specialty &amp; Workflow
      </h2>
      <label for="lit-category">Specialty / workflow</label>
      <select id="lit-category" class="lit-category-select" aria-controls="el-directory">
        <option value="all">All specialties and workflows</option>
      </select>
      <p id="lit-directory-count" aria-live="polite"></p>
      <div id="el-directory" class="lit-catalog-pills"></div>
    </section>
  </main>

  <script type="module">
    import { createClinicalNoteDemo, mountClinicalMatrixExample, registerAllEmrElements, makeSpecialtyExamFixture, reduceSpecialtyExamFixture, AsyncSearchController, syntheticFormularyRepository, clearFixturePrescriptionProduct, resolveFixturePrescriptionProduct, PRESCRIBING_PRESETS } from './emr-elements.bundle.js';
    registerAllEmrElements();

    const noteExample = document.getElementById('clinical-note-example');
    const noteElement = noteExample.querySelector('emr-clinical-note-workspace');
    const noteSetting = noteExample.querySelector('[data-note-setting]');
    const noteActor = noteExample.querySelector('[data-note-actor]');
    const noteControllers = Object.fromEntries(
      ['opd', 'ipd', 'ot'].map(setting => [setting, createClinicalNoteDemo(setting)]),
    );
    let activeNote;
    let unsubscribeNote;
    function openNote() {
      unsubscribeNote?.();
      activeNote = noteControllers[noteSetting.value];
      noteActor.value = 'author';
      noteActor.querySelector('[value=reviewer]').disabled = noteSetting.value !== 'ipd';
      activeNote.selectActor('author');
      unsubscribeNote = activeNote.subscribe(model => { noteElement.model = model; });
    }
    noteSetting.addEventListener('change', openNote);
    noteActor.addEventListener('change', () => activeNote.selectActor(noteActor.value));
    noteElement.addEventListener('intent', event => activeNote.dispatch(event.detail));
    openNote();

    const unmountMatrixExample = mountClinicalMatrixExample(
      document.querySelector('#controller-matrix-example emr-clinical-matrix'),
      document.getElementById('matrix-accepted-od'),
      document.getElementById('matrix-accepted-os'),
    );
    window.addEventListener('pagehide', (event) => {
      if (event.persisted) return;
      unmountMatrixExample();
      unsubscribeNote();
      Object.values(noteControllers).forEach(controller => controller.destroy());
    });

    const intentLog = document.getElementById('intent-output');
    document.addEventListener('intent', (e) => {
      const tag = e.target?.tagName?.toLowerCase() || 'emr-element';
      intentLog.textContent = \`⚡ <\${tag}> emitted intent: \${JSON.stringify(e.detail)}\`;
    });

    // Theme & Care Setting toggles
    let isDark = false;
    document.getElementById('btn-theme').addEventListener('click', () => {
      isDark = !isDark;
      document.documentElement.className = isDark ? 'emr-theme-dark' : 'emr-theme-light';
    });

    let careSetting = 'opd';
    const bannerEl = document.getElementById('el-banner');
    const updateBanner = () => {
      bannerEl.model = {
        patientId: 'MRN-2026-0842',
        displayName: 'Aarav Sharma',
        ageLabel: '58 y',
        sexLabel: 'Male',
        careSetting,
        careSettingLabel: careSetting === 'opd' ? 'Outpatient (OPD Room 4)' : 'Inpatient (IPD Ward 4 · Bed 14B · Day 3)',
        locationLabel: careSetting === 'opd' ? 'OPD Room 4' : 'Ward 4 · Bed 14B',
        expanded: false,
        alerts: [],
        identifiers: [
          { label: 'MRN', value: 'MRN-2026-0842' },
          { label: 'National Health ID', value: '91-4820-7731-9904' },
        ],
        allergies: [
          { id: 'a1', label: 'Penicillin (Anaphylaxis)', tone: 'danger' },
          { id: 'a2', label: 'Sulfonamides (Rash)', tone: 'warning' },
        ],
        chronicDiseases: [
          { id: 'c1', label: 'T2DM (8 yrs)', tone: 'warning' },
          { id: 'c2', label: 'POAG (OU)', tone: 'info' },
        ],
        vitals: [
          { id: 'v1', label: 'BCVA OD/OS', valueLabel: '6/12 · 6/6', unit: 'LogMAR +0.30/0.00', tone: 'warning' },
          { id: 'v2', label: 'IOP OD/OS', valueLabel: '22 / 15', unit: 'mmHg', tone: 'warning' },
          { id: 'v3', label: 'BP', valueLabel: '136/84', unit: 'mmHg', tone: 'neutral' },
        ],
      };
    };
    updateBanner();
    bannerEl.addEventListener('intent', (ev) => {
      if (ev.detail.type === 'expandedChangeRequested') {
        bannerEl.model = { ...bannerEl.model, expanded: ev.detail.expanded };
      }
    });

    document.getElementById('btn-care-setting').addEventListener('click', (e) => {
      careSetting = careSetting === 'opd' ? 'ipd' : 'opd';
      e.target.textContent = careSetting === 'opd' ? 'Switch to Inpatient (IPD Ward 4)' : 'Switch to Outpatient (OPD Room 4)';
      updateBanner();
    });

    // 2. Prescribing Table State
    const rxEl = document.getElementById('el-rx');
    const slotDefs = [
      { id: 'm', label: 'Morning', shortLabel: 'Morn', timeHint: '8 am' },
      { id: 'a', label: 'Afternoon', shortLabel: 'Aft', timeHint: '2 pm' },
      { id: 'e', label: 'Evening', shortLabel: 'Even', timeHint: '6 pm' },
      { id: 'n', label: 'Night', shortLabel: 'Night', timeHint: '10 pm' },
    ];
    let rxSeq = 10;
    let rxModel = {
      title: '7-Column Multi-Specialty Prescribing Table (Lit Shadow DOM)',
      canSign: false,
      slotDefinitions: slotDefs,
      rows: [
        {
          id: 'rx-1',
          formularyCode: 'RXN-309114',
          drugName: 'Nepafenac',
          strength: '0.1% w/v',
          form: 'drop',
          formLabel: 'Ophthalmic Drops',
          stockStatus: 'In Stock',
          route: 'Ophthalmic',
          site: 'OD',
          doseAmount: 1,
          unitLabel: 'drop',
          frequencyCode: 'TDS',
          patternLabel: '1 - 1 - 0 - 1',
          slots: [
            { id: 'm', label: 'Morning', amount: 1 },
            { id: 'a', label: 'Afternoon', amount: 1 },
            { id: 'e', label: 'Evening', amount: 0 },
            { id: 'n', label: 'Night', amount: 1 },
          ],
          durationCount: 6,
          durationUnit: 'weeks',
          foodRelation: '5 min gap',
          instructions: '5 min gap between drops; shake well.',
        },
        {
          id: 'rx-2',
          formularyCode: 'RXN-860975',
          drugName: 'Prednisolone acetate',
          strength: '1% w/v',
          form: 'drop',
          formLabel: 'Ophthalmic Drops',
          stockStatus: 'In Stock',
          route: 'Ophthalmic',
          site: 'OD',
          doseAmount: 1,
          unitLabel: 'drop',
          frequencyCode: 'QID',
          patternLabel: '1 - 1 - 1 - 1',
          slots: [
            { id: 'm', label: 'Morning', amount: 1 },
            { id: 'a', label: 'Afternoon', amount: 1 },
            { id: 'e', label: 'Evening', amount: 1 },
            { id: 'n', label: 'Night', amount: 1 },
          ],
          durationCount: 7,
          durationUnit: 'days',
          foodRelation: 'Shake well',
          instructions: 'Click ↘ Step-Dn to add tapering rows.',
        },
        {
          id: 'rx-3',
          formularyCode: 'RXN-198440',
          drugName: 'Metformin HCl (SR)',
          strength: '500 mg',
          form: 'tablet',
          formLabel: 'Oral Tablet (Scored)',
          stockStatus: 'In Stock',
          route: 'Oral',
          doseAmount: 1,
          unitLabel: 'tab',
          frequencyCode: 'BD',
          patternLabel: '1 - 0 - 0 - 1',
          slots: [
            { id: 'm', label: 'Morning', amount: 1 },
            { id: 'a', label: 'Afternoon', amount: 0 },
            { id: 'e', label: 'Evening', amount: 0 },
            { id: 'n', label: 'Night', amount: 1 },
          ],
          durationCount: 30,
          durationUnit: 'days',
          foodRelation: 'After food',
          instructions: 'Dispense 60 tabs (Tab/Cap auto-calculated).',
        },
      ],
    };
    rxModel.formularyLabel = 'Fixture-backed formulary · synthetic data';
    rxModel.presets = PRESCRIBING_PRESETS;
    rxEl.model = rxModel;
    let searchRowId;
    const rxSearch = new AsyncSearchController(syntheticFormularyRepository, undefined, { debounceMs: 140, minChars: 1 });
    const unsubscribeRxSearch = rxSearch.subscribe(state => {
      if (!searchRowId) return;
      const row = rxModel.rows.find(item => item.id === searchRowId);
      if (!row || row.drugName !== state.query) return;
      rxModel = { ...rxModel, formularySearch: {
        rowId: searchRowId, query: state.query, items: state.options, loading: state.loading, error: state.error,
      } };
      rxEl.model = rxModel;
    });
    window.addEventListener('pagehide', (event) => {
      if (!event.persisted) {
        unsubscribeRxSearch();
        rxSearch.destroy();
      }
    });
    rxEl.addEventListener('intent', (ev) => {
      if (rxModel.readOnly) return;
      const i = ev.detail;
      const updateRow = (edit) => {
        rxModel = { ...rxModel, rows: rxModel.rows.map(row => row.id === i.rowId ? edit(row) : row) };
      };
      if (i.type === 'drugNameChanged') {
        updateRow(row => row.drugName === i.drugName ? row : row.formularyCode
          ? clearFixturePrescriptionProduct(row, i.drugName) : { ...row, drugName: i.drugName });
        rxModel = { ...rxModel, formularySearch: undefined };
      } else if (i.type === 'strengthChanged') {
        updateRow(row => ({ ...row, strength: i.strength }));
      } else if (i.type === 'instructionsChanged') {
        updateRow(row => ({ ...row, instructions: i.instructions }));
      } else if (i.type === 'formularySearchRequested') {
        if (!rxModel.rows.some(row => row.id === i.rowId && row.drugName === i.query)) return;
        searchRowId = i.rowId;
        if (rxSearch.getSnapshot().query === i.query) rxSearch.dispatch({ type: 'searchRequested' });
        else rxSearch.dispatch({ type: 'queryChanged', query: i.query });
      } else if (i.type === 'formularySelected') {
        const result = rxModel.formularySearch;
        if (result?.rowId !== i.rowId || result.loading || result.error || !result.items.includes(i.item)
          || !rxModel.rows.some(row => row.id === i.rowId && row.drugName === result.query)) return;
        searchRowId = undefined;
        rxSearch.dispatch({ type: 'queryChanged', query: '' });
        updateRow(row => resolveFixturePrescriptionProduct(row, i.item, rxModel));
        rxModel = { ...rxModel, formularySearch: undefined };
      } else if (i.type === 'rowAddRequested') {
        const nr = {
          id: 'rx-' + (++rxSeq), drugName: '', strength: '', form: 'other', formLabel: '', route: '',
          doseAmount: null, unitLabel: '', slots: rxModel.slotDefinitions.map(slot => ({ ...slot, amount: null })),
          durationCount: null, durationUnit: 'days', foodRelation: '', instructions: '',
        };
        const rows = [...rxModel.rows];
        const after = rows.findIndex(row => row.id === i.afterRowId);
        rows.splice(after < 0 ? rows.length : after + 1, 0, nr);
        rxModel = { ...rxModel, rows };
      } else if (i.type === 'rowRemoveRequested') {
        if (rxModel.rows.length > 1) {
          rxModel = { ...rxModel, rows: rxModel.rows.filter((r) => r.id !== i.rowId) };
          if (searchRowId === i.rowId) {
            searchRowId = undefined;
            rxSearch.dispatch({ type: 'queryChanged', query: '' });
            rxModel = { ...rxModel, formularySearch: undefined };
          }
        }
      } else if (i.type === 'rowMoveRequested') {
        const idx = rxModel.rows.findIndex((r) => r.id === i.rowId);
        const tIdx = i.direction === 'up' ? idx - 1 : idx + 1;
        if (idx >= 0 && tIdx >= 0 && tIdx < rxModel.rows.length) {
          const copy = [...rxModel.rows];
          const [m] = copy.splice(idx, 1);
          copy.splice(tIdx, 0, m);
          rxModel = { ...rxModel, rows: copy };
        }
      } else if (i.type === 'rowStepTitrationRequested') {
        const idx = rxModel.rows.findIndex((r) => r.id === i.rowId);
        if (idx >= 0) {
          const src = rxModel.rows[idx];
          const stepRow = {
            ...src,
            id: 'rx-' + (++rxSeq),
            drugName: src.drugName + (i.direction === 'down' ? ' (↘ Step-Down)' : ' (↗ Step-Up)'),
            frequencyCode: i.direction === 'down' ? 'BD' : 'QID',
            patternLabel: i.direction === 'down' ? '1 - 0 - 0 - 1' : '1 - 1 - 1 - 1',
            instructions: i.direction === 'down' ? 'Step-down continuation phase.' : 'Step-up escalation phase.',
          };
          const copy = [...rxModel.rows];
          copy.splice(idx + 1, 0, stepRow);
          rxModel = { ...rxModel, rows: copy };
        }
      } else if (i.type === 'doseStepped') {
        updateRow(row => {
          const next = Math.round(((row.doseAmount ?? 0) + i.delta) * 100) / 100;
          return Number.isFinite(next) && next > 0 ? { ...row, doseAmount: next } : row;
        });
      } else if (i.type === 'durationStepped') {
        rxModel = {
          ...rxModel,
          rows: rxModel.rows.map((r) =>
            r.id === i.rowId ? { ...r, durationCount: Math.max(1, (r.durationCount || 1) + i.delta) } : r
          ),
        };
      }
      rxEl.model = rxModel;
    });

    // 3. PACS Viewer State
    const pacsEl = document.getElementById('el-pacs');
    let pacsModel = {
      title: 'Multi-Viewport PACS & DICOMweb Compare Viewer (Lit Shadow DOM)',
      activeStudyId: 'pacs-1',
      layoutMode: '2-up-od-os',
      syncScroll: true,
      studies: [
        {
          id: 'pacs-1',
          accessionNumber: 'ACC-2026-OCT-9921',
          dateLabel: '10 Nov 2026',
          modality: 'OCT',
          bodyPart: 'Macula & RNFL (OD/OS)',
          title: 'SD-OCT Macular Cube 512×128 & Optic Disc RNFL',
          status: 'Final Report',
          pacsEndpointLabel: 'Fixture endpoint · no PACS connection',
          sliceCount: 32,
          currentSlice: 16,
          windowPreset: 'Retina/OCT',
          zoomPercent: 100,
          caliperMeasurementLabel: 'OD CST: 418 µm (↑ +164 µm) · OS CST: 258 µm',
          radiologistImpression: 'Right Eye (OD): Intraretinal cystoid spaces in OPL/INL (CST 418 µm), Irvine-Gass CMO. Left Eye (OS): Normal foveal contour.',
          keyFindings: ['OD CST 418 µm', 'OS CST 258 µm'],
        },
        {
          id: 'pacs-2',
          accessionNumber: 'ACC-2026-FFA-8840',
          dateLabel: '10 Nov 2026',
          modality: 'FFA',
          bodyPart: 'Retina Angiography (OU)',
          title: 'Fundus Fluorescein Angiography (Late Phase 10m)',
          status: 'Final Report',
          pacsEndpointLabel: 'Fixture endpoint · no PACS connection',
          sliceCount: 24,
          currentSlice: 18,
          windowPreset: 'High-Contrast',
          zoomPercent: 100,
          caliperMeasurementLabel: 'FAZ 540 µm · Late Petaloid Leakage OD',
          radiologistImpression: 'Classic late-phase perifoveal petaloid leakage in OD with mild disc staining.',
          keyFindings: ['Petaloid leakage OD'],
        },
      ],
    };
    pacsEl.model = pacsModel;
    pacsEl.addEventListener('intent', (ev) => {
      if (pacsModel.readOnly) return;
      const i = ev.detail;
      if (i.type === 'studySelected') pacsModel = { ...pacsModel, activeStudyId: i.studyId };
      else if (i.type === 'layoutModeChanged') pacsModel = { ...pacsModel, layoutMode: i.layoutMode };
      else if (i.type === 'sliceStepped') {
        pacsModel = {
          ...pacsModel,
          studies: pacsModel.studies.map((s) =>
            s.id === i.studyId ? { ...s, currentSlice: Math.max(1, Math.min(s.sliceCount, s.currentSlice + i.delta)) } : s
          ),
        };
      }
      pacsEl.model = pacsModel;
    });

    // 4. Specialty Exam Matrix State
    const examEl = document.getElementById('el-exam');
    const examLock = document.getElementById('btn-exam-lock');
    examEl.model = makeSpecialtyExamFixture();
    examLock.addEventListener('click', () => {
      examEl.model = { ...examEl.model, readOnly: !examEl.model.readOnly };
      examLock.textContent = examEl.model.readOnly ? 'Unlock fixture' : 'Lock fixture';
    });
    examEl.addEventListener('intent', (event) => {
      examEl.model = reduceSpecialtyExamFixture(examEl.model, event.detail);
    });

    // 5. Inpatient eMAR State
    const marEl = document.getElementById('el-mar');
    let marModel = {
      title: 'Inpatient eMAR & Nursing Kardex (Lit Shadow DOM)',
      wardBedLabel: 'Ward 4 · Bed 14B',
      shiftLabel: 'Morning Shift',
      nurseLabel: 'RN K. Nair',
      timeColumns: [
        { id: 'm', timeLabel: '08:00', slotLabel: 'Morning' },
        { id: 'a', timeLabel: '14:00', slotLabel: 'Afternoon' },
        { id: 'e', timeLabel: '18:00', slotLabel: 'Evening' },
        { id: 'n', timeLabel: '22:00', slotLabel: 'Night' },
      ],
      orders: [
        {
          id: 'mar-1',
          drugName: 'Nepafenac',
          strength: '0.1% w/v',
          formLabel: 'Ophthalmic Drops',
          doseLabel: '1 drop',
          routeLabel: 'Ophthalmic (OD)',
          frequencyCode: 'TDS',
          administrations: [
            { slotId: 'm', scheduledTime: '08:00', status: 'given' },
            { slotId: 'a', scheduledTime: '14:00', status: 'due' },
            { slotId: 'e', scheduledTime: '18:00', status: 'not-due' },
            { slotId: 'n', scheduledTime: '22:00', status: 'due' },
          ],
        },
        {
          id: 'mar-2',
          drugName: 'Mannitol 20%',
          strength: '20 g/100 mL',
          formLabel: 'IV Infusion',
          doseLabel: '100 mL',
          routeLabel: 'IV over 20m',
          frequencyCode: 'TDS',
          administrations: [
            { slotId: 'm', scheduledTime: '08:00', status: 'given' },
            { slotId: 'a', scheduledTime: '14:00', status: 'due' },
            { slotId: 'e', scheduledTime: '18:00', status: 'not-due' },
            { slotId: 'n', scheduledTime: '22:00', status: 'due' },
          ],
        },
      ],
    };
    marEl.model = marModel;
    marEl.addEventListener('intent', (ev) => {
      if (marModel.readOnly) return;
      const i = ev.detail;
      if (i.type === 'slotStatusCycled') {
        const cycle = ['due', 'given', 'held', 'refused'];
        marModel = {
          ...marModel,
          orders: marModel.orders.map((o) =>
            o.id === i.orderId
              ? {
                  ...o,
                  administrations: o.administrations.map((a) =>
                    a.slotId === i.slotId && a.status !== 'not-due'
                      ? { ...a, status: cycle[(cycle.indexOf(a.status) + 1) % cycle.length] }
                      : a
                  ),
                }
              : o
          ),
        };
        marEl.model = marModel;
      }
    });

    // 6. Print Summary State
    const printEl = document.getElementById('el-print');
    let printModel = {
      documentMode: 'opd-rx',
      facilityName: 'Advanced Multi-Specialty & Ophthalmic Institute',
      facilityDepartment: 'Ophthalmology, Vitreoretina & Internal Medicine',
      encounterDateLabel: '10 Nov 2026',
      encounterId: 'ENC-2026-88412',
      patientName: 'Aarav Sharma',
      patientAgeSex: '58 y / Male',
      patientIdentifiers: [{ label: 'MRN', value: 'MRN-2026-0842' }],
      careSettingLabel: 'OPD Room 4',
      allergiesSummary: ['Penicillin (Anaphylaxis)', 'Sulfonamides (Rash)'],
      chronicConditionsSummary: ['T2DM', 'POAG OU'],
      vitalsSummary: [{ label: 'BCVA OD/OS', value: '6/12 / 6/6' }],
      diagnoses: [],
      historySummary: [],
      examinationSummary: [],
      pacsKeyFindingsSummary: [],
      prescriptions: [
        {
          id: 'p1',
          drugName: 'Nepafenac',
          strength: '0.1% w/v',
          formLabel: 'Ophthalmic Drops',
          doseQtyUnit: '1 drop',
          frequencyPattern: 'TDS (1-1-0-1)',
          routeSite: 'Ophthalmic · OD',
          durationLabel: '6 weeks',
          instructions: '5 min gap between drops.',
        },
        {
          id: 'p2',
          drugName: 'Metformin HCl (SR)',
          strength: '500 mg',
          formLabel: 'Oral Tablet (Scored)',
          doseQtyUnit: '1 tab',
          frequencyPattern: 'BD (1-0-0-1)',
          routeSite: 'Oral',
          durationLabel: '30 days',
          dispenseTotalLabel: 'Dispense: 60 tabs',
          instructions: 'Take after meals.',
        },
      ],
      investigations: [],
      treatmentAdvises: [],
      crossConsultations: [],
      followUpDateLabel: 'Review in 3 weeks with repeat SD-OCT',
      prescriberName: 'Dr. Vivek Gupta, MD',
      prescriberRegNo: 'MCI-REG-48291',
    };
    printEl.model = printModel;
    printEl.addEventListener('intent', (ev) => {
      if (ev.detail.type === 'documentModeChanged') {
        printModel = { ...printModel, documentMode: ev.detail.mode };
        printEl.model = printModel;
      } else if (ev.detail.type === 'printTriggered') {
        window.print();
      }
    });

    // 7. Fixture Data Table
    const tableEl = document.getElementById('el-table');
    tableEl.model = {
      caption: 'Fixture: Prior Pathology & Glycemic Panel (<emr-data-table>)',
      columns: [
        { id: 'date', label: 'Date', sortable: true },
        { id: 'test', label: 'Investigation', sortable: true },
        { id: 'val', label: 'Result' },
        { id: 'ref', label: 'Reference Range' },
      ],
      rows: [
        { id: 'r1', cells: { date: '08 Nov 2026', test: 'HbA1c (HPLC)', val: '7.6 % (High)', ref: '4.0 – 5.6 %' } },
        { id: 'r2', cells: { date: '08 Nov 2026', test: 'Fasting Plasma Glucose', val: '134 mg/dL', ref: '70 – 99 mg/dL' } },
        { id: 'r3', cells: { date: '08 Nov 2026', test: 'Serum Creatinine / eGFR', val: '1.02 mg/dL (78 mL/min)', ref: '0.70 – 1.25 mg/dL' } },
      ],
      selectedIds: [],
      sort: { columnId: 'date', direction: 'desc' },
      filters: [],
      savedFilters: [],
      bulkActions: [],
      density: 'comfortable',
      page: 1,
      pageCount: 1,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50],
      summaryLabel: 'Showing 1–3 of 3 fixture results',
      status: 'ready',
    };
    tableEl.addEventListener('intent', ({ detail }) => {
      const m = tableEl.model;
      if (detail.type === 'sortChanged') {
        const direction = detail.direction === 'asc' ? 1 : -1;
        const label = (row) => row.cells[detail.columnId] ?? '';
        const rows = [...m.rows].sort((a, b) => direction * label(a).localeCompare(label(b)));
        tableEl.model = { ...m, sort: { columnId: detail.columnId, direction: detail.direction }, rows };
      } else if (detail.type === 'selectionChanged') {
        tableEl.model = { ...m, selectedIds: detail.selectedIds };
      } else if (detail.type === 'densityChanged') {
        tableEl.model = { ...m, density: detail.density };
      } else if (detail.type === 'pageSizeChanged') {
        tableEl.model = { ...m, pageSize: detail.pageSize };
      }
    });

    // 8. Browse all cataloged Lit elements using the exported registry metadata.
    const directory = ${directory};
    const selector = document.getElementById('lit-category');
    for (const [category, label] of Object.entries(directory.categories)) {
      selector.add(new Option(label, category));
    }
    const list = document.getElementById('el-directory');
    const count = document.getElementById('lit-directory-count');
    const renderDirectory = () => {
      const category = selector.value;
      const visible = directory.components.filter((item) => category === 'all' || item.categories.includes(category));
      list.replaceChildren(...visible.map(({ tag }) => {
        const entry = document.createElement('span');
        entry.className = 'lit-tag';
        entry.textContent = '<' + tag + '>' + (customElements.get(tag) ? '' : ' · Registration unavailable');
        return entry;
      }));
      count.textContent = visible.length + ' of ' + directory.components.length + ' components';
    };
    selector.addEventListener('change', renderDirectory);
    renderDirectory();
  </script>
</body>
</html>`;
}

// 1. Build controller, Lit elements, and Shadcn registry
run('pnpm build:controller');
run('pnpm build:elements');
run('pnpm registry:build');

// 2. Bundle the Lit elements and workstation example into the Next.js static export
mkdirSync(nextPublicLitDir, { recursive: true });
await esbuild.build({
  stdin: {
    resolveDir: rootDir,
    contents: [
      "export * from './examples/clinical-matrix/lit-host.mjs';",
      "export { createClinicalNoteDemo } from './examples/clinical-notes/clinical-note.fixture.ts';",
      "export { makeSpecialtyExamFixture, reduceSpecialtyExamFixture } from './packages/emr-react/harness/gallery/specialty-exam.fixture.ts';",
      "export { AsyncSearchController } from './packages/emr-controller/dist/search.controller.js';",
      "export { syntheticFormularyRepository, clearFixturePrescriptionProduct, resolveFixturePrescriptionProduct, PRESCRIBING_PRESETS } from './packages/emr-react/harness/gallery/prescribing-formulary.fixture.ts';",
    ].join('\n'),
  },
  bundle: true,
  format: 'esm',
  minify: true,
  outfile: join(nextPublicLitDir, 'emr-elements.bundle.js'),
});
writeFileSync(join(nextPublicLitDir, 'emr.css'), readFileSync(emrCssPath, 'utf8'));
writeFileSync(join(nextPublicLitDir, 'emr-print.css'), readFileSync(emrPrintCssPath, 'utf8'));
const registryIndex = JSON.parse(readFileSync(join(registryDir, 'index.json'), 'utf8'));
writeFileSync(join(nextPublicLitDir, 'index.html'), buildLitIndexHtml(registryIndex));

// 3. Build Next.js static export
run('pnpm --filter @drguptavivek/emr-react harness:build', {
  EMR_GH_PAGES_BASE_PATH: basePath,
});

if (withStorybook) {
  run('pnpm exec ng run emr-ui:build-storybook');
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// 4. Copy Next.js static export (which now includes /lit/) to root of dist/gh-pages/
cpSync(nextOutDir, outDir, { recursive: true });

// 5. Copy registry JSON files to dist/gh-pages/registry/
cpSync(registryDir, join(outDir, 'registry'), { recursive: true });

// 6. Copy Angular Storybook static build to dist/gh-pages/storybook/ if present
if (existsSync(storybookDir)) {
  cpSync(storybookDir, join(outDir, 'storybook'), { recursive: true });
}

// 7. Write .nojekyll so GitHub Pages serves _next/ and lit/ without Jekyll filtering
writeFileSync(join(outDir, '.nojekyll'), '');

console.log(`Built unified GitHub Pages site (with Lit Web Components @drguptavivek/emr-elements) -> dist/gh-pages/ (basePath: "${basePath || '/'}")`);
