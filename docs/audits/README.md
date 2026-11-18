# Component Parity & Audit Reports

Per-component verification and sign-off reports produced by Stage 3 (`component-verifier`) following [docs/COMPONENT_DESIGN_WORKFLOW.md](../COMPONENT_DESIGN_WORKFLOW.md).

Each file is named `<selector>.md` (e.g. `emr-button.md`, `emr-text-input.md`) and records:
- Props, events, and validation/error-handling parity across Angular, React/Expo, and Lit
- Visual, typography, sizing (`>=44px`), hover/focus, and Light/Dark theme verification
- Website docs & registry completeness (`PASS` / `FAIL` verdict).
