/**
 * fetch-collection.ts
 *
 * ดึง Postman Collection ผ่าน Postman API แล้วบันทึกเป็น postman/collection.json
 *
 * ต้องตั้ง env vars:
 *   POSTMAN_API_KEY  – API key จาก Postman (Settings → API keys)
 *   WORKSPACE_ID     – Workspace UUID เช่น 9f554d95-7dd6-415f-a35d-dcc24e35a09b
 *   COLLECTION_UID   – Collection UID (ถ้ารู้อยู่แล้ว จะข้ามขั้นตอนดึง workspace)
 *
 * วิธีรัน:
 *   npm run fetch
 *   หรือ: POSTMAN_API_KEY=xxx WORKSPACE_ID=yyy npx tsx tools/fetch-collection.ts
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const POSTMAN_API_KEY = process.env.POSTMAN_API_KEY ?? "";
const WORKSPACE_ID = process.env.WORKSPACE_ID ?? "";
const COLLECTION_UID_ENV = process.env.COLLECTION_UID ?? "";
const OUT_DIR = path.resolve("postman");
const OUT_FILE = path.join(OUT_DIR, "collection.json");

if (!POSTMAN_API_KEY) {
  console.error("❌  ต้องตั้งค่า POSTMAN_API_KEY ก่อน");
  console.error("   export POSTMAN_API_KEY='your-key-here'");
  process.exit(1);
}

function getJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      { headers: { "X-Api-Key": POSTMAN_API_KEY } },
      (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => (body += chunk.toString()));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON parse error: ${body.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function resolveCollectionUid(): Promise<string> {
  if (COLLECTION_UID_ENV) {
    console.log(`ℹ️  ใช้ COLLECTION_UID จาก env`);
    return COLLECTION_UID_ENV;
  }

  if (!WORKSPACE_ID) {
    console.error("❌  ต้องตั้งค่า WORKSPACE_ID หรือ COLLECTION_UID");
    process.exit(1);
  }

  console.log(`🔍  ดึง workspace ${WORKSPACE_ID} ...`);
  const data = (await getJson(
    `https://api.getpostman.com/workspaces/${WORKSPACE_ID}`
  )) as { workspace?: { collections?: Array<{ uid: string; name: string }> } };

  const collections = data?.workspace?.collections ?? [];
  if (collections.length === 0) {
    console.error("❌  ไม่พบ collection ใน workspace นี้");
    process.exit(1);
  }

  console.log(`📋  พบ ${collections.length} collection(s):`);
  collections.forEach((c, i) => console.log(`   [${i}] ${c.name} — uid: ${c.uid}`));

  if (collections.length === 1) {
    console.log(`✅  เลือก collection เดียวที่มีอยู่: ${collections[0].name}`);
    return collections[0].uid;
  }

  // ถ้ามีหลาย collection ให้เลือกตัวแรก แล้วแสดงคำแนะนำ
  console.warn(
    `⚠️  มีหลาย collections — ใช้ตัวแรกไปก่อน หากต้องการตัวอื่นให้ตั้ง COLLECTION_UID=<uid>`
  );
  return collections[0].uid;
}

async function main() {
  const uid = await resolveCollectionUid();

  console.log(`📥  ดึง collection ...`);
  const data = (await getJson(
    `https://api.getpostman.com/collections/${uid}`
  )) as { collection?: unknown };

  if (!data?.collection) {
    console.error("❌  ดึง collection ไม่สำเร็จ:", JSON.stringify(data));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅  บันทึกแล้วที่: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("❌  Error:", err.message ?? err);
  process.exit(1);
});
