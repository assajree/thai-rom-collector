# Spec — Retro sidebar and desktop top bar *(Fast path)*

## 1. Requirements

**Purpose:** Make primary navigation resemble the supplied Thai Patch DB reference while keeping the application shell usable at desktop widths.

**Scope:** Restyle the shared top bar and desktop sidebar only; route behavior, platform filtering, and page content remain unchanged.

**Acceptance criteria:**
- [ ] The black top bar, brand, and Admin link are visible on both mobile and desktop layouts.
- [ ] At `lg` widths, the sidebar is a solid purple rail with a red section label and compact cyan underlined links, visually matching the reference.
- [ ] The sidebar continues to provide Browse, Add patch, and game-system selection without changing their behavior.

## 2. Design

**Reuse first — existing artifacts:**

| Need | Existing artifact | Change |
|------|-------------------|--------|
| Shared shell | `web/src/app/app.component.html` | Keep the header outside the responsive content grid and render it at all widths. |
| Sidebar styles | `web/src/app/app.component.css` | Replace decorative rail styling with compact reference-inspired navigation styling. |
| Navigation state | `AppComponent.selectedPlatform` | Reuse unchanged. |

**Correctness:** The visible navigation targets and selected platform state remain identical before and after the style update.

**Error / empty handling:** Not applicable; this is presentation-only and preserves existing route and status-message behavior.

## 3. Tasks

- [x] 1. Capture the shell requirements and reuse existing navigation state. _Requirements: 1.1, 1.2, 1.3_
- [x] 2. Make the existing top bar visible at desktop widths and update the desktop sidebar markup. _Requirements: 1.1, 1.2, 1.3_
- [x] 3. Apply the reference-inspired sidebar CSS and verify the Angular build. _Requirements: 1.2, 1.3_

## 4. Verification checklist

- [ ] At desktop width, confirm the black top bar remains visible above the sidebar and content.
- [ ] Confirm the sidebar has purple fill, red heading, cyan underlined navigation, and an obvious active state.
- [ ] Confirm Browse, Add patch, and each platform selector still work.
- [x] Run `npm run build` from `web` successfully.

> **Living-spec rule:** Keep this specification aligned with the implemented shell.
