# Daily Growth

Daily Growth เป็นเว็บแอปติดตามการเติบโตประจำวัน พร้อม Cloud Sync ผ่าน Supabase เพื่อให้ข้อมูลต่อเนื่องระหว่างคอมพิวเตอร์และมือถือ

## Features

- สมัครสมาชิกและเข้าสู่ระบบด้วย Email/Password
- รองรับ Google Login เมื่อเปิด Provider ใน Supabase
- ข้อมูลแยกตามผู้ใช้ด้วย `user_id`
- Sync ข้อมูลผ่าน Supabase Database
- To-do, Good Things, Improvements, Mood, Timeline, EXP, Level, Reason Logs
- Loading / Saving / Saved status
- Export / Import JSON สำหรับสำรองหรือย้ายข้อมูลเดิม
- Mobile First รองรับมือถือ แท็บเล็ต และเดสก์ท็อป

## Files

- `index.html` หน้าเว็บหลักและ Auth UI
- `styles.css` ระบบดีไซน์ทั้งหมด
- `app.js` Supabase client, auth, sync และ logic ของแอป
- `supabase-schema.sql` SQL สำหรับสร้างตารางและ RLS policies
- `SUPABASE_SETUP.md` คู่มือตั้งค่า Supabase และ deploy

## Local Development

เปิดผ่าน local server เช่น VS Code Live Server หรือ:

```bash
python -m http.server 4173
```

แล้วเปิด `http://localhost:4173`

## Important

ใน `app.js` ต้องแก้ค่า:

```js
const SUPABASE_URL = "https://dupafcuqsaxwkbwnhker.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7QdttccZ5yJgQwp4CtxWhQ_oIJ3zyOi";
```

ใช้เฉพาะ anon public หรือ publishable key เท่านั้น ห้ามใช้ service role key ใน frontend
