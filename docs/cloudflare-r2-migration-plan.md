# แผนการย้ายจาก Google Cloud Storage สู่ Cloudflare R2

เอกสารสรุปแผนงาน ข้อดี สถาปัตยกรรม และขั้นตอนการย้ายระบบจัดเก็บรูปภาพหน้าปก (Cover Storage) จาก Google Cloud Storage / Firebase Storage ไปยัง **Cloudflare R2** เพื่อลดค่าใช้จ่าย Network Egress ให้เป็น 0 บาท

---

## 1. ทำไมต้อง Cloudflare R2?

| หัวข้อ | Google Cloud Storage (ปัจจุบัน) | Cloudflare R2 (เป้าหมาย) |
| :--- | :--- | :--- |
| **ค่าพื้นที่จัดเก็บ (Storage)** | ฟรี 5 GB แรก (฿0.70+/GB หลังจากนั้น) | **ฟรี 10 GB แรก** |
| **ค่าดาวน์โหลดข้อมูล (Egress Bandwidth)** | คิดเงินเมื่อข้ามทวีป/เกินโควต้า (ต้นเหตุบิล ฿87+) | **ฟรี 100% ไม่จำกัด ($0 Egress)** |
| **API มาตรฐาน** | Google Cloud / Firebase SDK | **S3-compatible API** |
| **CDN / Caching** | ต้องตั้งค่า Cloud CDN เพิ่มเติม | มี Edge Caching ของ Cloudflare ในตัว |

---

## 2. สถาปัตยกรรมระบบ (Architecture)

เนื่องจาก Frontend (Angular SPA) เป็นไคลเอนต์สาธารณะ **ไม่ควรเก็บ Secret Key (R2 Access Keys)** ไว้ในโค้ดฝั่งเบราว์เซอร์ จึงแนะนำใช้สถาปัตยกรรมผ่าน **Cloudflare Worker** (ฟรี 100,000 requests/วัน):

```mermaid
flowchart TD
    subgraph Frontend["Angular Client (Admin / User)"]
        A[Admin Upload Cover]
        B[User View Web]
    end

    subgraph Cloudflare["Cloudflare Infrastructure"]
        W[Cloudflare Worker<br/>(Upload Proxy + Auth Check)]
        R2[(Cloudflare R2 Bucket<br/>'thairomdb-covers')]
        CDN[Cloudflare Public CDN / r2.dev]
    end

    A -->|POST /upload with Auth Header| W
    W -->|PutObject| R2
    R2 --> CDN
    CDN -->|GET Image| B
```

---

## 3. ขั้นตอนการดำเนินการ (Action Plan)

### เฟสที่ 1: เตรียมการบน Cloudflare Dashboard
1. **สร้าง Bucket:**
   * ล็อกอิน [Cloudflare Dashboard](https://dash.cloudflare.com) > เมนู **R2**
   * กด **Create bucket** ตั้งชื่อ เช่น `thairomdb-covers`
2. **เปิด Public Access:**
   * ไปที่ Bucket `thairomdb-covers` > แท็บ **Settings** > **Public access**
   * เปิดใช้งาน **R2.dev subdomain** หรือผูกกับ **Custom Domain** (เช่น `covers.thairomdb.com`)
   * บันทึก Public URL Base ไว้ใช้งาน เช่น `https://pub-xxxxxxxx.r2.dev`
3. **สร้าง Cloudflare Worker สำหรับเป็น Upload Proxy:**
   * ไปที่เมนู **Workers & Pages** > **Create application**
   * ผูก R2 Bucket Binding (ชื่อตัวแปร `COVERS_BUCKET`)
   * ตั้งค่า Secret Token (สำหรับตรวจสอบสิทธิ์ว่าคำขอมาจาก Admin)
   * โค้ด Worker รองรับ `PUT/POST /upload` และ `DELETE /remove`

---

### เฟสที่ 2: ปรับปรุงโค้ดโปรเจกต์ (Frontend Angular)

#### 1. อัปเดต `web/src/app/services/cover-storage.service.ts`
* แทนที่การเรียกใช้ Firebase Storage ด้วย HTTP Request ไปยัง Cloudflare Worker Endpoint:
  * **Upload:** ส่ง `FormData` หรือ `ArrayBuffer` ไปที่ Worker API
  * **Remove:** ส่งคำขอลบรูปไปยัง Worker API
  * **Backward Compatibility:** ตรวจสอบ URL เดิมของ Firebase เพื่อไม่ให้ฟังก์ชัน remove พังเมื่อเป็นรูปเก่า

```typescript
// ตัวอย่างแนวคิดการปรับ cover-storage.service.ts
@Injectable({ providedIn: 'root' })
export class CoverStorageService {
  private readonly http = inject(HttpClient);
  private readonly workerUrl = environment.r2WorkerUrl;

  async upload(patchId: string, blob: Blob, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('patchId', patchId);

    const res = await firstValueFrom(
      this.http.post<{ url: string }>(`${this.workerUrl}/upload`, formData)
    );
    return res.url;
  }

  async remove(downloadUrl: string): Promise<void> {
    if (!this.belongsToR2(downloadUrl)) return;
    await firstValueFrom(
      this.http.delete(`${this.workerUrl}/delete`, { body: { url: downloadUrl } })
    );
  }
}
```

#### 2. อัปเดต `web/src/environments/`
* เพิ่มคอนฟิก `r2WorkerUrl` และ Public Base URL สำหรับแสดงรูปภาพ

#### 3. ปรับปรุง Unit Test
* ปรับปรุง mock service ใน `web/src/app/pages/admin-patch-page.component.spec.ts` ให้สอดคล้อง

---

### เฟสที่ 3: การย้ายข้อมูลรูปภาพเดิม (Data Migration)

1. **ดาวน์โหลดรูปเดิมจาก Firebase Storage:**
   * ใช้ gsutil หรือดาวน์โหลดโฟลเดอร์ `covers/` จาก Google Cloud Storage Console
2. **อัปโหลดเข้า Cloudflare R2:**
   * ลากโฟลเดอร์ใส่ใน Cloudflare R2 Bucket ผ่านหน้า Dashboard โดยตรง หรือใช้เครื่องมือ `rclone` / S3 CLI
3. **อัปเดต URL ในฐานข้อมูล (Realtime Database / Firestore):**
   * รัน Batch Script ครั้งเดียว เพื่อแทนที่ URL เก่า:
     - จาก: `https://firebasestorage.googleapis.com/...`
     - เป็น: `https://pub-xxxx.r2.dev/covers/...`
4. **ลบไฟล์บน Google Cloud Storage:**
   * หลังจากตรวจสอบว่ารูปภาพบนเว็บเปิดติดครบถ้วน ให้ลบไฟล์ใน GCS เพื่อหยุดค่าใช้จ่ายทันที

---

## 4. ประมาณการผลลัพธ์หลังย้ายระบบ

| รายการ | ปัจจุบัน (Google Cloud) | หลังย้าย (Cloudflare R2) |
| :--- | :--- | :--- |
| **ค่าใช้จ่ายต่อเดือน** | ~฿110 / เดือน | **฿0 / เดือน** |
| **ความเสี่ยงค่าใช้จ่ายบวมจากบอท/คนโหลดเยอะ** | สูง (คิดตามปริมาณ Egress) | **ไม่มี (ฟรีค่า Egress 100%)** |
| **ความเร็วในการโหลดรูปภาพ** | ช้ากว่า (ดึงข้ามทวีปจาก US) | **เร็วขึ้นมาก (Cloudflare Edge Caching)** |
