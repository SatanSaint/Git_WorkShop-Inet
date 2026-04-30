# postman-api-tests

แปลง Postman Collection เป็นโค้ดทดสอบ API แบบ **Vitest (TypeScript)** พร้อมรันใน VS Code

> **Convert Postman Collections to runnable Vitest API test code in VS Code**

---

## โครงสร้างโปรเจกต์ / Project Structure

```
postman-api-tests/
├── tools/
│   ├── fetch-collection.ts   # ดึง Postman Collection จาก Postman API
│   └── generate-tests.ts     # แปลง Collection JSON → ไฟล์ Vitest spec
├── tests/
│   └── (generated tests will appear here)
├── postman/
│   ├── example.collection.json   # ตัวอย่าง Collection
│   └── collection.json           # Collection จริง (ไม่ถูก commit)
├── .env.example      # template สำหรับ env vars
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## ขั้นตอนการใช้งาน / Step-by-Step Guide

### ขั้นที่ 1 – ติดตั้ง dependencies

```bash
cd postman-api-tests
npm install
```

---

### ขั้นที่ 2 – ตั้งค่า environment variables

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
BASE_URL=https://your-api.example.com   # URL ของ API ที่จะทดสอบ
TOKEN=your-bearer-token                  # Bearer token (ถ้ามี)
POSTMAN_API_KEY=your-postman-api-key     # จาก Postman Settings → API keys
WORKSPACE_ID=9f554d95-7dd6-415f-a35d-dcc24e35a09b
COLLECTION_UID=                          # ระบุถ้าทราบแล้ว (ไม่จำเป็น)
```

> **⚠️ อย่า commit ไฟล์ `.env`** — ไฟล์นี้อยู่ใน `.gitignore` แล้ว

---

### ขั้นที่ 3 – เตรียม Postman Collection

**ตัวเลือก A: ดึงจาก Postman API อัตโนมัติ**

ต้องมี `POSTMAN_API_KEY` และ `WORKSPACE_ID` ใน `.env`

```bash
# โหลดค่าจาก .env แล้วรัน
export $(cat .env | grep -v '^#' | xargs)
npm run fetch
```

ไฟล์จะถูกบันทึกที่ `postman/collection.json`

**ตัวเลือก B: วางไฟล์เอง**

1. เปิด Postman → เลือก Collection
2. คลิก `...` → **Export** → เลือก **Collection v2.1**
3. บันทึกไฟล์ที่ดาวน์โหลดมาเป็น `postman/collection.json`

---

### ขั้นที่ 4 – Generate test code

```bash
npm run generate
```

หรือทำขั้น 3A + 4 ในคำสั่งเดียว:

```bash
npm run fetch:generate
```

ไฟล์เทสจะถูกสร้างที่ `tests/generated.api.spec.ts`

---

### ขั้นที่ 5 – รันทดสอบ

```bash
# โหลดค่าจาก .env แล้วรัน
export $(cat .env | grep -v '^#' | xargs)
npm test
```

หรือระบุค่าตรง:

```bash
BASE_URL="https://your-api.example.com" TOKEN="your-token" npm test
```

ดูผลแบบ watch mode (สะดวกตอน dev):

```bash
BASE_URL="https://your-api.example.com" npm run test:watch
```

---

## npm Scripts

| คำสั่ง | คำอธิบาย |
|--------|-----------|
| `npm run fetch` | ดึง Collection จาก Postman API → `postman/collection.json` |
| `npm run generate` | แปลง Collection → `tests/generated.api.spec.ts` |
| `npm run fetch:generate` | รัน fetch แล้ว generate ต่อกัน |
| `npm test` | รัน Vitest ครั้งเดียว |
| `npm run test:watch` | รัน Vitest แบบ watch mode |

---

## Environment Variables

| ตัวแปร | จำเป็น | คำอธิบาย |
|--------|---------|-----------|
| `BASE_URL` | ✅ (เวลารันเทส) | Base URL ของ API |
| `TOKEN` | ❌ | Bearer token สำหรับ `Authorization` header |
| `POSTMAN_API_KEY` | ✅ (เวลา fetch) | API key จาก Postman |
| `WORKSPACE_ID` | ✅ (เวลา fetch ถ้าไม่มี COLLECTION_UID) | Workspace UUID |
| `COLLECTION_UID` | ❌ | Collection UID (ข้ามขั้นดึง workspace ได้) |

---

## ปรับแต่ง assertions / Customizing Tests

Generated test ตั้งต้นด้วย:

```typescript
expect(res.status).toBeLessThan(500);
```

ปรับได้ตามต้องการ เช่น:

```typescript
// ตรวจสอบ status code
expect(res.status).toBe(200);

// ตรวจสอบ response body
expect(res.data).toHaveProperty("id");
expect(res.data.name).toBe("Alice");

// ตรวจสอบ header
expect(res.headers["content-type"]).toContain("application/json");
```

---

## ตัวอย่าง Collection / Example

ดูตัวอย่าง Postman Collection ได้ที่ `postman/example.collection.json`  
ทดลอง generate จากตัวอย่าง:

```bash
npx tsx tools/generate-tests.ts postman/example.collection.json tests/example.api.spec.ts
```

---

## Requirements

- Node.js ≥ 18
- npm ≥ 9
- (Optional) Postman account + API key สำหรับ fetch อัตโนมัติ
