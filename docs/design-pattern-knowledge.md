# Design Pattern & UI/UX Knowledge Guide (ROM Collector)

เอกสารรวบรวมแบบแผนการออกแบบ (Design Patterns), สถาปัตยกรรม UI/UX, โครงสร้าง CSS Theme และแนวทางการเขียนโค้ดที่ถูกต้องสำหรับโปรเจกต์ **ROM Collector (THAI ROM DB)**

---

## 1. App Shell & Layout Grid Pattern

### 1.1 โครงสร้าง 3 คอลัมน์ (CSS Grid)
โครงสร้างหลักของเว็บไซต์ใน `web/src/app/app.component.html` จัดวางด้วย CSS Grid ดังนี้:

- **Desktop (≥ 1200px):**
  - คอลัมน์ที่ 1: `max-content` (Left Navigation Rail: `.retro-rail`)
  - คอลัมน์ที่ 2: `minmax(0, 1fr)` (Center Content Area: `.app-content`)
  - คอลัมน์ที่ 3: `288px` (Right Ad Sidebar: `.right-ad-sidebar`)
- **Tablet (769px - 1199px):** 2 คอลัมน์ (`max-content minmax(0, 1fr)`) ซ่อนแถบโฆษณาด้านขวา
- **Mobile (≤ 768px):** คอลัมน์เดียว เมนูเปลี่ยนเป็น Drawer/Off-canvas

### 1.2 การป้องกัน Content ทะลุ / ล้นทับ Sidebar (Overflow Prevention)
เมื่อหน้าจอคอมพิวเตอร์อยู่ในช่วง 1200px - 1450px คอลัมน์กลางจะมีพื้นที่เหลือประมาณ 600px - 750px ซึ่งแคบกว่าปกติ

**ข้อกำหนดที่ต้องปฏิบัติตามสำหรับทุกหน้า:**
1. **Container `.app-content`:**
   - ต้องมี `min-width: 0;` และ `overflow-x: clip;` (หรือ `overflow-x: hidden;`) เพื่อกักไม่ให้เนื้อหาภายในดันคอลัมน์หลุดออกนอก Grid
2. **Page Component Host (`:host`):**
   ```css
   :host {
     display: block;
     width: 100%;
     max-width: 100%;
     min-width: 0;
     box-sizing: border-box;
   }
   ```
3. **Hero Header / Page Title:**
   - คำภาษาไทยขนาดยาว (เช่น `รายการสนับสนุน`, `จัดการเครื่องเกม`) ไม่ตัดช่องว่างอัตโนมัติ หากตั้งขนาดฟอนต์ใหญ่เกินไป (เช่น `6vw`) จะมีความกว้างเกินพื้นที่คอลัมน์กลาง
   - ต้องใช้ `overflow-wrap: break-word;` และ `word-break: break-word;` เสมอ
   - ขนาดฟอนต์ `h1` แนะนำให้ใช้ `clamp(1.75rem, 4vw, 3.25rem)`

---

## 2. Multi-Theme Token Architecture

โปรเจกต์รองรับ 2 ธีมหลัก คือ **Blue Neon Theme (Default)** และ **Pocket-Pet Theme (LCD / Retro Handheld)** ผ่านการสลับ `data-theme` บน `<body>`

### 2.1 CSS Variables ห้ามฮาร์ดโค้ดสี (Semantic Color Tokens)
ห้ามใช้ Tailwind utility class ที่เป็นสีคงที่ (เช่น `bg-slate-800`, `text-pink-600`, `bg-white`) ในหน้าของระบบ เพราะจะทำให้การแสดงผลพังเมื่อเปลี่ยนธีม ให้ใช้ CSS Variables เสมอ:

| CSS Variable | ความหมาย / การใช้งาน | ตัวอย่างการใช้ |
|---|---|---|
| `--color-surface` | สีพื้นหลังหลักของหน้าเว็บ / Header | `background: var(--color-surface);` |
| `--color-surface-light` | สีพื้นหลังการ์ด / กล่องคอนเทนต์ | `background: var(--color-surface-light);` |
| `--color-border` | เส้นขอบของหน้าต่าง / การ์ด / เส้นแบ่ง | `border: 1px solid var(--color-border);` |
| `--color-text` | สีตัวอักษรหลัก (High Contrast) | `color: var(--color-text);` |
| `--color-text-muted` | สีตัวอักษรรอง / วันที่ / คำอธิบายย่อย | `color: var(--color-text-muted);` |
| `--color-brand` | สีแบรนด์หลัก (ชมพู Neon / น้ำตาล LCD) | สีไอคอนหัวใจ, Badge สำคัญ |
| `--color-highlight` | สีไฮไลต์เด่น (เหลือง Neon / น้ำตาลเข้ม) | ยอดเงิน, ข้อความหัวข้อเด่น |
| `--color-accent` | สีเน้นย้ำ (เขียวชาร์ตรูส / สีทอง) | ขอบปุ่ม active, ปุ่ม action สำคัญ |
| `--color-shadow` | เงา Retro Pixel Shadow (เงาทึบ 0 blur) | `box-shadow: 4px 4px 0 var(--color-shadow);` |

---

## 3. Retro & Windows 95/Arcade Component Patterns

### 3.1 Hero Banner Pattern
ใช้ในหน้าเนื้อหาหลัก เช่น Donate, Redeem, Donations:
```html
<section class="donations-hero">
  <div class="hero-copy">
    <p class="eyebrow">Category / English Title</p>
    <h1>หัวข้อภาษาไทย<br><span>ENGLISH / HIGHLIGHT</span></h1>
    <p class="hero-description">คำอธิบายรายละเอียดแบบย่อ...</p>
  </div>
  <div class="hero-mark" aria-hidden="true">♥</div>
</section>
```
- `.hero-mark` คือสัญลักษณ์ Watermark จางๆ ด้านหลัง (`opacity: 0.15`) เช่น `♥` หรือ `★`
- มีเส้นกั้นล่าง `border-bottom: 1px solid var(--color-border);`

### 3.2 Retro Window & Card Pattern
ทุกการ์ดบนหน้าจอจะใช้ขอบทึบและเงาสไตล์ 90s Pixel Art:
```css
.card {
  background: var(--color-surface-light);
  border: 1px solid var(--color-border);
  box-shadow: 4px 4px 0 var(--color-shadow);
  max-width: 100%;
  box-sizing: border-box;
}
```

### 3.3 Retro Tabs Pattern (Accessible Tabs)
การสลับแท็บต้องรองรับ Accessibility (ARIA Roles) และมี Touch Target ไม่ต่ำกว่า 42-44px:
```html
<div class="tab-switcher" role="tablist" aria-label="เลือกหมวดหมู่">
  <button
    type="button"
    class="tab-btn"
    role="tab"
    [attr.aria-selected]="activeTab === 'current'"
    [class.tab-btn--active]="activeTab === 'current'"
    (click)="selectTab('current')">
    <span>เดือนนี้</span>
    <span class="tab-count-badge" [attr.aria-label]="count + ' รายการ'">{{ count }}</span>
  </button>
</div>
```

---

## 4. Typography & Font Compatibility Rules

### 4.1 Middle Dot Character Incompatibility
> [!WARNING]
> ฟอนต์ประจำโปรเจกต์ (`RD Chulajaruek`) **ไม่รองรับตัวอักษร Middle Dot (`·`)** จะแสดงผลเป็นสี่เหลี่ยมหรือเครื่องหมายคำถาม ให้ใช้เครื่องหมายขีดคั่น `-` หรือเว้นวรรคแทนเสมอ เช่น:
> - **ผิด:** `25 ก.ย. 2569 · 12:00 น.`
> - **ถูก:** `25 ก.ย. 2569 - 12:00 น.`

### 4.2 Full-Space Page Standard
ทุกหน้าที่สร้างใหม่ต้องครอบคลุมพื้นที่ความสูงและกว้างทั้งหมดของคอนเทนต์กลาง:
```css
.page-container {
  min-height: calc(100vh - 2.5rem);
  display: flex;
  flex-direction: column;
}
```

---

## 5. Security & Data Architecture Pattern: Dual-Write Pattern

### 5.1 ปัญหาของ Firebase Realtime Database
Firebase RTDB **ไม่รองรับ Field-level security rules** หากเปิดสิทธิ์ Read ให้สาธารณะในโหนดใด ผู้ใช้จะสามารถเข้าถึง Key (รหัสโค้ดลับ) และทุกฟิลด์ในโหนดนั้นได้

### 5.2 วิธีแก้ปัญหา (Dual-Write Projection Pattern)
เมื่อแอดมินสร้างโค้ดหรือทำธุรกรรมที่มีความลับ (เช่น โค้ดเติมเงิน VIP):
1. **Private Node (`redeemCodes/{code}`):** เก็บข้อมูลโค้ดลับพร้อมสิทธิ์เฉพาะ Admin หรือเจ้าของ UID เท่านั้น
2. **Public Projected Node (`donations/{randomPushId}`):** บันทึกเฉพาะข้อมูลที่ไม่เป็นความลับ ได้แก่ `amount` และ `donatedAt` โดยใช้ Random ID เพื่อไม่ให้สามารถเดาหรือย้อนกลับไปหารหัสลับได้
3. **Admin Sync Mechanism:** มีฟังก์ชัน `syncDonations()` ในฝั่งแอดมิน เพื่อทำ Projection ย้อนหลังสำหรับข้อมูลเดิมที่มีอยู่

---

## 6. Angular Budget Optimization Pattern

`angular.json` ของโปรเจกต์ตั้งข้อจำกัดขนาด Component Style ไว้เข้มงวด:
- `maximumWarning`: `3kb`
- `maximumError`: `6kb`

**วิธีจัดระเบียบสไตล์เพื่อไม่ให้เกิน Budget:**
1. **ใช้ Tailwind สำหรับ Layout & Spacing:** Utility classes เช่น `flex`, `gap-3`, `p-4`, `min-w-0`, `flex-wrap` จะถูกรวมใน Global Stylesheet และถูก Purge ขนาดไฟล์ ทำให้ไม่นับรวมใน Component Style Budget
2. **ใช้ Component CSS เฉพาะ Tokens & Custom Rules:** เก็บเฉพาะตัวแปร CSS Variables, Hero Keyframes, Media Query เฉพาะส่วน, และ Retro Shadow เพื่อให้ไฟล์ `.component.css` มีขนาดเล็ก (< 3kB)
