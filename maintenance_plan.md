# แผนการเพิ่มระบบ Maintenance Mode (เปิด-ปิด แมนนวลโดย Admin)

รับทราบครับ เปลี่ยนจากการใช้ cost limit อัตโนมัติ มาเป็น **หน้าจอให้ Admin สามารถกดเปิด-ปิดระบบ (Maintenance Mode)** ได้ด้วยตัวเอง แผนจะปรับเป็นดังนี้ครับ:

## 1. การจัดการสถานะ Maintenance (Database & Repository)
*   **Firebase RTDB:** เพิ่ม `maintenanceMode` (boolean `true`/`false`) ใน path `settings/maintenanceMode`
*   **สร้าง `settings.repository.ts`:**
    *   สร้าง Repository ใหม่สำหรับจัดการการตั้งค่าระบบโดยเฉพาะ
    *   มีเมธอด `readMaintenanceMode(): Promise<boolean>`
    *   มีเมธอด `setMaintenanceMode(enabled: boolean): Promise<void>` สำหรับให้ Admin บันทึกค่า

## 2. สร้างหน้าจอให้ Admin เปิด-ปิด (Admin UI)
*   **สร้าง `AdminSettingsPageComponent` (หรือ `AdminMaintenancePageComponent`):**
    *   สร้างหน้าจอ Admin ใหม่ที่มี Toggle Switch หรือ Checkbox เขียนว่า **"เปิดใช้งานโหมดปิดปรับปรุงชั่วคราว (Maintenance Mode)"**
    *   เพิ่มลิงก์เข้าหน้านี้ใน Sidebar เมนู Admin (ใต้เมนู "ค่าเซิร์ฟเวอร์เดือนนี้" ใน `app.component.html`)

## 3. ปรับปรุง AuthService เพื่อรองรับการเช็คสถานะ VIP
*   **`auth.service.ts`:**
    *   เพิ่ม Signal แจ้งสถานะว่าตรวจสอบสิทธิ์ VIP เสร็จสิ้นหรือยัง (`vipCheckComplete`)
    *   เพิ่มฟังก์ชัน `waitForVipCheck()` เพื่อให้ Guard สามารถ `await` รอจนกว่าระบบจะรู้แน่ชัดว่าผู้ใช้คนนี้เป็น VIP หรือไม่

## 4. สร้าง Router Guard สำหรับป้องกันหน้า Game List
*   **สร้าง `maintenance.guard.ts`:**
    *   ดึงค่า `maintenanceMode` จาก `SettingsRepository`
    *   **ถ้า `maintenanceMode` เป็น `true`:**
        *   รอเช็คสิทธิ์ด้วย `await authService.waitForAdminCheck()` และ `await authService.waitForVipCheck()`
        *   ถ้า `authService.isAdmin()` หรือ `authService.isVip()` เป็น `true` ให้อนุญาตผ่านเข้าหน้า Game list ได้
        *   ถ้าไม่ใช่ทั้ง Admin และ VIP จะทำการ Redirect ผู้ใช้ไปที่หน้า `/maintenance`
    *   **ถ้า `maintenanceMode` เป็น `false`:** อนุญาตให้ทุกคนผ่านได้ตามปกติ

## 5. สร้างหน้า Maintenance Page (หน้าแสดงการปิดชั่วคราว)
*   **สร้าง `MaintenancePageComponent` (`/maintenance`):**
    *   หน้าจอแจ้งเตือนผู้ใช้ทั่วไป เช่น "เว็บไซต์ปิดให้บริการชั่วคราว สามารถเข้าใช้งานได้เฉพาะ VIP"
    *   มีปุ่ม/ลิงก์ให้ล็อกอิน (เผื่อผู้ใช้มีสิทธิ์แต่ยังไม่ได้ล็อกอิน)
    *   มีปุ่ม/ลิงก์ไปหน้า `/donate` เพื่อสนับสนุนค่าเซิร์ฟเวอร์

## 6. การป้องกัน Routes
*   **`app.routes.ts`:**
    *   เพิ่ม `MaintenancePageComponent` เข้าไปใน path `/maintenance`
    *   เพิ่ม `admin-maintenance-page` ในส่วนของ Admin
    *   นำ `maintenanceGuard` ไปครอบใน `canActivate` ของหน้าที่ต้องการปิด (เช่น หน้าแรก `/`, `today`, `new`, `system`, `tag`, `rom` ฯลฯ)

---

ผมจะเริ่มดำเนินการตามแผนนี้เลยนะครับ เริ่มจากการสร้าง **หน้าจอ Admin และ Repository สำหรับเปิด-ปิด** เป็นอันดับแรก เห็นด้วยไหมครับ?
