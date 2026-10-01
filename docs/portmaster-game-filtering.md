# PortMaster Game Filtering & Dedicated Route

เอกสารบันทึกรายละเอียดการแยกเกม PortMaster ออกจากหน้าหลัก เพื่อรักษาธีมเกมเรโทร (Retro Games) และการสร้าง Route เฉพาะสำหรับเข้าถึงเกม PortMaster

## 1. ที่มาและความต้องการ (Background & Problem)
* **ปัญหา:** เกมของ PortMaster เป็นเกมพอร์ตสำหรับเครื่องเล่นพกพา (เช่น GTA San Andreas, Celeste ฯลฯ) ซึ่งลักษณะไม่ใช่เกมคอนโซลเรโทรแบบดั้งเดิม ทำให้การแสดงปะปนในหน้าแรก ("เกมทั้งหมด") ดูไม่เข้ากับบรรยากาศ Retro Game ของเว็บไซต์
* **ความต้องการ:**
  1. กรองเกมของ PortMaster ออกจากหน้าแรก (`/` และ `/page`)
  2. สร้างเมนูและหน้าแยกสำหรับเข้าถึงเกม PortMaster โดยเฉพาะที่ `/port`
  3. วางลิงก์ "เกม PortMaster" ไว้ที่ Sidebar ก่อนเมนู "บทสรุป" พร้อมแสดงตัวเลขจำนวนเกม
  4. ซ่อนตัวเลือก PortMaster ออกจากรายการ "ระบบเกม" ด้านล่างของ Sidebar เพื่อไม่ให้มีเมนูซ้ำซ้อน

## 2. การระบุข้อมูลเกม PortMaster (Identification)
ในฐานข้อมูล ข้อมูลระบบเกมของ PortMaster ถูกบันทึกเป็นชื่อย่อ `PORT` (และอาจมีการใช้ `PortMaster` หรือ `Port Master`) 
จึงมีการสร้างฟังก์ชันตรวจสอบแบบรวมศูนย์ที่ `web/src/app/shared/browse-route.util.ts`:

```typescript
export function isPortMasterSystem(system: string | null | undefined): boolean {
  const s = (system ?? '').trim().toLowerCase();
  return s === 'port' || s === 'portmaster' || s === 'port master';
}
```

## 3. สถาปัตยกรรมและการทำงาน (Implementation Details)

### 3.1 Routing (`web/src/app/app.routes.ts`)
* เพิ่ม Route `/port` โดยใช้ `BrowsePageComponent` ร่วมกับ `data: { browseKind: 'port' }`
* เพิ่ม `'port'` เข้าสู่ `BrowseRouteKind` ใน `browse-route.util.ts`

### 3.2 Sidebar Navigation & Counts (`web/src/app/app.component.ts`, `app.component.html`)
* **Sidebar Link:** เพิ่มเมนู `เกม PortMaster` ลิงก์ไปยัง `/port` วางไว้ก่อนลิงก์ `บทสรุป`
* **ตัวนับจำนวนเกม (`patchCounts`):**
  * `total`: นับเฉพาะเกม Retro ทั่วไป (ไม่รวมเกมที่ `isPortMasterSystem(patch.system)`) เพื่อให้ตัวเลขตรงกับหน้าแรก
  * `port`: นับเฉพาะเกมของ PortMaster (`isPortMasterSystem(patch.system)`)
* **รายการ "ระบบเกม" ด้านล่าง (`sidebarPlatforms`):**
  * กรองระบบที่เป็น PortMaster (`PORT`, `PortMaster`) ออกจากรายการระบบเกมด้านล่าง เพื่อป้องกันลิงก์ซ้ำซ้อน

### 3.3 หน้ารวมเกม (`web/src/app/pages/browse-page.component.ts`)
* **การกรองรายการเกม (`sortedPatches`):**
  * หน้าหลัก (`routeKind === null`): กรองเกมที่ `isPortMasterSystem(patch.system)` ออก
  * หน้า PortMaster (`routeKind === 'port'`): แสดงเฉพาะเกมที่ `isPortMasterSystem(patch.system)`
  * หน้าผลงานทีมแปลหรือหน้ารวมแท็ก: ยังคงแสดงผลได้ตามปกติ (กระทบน้อยที่สุด)
* **ตัวเลือกเครื่องเกมใน Dropdown (`systems`):**
  * หน้าหลัก: ตัดตัวเลือกที่เป็น PortMaster ออก
  * หน้า `/port`: มีเฉพาะตัวเลือก PortMaster
* **หัวข้อหน้า (`activeRouteLabel`):** เมื่อเข้าหน้า `/port` จะแสดงชื่อหัวข้อเป็น `เกม PortMaster`
* **การรีเซ็ตตัวกรอง (`routeFilterEffect`):** เคลียร์ค่าตัวกรองเมื่อเปลี่ยนมาที่หน้า `/port`

### 3.4 ตัวกรองเกม (`web/src/app/components/game-list-controls.component.html`)
* ในหน้า `/port` (`routeKind === 'port'`) จะซ่อนช่องตัวกรองเครื่องเกม (System Autocomplete) เนื่องจากเกมทั้งหมดในหน้านี้เป็นของ PortMaster อยู่แล้ว

## 4. ไฟล์ที่เกี่ยวข้องกับการแก้ไข
* `docs/portmaster-game-filtering.md`: เอกสารอธิบายการออกแบบและบันทึกการแก้ไข
* `web/src/app/shared/browse-route.util.ts` & `browse-route.util.spec.ts`
* `web/src/app/app.routes.ts`
* `web/src/app/app.component.ts` & `app.component.html` & `app.component.spec.ts`
* `web/src/app/pages/browse-page.component.ts` & `browse-page.component.spec.ts`
* `web/src/app/components/game-list-controls.component.html` & `game-list-controls.component.spec.ts`
