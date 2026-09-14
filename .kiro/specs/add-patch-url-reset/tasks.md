# Implementation Plan

## Overview

แก้ไข `AdminPatchPageComponent` ให้ navigate URL กลับไปที่ `/add-patch` หลังบันทึกแพตช์สำเร็จในโหมดแก้ไข โดยใช้ `preserveFormOnNextLoad` flag เพื่อป้องกัน `loadEditRecord` ล้างค่า `system`/`translatorId` ที่ `save()` เก็บไว้

## Tasks

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 0, "tasks": ["1", "2"] },
    { "wave": 1, "tasks": ["3.1"] },
    { "wave": 2, "tasks": ["3.2"] },
    { "wave": 3, "tasks": ["3.3"] },
    { "wave": 4, "tasks": ["3.4", "3.5"] },
    { "wave": 5, "tasks": ["4"] }
  ]
}
```

## Notes

- ไฟล์เดียวที่แก้ไข: `web/src/app/pages/admin-patch-page.component.ts`
- ไม่มีการเปลี่ยน template, routing config หรือ service อื่น ๆ
- Task 1 และ 2 ต้องทำ **ก่อน** implement fix เพื่อ observe พฤติกรรม unfixed code
- Task 1 ต้อง FAIL บน unfixed code (ยืนยันว่า bug มีอยู่จริง)
- Task 2 ต้อง PASS บน unfixed code (ยืนยัน baseline behavior)

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - URL Not Reset After Save in Edit Mode
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case - any non-null patch ID (editId != null) when save() completes successfully
  - Set up `AdminPatchPageComponent` in test bed with a spy on `router.navigate`
  - Set `component.editId` to a non-null patch ID (e.g., `'patch-abc123'`) to simulate edit mode
  - Fill form with valid values and call `save()`
  - Assert that `router.navigate(['/add-patch'], { replaceUrl: true })` was called (from Bug Condition: `isBugCondition` = editId IS NOT NULL AND saveJustCompleted = true)
  - Assert that `component.editId` is null after save completes
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (router.navigate was not called and editId remains non-null - this proves the bug exists)
  - Document counterexamples found (e.g., "router.navigate not called; editId still 'patch-abc123' after save")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Edit-Mode Behaviors Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for all non-buggy inputs (cases where `isBugCondition` returns false)
  - Observe: `save()` in add-new mode (editId = null) does NOT call `router.navigate` - URL stays at `/add-patch`
  - Observe: `save()` in add-new mode resets form, clears cover, scrolls to top, shows success toast
  - Observe: `confirmDelete()` calls `router.navigateByUrl('/', { replaceUrl: true })`
  - Observe: `loadEditRecord('some-id')` when `preserveFormOnNextLoad` is false loads patch data into form
  - Write property-based test: for all valid patch IDs, save() in add-new mode (editId = null) never calls router.navigate (from Preservation Requirements - add-new mode save behavior unchanged)
  - Write property-based test: for all valid patch IDs, confirmDelete() always navigates to '/'
  - Write test: loadEditRecord with a valid ID and preserveFormOnNextLoad=false populates the form correctly
  - Verify all tests PASS on UNFIXED code (baseline behavior confirmed)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 2.3, 3.1, 3.2, 3.3_

- [x] 3. Fix URL not reset after save in edit mode

  - [x] 3.1 Add `preserveFormOnNextLoad` private field to `AdminPatchPageComponent`
    - Add `private preserveFormOnNextLoad = false;` as a class field
    - Place alongside other private fields (near `existingCoverUrl` and `editLoadRequest`)
    - _Bug_Condition: isBugCondition(state) where state.editId IS NOT NULL AND state.saveJustCompleted = true_
    - _Expected_Behavior: After save in edit mode, URL SHALL be '/add-patch' and editId SHALL be null_
    - _Preservation: No change to add-new mode, delete, or load behaviors_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Update `save()` to navigate URL and set flag when saving in edit mode
    - After `window.scrollTo({ top: 0, behavior: 'smooth' })` inside the `try` block, add:
      ```ts
      if (this.editId) {
        this.preserveFormOnNextLoad = true;
        await this.router.navigate(['/add-patch'], { replaceUrl: true });
      }
      this.editId = null;
      ```
    - `this.editId = null` MUST be placed after the navigate call so the guard in `loadEditRecord` sees the flag correctly
    - When editId is null (add-new mode) the new block is skipped entirely - no change to existing behavior
    - _Bug_Condition: isBugCondition(state) where state.editId IS NOT NULL_
    - _Expected_Behavior: router.navigate(['/add-patch'], { replaceUrl: true }) called; editId set to null_
    - _Preservation: save() in add-new mode (editId = null) skips the new block completely_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Update `loadEditRecord()` to return early when `preserveFormOnNextLoad` is true
    - Add guard at the very top of `loadEditRecord`, before any existing code:
      ```ts
      if (this.preserveFormOnNextLoad) {
        this.preserveFormOnNextLoad = false;
        this.editId = null;
        return;
      }
      ```
    - This prevents `loadEditRecord(null)` (triggered by paramMap emitting after navigate) from resetting the form values (`system`, `translatorId`, `patchTool`) that `save()` already preserved
    - The flag is reset to false immediately so subsequent navigations are not affected
    - _Bug_Condition: preserveFormOnNextLoad = true when loadEditRecord is called after save in edit mode_
    - _Expected_Behavior: form.value.system and form.value.translatorId remain unchanged; flag reset to false_
    - _Preservation: loadEditRecord with preserveFormOnNextLoad=false proceeds normally for all existing cases_
    - _Requirements: 2.2, 3.3_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - URL Reset After Save in Edit Mode
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (router.navigate called, editId null after save)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Edit-Mode Behaviors Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run all preservation property tests from step 2
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
    - Confirm save in add-new mode still does not navigate, delete still navigates to '/', and loadEditRecord still loads patch data for non-flag cases
    - _Requirements: 2.3, 3.1, 3.2, 3.3_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run the full unit test suite for `admin-patch-page.component`
  - Ensure all tests pass; ask the user if any questions arise
  - Confirm no regressions in unrelated component tests
