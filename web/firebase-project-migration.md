# คู่มือย้าย Rom Collector ไปยัง Firebase Project ใหม่

เอกสารนี้อธิบายขั้นตอนการย้ายโปรเจกต์ Rom Collector จาก Firebase project เดิมไปยัง project ใหม่ โดยครอบคลุม Angular Hosting, Firestore, Storage และ Google Authentication

## ข้อมูลที่ต้องเตรียม

- Firebase project ID ของ project ใหม่
- สิทธิ์เข้าถึง Firebase project เดิมและ project ใหม่
- บัญชี Google ที่จะใช้เป็นผู้ดูแลระบบ
- Firebase CLI ที่ติดตั้งและ login แล้ว

ตรวจสอบการ login:

```powershell
firebase login
firebase projects:list
```

## 1. สร้างและตั้งค่า Firebase project ใหม่

ใน [Firebase Console](https://console.firebase.google.com/) ให้สร้าง project ใหม่ แล้วเปิดใช้งานบริการต่อไปนี้:

- Firestore Database
- Storage
- Authentication
- Hosting

ใน Authentication ให้เปิดใช้งาน Google sign-in provider

จากนั้นเพิ่ม Web App ใน project ใหม่ และบันทึก Firebase Web configuration ที่ได้มา

## 2. เปลี่ยน Firebase Web configuration

แก้ไฟล์:

```text
web/src/environments/environment.ts
```

เปลี่ยนค่าภายใน `firebase` ให้เป็นค่าของ project ใหม่:

```ts
firebase: {
  apiKey: "NEW_API_KEY",
  authDomain: "NEW_PROJECT_ID.firebaseapp.com",
  projectId: "NEW_PROJECT_ID",
  storageBucket: "NEW_STORAGE_BUCKET",
  messagingSenderId: "NEW_MESSAGING_SENDER_ID",
  appId: "NEW_APP_ID",
}
```

Firebase Web API key เป็นค่าที่ใช้ใน client ได้ การควบคุมสิทธิ์ต้องทำผ่าน Authentication และ Firebase Rules ห้ามนำ service-account private key มาใส่ในไฟล์ frontend

## 3. เปลี่ยน Firebase CLI project alias

ไฟล์ปัจจุบันคือ:

```text
.firebaserc
```

แก้ค่า project ID จาก project เดิมเป็น project ใหม่ เช่น:

```json
{
  "projects": {
    "rom_db": "NEW_PROJECT_ID"
  }
}
```

หรือใช้คำสั่ง:

```powershell
firebase use --add
```

เลือก project ใหม่และตั้ง alias เป็น `rom_db` จากนั้นตรวจสอบ:

```powershell
firebase use
firebase projects:list
```

ต้องตรวจสอบให้แน่ใจว่าคำสั่ง deploy ต่อจากนี้ชี้ไปยัง project ใหม่จริง

## 4. Deploy Firestore และ Storage Rules

โปรเจกต์มี Rules อยู่ที่:

- `firestore.rules`
- `storage.rules`

Deploy Rules:

```powershell
firebase deploy --project rom_db --only firestore:rules,storage
```

หรือใช้สคริปต์ที่มีอยู่:

```powershell
web\_deploy_firestore_rule.bat
web\_deploy_storage_rule.bat
```

หากต้องตั้งค่า CORS ให้กับ Storage ด้วย ให้รัน:

```powershell
web\_deploy_storage_cors.bat
```

ควรตรวจสอบ Rules ใน Firebase Console ก่อนเปิดใช้งาน production

## 5. ย้ายข้อมูล Firestore

### วิธีแนะนำ: ใช้หน้า Admin ของโปรเจกต์

โปรเจกต์มีหน้าโอนย้ายข้อมูลที่ route:

```text
/admin/firestore-data
```

ขั้นตอน:

1. Deploy หรือเปิดใช้งานเวอร์ชันที่ยังเชื่อมต่อ project เดิม
2. Login ด้วยบัญชี Admin
3. เข้า `/admin/firestore-data`
4. Export ข้อมูลเป็นไฟล์ JSON
5. เก็บไฟล์ backup ไว้ในที่ปลอดภัย
6. เปลี่ยน `environment.ts` ไปยัง project ใหม่
7. Deploy เว็บใหม่
8. Login ด้วยบัญชี Admin ของ project ใหม่
9. เข้า `/admin/firestore-data`
10. Import ไฟล์ JSON

Collection หลักที่ควรตรวจสอบ:

```text
patches
systems
tags
translators
admins
```

### กรณีข้อมูลจำนวนมาก

ให้ใช้ Firestore export/import ผ่าน Google Cloud หรือเครื่องมือของ Firebase แทนการโอนผ่านหน้าเว็บ และตรวจสอบ quota กับสิทธิ์ของบัญชีที่ใช้ดำเนินการ

## 6. สร้าง Admin document ใน project ใหม่

ระบบตรวจสอบสิทธิ์ Admin จาก UID ของ Google user ใน collection:

```text
admins/{GOOGLE_USER_UID}
```

ขั้นตอน:

1. Login เข้าเว็บ project ใหม่ด้วยบัญชีที่จะเป็น Admin
2. เปิดดู UID ของ user จาก Firebase Authentication
3. สร้าง document ใน Firestore ที่ path `admins/{UID}`
4. ใส่ field ตามที่ระบบเดิมใช้งาน
5. Logout และ login ใหม่เพื่อทดสอบสิทธิ์

หากย้าย collection `admins` จาก project เดิมมาแล้ว ให้ตรวจสอบว่า UID ของผู้ดูแลยังถูกต้อง หากใช้บัญชีคนละบัญชี ต้องเพิ่ม document ด้วย UID ใหม่

## 7. ย้ายไฟล์ใน Firebase Storage

การ Export Firestore ไม่ได้ย้ายไฟล์ใน Storage ต้องดำเนินการแยกต่างหาก

แนวทาง:

- ดาวน์โหลดไฟล์จาก bucket เดิมแล้วอัปโหลดเข้า bucket ใหม่
- ใช้ Google Cloud Storage transfer สำหรับข้อมูลจำนวนมาก
- ใช้ `gsutil` หรือเครื่องมือ Cloud Storage ที่เหมาะสม

หลังย้ายไฟล์ ให้ตรวจสอบ URL รูปภาพที่เก็บใน Firestore เพราะ URL เดิมอาจยังอ้างอิง bucket ของ project เก่า หากพบว่าอ้างอิง bucket เดิม ต้องอัปเดตข้อมูลให้ชี้ไปยัง bucket ใหม่

## 8. Build และ Deploy Hosting

ติดตั้ง dependency และ build:

```powershell
cd web
npm ci
npm run build
cd ..
```

Deploy Hosting:

```powershell
firebase deploy --project rom_db --only hosting
```

หรือใช้สคริปต์:

```powershell
web\_build_web.bat
web\_deploy_web.bat
```

การตั้งค่า Hosting อยู่ใน:

```text
firebase.json
```

โปรเจกต์นี้ตั้งค่า rewrite ทุก route ไปที่ `index.html` เพื่อรองรับ Angular routing

## 9. ตั้งค่า domain และ Authentication หลัง deploy

ใน Firebase Console ของ project ใหม่:

- เพิ่ม Firebase Hosting domain ใน Authorized domains
- เพิ่ม custom domain หากมี
- ตรวจสอบ Google OAuth consent/configuration หากใช้ domain ใหม่
- ตรวจสอบว่า redirect และ popup login ทำงานบน domain ใหม่

## 10. Checklist ตรวจสอบหลังย้าย

- [ ] `environment.ts` ใช้ `projectId` ใหม่
- [ ] `.firebaserc` ชี้ไป project ใหม่
- [ ] เปิด Firestore แล้ว
- [ ] เปิด Storage แล้ว
- [ ] เปิด Google Authentication แล้ว
- [ ] Deploy Firestore Rules แล้ว
- [ ] Deploy Storage Rules แล้ว
- [ ] ย้ายข้อมูล Firestore แล้ว
- [ ] ย้ายไฟล์ Storage แล้ว
- [ ] ตรวจสอบ URL รูปภาพแล้ว
- [ ] สร้าง/ตรวจสอบ `admins/{UID}` แล้ว
- [ ] Build ผ่าน
- [ ] Deploy Hosting สำเร็จ
- [ ] Login ด้วย Google ได้
- [ ] หน้า Admin ใช้งานได้
- [ ] อ่านและเขียน Firestore ได้
- [ ] Upload และเปิดรูปภาพได้
- [ ] Refresh route ย่อย เช่น `/admin/...` ได้
- [ ] ตรวจสอบว่าไม่มีการเขียนข้อมูลเข้า project เดิม

## คำสั่งสรุปแบบย่อ

```powershell
firebase login
firebase use --add

cd web
npm ci
npm run build
cd ..

firebase deploy --project rom_db --only firestore:rules,storage
firebase deploy --project rom_db --only hosting
```

ก่อน deploy ทุกครั้งควรตรวจสอบผลลัพธ์ของ `firebase use` และ `firebase projects:list` เพื่อป้องกันการ deploy ไปยัง project เดิมโดยไม่ตั้งใจ
