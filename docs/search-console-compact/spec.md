# Spec — Compact search console *(Fast path)*

## 1. Requirements

**Purpose:** Reduce the browse-page search console's vertical footprint so game results appear earlier without changing search or filtering behavior.

**Scope:** Compact the search-console layout on desktop and mobile. Tag filters, sort controls, view toggle, bindings, and data flow are unchanged.

**Acceptance criteria:**
- [x] The search console uses a short, dense retro utility layout on all viewport sizes.
- [x] The search icon, text input, and clear button remain readable, usable, and horizontally contained.
- [x] Keyword search and clearing the keyword preserve their existing behavior.

## 2. Design

**Visual thesis:** A dense, brushed-metal retro search control that preserves the console's tactile styling while yielding space to the game catalogue.

**Reuse first:** Update only `web/src/app/components/game-list-controls.component.css`; retain the existing template, Angular bindings, colors, shadows, and responsive layout.

**Interaction:** No new motion or decorative UI. The existing keyboard focus, text search, and clear action remain unchanged.

**Correctness:** The component emits the same filter values as before; this is presentation-only.

## 3. Tasks

- [x] 1. Reduce the console padding, spacing, icon dimensions, input padding, and clear-button footprint.
- [x] 2. Add narrower mobile dimensions while retaining no-overflow behavior.
- [x] 3. Run the Angular build.
- [ ] 4. Manually verify desktop and narrow mobile search behavior.

## 4. Verification checklist

- [ ] The console is substantially shorter at desktop and narrow mobile widths.
- [ ] Typing updates the game filter and the clear button resets it.
- [ ] Tag filters, sort controls, and Card/Table toggle still work.
- [x] Run `npm run build` from `web` successfully.
