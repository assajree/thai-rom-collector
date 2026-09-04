# Requirements — Thai Game Patch Database

> Status: **Phase 1 complete — ready for design.**
> Source: `requirement.txt`

## Overview

Build a public, static single-page web application that lets Thai game players discover, filter, and download Thai-translated game patches, ROM mods, and related tools. Public users can browse the repository without signing in, while approved administrators use a Google-authenticated administration area to maintain standardized translators, tags, and patch records, including optimized cover images. The application will be deployed on GitHub Pages and use Firebase Authentication, Firestore, and Cloud Storage.

## User Stories

1. As a public visitor, I want to browse a complete list of Thai game patches without signing in so that I can find available translations quickly.

2. As a public visitor, I want to search and filter patches by keyword and category tag so that I can narrow the repository to games relevant to me.

3. As a public visitor on a mobile device, I want a compact responsive patch list with a direct download action so that I can browse and download patches easily on a small screen.

4. As an administrator, I want to sign in with Google before opening the administration area so that patch-management functions are not publicly available.

5. As an administrator, I want to maintain reusable translator/team and category-tag master data from the patch-entry form so that patch records use consistent names without interrupting data entry.

6. As an administrator, I want to create and update patch entries with all required game, translation, tool, tag, and download metadata so that visitors have accurate patch information.

7. As an administrator, I want to upload or paste a cover image that is automatically resized, converted, and named before storage so that cover images are lightweight and consistently formatted.

8. As a project owner, I want public data access and administrator-only write/delete enforcement in Firebase so that the public repository remains usable while its data is protected from unauthorized changes.

9. As a public visitor, I want to sort and filter the game list by game title, translator/team, and system/platform so that I can browse the repository in the order and scope I need.

## Acceptance Criteria

### User Story 1 — Public browsing

1.1 The main public route loads without an authenticated Firebase user.

1.2 The public list displays every available patch record.

1.3 On desktop-width viewports, each patch record is shown in a structured table containing cover image, file name, game title, system/platform, translator/team, patch tool, category tags, and a download link.

1.4 Each displayed cover image uses the stored optimized image URL and is constrained to a maximum displayed dimension of 250 pixels.

1.5 Selecting a patch download link opens or downloads the URL saved for that patch record.

### User Story 2 — Search and tag filtering

2.1 A keyword search returns patches whose game title, file name, system/platform, or translator/team name matches the entered keyword, without requiring an additional database read for each keystroke.

2.2 Clearing the keyword restores all patches subject only to any active tag filter.

2.3 The public interface loads its clickable tag-filter options from the tag master collection.

2.4 Selecting a tag displays only patches associated with that tag.

2.5 Clearing or deselecting the active tag restores patches subject only to any active keyword search.

### User Story 3 — Responsive mobile browsing

3.1 At small-screen breakpoints, the desktop table is replaced with a mobile-optimized card layout.

3.2 Each mobile patch card displays the cover image, system/platform, game title, translator/team name, and an accessible download link or button.

3.3 Search and tag filtering produce the same matching records in desktop and mobile layouts.

### User Story 4 — Authenticated administration access

4.1 The public browsing routes remain accessible to signed-out visitors.

4.2 Navigating to `/add-patch` or `/login` while signed out redirects the visitor to Google sign-in or otherwise blocks access to the administration interface.

4.3 After a successful Google sign-in by an approved administrator, the route guard permits access to the administration interface.

4.4 A signed-in user who is not an approved administrator cannot create, update, or delete Firestore records or Cloud Storage assets.

### User Story 5 — Translator and tag master data

5.1 The patch-entry form loads the current translators master collection as selectable translator/team options, including each name and its optional external link.

5.2 The patch-entry form loads the current tags master collection as selectable multi-select category options.

5.3 An administrator can add a translator/team name and optional external link inline from the patch-entry form without leaving the page.

5.4 An inline-created translator is saved to the translators collection and becomes selectable in the current form immediately.

5.5 An administrator can add a tag inline from the patch-entry form without leaving the page.

5.6 An inline-created tag is saved to the tags collection and becomes selectable in the current form immediately.

5.7 New and existing patch records store standardized translator and tag values sourced from their respective master collections.

### User Story 6 — Patch management

6.1 An approved administrator can submit a patch record with file name, game title, system/platform, translator/team, patch tool, category tags, and patch-file URL.

6.2 The system/platform field accepts a supported platform value such as 3DS, GBA, NDS, or PSP.

6.3 A submitted patch record stores an auto-generated document ID, `translatorId`, denormalized `translatedBy`, an array of tag names, and the supplied metadata in the `patches` collection.

6.4 An approved administrator can update an existing patch record, and public browsing reflects the saved changes.

6.5 Invalid or incomplete required patch metadata prevents submission and identifies the fields that need correction.

### User Story 7 — Cover-image optimization

7.1 The patch-entry form accepts a cover image through a standard file input.

7.2 The patch-entry form accepts an image pasted from the clipboard using Ctrl+V while the form is active.

7.3 Before upload, the client preserves aspect ratio and resizes the image so that its width does not exceed 250 pixels; narrower images are not enlarged.

7.4 Before upload, the client converts the processed image to JPEG with compression suitable for a lightweight web payload.

7.5 The uploaded image filename follows the convention `cover_max250px_<timestamp>.png`.

7.6 After a successful upload, the patch record stores the resulting Cloud Storage download URL as `coverUrl`.

7.7 If image selection, processing, or upload fails, the form shows an understandable error and does not save an invalid cover URL.

### User Story 8 — Hosting, security, and quality

8.1 The frontend can be deployed as static assets to GitHub Pages.

8.2 Firebase Authentication is used for Google sign-in, Firestore for the translators, tags, and patches collections, and Cloud Storage for cover images.

8.3 Firestore security rules allow public read access to patch entries, translator master data, and tag master data.

8.4 Cloud Storage security rules allow public read access to published cover-image assets.

8.5 Firestore and Cloud Storage security rules allow write and delete operations only for approved administrator accounts.

8.6 The user interface adapts across desktop and mobile viewports using responsive layout behavior.

8.7 Client-side search and filtering update promptly from locally loaded application state and avoid unnecessary Firestore reads.

8.8 The visual design uses a retro 1990s–2000s gaming/web aesthetic while preserving readable controls, text, and responsive usability.

### User Story 9 — Game-list sorting and filtering

9.1 The public game list provides a sort control with game title, translator/team, and system/platform as selectable sort fields.

9.2 The public game list provides ascending and descending sort direction for the selected sort field.

9.3 Sorting by game title compares the displayed `gameTitle` values; sorting by translator/team compares `translatedBy`; and sorting by system/platform compares `system`.

9.4 The public game list provides a translator/team filter populated from the translators master collection.

9.5 Selecting a translator/team displays only patches whose `translatorId` matches the selected translator master record.

9.6 The public game list provides a system/platform filter populated from the distinct `system` values in available patch records.

9.7 Selecting a system/platform displays only patches whose `system` exactly matches the selected value.

9.8 Keyword, tag, translator/team, and system/platform filters combine using AND logic; clearing one filter leaves the other active filters unchanged.

9.9 The selected sort and all active filters produce the same visible patch records in the desktop table and mobile card layout.
