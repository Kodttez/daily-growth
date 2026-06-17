# Supabase Setup for Daily Growth

คู่มือนี้ใช้กับเว็บ static บน GitHub Pages โดยไม่ต้องมี backend server

## 1. สร้าง Supabase Project

1. ไปที่ [Supabase](https://supabase.com)
2. สร้าง Project ใหม่
3. รอให้ Project สร้างเสร็จ
4. ไปที่ `Project Settings > API`
5. คัดลอก:
   - Project URL
   - anon public key หรือ publishable key

นำไปใส่ใน `app.js`:

```js
const SUPABASE_URL = "https://dupafcuqsaxwkbwnhker.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7QdttccZ5yJgQwp4CtxWhQ_oIJ3zyOi";
```

ห้ามใช้ `service_role` key ใน frontend เพราะ key นั้นข้าม RLS ได้

## 2. สร้างตารางและ RLS

1. ไปที่ `SQL Editor`
2. เปิดไฟล์ `supabase-schema.sql`
3. คัดลอกทั้งหมดไปวางใน SQL Editor
4. กด `Run`

โครงสร้างหลัก:

- `profiles` เก็บชื่อเล่น สถานะแก้ชื่อ EXP รวม และ Streak ล่าสุด
- `daily_entries` เก็บข้อมูลรายวัน 1 แถวต่อ 1 วันของผู้ใช้
- `reason_logs` เก็บเหตุผลการลบ เลื่อนวัน และงานที่ไม่ได้ทำ

ทุกตารางเปิด Row Level Security และใช้ policy:

```sql
(select auth.uid()) = user_id
```

เพื่อให้ผู้ใช้เห็นและแก้ได้เฉพาะข้อมูลของตัวเอง

## 3. ตั้งค่า Email Login

ไปที่ `Authentication > Providers > Email`

แนะนำ:

- เปิด Email provider
- ถ้าต้องการให้สมัครแล้วใช้งานทันที ให้ปิด Confirm email
- ถ้าต้องการความปลอดภัยมากขึ้น ให้เปิด Confirm email แล้วผู้ใช้ต้องยืนยันอีเมลก่อน

## 4. ตั้งค่า Google Login

ใน Supabase:

1. ไปที่ `Authentication > Providers > Google`
2. เปิด Google provider
3. ใส่ Client ID และ Client Secret จาก Google Cloud

ใน Google Cloud Console:

1. สร้าง OAuth Client แบบ Web application
2. Authorized JavaScript origins:

```text
https://kodttez.github.io
```

3. Authorized redirect URIs ใช้ callback URL ที่ Supabase แสดงในหน้า Google provider เช่น:

```text
https://dupafcuqsaxwkbwnhker.supabase.co/auth/v1/callback
```

ใน Supabase `Authentication > URL Configuration`:

Site URL:

```text
https://kodttez.github.io/daily-growth/
```

Redirect URLs:

```text
https://kodttez.github.io/daily-growth/
http://localhost:4173/
http://127.0.0.1:4173/
```

## 5. การทำงานของ Cloud Sync

หลัง Login:

1. แอปโหลด `profiles`, `daily_entries`, `reason_logs` ของ user คนนั้น
2. ทุกครั้งที่เพิ่ม แก้ ลบ ติ๊กงาน หรือแก้ reflection จะบันทึก Supabase ทันทีแบบ debounce สั้น ๆ
3. สถานะมุมจอจะแสดง `Loading`, `Saving`, `Saved` หรือ `Save failed`
4. เปิดบนมือถือหรือคอมด้วยบัญชีเดียวกัน ข้อมูลจะถูกโหลดจาก Supabase เหมือนกัน

## 6. ย้ายข้อมูลเดิมจาก Local Storage

ถ้ามีไฟล์ JSON ที่ Export จากเวอร์ชันเดิม:

1. Login ก่อน
2. กดปุ่ม Import
3. เลือกไฟล์ `.json`
4. ข้อมูลจะถูกแปลงและบันทึกขึ้น Supabase ของบัญชีนั้น

## 7. Deploy กลับ GitHub Pages

1. แก้ `SUPABASE_URL` และ `SUPABASE_ANON_KEY` ใน `app.js`
2. Commit ไฟล์:

```bash
git add index.html styles.css app.js README.md SUPABASE_SETUP.md supabase-schema.sql
git commit -m "Add Supabase cloud sync"
git push
```

3. ไปที่ GitHub repository
4. `Settings > Pages`
5. เลือก branch ที่ใช้ deploy เช่น `main`
6. รอ GitHub Pages build
7. เปิด:

```text
https://kodttez.github.io/daily-growth/
```

## 8. Security Checklist

- ใช้ anon public หรือ publishable key เท่านั้นใน `app.js`
- ห้ามใส่ service role key ใน GitHub
- เปิด RLS ทุกตารางแล้ว
- Policies ตรวจ `auth.uid() = user_id`
- ตั้ง Redirect URL ให้ตรงกับ GitHub Pages URL
