# Component template and style extraction

## Requirements

- Move every inline template in `web/src/app/components` and `web/src/app/pages` to an adjacent `.component.html` file.
- Give every refactored component an adjacent `.component.css` file referenced through `styleUrl`.
- Move custom browse controls and patch-card styling to their owning components while keeping the rendered UI and interactions unchanged.
- Keep Tailwind utility classes, Angular bindings, events, and TypeScript logic unchanged.

## Design

- Use Angular `templateUrl` and singular `styleUrl`, matching the existing root component convention.
- Keep page-only styles in their page CSS files; use empty CSS files where a component has no custom rules.
- Preserve the existing patch-card cascade by keeping legacy, responsive, and compact rules in their original order within the card component stylesheet.

## Tasks

- [x] Extract component and page templates.
- [x] Extract component styles and relocate browse-owned custom styles.
- [x] Build the Angular application.
- [x] Run the existing unit test suite (blocked by the pre-existing missing `Auth` test provider).
