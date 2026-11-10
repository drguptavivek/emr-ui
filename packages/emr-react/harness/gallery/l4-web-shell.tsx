'use client';

import { createElement, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  CaptureStatusBarViewModel,
  EmrClassicalHistoryHeading,
  EmrCrossConsultationEntry,
  EmrDiagnosisEntry,
  EmrExaminationSection,
  EmrInvestigationOrder,
  EmrPacsStudyEntry,
  EmrPriorLabEntry,
  EmrPriorNoteEntry,
  NavItem,
  PatientBannerViewModel,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from '../../src/inputs-core';
import { EmrCaptureStatusBar, EmrPatientBanner } from '../../src/l4-shell';
import { EmrAppShell, type EmrAppShellIntent, type EmrSearchGroup } from '../../src/l4-web-shell';
import { EmrBadgeView, EmrButton } from '../../src/primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from '../../src/theme';
import { PrescribingTableDemo } from './l4-medications';
import type { GallerySection } from './types';

type PressState = PressableStateCallbackType & { focused?: boolean };

const INITIAL_PATIENT: PatientBannerViewModel = {
  patientId: 'MRN-2026-0842',
  displayName: 'Aarav Sharma',
  identifiers: [
    { label: 'MRN', value: 'MRN-2026-0842' },
    { label: 'National Health ID', value: '91-4820-7731-9904' },
  ],
  ageLabel: '58 y',
  sexLabel: 'Male',
  weightLabel: '68 kg · BSA 1.76 m²',
  careSetting: 'opd',
  careSettingLabel: 'Outpatient (OPD · Room 4)',
  locationLabel: 'Ophthalmology & Multi-Specialty Wing',
  encounterLabel: 'ENC-2026-88412',
  criticality: { label: 'High Risk (Post-Op + T2DM)', tone: 'warning' },
  allergyStatus: { label: '2 Drug Allergies', tone: 'danger' },
  allergyChipPrefix: 'Allergy:',
  allergies: [
    {
      id: 'alg-1',
      label: 'Penicillin (Anaphylaxis)',
      tone: 'danger',
      reactionLabel: 'Anaphylaxis / Bronchospasm',
      detail: 'Avoid all beta-lactams; use fluoroquinolones or macrolides.',
      provenanceLabel: 'Verified by Dr. R. Menon · Allergy Registry',
      recordedAtLabel: '12 Jan 2025',
    },
    {
      id: 'alg-2',
      label: 'Sulfonamides (Rash)',
      tone: 'warning',
      reactionLabel: 'Maculopapular Rash',
      detail: 'Avoid oral Acetazolamide / Co-trimoxazole.',
      provenanceLabel: 'Verified by Dr. S. Iyer · OPD Intake',
      recordedAtLabel: '08 Jun 2025',
    },
  ],
  chronicDiseaseStatus: { label: '3 Chronic Conditions', tone: 'info' },
  chronicDiseases: [
    { id: 'cd-1', label: 'Type 2 Diabetes Mellitus (8 yrs)', tone: 'warning' },
    { id: 'cd-2', label: 'Primary Open-Angle Glaucoma (OU)', tone: 'info' },
    { id: 'cd-3', label: 'Essential Hypertension', tone: 'neutral' },
  ],
  alerts: [
    { id: 'al-1', label: 'Steroid Responder (OD IOP)', tone: 'warning' },
    { id: 'al-2', label: 'Anticoagulant: Aspirin 75 mg', tone: 'info' },
  ],
  vitals: [
    {
      id: 'vt-va',
      label: 'BCVA OD / OS',
      valueLabel: '6/12 · 6/6',
      unit: '(+0.30 / 0.00 LogMAR)',
      tone: 'warning',
      trendPoints: [6, 9, 12, 12],
      provenanceLabel: 'ETDRS 4m Chart · Today 08:40',
    },
    {
      id: 'vt-iop',
      label: 'IOP OD / OS',
      valueLabel: '22 / 15',
      unit: 'mmHg',
      deltaLabel: 'Δ +6 OD',
      tone: 'warning',
      trendPoints: [15, 16, 19, 22],
      provenanceLabel: 'Goldmann Applanation · Today 08:42',
    },
    {
      id: 'vt-bp',
      label: 'BP',
      valueLabel: '136/84',
      unit: 'mmHg',
      deltaLabel: 'Δ -4',
      tone: 'neutral',
      trendPoints: [148, 142, 138, 136],
      provenanceLabel: 'Oscillometric · Today 08:30',
    },
    {
      id: 'vt-hba1c',
      label: 'HbA1c',
      valueLabel: '7.6',
      unit: '%',
      deltaLabel: 'High',
      tone: 'warning',
      trendPoints: [8.4, 8.1, 7.8, 7.6],
      provenanceLabel: 'Central Pathology HPLC · 08 Nov 2026',
    },
  ],
  layoutMode: 'banner',
  expanded: false,
  bedLabel: 'Bed 14B',
  wardLabel: 'Ward 4 (Ophth & Neuro-Med)',
  lengthOfStayLabel: 'Day 3',
  codeStatus: { label: 'Full Code', tone: 'success' },
};

const INITIAL_DIAGNOSES: readonly EmrDiagnosisEntry[] = [
  {
    id: 'dx-1',
    code: 'H59.031',
    label: 'Pseudophakic cystoid macular oedema (Irvine-Gass), right eye',
    status: 'principal',
    laterality: 'OD',
    onsetLabel: '3 weeks post-Phaco',
  },
  {
    id: 'dx-2',
    code: 'E11.3213',
    label: 'Type 2 diabetes mellitus with mild nonproliferative diabetic retinopathy, bilateral',
    status: 'confirmed',
    laterality: 'OU',
    onsetLabel: 'Chronic',
  },
  {
    id: 'dx-3',
    code: 'H40.41X2',
    label: 'Steroid-induced ocular hypertension, right eye',
    status: 'provisional',
    laterality: 'OD',
    onsetLabel: 'Today',
  },
  {
    id: 'dx-4',
    code: 'I10',
    label: 'Essential (primary) hypertension',
    status: 'comorbidity',
    laterality: 'Systemic',
    onsetLabel: '5 yrs',
  },
];

const INITIAL_PRIOR_NOTES: readonly EmrPriorNoteEntry[] = [
  {
    id: 'pn-1',
    dateLabel: '28 Oct 2026',
    setting: 'OPD',
    specialty: 'Ophthalmology Post-Op Day 10',
    authorLabel: 'Dr. V. Gupta (Senior Consultant)',
    title: 'Post-Op Day 10 Right Phaco + Toric PCIOL',
    summary: 'Patient comfortable. BCVA OD 6/6, OS 6/6. IOP OD 16 mmHg, OS 15 mmHg.',
    findings: 'Cornea clear, wound well-apposed, AC deep & quiet, PCIOL well-centered in capsular bag.',
    plan: 'Continue Prednisolone acetate 1% QID OD taper and Moxifloxacin 0.5% QID OD for 1 more week.',
  },
  {
    id: 'pn-2',
    dateLabel: '18 Oct 2026',
    setting: 'OT',
    specialty: 'Ophthalmic Surgery (OT 2)',
    authorLabel: 'Dr. V. Gupta',
    title: 'Operative Note: Right Eye Topical Phacoemulsification + Hydrophobic Acrylic PCIOL (+21.5 D)',
    summary: 'Uneventful temporal clear corneal phacoemulsification under topical anaesthesia.',
    findings: 'Continuous curvilinear capsulorhexis intact, posterior capsule intact, no vitreous loss.',
    plan: 'Post-op cataract regimen started.',
  },
  {
    id: 'pn-3',
    dateLabel: '02 Oct 2026',
    setting: 'OPD',
    specialty: 'Endocrinology & Diabetology',
    authorLabel: 'Dr. A. Kulkarni',
    title: 'Pre-Operative Glycemic Optimization',
    summary: 'HbA1c improved from 8.4% to 7.6%. Cleared for elective cataract surgery.',
    findings: 'BP 138/84 mmHg, pedal pulses palpable, no active foot ulceration.',
    plan: 'Continue Metformin 500 mg BD + Empagliflozin 10 mg OD; recheck HbA1c in 3 months.',
  },
];

const INITIAL_PRIOR_LABS: readonly EmrPriorLabEntry[] = [
  { id: 'lb-1', dateLabel: '08 Nov 2026', panelLabel: 'Glycemic', testName: 'HbA1c (HPLC)', valueLabel: '7.6', unit: '%', referenceRange: '4.0 – 5.6', flag: { label: 'High', tone: 'warning' }, trendLabel: '↓ from 8.1%' },
  { id: 'lb-2', dateLabel: '08 Nov 2026', panelLabel: 'Glycemic', testName: 'Fasting Plasma Glucose', valueLabel: '134', unit: 'mg/dL', referenceRange: '70 – 99', flag: { label: 'High', tone: 'warning' }, trendLabel: '↓ -12 mg/dL' },
  { id: 'lb-3', dateLabel: '08 Nov 2026', panelLabel: 'Renal', testName: 'Serum Creatinine', valueLabel: '1.02', unit: 'mg/dL', referenceRange: '0.70 – 1.25', trendLabel: 'Stable' },
  { id: 'lb-4', dateLabel: '08 Nov 2026', panelLabel: 'Renal', testName: 'eGFR (CKD-EPI)', valueLabel: '78', unit: 'mL/min/1.73m²', referenceRange: '> 60', trendLabel: 'WNL' },
  { id: 'lb-5', dateLabel: '08 Nov 2026', panelLabel: 'Haematology', testName: 'Haemoglobin', valueLabel: '13.8', unit: 'g/dL', referenceRange: '13.0 – 17.0', trendLabel: 'WNL' },
  { id: 'lb-6', dateLabel: '08 Nov 2026', panelLabel: 'Inflammatory', testName: 'ESR / hs-CRP', valueLabel: '14 mm/hr · 1.2 mg/L', unit: '', referenceRange: '< 20 / < 3.0', trendLabel: 'WNL' },
];

const INITIAL_PACS_STUDIES: readonly EmrPacsStudyEntry[] = [
  {
    id: 'pacs-1',
    accessionNumber: 'ACC-2026-OCT-9921',
    dateLabel: '10 Nov 2026 08:45',
    modality: 'OCT',
    bodyPart: 'Macula & RNFL (OD / OS)',
    title: 'SD-OCT Macular Cube 512×128 & Optic Disc RNFL (DICOM)',
    status: 'Final Report',
    pacsEndpointLabel: 'DICOMweb://pacs.hospital.org/wado-rs/studies/1.2.840.113619.2.408',
    sliceCount: 32,
    currentSlice: 16,
    windowPreset: 'Retina/OCT',
    zoomPercent: 100,
    inverted: false,
    comparePriorDateLabel: '14 Oct 2026 (Pre-Op Baseline CRT 254 µm)',
    caliperMeasurementLabel: 'OD Central Subfield Thickness (CST): 418 µm (↑ +164 µm) · OS CST: 258 µm',
    radiologistImpression:
      'Right Eye (OD): Intraretinal cystoid spaces in outer plexiform and inner nuclear layers with small subfoveal neurosensory detachment (CST 418 µm), consistent with Pseudophakic Cystoid Macular Oedema (Irvine-Gass). Left Eye (OS): Normal foveal contour (CST 258 µm).',
    keyFindings: [
      'OD Foveal CST: 418 µm (Baseline 254 µm)',
      'OD Cystoid intraretinal spaces in INL/OPL',
      'OS Foveal CST: 258 µm (Normal contour)',
      'RNFL Average OU: 94 µm OD / 96 µm OS (WNL)',
    ],
  },
  {
    id: 'pacs-2',
    accessionNumber: 'ACC-2026-FFA-8840',
    dateLabel: '10 Nov 2026 09:00',
    modality: 'FFA',
    bodyPart: 'Retina Angiography (OU)',
    title: 'Fundus Fluorescein Angiography (Early, Mid & Late Phase 10 min)',
    status: 'Final Report',
    pacsEndpointLabel: 'DICOMweb://pacs.hospital.org/wado-rs/studies/1.2.840.113619.2.512',
    sliceCount: 24,
    currentSlice: 18,
    windowPreset: 'High-Contrast',
    zoomPercent: 100,
    inverted: false,
    comparePriorDateLabel: 'No prior FFA',
    caliperMeasurementLabel: 'FAZ Diameter OD: 540 µm · Late Petaloid Hyperfluorescence',
    radiologistImpression:
      'Classic late-phase perifoveal petaloid leakage in OD with mild optic disc staining (Irvine-Gass syndrome). Scattered microaneurysms OU without neovascularization.',
    keyFindings: [
      'Late perifoveal petaloid pooling OD',
      'Mild late optic disc hyperfluorescence OD',
      'No capillary non-perfusion or NVD/NVE',
    ],
  },
  {
    id: 'pacs-3',
    accessionNumber: 'ACC-2026-MRI-4410',
    dateLabel: '15 Sep 2026',
    modality: 'MRI',
    bodyPart: 'Brain & Orbits (3T)',
    title: 'MRI Brain & Orbits Axial/Coronal T1, T2, FLAIR & Fat-Suppressed Post-Contrast',
    status: 'Final Report',
    pacsEndpointLabel: 'DICOMweb://pacs.hospital.org/wado-rs/studies/1.2.840.113619.2.301',
    sliceCount: 48,
    currentSlice: 22,
    windowPreset: 'Brain/Orbit',
    zoomPercent: 100,
    inverted: false,
    comparePriorDateLabel: 'Baseline Study',
    caliperMeasurementLabel: 'Optic Nerve Sheath Diameter: 5.1 mm OD / 5.0 mm OS (Normal)',
    radiologistImpression:
      'Normal bilateral optic nerves, chiasm, and retrobulbar fat. Age-appropriate mild periventricular chronic microvascular white matter changes (Fazekas Grade 1). No acute infarct or mass lesion.',
    keyFindings: [
      'Bilateral globes & extraocular muscles symmetric',
      'Optic nerve-sheath complex normal signal',
      'Fazekas Grade 1 small vessel changes',
    ],
  },
];

const INITIAL_CLASSICAL_HISTORY: readonly EmrClassicalHistoryHeading[] = [
  {
    id: 'cc',
    code: '1. Chief Complaints (CC)',
    title: 'Chief Presenting Complaints with Duration & Laterality',
    value: 'Blurring of central vision in right eye (OD) for 5 days; mild dull ache around right eye.',
    quickChips: ['Blurred central vision OD × 5d', 'Metamorphopsia (wavy lines)', 'Mild ocular ache', 'No flashes / floaters', 'No redness / discharge'],
    normalMacroText: 'Routine post-operative follow-up; patient reports clear comfortable vision OU.',
  },
  {
    id: 'hpi',
    code: '2. History of Present Illness (HPI / HOPI)',
    title: 'Chronological Narrative (Onset, Course, Associated & Relieving Factors)',
    value: '58-year-old male underwent uneventful right eye topical phacoemulsification with PCIOL 3 weeks ago (18 Oct 2026). Initial post-op vision was 6/6 at Day 10. Over the past 5 days, noticed gradual painless central haze and slight micropsia in OD while reading. No trauma, no severe pain or purulent discharge.',
    quickChips: ['Insidious onset', 'Central scotoma / haze', '3 wks post-Phaco OD', 'Compliant with drops', 'No systemic fever'],
    normalMacroText: 'Asymptomatic post-operative course with stable visual recovery.',
  },
  {
    id: 'pmh',
    code: '3. Past Medical History (PMH)',
    title: 'Medical Comorbidities & Systemic Illness',
    value: 'Type 2 Diabetes Mellitus × 8 years (most recent HbA1c 7.6%); Essential Hypertension × 5 years; Primary Open-Angle Glaucoma OU on topical therapy.',
    quickChips: ['T2DM × 8 yrs', 'Hypertension × 5 yrs', 'POAG OU', 'No IHD / CVA', 'No CKD / Asthma'],
    normalMacroText: 'No known systemic medical comorbidities (No DM, HTN, IHD, Asthma, or Thyroid disorder).',
  },
  {
    id: 'psh',
    code: '4. Past Surgical & Ocular History (PSH)',
    title: 'Prior Ocular & Systemic Surgeries / Lasers',
    value: 'Right eye Phacoemulsification + Toric PCIOL on 18 Oct 2026 (uneventful). No prior retinal laser or intravitreal injections.',
    quickChips: ['Phaco + PCIOL OD (Oct 2026)', 'Pseudophakia OD', 'Immature Cataract OS', 'No prior PRP / IVT'],
    normalMacroText: 'No prior ocular or systemic surgical procedures.',
  },
  {
    id: 'drug',
    code: '5. Medication & Treatment History (Drug Hx)',
    title: 'Current Ocular & Systemic Medications',
    value: 'Topical: Prednisolone acetate 1% OD (tapering), Timolol 0.5% OU BD. Systemic: Metformin 500 mg BD, Empagliflozin 10 mg OD, Telmisartan 40 mg OD, Aspirin 75 mg OD.',
    quickChips: ['On Prednisolone 1% OD', 'On Timolol 0.5% OU', 'On Metformin + Empagliflozin', 'On Aspirin 75 mg', 'No oral prostaglandin / tamsulosin'],
    normalMacroText: 'Not on any regular long-term systemic or topical medications.',
  },
  {
    id: 'allergy',
    code: '6. Allergy & ADR History',
    title: 'Drug, Food, Contrast & Latex Allergies',
    value: 'Penicillin (Anaphylaxis — strict avoidance); Sulfonamides (Maculopapular rash — avoid oral Acetazolamide). Tolerates topical Dorzolamide/Brinzolamide and Fluorescein dye.',
    quickChips: ['Penicillin — Anaphylaxis', 'Sulfa — Rash (Avoid Diamox)', 'Tolerates Tropicamide / Fluorescein', 'No Latex allergy'],
    normalMacroText: 'NKDA — No Known Drug, Food, or Latex Allergies.',
  },
  {
    id: 'family',
    code: '7. Family History (FH)',
    title: 'Hereditary Ocular & Systemic Conditions',
    value: 'Mother had Primary Open-Angle Glaucoma; Father had Type 2 Diabetes Mellitus. No family history of retinal detachment or corneal dystrophy.',
    quickChips: ['Positive FH of Glaucoma (Mother)', 'Positive FH of T2DM (Father)', 'No consanguinity', 'No hereditary blindness'],
    normalMacroText: 'No significant family history of glaucoma, blindness, or hereditary systemic disease.',
  },
  {
    id: 'social',
    code: '8. Personal & Social History (SH)',
    title: 'Occupation, Lifestyle, Tobacco/Alcohol, Sleep & Bowel/Bladder',
    value: 'Chartered accountant (high near-screen demand). Non-smoker, non-alcoholic. Vegetarian diet, normal sleep and bowel/bladder habits.',
    quickChips: ['High screen/near work', 'Non-smoker', 'Teetotaller', 'Normal sleep & appetite', 'Independent ADL'],
    normalMacroText: 'Non-smoker, non-alcoholic; normal sleep, appetite, and bowel/bladder habits.',
  },
  {
    id: 'ros',
    code: '9. Review of Systems (ROS)',
    title: '10-Point Systemic Review',
    value: 'Constitutional: No fever/weight loss. CVS: No chest pain/palpitations. RS: No dyspnoea/cough. CNS: No focal deficit/diplopia. Endo: Polyuria controlled.',
    quickChips: ['No fever / weight loss', 'No chest pain / dyspnoea', 'No diplopia / weakness', 'No dysuria', 'No joint pains'],
    normalMacroText: '10-system Review of Systems negative for fever, chest pain, dyspnoea, focal neurological deficit, GI/GU symptoms.',
  },
];

const INITIAL_EXAM_SECTIONS: readonly EmrExaminationSection[] = [
  {
    id: 'gpe',
    code: 'GPE & Vitals',
    title: 'General Physical Examination & Vitals',
    findingsText: 'Conscious, cooperative, well-oriented to time, place, and person. BP 136/84 mmHg, Pulse 76/min regular, Afebrile (36.8°C), SpO2 99% on room air. No pallor, icterus, cyanosis, clubbing, lymphadenopathy, or pedal oedema.',
    normalMacroText: 'Conscious, oriented, afebrile, vitals stable; PICCLE negative (no pallor, icterus, cyanosis, clubbing, lymphadenopathy, or oedema).',
    quickChips: ['Conscious & oriented', 'PICCLE negative', 'Afebrile', 'Hydration adequate', 'No pedal oedema'],
  },
  {
    id: 'local',
    code: 'Ocular / Specialty Exam',
    title: 'Ophthalmic Slit-Lamp, Tonometry & Dilated Fundus Examination',
    findingsText: 'BCVA: OD 6/12 (+0.30 LogMAR) improving to 6/9p, OS 6/6 (0.00 LogMAR). IOP (Goldmann): OD 22 mmHg (steroid response), OS 15 mmHg. Anterior Segment OD: Quiet conjunctiva, clear cornea, deep AC (0 cells), well-centered in-the-bag PCIOL. Fundus OD: Media clear, CDR 0.5:1, dull foveal reflex with perifoveal cystoid thickening (confirmed on OCT CST 418 µm), few background microaneurysms. Fundus OS: CDR 0.5:1, healthy macula, mild NPDR.',
    normalMacroText: 'OU BCVA 6/6 (0.00 LogMAR), IOP 14/15 mmHg, Anterior segment quiet, media clear, CDR 0.3:1 with healthy foveal reflex.',
    quickChips: ['Cornea clear OD/OS', 'AC deep & quiet (0 cells)', 'PCIOL in bag OD', 'Dull foveal reflex / CMO OD', 'IOP 22 mmHg OD (Steroid responder)'],
  },
  {
    id: 'cvs',
    code: 'CVS & RS',
    title: 'Cardiovascular & Respiratory System',
    findingsText: 'CVS: S1 S2 heard normally, no added heart sounds or murmurs. RS: Bilateral normal vesicular breath sounds, no crepitations or wheeze.',
    normalMacroText: 'CVS: S1 S2 normal, no murmur. RS: Bilateral NVBS, clear.',
    quickChips: ['S1 S2 normal, no murmur', 'B/L NVBS clear', 'No basal crepts', 'JVP not raised'],
  },
  {
    id: 'cns',
    code: 'CNS & Cranial Nerves',
    title: 'Central Nervous System & Neuro-Ophthalmology',
    findingsText: 'GCS 15/15 (E4V5M6). Pupils 3 mm round, briskly reactive to light OU, no RAPD. Extraocular movements full and painless in all 9 cardinal gazes (CN III, IV, VI intact).',
    normalMacroText: 'GCS 15/15, pupils equal and reactive (no RAPD), EOM full in all gazes, no focal sensory/motor deficit.',
    quickChips: ['GCS 15/15', 'No RAPD', 'EOM full in 9 gazes', 'CN II–XII intact'],
  },
];

const INITIAL_INVESTIGATIONS: readonly EmrInvestigationOrder[] = [
  { id: 'inv-1', category: 'Ophthalmic / Specialty', code: 'OCT-MAC', name: 'SD-OCT Macula & Ganglion Cell Analysis (OU) — Repeat in 4 Weeks', priority: 'Routine', indication: 'Quantify CST response to Nepafenac + Steroid stop in Pseudophakic CMO', status: 'Ordered' },
  { id: 'inv-2', category: 'Ophthalmic / Specialty', code: 'HVF-24-2', name: 'Humphrey Visual Field (HVF 24-2 SITA-Standard OU)', priority: 'Routine', indication: 'Baseline glaucoma field tracking with steroid-induced IOP rise', status: 'Ordered' },
  { id: 'inv-3', category: 'Lab / Pathology', code: 'LAB-FBS-PP', name: 'Fasting & Post-Prandial Blood Glucose + Serum Electrolytes', priority: 'Urgent', indication: 'Glycemic control check for macular oedema', status: 'Sample Collected' },
  { id: 'inv-4', category: 'Radiology / PACS', code: 'OCT-CUR', name: 'SD-OCT Macular Cube (Today — Linked in PACS)', priority: 'STAT', indication: 'Post-op visual blur OD', status: 'In PACS' },
];

const INITIAL_CONSULTS: readonly EmrCrossConsultationEntry[] = [
  {
    id: 'con-1',
    careSetting: 'opd',
    targetSpecialty: 'Vitreoretinal Subspecialty Clinic',
    targetConsultant: 'Dr. N. Deshmukh (VR Service)',
    urgency: 'Same-Day OPD',
    reasonForConsult: 'Pseudophakic Cystoid Macular Oedema OD (CST 418 µm) with steroid-induced IOP elevation (22 mmHg)',
    clinicalQuestion: 'Please review SD-OCT/FFA; advise if sub-Tenon triamcinolone / intravitreal anti-VEGF is indicated if topical Nepafenac 0.3% does not resolve CMO in 3 weeks.',
    locationOrClinic: 'Retina Suite B · Ground Floor',
    status: 'Acknowledged',
    consultantReply: 'Reviewed OCT & FFA on PACS. Agree with stopping Prednisolone immediately, starting Nepafenac 0.3% OD + Brinzolamide 1% BD OD. Re-OCT in 3 weeks.',
  },
  {
    id: 'con-2',
    careSetting: 'opd',
    targetSpecialty: 'Endocrinology & Diabetology',
    targetConsultant: 'Dr. A. Kulkarni',
    urgency: 'Routine',
    reasonForConsult: 'Suboptimal glycemic control (HbA1c 7.6%, FPG 134 mg/dL) contributing to macular oedema',
    clinicalQuestion: 'Kindly optimize oral hypoglycemic regimen; avoid thiazolidinediones (pioglitazone) due to macular oedema.',
    locationOrClinic: 'OPD Room 12 · Medicine Block',
    status: 'Requested',
  },
  {
    id: 'con-3',
    careSetting: 'ipd',
    targetSpecialty: 'Internal Medicine / Inpatient Diabetic Team',
    targetConsultant: 'Dr. S. Iyer (Ward Consult Roster)',
    urgency: 'Urgent (<4h)',
    reasonForConsult: 'Inpatient bedside glycemic & blood pressure titration for post-op complicated macular oedema',
    clinicalQuestion: 'Bedside review in Ward 4 Bed 14B for sliding-scale vs basal-bolus insulin adjustment.',
    locationOrClinic: 'Ward 4 · Bed 14B',
    status: 'Requested',
  },
];

const OPD_ADVISES = [
  'Stop Prednisolone acetate 1% eye drops in Right Eye immediately (causing IOP rise).',
  'Leave at least 5 minutes gap between two different eye drops.',
  'Strict blood sugar and blood pressure control; continue diabetic diet.',
  'Avoid rubbing the operated eye or splashing tap water directly into the eye.',
  'Report immediately to Emergency/OPD if you experience severe eye pain, sudden drop in vision, or redness.',
] as const;

const IPD_ADVISES = [
  'Admit to Ward 4 Bed 14B under Ophthalmology + Internal Medicine co-care.',
  'Diabetic Low-Sodium Diet (1,600 kcal/day); strict 6-hourly capillary blood glucose (CBG) charting.',
  'Head-end elevation 30 degrees; avoid Valsalva / heavy straining.',
  'Supervised nursing instillation of topical NSAID (Nepafenac 0.3%) and antiglaucoma drops (Brinzolamide 1% + Timolol 0.5%) with punctal occlusion.',
  'Twice-daily Applanation Tonometry (IOP charting at 08:00 and 18:00) in Flowsheet.',
] as const;

const RESULTS: EmrSearchGroup[] = [
  {
    id: 'patients',
    label: 'Active Patients',
    results: [
      { id: 'p1', label: 'Aarav Sharma (MRN-2026-0842 · 58 M)', sub: 'OPD Room 4 / Ward 4 · Pseudophakic CMO OD', badge: { label: 'Active', tone: 'info' } },
      { id: 'p2', label: 'Meera Krishnan (MRN-2026-0911 · 64 F)', sub: 'OPD Room 2 · Proliferative DR OU', badge: { label: 'Waiting', tone: 'warning' } },
    ],
  },
  {
    id: 'pacs',
    label: 'PACS Studies (DICOMweb)',
    results: [
      { id: 's1', label: 'ACC-2026-OCT-9921 · SD-OCT Macula OU', sub: 'Today 08:45 · CST 418 µm OD', badge: { label: 'DICOM Ready', tone: 'success' } },
      { id: 's2', label: 'ACC-2026-FFA-8840 · Fluorescein Angiography', sub: 'Today 09:00 · Petaloid leakage OD', badge: { label: 'DICOM Ready', tone: 'success' } },
    ],
  },
];

function PacsSimulatedViewport({ study }: { study: EmrPacsStudyEntry }) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const bg = study.inverted ? '#f4f7f9' : '#09111a';
  const fg = study.inverted ? '#09111a' : '#38bdf8';
  const accent = study.inverted ? '#b91c1c' : '#f59e0b';
  const gridStroke = study.inverted ? '#cbd5e1' : '#1e293b';

  return (
    <View
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: bg,
        padding: 10,
        gap: 6,
      }}
    >
      {/* DICOM HUD Overlay Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <Text style={{ color: fg, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
          [{study.modality}] {study.accessionNumber} · {study.bodyPart}
        </Text>
        <Text style={{ color: '#94a3b8', fontFamily: t.fontMono, fontSize: 11 }}>
          Slice {study.currentSlice}/{study.sliceCount} · W/L: {study.windowPreset} · Zoom: {study.zoomPercent}%
        </Text>
      </View>

      {/* Simulated Cross-Sectional OCT / Angiography / MRI SVG Canvas */}
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
        {Platform.OS === 'web' ? (
          createElement(
            'svg' as unknown as React.ComponentType<Record<string, unknown>>,
            {
              xmlns: 'http://www.w3.org/2000/svg',
              width: '100%',
              height: 156,
              viewBox: '0 0 520 156',
              style: { display: 'block', borderRadius: 6 },
            },
            createElement('rect' as unknown as React.ComponentType<Record<string, unknown>>, {
              key: 'bg',
              x: '0',
              y: '0',
              width: '520',
              height: '156',
              fill: bg,
            }),
            createElement('line' as unknown as React.ComponentType<Record<string, unknown>>, {
              key: 'g1',
              x1: '0',
              y1: '39',
              x2: '520',
              y2: '39',
              stroke: gridStroke,
              strokeDasharray: '3 3',
              strokeWidth: '1',
            }),
            createElement('line' as unknown as React.ComponentType<Record<string, unknown>>, {
              key: 'g2',
              x1: '0',
              y1: '78',
              x2: '520',
              y2: '78',
              stroke: gridStroke,
              strokeDasharray: '3 3',
              strokeWidth: '1',
            }),
            createElement('line' as unknown as React.ComponentType<Record<string, unknown>>, {
              key: 'g3',
              x1: '0',
              y1: '117',
              x2: '520',
              y2: '117',
              stroke: gridStroke,
              strokeDasharray: '3 3',
              strokeWidth: '1',
            }),
            ...(study.modality === 'OCT'
              ? [
                  createElement('path' as unknown as React.ComponentType<Record<string, unknown>>, {
                    key: 'rpe',
                    d: 'M 20 122 Q 260 118 500 122',
                    stroke: '#22c55e',
                    strokeWidth: '2.5',
                    fill: 'none',
                  }),
                  createElement('path' as unknown as React.ComponentType<Record<string, unknown>>, {
                    key: 'isos',
                    d: 'M 20 112 Q 260 108 500 112',
                    stroke: fg,
                    strokeWidth: '1.5',
                    fill: 'none',
                  }),
                  createElement('path' as unknown as React.ComponentType<Record<string, unknown>>, {
                    key: 'ilm',
                    d: 'M 20 76 Q 140 74 195 52 Q 260 24 325 52 Q 380 74 500 76',
                    stroke: fg,
                    strokeWidth: '2.5',
                    fill: 'none',
                  }),
                  createElement('circle' as unknown as React.ComponentType<Record<string, unknown>>, {
                    key: 'c1',
                    cx: '232',
                    cy: '74',
                    r: '14',
                    stroke: accent,
                    strokeWidth: '1.8',
                    fill: 'none',
                  }),
                  createElement('circle' as unknown as React.ComponentType<Record<string, unknown>>, {
                    key: 'c2',
                    cx: '260',
                    cy: '68',
                    r: '18',
                    stroke: accent,
                    strokeWidth: '2',
                    fill: 'none',
                  }),
                  createElement('circle' as unknown as React.ComponentType<Record<string, unknown>>, {
                    key: 'c3',
                    cx: '288',
                    cy: '74',
                    r: '13',
                    stroke: accent,
                    strokeWidth: '1.8',
                    fill: 'none',
                  }),
                  createElement('line' as unknown as React.ComponentType<Record<string, unknown>>, {
                    key: 'cal',
                    x1: '260',
                    y1: '36',
                    x2: '260',
                    y2: '118',
                    stroke: '#ef4444',
                    strokeWidth: '1.8',
                    strokeDasharray: '4 2',
                  }),
                  createElement(
                    'text' as unknown as React.ComponentType<Record<string, unknown>>,
                    {
                      key: 'cal-txt',
                      x: '268',
                      y: '48',
                      fill: '#ef4444',
                      fontSize: '11',
                      fontWeight: 'bold',
                    },
                    'CST 418 µm (OD)',
                  ),
                ]
              : study.modality === 'FFA'
                ? [
                    createElement('circle' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'ffa-ring',
                      cx: '260',
                      cy: '78',
                      r: '64',
                      stroke: fg,
                      strokeWidth: '1.8',
                      fill: 'none',
                    }),
                    createElement('circle' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'disc',
                      cx: '165',
                      cy: '78',
                      r: '14',
                      stroke: '#facc15',
                      strokeWidth: '2',
                      fill: 'none',
                    }),
                    createElement('path' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'v1',
                      d: 'M 178 72 Q 240 35 335 48',
                      stroke: fg,
                      strokeWidth: '2',
                      fill: 'none',
                    }),
                    createElement('path' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'v2',
                      d: 'M 178 84 Q 240 122 335 108',
                      stroke: fg,
                      strokeWidth: '2',
                      fill: 'none',
                    }),
                    createElement('circle' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'faz',
                      cx: '268',
                      cy: '78',
                      r: '16',
                      stroke: accent,
                      strokeWidth: '2.2',
                      strokeDasharray: '3 2',
                      fill: 'none',
                    }),
                    createElement(
                      'text' as unknown as React.ComponentType<Record<string, unknown>>,
                      {
                        key: 'faz-txt',
                        x: '290',
                        y: '82',
                        fill: accent,
                        fontSize: '11',
                        fontWeight: 'bold',
                      },
                      'Petaloid CMO Leakage',
                    ),
                  ]
                : [
                    createElement('circle' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'mri-head',
                      cx: '260',
                      cy: '84',
                      r: '62',
                      stroke: fg,
                      strokeWidth: '2',
                      fill: 'none',
                    }),
                    createElement('circle' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'orb-r',
                      cx: '222',
                      cy: '34',
                      r: '14',
                      stroke: accent,
                      strokeWidth: '2',
                      fill: 'none',
                    }),
                    createElement('circle' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'orb-l',
                      cx: '298',
                      cy: '34',
                      r: '14',
                      stroke: accent,
                      strokeWidth: '2',
                      fill: 'none',
                    }),
                    createElement('line' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'on-r',
                      x1: '222',
                      y1: '48',
                      x2: '252',
                      y2: '74',
                      stroke: fg,
                      strokeWidth: '2.5',
                    }),
                    createElement('line' as unknown as React.ComponentType<Record<string, unknown>>, {
                      key: 'on-l',
                      x1: '298',
                      y1: '48',
                      x2: '268',
                      y2: '74',
                      stroke: fg,
                      strokeWidth: '2.5',
                    }),
                    createElement(
                      'text' as unknown as React.ComponentType<Record<string, unknown>>,
                      {
                        key: 'mri-txt',
                        x: '322',
                        y: '38',
                        fill: accent,
                        fontSize: '10',
                        fontWeight: 'bold',
                      },
                      'ONSD 5.1 mm (WNL)',
                    ),
                  ]),
          )
        ) : (
          <View style={{ height: 140, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: fg, fontFamily: t.fontMono, fontSize: 12 }}>
              [DICOM {study.modality} Slice {study.currentSlice}/{study.sliceCount}]
            </Text>
          </View>
        )}
      </View>

      {/* Caliper & Prior Comparison Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <Text style={{ color: accent, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
          Caliper: {study.caliperMeasurementLabel}
        </Text>
        {study.comparePriorDateLabel ? (
          <Text style={{ color: '#94a3b8', fontFamily: ff, fontSize: 11 }}>
            Prior Compare: {study.comparePriorDateLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ClinicalEncounterWebShellDemo() {
  const t = useEmrTheme();
  const ff = fontFamily(t);

  // Care setting ('opd' vs 'ipd')
  const [careSetting, setCareSetting] = useState<'opd' | 'ipd'>('opd');
  const [patient, setPatient] = useState<PatientBannerViewModel>(INITIAL_PATIENT);
  const [diagnoses, setDiagnoses] = useState<readonly EmrDiagnosisEntry[]>(INITIAL_DIAGNOSES);
  const [newDxCode, setNewDxCode] = useState('');
  const [newDxLabel, setNewDxLabel] = useState('');

  // Left Nav & Right Split-Pane Chart/PACS Drawer
  const [activeNavId, setActiveNavId] = useState<string>('all');
  const [expandedNavIds, setExpandedNavIds] = useState<string[]>(['clinical-doc', 'orders-plan']);
  const [navOpen, setNavOpen] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [rightTab, setRightTab] = useState<'pacs' | 'notes' | 'labs'>('pacs');

  // Search state
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // PACS state
  const [pacsStudies, setPacsStudies] = useState<readonly EmrPacsStudyEntry[]>(INITIAL_PACS_STUDIES);
  const [activePacsId, setActivePacsId] = useState<string>('pacs-1');

  // Classical History & Exam state
  const [historyHeadings, setHistoryHeadings] = useState<readonly EmrClassicalHistoryHeading[]>(INITIAL_CLASSICAL_HISTORY);
  const [activeHistoryId, setActiveHistoryId] = useState<EmrClassicalHistoryHeading['id']>('cc');
  const [examSections, setExamSections] = useState<readonly EmrExaminationSection[]>(INITIAL_EXAM_SECTIONS);

  // Investigations, Treatment Advises & Cross-Consultations state
  const [investigations, setInvestigations] = useState<readonly EmrInvestigationOrder[]>(INITIAL_INVESTIGATIONS);
  const [newInvName, setNewInvName] = useState('');
  const [newInvCat, setNewInvCat] = useState<EmrInvestigationOrder['category']>('Ophthalmic / Specialty');
  const [newInvPriority, setNewInvPriority] = useState<EmrInvestigationOrder['priority']>('Routine');

  const [opdAdvises, setOpdAdvises] = useState<readonly string[]>(OPD_ADVISES);
  const [ipdAdvises, setIpdAdvises] = useState<readonly string[]>(IPD_ADVISES);
  const [customAdviseText, setCustomAdviseText] = useState('');
  const [followUpInterval, setFollowUpInterval] = useState('Review in 3 weeks with repeat SD-OCT Macula');

  const [consults, setConsults] = useState<readonly EmrCrossConsultationEntry[]>(INITIAL_CONSULTS);
  const [newConsultSpec, setNewConsultSpec] = useState('Cardiology');
  const [newConsultUrgency, setNewConsultUrgency] = useState<EmrCrossConsultationEntry['urgency']>('Routine');
  const [newConsultReason, setNewConsultReason] = useState('');

  // Record Status Bar
  const [statusBar, setStatusBar] = useState<CaptureStatusBarViewModel>({
    session: { dirty: true, saving: false, savedAt: '2026-11-10T08:45:00Z', conflict: null, error: null },
    savedAtLabel: '08:45',
    attributionLabel: 'Author: Dr. V. Gupta (Senior Consultant) · Encounter ENC-2026-88412',
    signature: {
      status: { label: 'Draft in progress', tone: 'warning' },
      signatories: [],
      canSign: true,
      canAmend: false,
    },
    connection: { label: 'DICOMweb + FHIR Online', tone: 'success' },
  });

  const switchCareSetting = (nextSetting: 'opd' | 'ipd') => {
    setCareSetting(nextSetting);
    setPatient((prev) => ({
      ...prev,
      careSetting: nextSetting,
      careSettingLabel:
        nextSetting === 'opd' ? 'Outpatient (OPD · Room 4)' : 'Inpatient (IPD · Ward 4 · Bed 14B)',
      locationLabel:
        nextSetting === 'opd' ? 'Ophthalmology & Multi-Specialty Clinic' : 'Ward 4 · Bed 14B · Day 3 Post-Admit',
    }));
  };

  const navItems: NavItem[] = [
    { id: 'all', label: 'Full Encounter Workspace', badge: { label: careSetting.toUpperCase(), tone: 'info' } },
    {
      id: 'clinical-doc',
      label: 'Clinical Documentation',
      children: [
        { id: 'history', label: '1. Classical History (9)', badge: { label: '9/9', tone: 'success' } },
        { id: 'exam', label: '2. Examination & VA/IOP', badge: { label: '4/4', tone: 'success' } },
      ],
    },
    {
      id: 'orders-plan',
      label: 'Orders, Rx & Consults',
      children: [
        { id: 'investigations', label: '3. Investigations & PACS', badge: { label: String(investigations.length), tone: 'info' } },
        { id: 'treatment', label: '4. Rx Plan & Advises', badge: { label: 'Rx', tone: 'warning' } },
        { id: 'consults', label: '5. Cross-Consultations', badge: { label: String(consults.length), tone: 'info' } },
      ],
    },
    { id: 'pacs-review', label: '6. Prior Notes, Labs & PACS' },
  ];

  const handleShellIntent = (i: EmrAppShellIntent) => {
    switch (i.type) {
      case 'itemSelected':
        setActiveNavId(i.itemId);
        setNavOpen(false);
        break;
      case 'itemExpansionRequested':
        setExpandedNavIds((prev) => (i.expanded ? [...prev, i.itemId] : prev.filter((x) => x !== i.itemId)));
        break;
      case 'navToggleRequested':
        setNavOpen((o) => !o);
        break;
      case 'queryChanged':
        setQuery(i.query);
        setSearchOpen(true);
        break;
      case 'searchOpenRequested':
        setSearchOpen(true);
        break;
      case 'searchCloseRequested':
        setSearchOpen(false);
        break;
      case 'resultSelected':
        setSearchOpen(false);
        if (i.groupId === 'pacs') {
          setShowRightDrawer(true);
          setRightTab('pacs');
        }
        break;
      case 'menuRequested':
        break;
    }
  };

  const activePacs = pacsStudies.find((s) => s.id === activePacsId) ?? pacsStudies[0]!;
  const activeHistory = historyHeadings.find((h) => h.id === activeHistoryId) ?? historyHeadings[0]!;
  const showSection = (secId: string) => activeNavId === 'all' || activeNavId === secId;

  // Right-Rail Split-Pane Historical Chart Review & PACS Panel
  const rightChartAndPacsDrawer = showRightDrawer ? (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
          CHART REVIEW & PACS
        </Text>
        <EmrButton small variant="ghost" label="Hide ✕" onPress={() => setShowRightDrawer(false)} />
      </View>

      {/* Drawer Tab Switcher: PACS & Radiology | Prior Notes | Prior Labs */}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {(
          [
            { id: 'pacs', label: `PACS & Imaging (${pacsStudies.length})` },
            { id: 'notes', label: `Prior Notes (${INITIAL_PRIOR_NOTES.length})` },
            { id: 'labs', label: `Labs (${INITIAL_PRIOR_LABS.length})` },
          ] as const
        ).map((tab) => {
          const active = rightTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              role="button"
              aria-pressed={active}
              onPress={() => setRightTab(tab.id)}
              style={({ focused }: PressState) => [
                {
                  flex: 1,
                  paddingVertical: 6,
                  paddingHorizontal: 6,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: active ? t.primary : t.border,
                  backgroundColor: active ? t.primarySoft : t.surfaceSoft,
                  alignItems: 'center',
                },
                focusRing(t, focused),
              ]}
            >
              <Text
                style={{
                  color: active ? t.primaryContrast : t.text,
                  fontFamily: ff,
                  fontSize: 11,
                  fontWeight: fontWeight(active ? t.weightBold : t.weightMedium),
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {rightTab === 'pacs' ? (
        <View style={{ gap: 10 }}>
          {/* Study Selector Pills */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {pacsStudies.map((st) => {
              const sel = st.id === activePacs.id;
              return (
                <Pressable
                  key={st.id}
                  role="button"
                  aria-pressed={sel}
                  onPress={() => setActivePacsId(st.id)}
                  style={({ focused }: PressState) => [
                    {
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: sel ? t.primary : t.border,
                      backgroundColor: sel ? t.primarySoft : t.surface,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                    [{st.modality}] {st.bodyPart}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Interactive PACS Viewport */}
          <PacsSimulatedViewport study={activePacs} />

          {/* PACS Toolbar: Slice Scrubber, Window/Level, Zoom, Invert */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <EmrButton
              small
              variant="outline"
              label="◀ Slice"
              onPress={() =>
                setPacsStudies((prev) =>
                  prev.map((s) => (s.id === activePacs.id ? { ...s, currentSlice: Math.max(1, s.currentSlice - 1) } : s)),
                )
              }
            />
            <EmrButton
              small
              variant="outline"
              label="Slice ▶"
              onPress={() =>
                setPacsStudies((prev) =>
                  prev.map((s) =>
                    s.id === activePacs.id ? { ...s, currentSlice: Math.min(s.sliceCount, s.currentSlice + 1) } : s,
                  ),
                )
              }
            />
            <EmrButton
              small
              variant="outline"
              label={activePacs.zoomPercent >= 150 ? 'Zoom 100%' : 'Zoom 150%'}
              onPress={() =>
                setPacsStudies((prev) =>
                  prev.map((s) =>
                    s.id === activePacs.id ? { ...s, zoomPercent: s.zoomPercent >= 150 ? 100 : 150 } : s,
                  ),
                )
              }
            />
            <EmrButton
              small
              variant="outline"
              label={activePacs.inverted ? 'LUT: Inverted' : 'LUT: Standard'}
              onPress={() =>
                setPacsStudies((prev) =>
                  prev.map((s) => (s.id === activePacs.id ? { ...s, inverted: !s.inverted } : s)),
                )
              }
            />
          </View>

          {/* Radiologist / Imaging Report & Copy-to-Exam Button */}
          <View
            style={{
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surfaceSoft,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                {activePacs.title}
              </Text>
              <EmrBadgeView badge={{ label: activePacs.status, tone: 'success' }} />
            </View>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10 }}>
              {activePacs.pacsEndpointLabel}
            </Text>
            <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs }}>
              {activePacs.radiologistImpression}
            </Text>
            <EmrButton
              small
              variant="outline"
              label="Copy PACS Impression → Specialty Exam"
              onPress={() =>
                setExamSections((prev) =>
                  prev.map((sec) =>
                    sec.id === 'local'
                      ? { ...sec, findingsText: `${sec.findingsText} [${activePacs.modality}: ${activePacs.caliperMeasurementLabel}]` }
                      : sec,
                  ),
                )
              }
            />
          </View>
        </View>
      ) : rightTab === 'notes' ? (
        <View style={{ gap: 10 }}>
          {INITIAL_PRIOR_NOTES.map((note) => (
            <View
              key={note.id}
              style={{
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surfaceSoft,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: t.primary, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                  {note.dateLabel} · {note.setting}
                </Text>
                <EmrBadgeView badge={{ label: note.specialty, tone: 'info' }} />
              </View>
              <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                {note.title}
              </Text>
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 11 }}>
                {note.authorLabel}
              </Text>
              <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs }}>
                {note.summary} {note.findings}
              </Text>
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 11 }}>
                Prior Plan: {note.plan}
              </Text>
              <EmrButton
                small
                variant="outline"
                label="Copy Forward to Current HPI"
                onPress={() =>
                  setHistoryHeadings((prev) =>
                    prev.map((h) =>
                      h.id === 'hpi'
                        ? { ...h, value: `${h.value} [Prior ${note.dateLabel}: ${note.summary}]` }
                        : h,
                    ),
                  )
                }
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {INITIAL_PRIOR_LABS.map((lab) => (
            <View
              key={lab.id}
              style={{
                padding: 8,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surfaceSoft,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                  {lab.testName}
                </Text>
                <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10 }}>
                  {lab.dateLabel} · Ref: {lab.referenceRange} {lab.unit}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                  {lab.valueLabel} {lab.unit}
                </Text>
                {lab.flag ? <EmrBadgeView badge={lab.flag} /> : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  ) : undefined;

  return (
    <View style={{ minHeight: 920, borderWidth: 1, borderColor: t.border, borderRadius: 10, overflow: 'hidden' }}>
      <EmrAppShell
        wideBreakpoint={1180}
        rightPanel={rightChartAndPacsDrawer}
        onIntent={handleShellIntent}
        model={{
          navOpen,
          nav: { title: 'Encounter Sections', items: navItems, activeId: activeNavId, expandedIds: expandedNavIds },
          topBar: {
            title: `EMR Clinical Workstation · ${careSetting === 'opd' ? 'Outpatient (OPD)' : 'Inpatient (IPD)'}`,
            userLabel: 'Dr. V. Gupta (Ophthalmology / Med)',
            search: { query, open: searchOpen, groups: query.trim() ? RESULTS : [] },
          },
        }}
      >
        <View style={{ gap: 16 }}>
          {/* Care Setting Switcher (OPD vs IPD) + Split-Pane PACS / Prior Notes Drawer Toggle */}
          <View
            style={{
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surface,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                ENCOUNTER SETUP:
              </Text>
              {(
                [
                  { id: 'opd', label: 'Outpatient (OPD Clinic Setup)' },
                  { id: 'ipd', label: 'Inpatient (IPD Ward & Bedside Setup)' },
                ] as const
              ).map((mode) => {
                const active = careSetting === mode.id;
                return (
                  <Pressable
                    key={mode.id}
                    role="button"
                    aria-pressed={active}
                    onPress={() => switchCareSetting(mode.id)}
                    style={({ focused }: PressState) => [
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: active ? t.primary : t.border,
                        backgroundColor: active ? t.primary : t.surfaceSoft,
                      },
                      focusRing(t, focused),
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? '#ffffff' : t.text,
                        fontFamily: ff,
                        fontSize: t.textXs,
                        fontWeight: fontWeight(t.weightBold),
                      }}
                    >
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <EmrButton
                small
                variant={showRightDrawer ? 'primary' : 'outline'}
                label={showRightDrawer ? '✓ Split-Pane PACS / Labs / Prior Notes Open' : 'Open PACS / Labs / Prior Notes'}
                onPress={() => setShowRightDrawer((prev) => !prev)}
              />
            </View>
          </View>

          {/* 1. Patient Details, Key Allergies, Chronic Diseases & Vitals Sparklines */}
          <EmrPatientBanner
            model={patient}
            onIntent={(i) => {
              if (i.type === 'expandedChangeRequested') setPatient({ ...patient, expanded: i.expanded });
              else if (i.type === 'alertInspectRequested') setPatient({ ...patient, activeInspectId: i.alertId });
              else if (i.type === 'layoutModeChangeRequested') setPatient({ ...patient, layoutMode: i.layoutMode });
            }}
          />

          {/* 2. Active & Working Diagnoses Strip (ICD-10 / SNOMED) */}
          <View
            style={{
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surface,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                ACTIVE & WORKING DIAGNOSES (ICD-10 / SNOMED-CT)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <View style={{ width: 90 }}>
                  <ThemedInput
                    value={newDxCode}
                    onChangeText={setNewDxCode}
                    placeholder="ICD Code…"
                    aria-label="New diagnosis ICD-10 code"
                    style={{ minHeight: 32, height: 32, paddingVertical: 2, fontSize: t.textXs, fontFamily: t.fontMono }}
                  />
                </View>
                <View style={{ width: 220 }}>
                  <ThemedInput
                    value={newDxLabel}
                    onChangeText={setNewDxLabel}
                    placeholder="Add diagnosis description…"
                    aria-label="New diagnosis description"
                    style={{ minHeight: 32, height: 32, paddingVertical: 2, fontSize: t.textXs }}
                  />
                </View>
                <EmrButton
                  small
                  variant="outline"
                  label="+ Add Diagnosis"
                  disabled={!newDxLabel.trim()}
                  onPress={() => {
                    setDiagnoses((prev) => [
                      ...prev,
                      {
                        id: `dx-${Date.now()}`,
                        code: newDxCode.trim() || 'H57.9',
                        label: newDxLabel.trim(),
                        status: 'provisional',
                        laterality: 'OD',
                        onsetLabel: 'Today',
                      },
                    ]);
                    setNewDxCode('');
                    setNewDxLabel('');
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {diagnoses.map((dx) => {
                const badgeTone =
                  dx.status === 'principal'
                    ? 'danger'
                    : dx.status === 'confirmed'
                      ? 'success'
                      : dx.status === 'provisional'
                        ? 'warning'
                        : 'info';
                return (
                  <View
                    key={dx.id}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surfaceSoft,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <EmrBadgeView badge={{ label: `${dx.code} · ${dx.status.toUpperCase()}`, tone: badgeTone }} />
                    <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium) }}>
                      {dx.label} {dx.laterality ? `(${dx.laterality})` : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 3. Classical Clinical History Headings */}
          {showSection('history') ? (
            <View
              style={{
                padding: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surface,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <View>
                  <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                    1. CLASSICAL CLINICAL HISTORY DOCUMENTATION
                  </Text>
                  <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>
                    Structured 9-heading medical history with 1-click positive/negative chips and normal macros.
                  </Text>
                </View>
                <EmrButton
                  small
                  variant="outline"
                  label="✓ Fill Normal Macros for Empty Headings"
                  onPress={() =>
                    setHistoryHeadings((prev) =>
                      prev.map((h) => (h.value.trim() ? h : { ...h, value: h.normalMacroText })),
                    )
                  }
                />
              </View>

              {/* Classical Heading Selector Pills */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {historyHeadings.map((h) => {
                  const sel = h.id === activeHistory.id;
                  return (
                    <Pressable
                      key={h.id}
                      role="button"
                      aria-pressed={sel}
                      onPress={() => setActiveHistoryId(h.id)}
                      style={({ focused }: PressState) => [
                        {
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: sel ? t.primary : t.border,
                          backgroundColor: sel ? t.primarySoft : t.surfaceSoft,
                        },
                        focusRing(t, focused),
                      ]}
                    >
                      <Text
                        style={{
                          color: sel ? t.primaryContrast : t.text,
                          fontFamily: ff,
                          fontSize: t.textXs,
                          fontWeight: fontWeight(sel ? t.weightBold : t.weightMedium),
                        }}
                      >
                        {h.code}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Active Classical Heading Editor */}
              <View
                style={{
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: t.primaryBorder,
                  backgroundColor: t.surfaceSoft,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                    {activeHistory.code}: {activeHistory.title}
                  </Text>
                  <EmrButton
                    small
                    variant="ghost"
                    label="✓ Apply Normal / Negative Macro"
                    onPress={() =>
                      setHistoryHeadings((prev) =>
                        prev.map((h) => (h.id === activeHistory.id ? { ...h, value: h.normalMacroText } : h)),
                      )
                    }
                  />
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {activeHistory.quickChips.map((chip) => (
                    <Pressable
                      key={chip}
                      role="button"
                      onPress={() =>
                        setHistoryHeadings((prev) =>
                          prev.map((h) =>
                            h.id === activeHistory.id
                              ? { ...h, value: h.value ? `${h.value.trimEnd()} · ${chip}` : chip }
                              : h,
                          ),
                        )
                      }
                      style={({ focused }: PressState) => [
                        {
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 4,
                          borderWidth: 1,
                          borderColor: t.primaryBorder,
                          backgroundColor: t.surface,
                        },
                        focusRing(t, focused),
                      ]}
                    >
                      <Text style={{ color: t.primaryContrast, fontFamily: ff, fontSize: 11 }}>
                        + {chip}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <ThemedInput
                  multiline
                  numberOfLines={3}
                  value={activeHistory.value}
                  aria-label={activeHistory.title}
                  onChangeText={(txt) =>
                    setHistoryHeadings((prev) =>
                      prev.map((h) => (h.id === activeHistory.id ? { ...h, value: txt } : h)),
                    )
                  }
                />
              </View>
            </View>
          ) : null}

          {/* 4. Physical, Systemic & Specialty Examination Findings */}
          {showSection('exam') ? (
            <View
              style={{
                padding: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surface,
                gap: 12,
              }}
            >
              <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                2. PHYSICAL, SYSTEMIC & SPECIALTY EXAMINATION FINDINGS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {examSections.map((sec) => (
                  <View
                    key={sec.id}
                    style={{
                      flex: 1,
                      minWidth: 280,
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surfaceSoft,
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                        {sec.title}
                      </Text>
                      <EmrButton
                        small
                        variant="ghost"
                        label="✓ WNL"
                        onPress={() =>
                          setExamSections((prev) =>
                            prev.map((s) => (s.id === sec.id ? { ...s, findingsText: s.normalMacroText } : s)),
                          )
                        }
                      />
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {sec.quickChips.map((chip) => (
                        <Pressable
                          key={chip}
                          role="button"
                          onPress={() =>
                            setExamSections((prev) =>
                              prev.map((s) =>
                                s.id === sec.id ? { ...s, findingsText: `${s.findingsText.trimEnd()} · ${chip}` } : s,
                              ),
                            )
                          }
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: t.border,
                            backgroundColor: t.surface,
                          }}
                        >
                          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>+ {chip}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <ThemedInput
                      multiline
                      numberOfLines={3}
                      value={sec.findingsText}
                      aria-label={sec.title}
                      onChangeText={(txt) =>
                        setExamSections((prev) =>
                          prev.map((s) => (s.id === sec.id ? { ...s, findingsText: txt } : s)),
                        )
                      }
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 5. Recommended Investigations (Lab, Radiology/PACS & Specialty Diagnostics) */}
          {showSection('investigations') ? (
            <View
              style={{
                padding: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surface,
                gap: 10,
              }}
            >
              <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                3. RECOMMENDED INVESTIGATIONS (LAB · RADIOLOGY/PACS · SPECIALTY)
              </Text>

              {/* Quick Investigation Order Composer */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {(
                  [
                    'Ophthalmic / Specialty',
                    'Lab / Pathology',
                    'Radiology / PACS',
                    'Cardio / Neuro',
                  ] as const
                ).map((cat) => (
                  <Pressable
                    key={cat}
                    role="button"
                    aria-pressed={newInvCat === cat}
                    onPress={() => setNewInvCat(cat)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: newInvCat === cat ? t.primary : t.border,
                      backgroundColor: newInvCat === cat ? t.primarySoft : t.surfaceSoft,
                    }}
                  >
                    <Text style={{ color: newInvCat === cat ? t.primaryContrast : t.text, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightMedium) }}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}

                {(
                  ['Routine', 'Urgent', 'STAT'] as const
                ).map((pri) => (
                  <Pressable
                    key={pri}
                    role="button"
                    aria-pressed={newInvPriority === pri}
                    onPress={() => setNewInvPriority(pri)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: newInvPriority === pri ? t.warning : t.border,
                      backgroundColor: newInvPriority === pri ? t.warningSoft : t.surface,
                    }}
                  >
                    <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                      {pri}
                    </Text>
                  </Pressable>
                ))}

                <View style={{ flex: 1, minWidth: 200 }}>
                  <ThemedInput
                    value={newInvName}
                    onChangeText={setNewInvName}
                    placeholder="Order investigation (e.g. B-Scan USG, Specular Microscopy, MRI Orbits, Lipid Profile)…"
                    aria-label="Investigation name"
                    style={{ minHeight: 34, height: 34, paddingVertical: 4, fontSize: t.textXs }}
                  />
                </View>
                <EmrButton
                  small
                  label="+ Order Investigation"
                  disabled={!newInvName.trim()}
                  onPress={() => {
                    setInvestigations((prev) => [
                      ...prev,
                      {
                        id: `inv-${Date.now()}`,
                        category: newInvCat,
                        code: `ORD-${prev.length + 1}`,
                        name: newInvName.trim(),
                        priority: newInvPriority,
                        indication: 'Ordered during current encounter',
                        status: 'Ordered',
                      },
                    ]);
                    setNewInvName('');
                  }}
                />
              </View>

              {/* Ordered Investigations List */}
              <View style={{ gap: 6 }}>
                {investigations.map((inv) => (
                  <View
                    key={inv.id}
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surfaceSoft,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 220 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <EmrBadgeView badge={{ label: inv.category, tone: 'info' }} />
                        <EmrBadgeView
                          badge={{
                            label: inv.priority,
                            tone: inv.priority === 'STAT' ? 'danger' : inv.priority === 'Urgent' ? 'warning' : 'neutral',
                          }}
                        />
                        <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                          {inv.name}
                        </Text>
                      </View>
                      <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 11 }}>
                        Indication: {inv.indication}
                      </Text>
                    </View>
                    <EmrBadgeView
                      badge={{
                        label: inv.status,
                        tone: inv.status === 'In PACS' || inv.status === 'Reported' ? 'success' : 'warning',
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 6. Recommended Treatment Plan (7-Column Prescribing Table) & Treatment Advises */}
          {showSection('treatment') ? (
            <View style={{ gap: 14 }}>
              <PrescribingTableDemo />

              {/* Recommended Treatment Advises & Patient Instructions (OPD vs IPD) */}
              <View
                style={{
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                    4B. RECOMMENDED TREATMENT ADVISES & FOLLOW-UP ({careSetting.toUpperCase()} SETUP)
                  </Text>
                  <EmrBadgeView
                    badge={{
                      label: careSetting === 'opd' ? 'Outpatient Home Care Instructions' : 'Inpatient Nursing & Ward Care Orders',
                      tone: 'info',
                    }}
                  />
                </View>

                <View style={{ gap: 6 }}>
                  {(careSetting === 'opd' ? opdAdvises : ipdAdvises).map((adv, idx) => (
                    <View
                      key={idx}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: t.border,
                        backgroundColor: t.surfaceSoft,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Text style={{ color: t.primary, fontFamily: t.fontMono, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                        {idx + 1}.
                      </Text>
                      <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, flex: 1 }}>
                        {adv}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <View style={{ flex: 1, minWidth: 220 }}>
                    <ThemedInput
                      value={customAdviseText}
                      onChangeText={setCustomAdviseText}
                      placeholder={`Add custom ${careSetting.toUpperCase()} treatment advise or precaution…`}
                      aria-label="Add treatment advise"
                      style={{ minHeight: 34, height: 34, paddingVertical: 4, fontSize: t.textXs }}
                    />
                  </View>
                  <EmrButton
                    small
                    variant="outline"
                    label="+ Add Treatment Advise"
                    disabled={!customAdviseText.trim()}
                    onPress={() => {
                      if (careSetting === 'opd') setOpdAdvises((prev) => [...prev, customAdviseText.trim()]);
                      else setIpdAdvises((prev) => [...prev, customAdviseText.trim()]);
                      setCustomAdviseText('');
                    }}
                  />
                  <View style={{ width: 280 }}>
                    <ThemedInput
                      value={followUpInterval}
                      onChangeText={setFollowUpInterval}
                      aria-label="Follow-up schedule"
                      style={{ minHeight: 34, height: 34, paddingVertical: 4, fontSize: t.textXs, fontFamily: t.fontMono }}
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* 7. Cross-Consultations (Outpatient Referral vs Inpatient Bedside Consultation) */}
          {showSection('consults') ? (
            <View
              style={{
                padding: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surface,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <View>
                  <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                    5. CROSS-CONSULTATIONS ({careSetting === 'opd' ? 'OUTPATIENT CLINIC REFERRALS' : 'INPATIENT BEDSIDE & CO-MANAGEMENT CONSULTS'})
                  </Text>
                  <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>
                    Request inter-departmental specialist opinion in OPD (clinic referral) or IPD (STAT / Urgent bedside ward consult).
                  </Text>
                </View>
              </View>

              {/* Quick Cross-Consult Composer */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {[
                  'Endocrinology',
                  'Cardiology',
                  'Neurology / Neurosurgery',
                  'Nephrology',
                  'Internal Medicine / PAC',
                  'ENT',
                  'Dermatology',
                  'Oncology',
                ].map((spec) => (
                  <Pressable
                    key={spec}
                    role="button"
                    aria-pressed={newConsultSpec === spec}
                    onPress={() => setNewConsultSpec(spec)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: newConsultSpec === spec ? t.primary : t.border,
                      backgroundColor: newConsultSpec === spec ? t.primarySoft : t.surfaceSoft,
                    }}
                  >
                    <Text style={{ color: newConsultSpec === spec ? t.primaryContrast : t.text, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightMedium) }}>
                      {spec}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {(
                  careSetting === 'opd'
                    ? (['Routine', 'Same-Day OPD'] as const)
                    : (['STAT Bedside (<1h)', 'Urgent (<4h)', 'Routine', 'Co-Management'] as const)
                ).map((urg) => (
                  <Pressable
                    key={urg}
                    role="button"
                    aria-pressed={newConsultUrgency === urg}
                    onPress={() => setNewConsultUrgency(urg)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: newConsultUrgency === urg ? t.warning : t.border,
                      backgroundColor: newConsultUrgency === urg ? t.warningSoft : t.surface,
                    }}
                  >
                    <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                      {urg}
                    </Text>
                  </Pressable>
                ))}
                <View style={{ flex: 1, minWidth: 220 }}>
                  <ThemedInput
                    value={newConsultReason}
                    onChangeText={setNewConsultReason}
                    placeholder={`Reason & clinical question for ${newConsultSpec} (${careSetting.toUpperCase()})…`}
                    aria-label="Cross-consultation reason"
                    style={{ minHeight: 34, height: 34, paddingVertical: 4, fontSize: t.textXs }}
                  />
                </View>
                <EmrButton
                  small
                  label={`+ Request ${careSetting.toUpperCase()} Cross-Consult`}
                  disabled={!newConsultReason.trim()}
                  onPress={() => {
                    setConsults((prev) => [
                      ...prev,
                      {
                        id: `con-${Date.now()}`,
                        careSetting,
                        targetSpecialty: newConsultSpec,
                        targetConsultant: `On-Call ${newConsultSpec} Consultant`,
                        urgency: newConsultUrgency,
                        reasonForConsult: newConsultReason.trim(),
                        clinicalQuestion: 'Please evaluate and advise management.',
                        locationOrClinic: careSetting === 'opd' ? `${newConsultSpec} OPD Clinic` : 'Ward 4 · Bed 14B (Bedside)',
                        status: 'Requested',
                      },
                    ]);
                    setNewConsultReason('');
                  }}
                />
              </View>

              {/* Active Cross-Consultations List */}
              <View style={{ gap: 8 }}>
                {consults.map((c) => (
                  <View
                    key={c.id}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surfaceSoft,
                      gap: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <EmrBadgeView badge={{ label: c.careSetting.toUpperCase(), tone: c.careSetting === 'ipd' ? 'warning' : 'info' }} />
                        <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                          {c.targetSpecialty} · {c.targetConsultant}
                        </Text>
                        <EmrBadgeView
                          badge={{
                            label: c.urgency,
                            tone: c.urgency.includes('STAT') ? 'danger' : c.urgency.includes('Urgent') || c.urgency.includes('Same-Day') ? 'warning' : 'neutral',
                          }}
                        />
                      </View>
                      <EmrBadgeView badge={{ label: c.status, tone: c.status === 'Acknowledged' || c.status === 'Completed' ? 'success' : 'warning' }} />
                    </View>
                    <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs }}>
                      Reason: {c.reasonForConsult}
                    </Text>
                    <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 11 }}>
                      Question: {c.clinicalQuestion} · Location: {c.locationOrClinic}
                    </Text>
                    {c.consultantReply ? (
                      <View
                        style={{
                          marginTop: 4,
                          padding: 8,
                          borderRadius: 6,
                          borderLeftWidth: 3,
                          borderLeftColor: t.success,
                          backgroundColor: t.surface,
                        }}
                      >
                        <Text style={{ color: t.success, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                          Consultant Response:
                        </Text>
                        <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs }}>
                          {c.consultantReply}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 8. Encounter Capture Status & Sign-Off Bar */}
          <EmrCaptureStatusBar
            model={statusBar}
            onIntent={(i) => {
              if (i.type === 'saveRequested' || i.type === 'signRequested') {
                setStatusBar((prev) => ({
                  ...prev,
                  savedAtLabel: '08:52',
                  session: { ...prev.session, dirty: false, savedAt: '2026-11-10T08:52:00Z' },
                  signature: prev.signature
                    ? {
                        ...prev.signature,
                        status: { label: 'Signed & Locked', tone: 'success' },
                        canSign: false,
                        canAmend: true,
                      }
                    : undefined,
                }));
              } else if (i.type === 'amendRequested') {
                setStatusBar((prev) => ({
                  ...prev,
                  session: { ...prev.session, dirty: true },
                  signature: prev.signature
                    ? {
                        ...prev.signature,
                        status: { label: 'Amendment in progress', tone: 'warning' },
                        canSign: true,
                        canAmend: false,
                      }
                    : undefined,
                }));
              }
            }}
          />
        </View>
      </EmrAppShell>
    </View>
  );
}

export const gallery: GallerySection[] = [
  {
    id: 'l4-web-shell',
    title: 'Integrated OPD & IPD Clinical Encounter Web Shell (Patient Banner, Diagnoses, PACS, Prior Notes/Labs, Classical History, Exam, Investigations, Rx & Cross-Consults)',
    render: () => <ClinicalEncounterWebShellDemo />,
  },
];
