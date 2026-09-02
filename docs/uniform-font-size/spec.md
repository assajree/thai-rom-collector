# Spec — Uniform font size (Fast path)

## 1. Requirements

**Purpose:** Make every user-visible text element in the web app use a readable, consistent 16px (`1rem`) size.

**Scope:** Apply the shared text size to the application shell, browsing controls and results, status messages, and admin pages. Functional icons and symbols are excluded.

**Acceptance criteria:**
- [x] The base application font size is `1rem`.
- [x] Headings, labels, body text, table text, inputs, selects, and buttons do not apply a competing text-size utility or CSS declaration.
- [x] Close and search symbols retain their functional icon sizing.
- [x] The production Angular build succeeds.

## 2. Design

The global stylesheet defines the single text-size baseline and normalizes semantic headings and `small` text to inherit it. Component styles and Tailwind templates rely on that inheritance; only icon-specific selectors retain explicit sizes.

**Correctness:** Every user-visible textual control and content element resolves to `1rem` at all viewport widths, unless it is a functional icon.

## 3. Tasks

- [x] 1. Define the global `1rem` baseline and semantic inheritance.
- [x] 2. Remove component and Tailwind font-size overrides for text.
- [x] 3. Preserve icon-only sizing and responsive icon geometry.
- [ ] 4. Run the production build and inspect its result.

## 4. Verification checklist

- [ ] Browse, card/table, search/filter/sort, status message, and admin pages render text at 16px.
- [ ] Inputs, selects, and buttons inherit the same 16px size.
- [ ] Search and dismiss icons remain clearly visible and usable.
