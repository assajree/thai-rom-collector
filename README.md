# RomCollector

RomCollector เป็นเว็บแอปสำหรับจัดเก็บและค้นหาข้อมูลเกม/แพตช์ โดยมี Angular เป็น frontend และใช้ Firebase เป็น backend service สำหรับ authentication, database, storage และ hosting

## How It Works

1. ผู้ใช้เปิดเว็บที่ deploy อยู่บน Firebase Hosting
2. Angular โหลดข้อมูลและจัดการหน้าจอผ่าน routes, components และ services
3. ผู้ใช้เข้าสู่ระบบผ่าน Firebase Authentication
4. ข้อมูลเกมและแพตช์ถูกอ่านหรือเขียนผ่าน Firebase/AngularFire
5. รูปภาพปกและไฟล์ที่เกี่ยวข้องจัดเก็บผ่าน Firebase Storage
6. Firestore, Realtime Database และ Storage Rules ใช้ควบคุมสิทธิ์การเข้าถึงข้อมูล

แอปเป็น Angular standalone application โดย logic ที่ใช้ร่วมกันอยู่ใน `web/src/app/shared` และการเชื่อมต่อข้อมูลหลักอยู่ใน `web/src/app/services`

## Tech Stack

- Angular 17
- TypeScript
- RxJS
- AngularFire และ Firebase JavaScript SDK
- Firebase Authentication
- Cloud Firestore และ Realtime Database
- Firebase Storage
- Firebase Hosting
- Tailwind CSS
- Font Awesome
- Angular Service Worker / PWA

## Project Structure

```text
.
├── firestore.rules          # กฎความปลอดภัยของ Firestore
├── database.rules.json      # กฎความปลอดภัยของ Realtime Database
├── storage.rules            # กฎความปลอดภัยของ Storage
├── firebase.json            # Firebase Hosting และ service configuration
├── docs/                    # เอกสาร design, requirements และ tasks
└── web/
    ├── src/app/components/  # Angular UI components
    ├── src/app/services/    # Authentication, cache และ data services
    ├── src/app/shared/      # Logic และ utilities ที่ใช้ร่วมกัน
    ├── src/environments/    # Firebase/environment configuration
    ├── scripts/             # สคริปต์ migration และ maintenance
    └── package.json         # Dependencies และคำสั่งของ frontend
```

## Development

ต้องติดตั้ง Node.js และ Firebase CLI ก่อน จากนั้นรันคำสั่ง:

```powershell
cd web
npm install
npm start
```

เปิดเว็บที่ `http://localhost:4200/`

## Build and Deploy

สร้าง production build:

```powershell
cd web
npm run build
```

สร้าง build และ deploy ไปยัง Firebase Hosting:

```powershell
cd web
npm run deploy:hosting
```

การ deploy rules ให้ใช้คำสั่ง Firebase CLI จาก root ของ repository เช่น:

```powershell
firebase deploy --only firestore:rules,database,storage
```

## Maintenance Scripts

คำสั่งเหล่านี้อยู่ใน `web/package.json`:

```powershell
npm run backfill:create-date
npm run migrate:firestore-to-rtdb
```

ควรตรวจสอบผลกระทบและ backup ข้อมูลก่อนรัน migration หรือ backfill ใน production

## Firebase Configuration

- Web Firebase configuration: `web/src/environments/environment.ts`
- Firebase project alias: `.firebaserc`
- Hosting/database/storage configuration: `firebase.json`
- คู่มือย้าย Firebase project: `web/firebase-project-migration.md`

ห้ามใส่ service-account private key ไว้ใน frontend หรือ commit secret ที่ใช้ฝั่ง server

## Documentation for Contributors and Agents

เอกสารใน `docs/` มีรายละเอียดของ feature และ design ในแต่ละงาน ส่วนกฎการทำงานของ Agent อยู่ใน `AGENTS.md`

