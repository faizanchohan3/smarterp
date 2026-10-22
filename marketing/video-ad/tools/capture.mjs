import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW);
const [,, html, outDir, mode] = process.argv;
const fps = 30;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("file://" + html + "#capture", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
const dur = await page.evaluate(() => window.TOTAL);
const st = await page.evaluate(() => window.SCENE_STARTS);
const times = mode === "preview" ? st.map((s, i) => s + (i === 9 ? 6 : 5.5)) : Array.from({ length: fps * dur }, (_, i) => i / fps);
let i = 0;
for (const t of times) {
  await page.evaluate(t => window.seek(t), t);
  await page.screenshot({ path: `${outDir}/f${String(i++).padStart(5, "0")}.${mode === "preview" ? "png" : "jpg"}`, ...(mode === "preview" ? {} : { type: "jpeg", quality: 92 }) });
}
await browser.close();
