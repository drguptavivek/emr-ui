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

function buildLitIndexHtml() {
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
      <a href="../index.html" class="lit-btn">← Main Catalog &amp; Registry</a>
    </div>
  </header>

  <main class="lit-container">
    <div class="lit-intent-bar">
      <span id="intent-output">⚡ Shadow DOM CustomEvent('emr-intent') Inspector: Interact with any &lt;emr-*&gt; Web Component below…</span>
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

    <!-- 2. Multi-Specialty 7-Column Prescribing Table with Backend API Dose Form Resolution -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        2. 7-Column Clinical Prescribing Table (Backend Formulary API Dose-Form + Step-Down / Step-Up)
        <span class="lit-tag">&lt;emr-prescribing-table&gt;</span>
      </h2>
      <emr-prescribing-table id="el-rx"></emr-prescribing-table>
    </section>

    <!-- 3. Multi-Viewport PACS & DICOMweb Compare Viewer -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        3. Multi-Viewport PACS &amp; DICOMweb Compare Viewer (1-Up · 2-Up OD vs OS · Active vs Prior)
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
      <emr-specialty-exam-matrix id="el-exam"></emr-specialty-exam-matrix>
    </section>

    <!-- 5. Inpatient eMAR & Nursing Kardex Grid -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        5. Inpatient eMAR &amp; Nursing Administration Grid (BCMA Barcode &amp; Dual-Sign)
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

    <!-- 8. Registered Custom Elements Directory -->
    <section class="lit-section">
      <h2 class="lit-section-title">
        8. Registered &lt;emr-*&gt; Custom Elements in window.customElements
      </h2>
      <div id="el-directory" class="lit-catalog-pills"></div>
    </section>
  </main>

  <script type="module">
    import { registerAllEmrElements } from './emr-elements.bundle.js';
    registerAllEmrElements();

    const intentLog = document.getElementById('intent-output');
    document.addEventListener('emr-intent', (e) => {
      const tag = e.target?.tagName?.toLowerCase() || 'emr-element';
      intentLog.textContent = \`⚡ <\${tag}> emitted emr-intent: \${JSON.stringify(e.detail)}\`;
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
        weightLabel: '68 kg · BSA 1.76 m²',
        careSetting,
        careSettingLabel: careSetting === 'opd' ? 'Outpatient (OPD Room 4)' : 'Inpatient (IPD Ward 4 · Bed 14B · Day 3)',
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
      canSign: true,
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
    rxEl.model = rxModel;
    rxEl.addEventListener('emr-intent', (ev) => {
      const i = ev.detail;
      if (i.type === 'rowAddRequested') {
        const nr = {
          id: 'rx-' + (++rxSeq),
          formularyCode: 'RXN-198440',
          drugName: 'Paracetamol',
          strength: '500 mg',
          form: 'tablet',
          formLabel: 'Oral Tablet (Scored)',
          stockStatus: 'In Stock',
          route: 'Oral',
          doseAmount: 1,
          unitLabel: 'tab',
          frequencyCode: 'TDS',
          patternLabel: '1 - 1 - 0 - 1',
          slots: [
            { id: 'm', label: 'Morning', amount: 1 },
            { id: 'a', label: 'Afternoon', amount: 1 },
            { id: 'e', label: 'Evening', amount: 0 },
            { id: 'n', label: 'Night', amount: 1 },
          ],
          durationCount: 5,
          durationUnit: 'days',
          foodRelation: 'After food',
          instructions: 'Take after meals.',
        };
        rxModel = { ...rxModel, rows: [...rxModel.rows, nr] };
      } else if (i.type === 'rowRemoveRequested') {
        if (rxModel.rows.length > 1) {
          rxModel = { ...rxModel, rows: rxModel.rows.filter((r) => r.id !== i.rowId) };
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
        rxModel = {
          ...rxModel,
          rows: rxModel.rows.map((r) =>
            r.id === i.rowId ? { ...r, doseAmount: Math.max(0.5, (r.doseAmount || 1) + i.delta) } : r
          ),
        };
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
          pacsEndpointLabel: 'DICOMweb://pacs.hospital.org/studies/oct-9921',
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
          pacsEndpointLabel: 'DICOMweb://pacs.hospital.org/studies/ffa-8840',
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
    pacsEl.addEventListener('emr-intent', (ev) => {
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
    let examModel = {
      title: 'Multi-Specialty Clinical Examination & Dosing Matrix (Lit Shadow DOM)',
      activeSpecialty: 'ophthalmology',
      ophthalmicRows: [
        { id: 'c1', segment: 'Anterior Segment', structureLabel: 'Cornea & Wound', odValue: 'Clear, temporal phaco port intact', osValue: 'Clear', normalDefault: 'Clear, Fluorescein neg', quickChips: ['Clear'] },
        { id: 'c2', segment: 'Anterior Segment', structureLabel: 'Anterior Chamber', odValue: 'Deep, 0 cells', osValue: 'Deep & quiet', normalDefault: 'Deep and quiet', quickChips: ['Deep & quiet'] },
        { id: 'c3', segment: 'Tonometry & Gonioscopy', structureLabel: 'IOP (GAT) & Angle', odValue: '22 mmHg (Steroid responder)', osValue: '15 mmHg', normalDefault: '15 mmHg · Shaffer IV open', quickChips: ['15 mmHg'] },
        { id: 'c4', segment: 'Posterior Segment', structureLabel: 'Macula & Fovea', odValue: 'Cystoid macular oedema (CST 418 µm)', osValue: 'Healthy foveal reflex (CST 258 µm)', normalDefault: 'Healthy foveal reflex', quickChips: ['Healthy'] },
      ],
      pediatrics: {
        weightKg: 12,
        heightCm: 88,
        bsaM2: '0.54',
        weightCentileLabel: '50th WHO Centile',
        heightCentileLabel: '55th WHO Centile',
        targetDrugLabel: 'Amoxicillin Oral Suspension (250 mg/5 mL)',
        mgPerKgPerDose: 15,
        concentrationMgPer5Ml: 250,
        calculatedMgPerDose: 180,
        calculatedMlPerDose: 3.6,
        maxDailyMgLabel: 'Max 90 mg/kg/day',
      },
      dermatology: {
        morphologyLabel: 'Erythematous scaly plaques',
        regions: [],
        totalBsaPercent: 10,
        totalFtuPerApp: 6.5,
        totalGramsFor14DaysBd: 91,
      },
      oncology: {
        regimenName: 'CAPOX (Capecitabine + Oxaliplatin)',
        cycleNumber: 3,
        cycleDayLabel: 'Days 1–14',
        ecogScore: 1,
        bsaM2: 1.76,
        ancCountLabel: '2,450 /µL (Gate Passed)',
        plateletCountLabel: '168,000 /µL',
        safetyGatePassed: true,
        doseReductionPercent: 100,
        agents: [],
      },
    };
    examEl.model = examModel;
    examEl.addEventListener('emr-intent', (ev) => {
      const i = ev.detail;
      if (i.type === 'specialtyChanged') examModel = { ...examModel, activeSpecialty: i.specialty };
      else if (i.type === 'ophthalmicApplyWnlAll') {
        examModel = {
          ...examModel,
          ophthalmicRows: examModel.ophthalmicRows.map((r) => ({ ...r, odValue: r.normalDefault, osValue: r.normalDefault })),
        };
      } else if (i.type === 'ophthalmicCopyOdToOs') {
        examModel = {
          ...examModel,
          ophthalmicRows: examModel.ophthalmicRows.map((r) => ({ ...r, osValue: r.odValue })),
        };
      }
      examEl.model = examModel;
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
    marEl.addEventListener('emr-intent', (ev) => {
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
    printEl.addEventListener('emr-intent', (ev) => {
      if (ev.detail.type === 'documentModeChanged') {
        printModel = { ...printModel, documentMode: ev.detail.mode };
        printEl.model = printModel;
      } else if (ev.detail.type === 'printTriggered') {
        window.print();
      }
    });

    // 7. Data Table
    const tableEl = document.getElementById('el-table');
    tableEl.definition = {
      id: 'labs-table',
      title: 'Prior Pathology & Glycemic Panel (<emr-data-table>)',
      columns: [
        { id: 'date', label: 'Date' },
        { id: 'test', label: 'Investigation' },
        { id: 'val', label: 'Result' },
        { id: 'ref', label: 'Reference Range' },
      ],
    };
    tableEl.rows = [
      { id: 'r1', cells: { date: '08 Nov 2026', test: 'HbA1c (HPLC)', val: '7.6 % (High)', ref: '4.0 – 5.6 %' } },
      { id: 'r2', cells: { date: '08 Nov 2026', test: 'Fasting Plasma Glucose', val: '134 mg/dL', ref: '70 – 99 mg/dL' } },
      { id: 'r3', cells: { date: '08 Nov 2026', test: 'Serum Creatinine / eGFR', val: '1.02 mg/dL (78 mL/min)', ref: '0.70 – 1.25 mg/dL' } },
    ];

    // 8. Populate Registered Custom Elements Directory
    const tags = [
      'emr-patient-banner', 'emr-prescribing-table', 'emr-pacs-viewer', 'emr-specialty-exam-matrix',
      'emr-inpatient-mar', 'emr-encounter-summary-print', 'emr-spectacle-prescription', 'emr-dose-schedule',
      'emr-observation-flowsheet', 'emr-clinical-transcript', 'emr-clinical-form', 'emr-data-table',
      'emr-stat-tile', 'emr-button', 'emr-badge', 'emr-text-input', 'emr-number-input', 'emr-select',
      'emr-checkbox', 'emr-switch', 'emr-app-shell', 'emr-top-bar', 'emr-left-nav', 'emr-work-queue',
      'emr-medication-reconciliation', 'emr-family-pedigree', 'emr-clinical-annotation-canvas'
    ];
    const dirEl = document.getElementById('el-directory');
    tags.forEach((tag) => {
      const registered = !!customElements.get(tag);
      const span = document.createElement('span');
      span.className = 'lit-tag';
      span.textContent = \`<\${tag}> \${registered ? '✓' : ''}\`;
      dirEl.appendChild(span);
    });
  </script>
</body>
</html>`;
}

// 1. Build controller, Lit elements, and Shadcn registry
run('pnpm build:controller');
run('pnpm build:elements');
run('pnpm registry:build');

// 2. Bundle @drguptavivek/emr-elements into Next.js public/lit/ so Next.js export includes it
mkdirSync(nextPublicLitDir, { recursive: true });
await esbuild.build({
  entryPoints: [join(rootDir, 'packages/emr-elements/dist/index.js')],
  bundle: true,
  format: 'esm',
  minify: true,
  outfile: join(nextPublicLitDir, 'emr-elements.bundle.js'),
});
writeFileSync(join(nextPublicLitDir, 'emr.css'), readFileSync(emrCssPath, 'utf8'));
writeFileSync(join(nextPublicLitDir, 'index.html'), buildLitIndexHtml());

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
