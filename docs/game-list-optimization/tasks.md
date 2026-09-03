# Game List Optimization Tasks

> Scope update: ยกเลิก Pagination แล้ว งานที่เกี่ยวข้องกับ backend pagination และ pagination control ไม่ต้องดำเนินการต่อ

## Implementation Tasks

- [x] 1. สำรวจโครงสร้าง game list และ data source ปัจจุบัน
  - [x] 1.1 ระบุ component/page, service/API และ query ที่ใช้โหลดเกม
    - ตรวจว่าปัจจุบันโหลดข้อมูลทั้งหมดหรือมี pagination อยู่แล้ว
    - _Requirements: 1.1, 1.6_
  - [x] 1.2 ระบุ component รูปภาพและวิธีจัดการ URL/version ของรูป
    - _Requirements: 2.1, 3.1–3.4_

- [ ] 2. ปรับ API/data layer ให้รองรับ bounded pagination
  - [ ] 2.1 เพิ่ม `page`, `pageSize`, keyword, filters และ sort ใน query contract
    - ตรวจสอบและ validate ค่า page/pageSize ที่ service และ API boundary
    - _Requirements: 1.1, 1.5, 1.6_
  - [ ] 2.2 ปรับ query ให้คืนเฉพาะรายการของหน้าปัจจุบัน พร้อม `totalItems` และ `totalPages`
    - ห้ามดึงข้อมูลทั้งหมดมาแบ่งหน้าใน client
    - _Requirements: 1.1, 1.2, 1.6_
  - [ ] 2.3 ตรวจสอบ index หรือ query plan ของฟิลด์ที่ใช้ค้นหา/กรอง/เรียง โดยแก้เฉพาะเมื่อมีหลักฐานจาก schema/query plan
    - _Requirements: 1.1, 1.5_

- [ ] 3. ปรับ state และ controller ของ game list
  - [ ] 3.1 เพิ่ม query state และ state model: idle, loading, success, empty, error
    - _Requirements: 1.3, 4.1, 4.4, 4.5, 5.1, 5.2_
  - [ ] 3.2 ทำให้ request ที่เกิดจาก keyword/filter/sort รีเซ็ต `page = 1`
    - _Requirements: 1.5_
  - [ ] 3.3 ป้องกัน response เก่าทับ response ล่าสุด และป้องกัน request ซ้อนจากการกดเร็ว ๆ
    - ใช้ request id, abort signal หรือกลไกเทียบเท่าตาม stack ของโปรเจกต์
    - _Requirements: 1.3, 4.3, 5.2_
  - [ ] 3.4 เพิ่ม retry โดยใช้ query ล่าสุดและไม่ append ข้อมูลซ้ำ
    - _Requirements: 4.5, 5.3_

- [x] 4. เพิ่ม pagination control ใน UI
  - [x] 4.1 แสดงหน้าปัจจุบัน จำนวนหน้า หรือช่วงรายการจาก response
    - _Requirements: 1.2_
  - [x] 4.2 เชื่อมปุ่มก่อนหน้า/ถัดไปกับ query state และปิดปุ่มเมื่ออยู่ขอบเขต
    - _Requirements: 1.4_
  - [x] 4.3 ตรวจว่าการเปลี่ยนหน้าแทนที่รายการเดิม ไม่ append หรือปะปนรายการ
    - _Requirements: 1.3_

- [x] 5. เพิ่ม lazy loading และ fallback สำหรับรูปภาพ
  - [x] 5.1 ปรับ `GameCardImage` ให้ใช้ native lazy loading หรือ IntersectionObserver ตามความเหมาะสม
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 5.2 เพิ่ม placeholder ขนาดคงที่ก่อนรูปโหลดเสร็จ
    - _Requirements: 2.3_
  - [x] 5.3 เพิ่ม fallback เมื่อรูปโหลดไม่สำเร็จ โดยไม่กระทบข้อมูลการ์ด
    - _Requirements: 2.4, 3.5_

- [x] 6. ตั้งค่า image cache และ cache invalidation
  - [x] 6.1 ตรวจสอบ/ปรับ HTTP response headers ของ image origin หรือ CDN ให้เหมาะกับรูป immutable
    - ตัวอย่างนโยบาย: `Cache-Control: public, max-age=31536000, immutable`
    - _Requirements: 3.1, 3.2_
  - [x] 6.2 ผูก image URL กับ version/hash ที่เปลี่ยนเมื่อเนื้อหารูปเปลี่ยน
    - _Requirements: 3.3, 3.4_
  - [x] 6.3 ตรวจว่า cache failure ไม่ทำให้ game list ใช้งานไม่ได้ และไม่ใช้ localStorage เก็บ binary รูปโดยไม่จำเป็น
    - _Requirements: 3.5_

- [x] 7. เพิ่ม skeleton, empty และ error states
  - [x] 7.1 สร้าง `SkeletonGrid` ให้โครงสร้างและจำนวนใกล้เคียง game card ต่อหน้า
    - _Requirements: 4.1, 4.2_
  - [x] 7.2 แสดง/ซ่อน skeleton ตาม state และไม่เหลือ skeleton หลัง success, empty หรือ error
    - _Requirements: 4.3, 4.4, 4.5_
  - [x] 7.3 เพิ่ม `EmptyState` สำหรับไม่มีเกมและไม่พบผลลัพธ์จาก search/filter
    - _Requirements: 5.1_
  - [x] 7.4 เพิ่ม `ErrorState` พร้อม retry และป้องกันการแสดงข้อมูลเก่าเป็นผลลัพธ์ล่าสุด
    - _Requirements: 4.5, 5.2, 5.3_

- [ ] 8. Checkpoint: ตรวจสอบ integration ของ API, state และ UI
  - [ ] 8.1 ตรวจว่า contract, query state, pagination และ search/filter/sort ใช้ค่าชุดเดียวกันตั้งแต่ UI ถึง data layer
    - _Requirements: 1.2, 1.5, 1.6_
  - [ ] 8.2 ตรวจว่า error, empty, retry และ stale response ทำงานครบตาม design
    - _Requirements: 4.5, 5.1–5.3_

## Manual Verification

- [ ] 9. ตรวจ pagination ด้วยข้อมูลจำนวนมาก
  - [ ] 9.1 ตรวจ Network ว่า request แรกมี `page/pageSize` และ response ไม่ใช่ข้อมูลทั้งหมด
    - _Requirements: 1.1, 1.6_
  - [ ] 9.2 เปลี่ยนหน้าและตรวจรายการ, total pages และปุ่มขอบเขต
    - _Requirements: 1.2–1.4_
  - [ ] 9.3 ค้นหา/กรอง/เรียงจากหน้าอื่นและตรวจว่ากลับหน้า 1 พร้อมผลลัพธ์ถูกต้อง
    - _Requirements: 1.5_

- [ ] 10. ตรวจ image loading และ cache
  - [ ] 10.1 ยืนยันว่ารูปนอก viewport ยังไม่ถูกโหลดจนกว่าจะเข้าใกล้ viewport
    - _Requirements: 2.1, 2.2_
  - [ ] 10.2 ตรวจ placeholder, layout stability และ fallback รูปเสีย
    - _Requirements: 2.3, 2.4_
  - [ ] 10.3 กลับไปดูรายการเดิมและตรวจ Network ว่ารูปใช้ browser cache เมื่อเหมาะสม
    - _Requirements: 3.1, 3.2_
  - [ ] 10.4 เปลี่ยน image version/URL และตรวจว่ารูปใหม่ไม่ใช้ cache เก่า
    - _Requirements: 3.3, 3.4_

- [ ] 11. ตรวจ loading, empty และ error states
  - [ ] 11.1 ตรวจ skeleton ตอนเปิดหน้าและตอนเปลี่ยนหน้า และยืนยันว่าไม่ค้างหลังโหลดเสร็จ
    - _Requirements: 4.1–4.5_
  - [ ] 11.2 ทดสอบไม่มีข้อมูล, API error, retry และรูปโหลดไม่สำเร็จ
    - _Requirements: 2.4, 4.5, 5.1–5.3_
  - [ ] 11.3 กดเปลี่ยนหน้าซ้ำเร็ว ๆ และตรวจว่าไม่มีรายการซ้ำหรือ response เก่าทับผลลัพธ์ใหม่
    - _Requirements: 1.3, 4.3, 5.2_

- [ ] 12. วัดผลก่อนและหลังการปรับปรุงด้วย DevTools โดยใช้ข้อมูลใกล้เคียง production
  - [ ] 12.1 เปรียบเทียบเวลาโหลด จำนวนรายการใน response จำนวน image requests และเวลา render
    - _Requirements: 1.1, 2.1, 3.1, 4.4_
