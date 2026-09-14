# Design: Add-Patch URL Reset After Save

## Overview

แก้ไข `AdminPatchPageComponent` เพื่อให้เมื่อบันทึกแพตช์สำเร็จในโหมดแก้ไข (`/add-patch/:id`) URL ถูก navigate กลับไปที่ `/add-patch` โดยฟอร์มยังคง `translatorId`, `system` และ `patchTool` ไว้เหมือนเดิม

บั๊กเกิดจากการที่ `save()` reset ฟอร์มกลับมาเป็นโหมดเพิ่มใหม่ แต่ไม่ได้ navigate URL ออกจาก `/add-patch/:id` ทำให้ `editId` ยังคงมีค่า ส่งผลให้ UI แสดงปุ่ม "ลบแพตช์" และหัวข้อ "แก้ไขแพตช์เกม" ต่อไป ทั้งที่ฟอร์มอยู่ในสถานะเพิ่มใหม่แล้ว

แนวทางแก้ไขใช้ `preserveFormOnNextLoad` flag เพื่อให้ `loadEditRecord` ไม่ reset ฟอร์มซ้ำเมื่อ navigation ทำให้ paramMap emit ค่าใหม่

## Glossary

- **Bug_Condition (C)**: เงื่อนไขที่ทำให้บั๊กเกิด - ผู้ใช้บันทึกแพตช์สำเร็จในขณะที่ `editId` มีค่า (อยู่ใน edit mode)
- **Property (P)**: พฤติกรรมที่ถูกต้อง - หลังบันทึกสำเร็จใน edit mode URL SHALL เป็น `/add-patch` และ `editId` SHALL เป็น null
- **Preservation**: พฤติกรรมเดิมที่ต้องไม่เปลี่ยน - การบันทึกใน add-new mode, การลบแพตช์, การโหลดข้อมูลสำหรับแก้ไข
- **AdminPatchPageComponent**: Component ใน `web/src/app/pages/admin-patch-page.component.ts` ที่ดูแลทั้ง add-new mode (`/add-patch`) และ edit mode (`/add-patch/:id`)
- **editId**: Property ของ component ที่เก็บ ID ของแพตช์ที่กำลังแก้ไข; เป็น `null` ใน add-new mode
- **loadEditRecord(id)**: Method ที่ถูกเรียกเมื่อ `paramMap` emit ค่าใหม่ ทำหน้าที่ reset form และโหลดข้อมูลจาก Firestore
- **preserveFormOnNextLoad**: Flag ชั่วคราวที่บอก `loadEditRecord` ว่าอย่า reset form เพราะ `save()` ได้ reset ไว้แล้วพร้อม translator/system

## Bug Details

### Bug Condition

บั๊กเกิดขึ้นเมื่อผู้ใช้บันทึกแพตช์สำเร็จในขณะที่อยู่ใน edit mode (`/add-patch/:id`) `save()` reset ฟอร์มแต่ไม่ navigate URL ทำให้ `editId` ยังคงมีค่าและ UI ยังแสดงสถานะแก้ไขอยู่

**Formal Specification:**

```
FUNCTION isBugCondition(componentState)
  INPUT: componentState ของ AdminPatchPageComponent
  OUTPUT: boolean

  RETURN componentState.editId IS NOT NULL
         AND componentState.saveJustCompleted = true
         AND componentState.currentUrl ENDS_WITH ('/' + componentState.editId)
END FUNCTION
```

### Examples

- **บั๊ก 1**: เปิด `/add-patch/abc123` แล้วบันทึกสำเร็จ - URL ยังเป็น `/add-patch/abc123`, ปุ่ม "ลบแพตช์" ยังแสดง, หัวข้อยังเป็น "แก้ไขแพตช์เกม" ทั้งที่ฟอร์มถูก reset เป็นโหมดเพิ่มใหม่แล้ว
- **บั๊ก 2**: หลัง reset ฟอร์มใน edit mode ถ้ากดบันทึกอีกครั้ง ระบบจะพยายาม update แพตช์เดิมแทนที่จะ create ใหม่ เพราะ `editId` ยังมีค่า
- **พฤติกรรมที่ถูกต้อง**: เปิด `/add-patch` (add-new mode) แล้วบันทึกสำเร็จ - URL คงเป็น `/add-patch`, ไม่มีปุ่ม "ลบแพตช์", หัวข้อเป็น "เพิ่มแพตช์เกม"
- **Edge case**: ถ้าบันทึกสำเร็จแล้ว navigate ทำให้ `loadEditRecord(null)` ถูกเรียก ต้องไม่ reset ฟอร์มทับค่า `system`/`translatorId` ที่ save() เก็บไว้

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- การบันทึกใน add-new mode (`/add-patch`) ต้องทำงานเหมือนเดิมทุกประการ - reset ฟอร์ม, clear cover, scroll กลับ top, แสดง success toast
- การลบแพตช์ต้องยัง navigate ไปที่ `/` ตามเดิม
- การเปิด `/add-patch/:id` ต้องยังโหลดข้อมูลแพตช์มาแสดงในฟอร์มตามเดิม
- Mouse click และ keyboard input อื่น ๆ บน form ต้องทำงานตามเดิม

**Scope:**
ทุก input ที่ไม่ใช่ "บันทึกสำเร็จใน edit mode" ต้องไม่ได้รับผลกระทบจาก fix นี้ รวมถึง:
- การบันทึกใน add-new mode (`editId === null`)
- การลบแพตช์
- การนำทางเข้า `/add-patch/:id` เพื่อแก้ไข
- การยกเลิกหรือออกจากหน้าโดยไม่บันทึก

## Hypothesized Root Cause

จากการวิเคราะห์ซอร์สโค้ดของ `AdminPatchPageComponent`:

1. **`save()` ไม่ navigate URL หลังบันทึกสำเร็จใน edit mode**: ใน `try` block ของ `save()` มีการ reset form พร้อมเก็บ `system`/`translatorId` ไว้ แต่ไม่มีการเรียก `router.navigate(['/add-patch'])` เลย ทำให้ URL ยังคงเป็น `/add-patch/:id`

2. **`editId` ถูก clear หลัง save แต่ไม่มีผลกับ URL**: ปัจจุบันไม่มีการ clear `editId` ใน `save()` เลย (ดู source code) ทำให้ `editId` ยังคงมีค่าตลอด

3. **`loadEditRecord` จะ reset form ซ้ำเมื่อ navigate**: เมื่อ navigate ไป `/add-patch` แล้ว `paramMap` จะ emit `id=null` ทำให้ `loadEditRecord(null)` ถูกเรียก ซึ่งจะ reset form ทั้งหมดรวมถึง `system` และ `translatorId` ที่ `save()` เก็บไว้ - ต้องแก้ด้วย flag

4. **Template binding กับ `editId`**: ปุ่ม "ลบแพตช์" และหัวข้อหน้า bind กับ `editId` โดยตรง ดังนั้นเมื่อ `editId` ยังมีค่า UI ก็ยังแสดงสถานะ edit mode

## Correctness Properties

Property 1: Bug Condition - URL Reset After Save in Edit Mode

_For any_ component state where `isBugCondition` returns true (user saves successfully while `editId` is not null), the fixed `save()` function SHALL navigate to `/add-patch` using `replaceUrl: true`, resulting in `editId` becoming null and the URL no longer containing the patch ID.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Add-New Mode Save Behavior Unchanged

_For any_ component state where `isBugCondition` returns false (editId is null when saving, or any non-save operation), the fixed code SHALL produce exactly the same behavior as the original code, preserving form reset, cover clear, scroll-to-top, success toast, delete navigation, and edit record loading behavior.

**Validates: Requirements 2.3, 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

**File**: `web/src/app/pages/admin-patch-page.component.ts`

**Specific Changes**:

1. **เพิ่ม field `preserveFormOnNextLoad`**: เพิ่ม private field ใหม่ในชั้นเรียน

   ```ts
   private preserveFormOnNextLoad = false;
   ```

2. **แก้ `save()` - เพิ่ม navigate หลัง scrollTo**: ท้ายสุดของ `try` block ใน `save()` ต่อจาก `window.scrollTo(...)` เพิ่ม:

   ```ts
   // ท้ายสุดของ try block ใน save() ต่อจาก window.scrollTo(...)
   if (this.editId) {
     this.preserveFormOnNextLoad = true;
     await this.router.navigate(['/add-patch'], { replaceUrl: true });
   }
   this.editId = null;
   ```

   หมายเหตุ: `this.editId = null` ต้องทำหลัง navigate เพื่อให้ guard ใน `loadEditRecord` ทำงานถูกต้อง

3. **แก้ `loadEditRecord()` - เพิ่ม guard สำหรับ flag**: เพิ่มที่ต้นของ method ก่อนโค้ดเดิม:

   ```ts
   private async loadEditRecord(id: string | null): Promise<void> {
     if (this.preserveFormOnNextLoad) {
       this.preserveFormOnNextLoad = false;
       this.editId = null;
       return; // form ถูก reset พร้อม translator/system ไว้แล้วใน save()
     }
     // ... โค้ดเดิมทั้งหมด
   }
   ```

4. **ไม่มีการเปลี่ยนแปลง**: template, routing config, service อื่น ๆ ไม่ต้องแก้ไข

### Execution Flow After Fix

```
save() ใน edit mode (/add-patch/:id)
  ├── form.reset({ system, translatorId, patchTool, ... })   <- เก็บค่าทั้งหมดไว้
  ├── window.scrollTo({ top: 0, behavior: 'smooth' })
  ├── preserveFormOnNextLoad = true
  ├── router.navigate(['/add-patch'], { replaceUrl: true })
  │     └── paramMap emits id=null
  │           └── loadEditRecord(null) ถูกเรียก
  │                 └── preserveFormOnNextLoad=true
  │                       └── flag=false, editId=null, return ทันที (ไม่ reset form)
  └── editId = null  (set อีกครั้งเพื่อความแน่ใจ)
```

```
save() ใน add-new mode (/add-patch)
  ├── form.reset({ system, translatorId, patchTool, ... })
  ├── window.scrollTo({ top: 0, behavior: 'smooth' })
  └── editId ยังเป็น null -> ไม่ navigate, ไม่ set flag  (พฤติกรรมเดิม)
```

## Testing Strategy

### Validation Approach

กลยุทธ์การทดสอบใช้แนวทางสองขั้นตอน: ขั้นแรกสังเกตพฤติกรรมบั๊กบนโค้ดที่ยังไม่ได้แก้ไข จากนั้นตรวจสอบว่า fix ทำงานถูกต้องและไม่ทำให้เกิด regression

### Exploratory Bug Condition Checking

**Goal**: แสดงให้เห็นบั๊กบนโค้ดที่ยังไม่ได้แก้ไข ยืนยันหรือหักล้าง root cause analysis

**Test Plan**: เขียน unit test ที่จำลอง `save()` สำเร็จใน edit mode แล้วตรวจสอบว่า `editId` และ URL ยังมีค่าเดิม รัน test บนโค้ด unfixed เพื่อ observe failure

**Test Cases**:
1. **Save in Edit Mode - URL Not Reset**: จำลอง save สำเร็จใน `/add-patch/:id` แล้ว assert ว่า `router.navigate` ไม่ถูกเรียก (will fail on unfixed code ถ้า test ตรวจ navigate call) หรือ assert ว่า `editId` ยังมีค่าหลัง save
2. **editId Not Cleared**: ตรวจสอบว่า `editId` ยังคงมีค่าหลัง `save()` เสร็จสิ้นบนโค้ด unfixed
3. **Delete Button Still Visible**: ตรวจสอบ template binding ว่าปุ่มลบยังแสดงเมื่อ `editId` ไม่ถูก clear

**Expected Counterexamples**:
- `router.navigate` ไม่ถูกเรียกหลัง save สำเร็จใน edit mode
- `editId` ยังคงมีค่าหลัง save สำเร็จ ทำให้ปุ่มลบยังแสดงผล

### Fix Checking

**Goal**: ตรวจสอบว่าสำหรับทุก input ที่ bug condition เป็นจริง fixed function ให้ผลที่ถูกต้อง

**Pseudocode:**

```
FOR ALL componentState WHERE isBugCondition(componentState) DO
  result := save_fixed(componentState)
  ASSERT router.navigate(['/add-patch'], { replaceUrl: true }) WAS CALLED
  ASSERT componentState.editId = null AFTER navigate
  ASSERT componentState.form.value.system = savedSystem
  ASSERT componentState.form.value.translatorId = savedTranslatorId
END FOR
```

### Preservation Checking

**Goal**: ตรวจสอบว่าสำหรับทุก input ที่ bug condition ไม่เป็นจริง fixed function ให้ผลเหมือนเดิม

**Pseudocode:**

```
FOR ALL componentState WHERE NOT isBugCondition(componentState) DO
  ASSERT save_original(componentState) BEHAVIOR = save_fixed(componentState) BEHAVIOR
END FOR
```

**Testing Approach**: Property-based testing เหมาะสำหรับ preservation checking เพราะ:
- Generate test cases จำนวนมากอัตโนมัติ
- ครอบคลุม edge cases ที่ manual test อาจพลาด
- ให้ความมั่นใจว่าพฤติกรรมไม่เปลี่ยนสำหรับทุก non-buggy input

**Test Cases**:
1. **Add-New Mode Save Preservation**: ตรวจสอบว่า save ใน `/add-patch` (editId=null) ไม่มีการเรียก `router.navigate` และฟอร์ม reset ตามเดิม
2. **Delete Navigation Preservation**: ตรวจสอบว่า `confirmDelete()` ยังคง navigate ไปที่ `/` ตามเดิม
3. **Edit Record Loading Preservation**: ตรวจสอบว่าการเปิด `/add-patch/:id` ยังโหลดข้อมูลมาแสดงในฟอร์มตามเดิม
4. **Form Values Preserved After Edit Save**: ตรวจสอบว่า `system` และ `translatorId` ยังคงมีค่าหลัง navigate กลับมาที่ `/add-patch`

### Unit Tests

- ทดสอบ `save()` ใน edit mode: ต้องเรียก `router.navigate(['/add-patch'], { replaceUrl: true })`
- ทดสอบ `save()` ใน add-new mode: ต้องไม่เรียก `router.navigate`
- ทดสอบ `loadEditRecord()` เมื่อ `preserveFormOnNextLoad=true`: ต้อง return ทันทีโดยไม่ reset form
- ทดสอบ `loadEditRecord()` เมื่อ `preserveFormOnNextLoad=false` และ `id=null`: ต้อง reset form ตามเดิม
- ทดสอบ edge case: `preserveFormOnNextLoad` ถูก reset กลับเป็น `false` หลังจาก `loadEditRecord` ใช้งาน

### Property-Based Tests

- Generate random patch IDs และตรวจสอบว่า save ใน edit mode (editId != null) เรียก navigate เสมอ
- Generate random form states และตรวจสอบว่า `system`/`translatorId` ถูกเก็บไว้ใน form หลัง save ใน edit mode
- ตรวจสอบว่า `preserveFormOnNextLoad` เป็น `false` เสมอหลัง `loadEditRecord` ทำงานเสร็จ ไม่ว่าจะ path ไหน

### Integration Tests

- ทดสอบ full flow: เปิด `/add-patch/:id`, แก้ไข, บันทึก, ตรวจสอบว่า URL เปลี่ยนเป็น `/add-patch` และ UI แสดงโหมดเพิ่มใหม่ (ไม่มีปุ่มลบ)
- ทดสอบว่าหลัง save ใน edit mode แล้วบันทึกใหม่อีกครั้ง ระบบ create แพตช์ใหม่ ไม่ใช่ update แพตช์เดิม
- ทดสอบว่า `system` และ `translatorId` ยังคงมีค่าใน form หลัง navigate กลับที่ `/add-patch`
