# Bugfix Requirements Document

## Introduction

หน้า `/add-patch` รองรับทั้งโหมดเพิ่มใหม่ (`/add-patch`) และโหมดแก้ไข (`/add-patch/:id`) ผ่าน component เดียวกัน
เมื่อบันทึกแพตช์สำเร็จในโหมดแก้ไข ระบบ clear ข้อมูลในฟอร์มแล้ว แต่ URL ยังคงเป็น `/add-patch/:id` ของเกมที่เพิ่งบันทึก
ทำให้ UI แสดงว่าอยู่ในโหมดแก้ไขรายการนั้นอยู่ (เช่น ปุ่ม "ลบแพตช์" ยังปรากฏ, หัวข้อยังเป็น "แก้ไขแพตช์เกม")
ทั้งที่ฟอร์มถูก reset กลับมาเป็นสถานะ "เพิ่มใหม่" แล้ว ซึ่งทำให้เกิดความไม่สอดคล้องระหว่าง URL กับสถานะของหน้า

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN ผู้ใช้เปิดหน้า `/add-patch/:id` แล้วบันทึกแพตช์สำเร็จ THEN ระบบ clear ฟอร์มแต่ URL ยังคงเป็น `/add-patch/:id` ทำให้ `editId` ยังมีค่าอยู่และปุ่ม "ลบแพตช์" ยังแสดงผลอยู่

1.2 WHEN ผู้ใช้เปิดหน้า `/add-patch/:id` แล้วบันทึกสำเร็จ THEN หัวข้อหน้ายังคงแสดง "แก้ไขแพตช์เกม" แม้ว่าฟอร์มจะถูก reset เป็นสถานะเพิ่มใหม่แล้ว

### Expected Behavior (Correct)

2.1 WHEN ผู้ใช้เปิดหน้า `/add-patch/:id` แล้วบันทึกแพตช์สำเร็จ THEN ระบบ SHALL navigate URL ไปที่ `/add-patch` (ไม่มี `:id`) โดยใช้ `replaceUrl: true` เพื่อให้สถานะของ URL สอดคล้องกับ state ของฟอร์มที่ reset เป็นโหมดเพิ่มใหม่

2.2 WHEN ผู้ใช้เปิดหน้า `/add-patch/:id` แล้วบันทึกแพตช์สำเร็จ THEN ระบบ SHALL คง `translatorId`, `system` และ `patchTool` (ค่า default ของ translator) ที่ reset ไว้ใน `save()` ไม่ให้ถูกล้างทิ้งจากการที่ navigate ทำให้ `loadEditRecord(null)` ถูกเรียกซ้ำ โดยใช้ `preserveFormOnNextLoad` flag เพื่อให้ `loadEditRecord` return ทันทีโดยไม่ reset form

2.3 WHEN ผู้ใช้เปิดหน้า `/add-patch` (โหมดเพิ่มใหม่) แล้วบันทึกแพตช์สำเร็จ THEN ระบบ SHALL คงอยู่ที่ `/add-patch` โดยไม่มีการเปลี่ยน URL (พฤติกรรมเดิม)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN ผู้ใช้เปิดหน้า `/add-patch` (โหมดเพิ่มใหม่) แล้วบันทึกสำเร็จ THEN ระบบ SHALL CONTINUE TO reset ฟอร์ม, clear cover, scroll กลับ top และแสดง success toast ตามเดิม

3.2 WHEN ผู้ใช้เปิดหน้า `/add-patch/:id` แล้วกดลบแพตช์สำเร็จ THEN ระบบ SHALL CONTINUE TO navigate ไปที่ `/` ตามเดิม

3.3 WHEN ผู้ใช้เปิดหน้า `/add-patch/:id` THEN ระบบ SHALL CONTINUE TO โหลดข้อมูลแพตช์มาแสดงในฟอร์มตามเดิม
