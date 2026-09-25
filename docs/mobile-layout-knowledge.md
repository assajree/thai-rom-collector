# Mobile Layout & Navigation Knowledge Guide (ROM Collector)

เอกสารรวบรวมแบบแผนและข้อควรระวังในการออกแบบและพัฒนา Layout, แถบ Header, Marquee, Sidebar และ Navigation บนหน้าจอ Mobile (หน้าจอขนาดเล็ก $\le$ 900px)

---

## 1. Multi-Tier Header Pattern (โครงสร้าง Header หลายชั้น)

### 1.1 ปัญหาของ Hardcoded `top` Offsets
เมื่อมี Header หลายแถวเรียงกัน (เช่น Topbar + Marquee ข่าวสาร) การกำหนด `position: fixed` แยกชิ้นกันโดยระบุระยะ `top: ...` (เช่น `top: 0` สำหรับแถบบน และ `top: 4rem` สำหรับแถบล่าง) **ห้ามทำโดยเด็ดขาด**
- **สาเหตุ:** หากความสูงจริงของแถบบนไม่ตรงกับตัวเลขที่เดาไว้ (เช่น Topbar สูง 2.625rem / 42px แต่ตั้งแถบล่างไว้ที่ `4rem` / 64px) จะเกิดช่องโหว่ว่างเปล่า (Gap) ขนาด 22px คั่นกลางระหว่างแถบทั้งสองทันที
- นอกจากนี้ เมื่อเกิด Text Wrap หรือผู้ใช้ปรับขนาดฟอนต์บนมือถือ ระยะ `top` ที่ฮาร์ดโค้ดไว้จะเหลื่อมล้ำหรือทับซ้อนกัน

### 1.2 โซลูชันที่ถูกต้อง (Single Container Pattern)
หุ้มทุกแถบของ Header ไว้ภายใต้คอนเทนเนอร์เดียวกัน:
```html
<header class="app-header">
  <div class="app-topbar ...">
    <!-- โลโก้, ปุ่ม Hamburger, วันที่อัปเดต -->
  </div>
  <div class="marquee ...">
    <!-- แถบข้อความวิ่ง -->
  </div>
</header>
```
และใน CSS กำหนด `position: fixed` ที่คอนเทนเนอร์แม่เท่านั้น:
```css
@media (max-width: 900px) {
  :host-context(body.sidebar-open) .app-header {
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 30;
  }
}
```
- **ผลลัพธ์:** ทั้ง Topbar และ Marquee จะไหลต่อกันตาม Flow ธรรมชาติ (Normal Document Flow) ภายใน `.app-header` ทำให้ติดกันสนิท 100% เสมอ ไม่ว่าฟอนต์หรือหน้าจอจะเปลี่ยนไปอย่างไร
- **การคำนวณความสูงรวม:** Topbar (42px) + Marquee (38px) = 80px (5rem)
  - ความสูงของ Drawer ด้านล่าง: `.retro-rail { top: 5rem; max-height: calc(100vh - 5rem); }`
  - ระยะดันเนื้อหาด้านหลัง: `:host-context(body.sidebar-open) .app-shell { padding-top: 5rem; }`
  - ความสูงขั้นต่ำของหน้าจอ: `.app-shell { min-height: calc(100vh - 5rem); }`

---

## 2. Mobile Drawer Horizontal Scrollbar Prevention (การป้องกัน Scrollbar แนวนอนใน Sidebar)

### 2.1 พฤติกรรมตามสเปกของ CSS `overflow-y`
ตามมาตรฐาน CSS Specification (W3C):
> หากกำหนด `overflow-y: auto;` หรือ `scroll;` โดยไม่ได้ระบุ `overflow-x` ตัวบราวเซอร์จะคำนวณค่า `overflow-x` เป็น `auto` โดยอัตโนมัติ (ไม่ใช่ `visible`)

ส่งผลให้หากมีคอนเทนต์ภายในกว้างเกินกล่องแม้แต่ 1px (เช่น Padding, คำยาว, หรือข้อจำกัดความกว้างจาก Desktop) จะเกิดแถบ Scrollbar แนวนอนทันที

### 2.2 โซลูชันที่ถูกต้อง
1. **ระบุ `overflow-x: hidden;` คู่เสมอ:**
   ```css
   @media (max-width: 900px) {
     .retro-rail {
       max-height: calc(100vh - 5rem);
       min-width: 0;            /* ปลด min-width: 16rem ของ Desktop */
       overflow-x: hidden;      /* ป้องกัน Scrollbar แนวนอนเด็ดขาด */
       overflow-y: auto;        /* เลื่อนเฉพาะแนวตั้ง */
       position: fixed;
       top: 5rem;
       width: min(18rem, 85vw);
       z-index: 20;
     }
   }
   ```
2. **บังคับตัดคำในปุ่มและลิงก์:**
   ```css
   .retro-rail-link,
   .retro-system-button {
     overflow-wrap: break-word;
     word-break: break-word;
   }
   ```

---

## 3. Flexbox Baseline Alignment (การจัดแนวตัวอักษรกับไอคอนในระดับเดียวกัน)

### 3.1 ปัญหาของ `align-items: center` กับ Element ต่างชนิด
ในแถวรายการที่มีทั้งปุ่มข้อความยาวและไอคอน เช่น แถวทีมแปล (`.sidebar-translator-row`):
- บน Mobile ปุ่มข้อความ (`.retro-system-button`) ถูกกำหนด `min-height: 44px;` และ `padding: 0.65rem 0.75rem;` เพื่อให้ผ่านเกณฑ์ Mobile Touch Target
- ตัวอักษรจึงถูกดันลงมาด้วย `padding-top: 0.65rem` (~10px) และอยู่ที่ครึ่งบนของกล่อง 44px
- แต่ไอคอน (เช่น ไอคอนดินสอแก้ข้อมูล หรือไอคอนโซเชียล) มีความสูงเพียง ~16px หากแถวใช้ `align-items: center;` ไอคอนจะถูกจัดไว้ตรงกึ่งกลางกล่อง 44px (ระดับ ~22px) ทำให้ไอคอนห้อยต่ำกว่าระดับตัวอักษร (~8px) ไม่เป็นระนาบเดียวกัน

### 3.2 โซลูชันที่ถูกต้อง (Baseline Alignment Pattern)
1. **กำหนด Flexbox Container ให้จัดแนวด้วย Baseline:**
   ```css
   .sidebar-translator-row {
     align-items: baseline;
     display: flex;
     gap: .35rem;
   }
   ```
2. **ตั้งค่า Wrapper ของไอคอนให้ส่งต่อ Baseline:**
   ```css
   .sidebar-translator-edit-link,
   .sidebar-translator-links,
   .sidebar-translator-links a {
     align-items: baseline;
     display: inline-flex;
     line-height: inherit;
   }
   ```
3. **รีเซ็ต `vertical-align` ของไอคอน FontAwesome:**
   FontAwesome กำหนด `vertical-align: -0.125em;` เป็นค่าเริ่มต้นสำหรับตัวละติน ในแถวที่ต้องการระนาบตรงกับฟอนต์ไทย ให้รีเซ็ตเป็น:
   ```css
   .sidebar-translator-row i {
     vertical-align: baseline;
   }
   ```
4. **กำหนด Touch Target และ Padding บน Mobile ให้สอดคล้องกัน:**
   ```css
   @media (max-width: 900px) {
     .sidebar-translator-edit-link,
     .sidebar-translator-links a {
       min-height: 44px;
       padding: 0.65rem 0.25rem;
       line-height: 1.2;
       touch-action: manipulation;
     }

     .sidebar-translator-row > .retro-system-button {
       padding-left: 0.25rem;
       padding-right: 0.25rem;
     }
   }
   ```
   - ไอคอนทั้งซ้ายและขวาจะได้ `padding-top: 0.65rem` เท่ากับข้อความ
   - ได้พื้นที่แตะสัมผัส (Touch Target) สูง 44px ครบถ้วนตามมาตรฐานมือถือ
   - เส้น Baseline ของข้อความและไอคอนทั้งหมดจะวางอยู่บนเส้นระนาบเดียวกันอย่างสมบูรณ์
