import { createRequire } from "module";
import { tables } from "./mock.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW);
const [,, base, out] = process.argv;
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = Math.floor(Date.now() / 1000) + 86400 * 30;
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", role: "authenticated", exp, aud: "authenticated", email: "demo@smarterp.pk" })}.sig`;
const user = { id: "u1", aud: "authenticated", role: "authenticated", email: "demo@smarterp.pk", app_metadata: {}, user_metadata: { full_name: "Haji Noor Ahmed" }, created_at: new Date().toISOString() };
const session = { access_token: jwt, refresh_token: "r", token_type: "bearer", expires_in: 86400 * 30, expires_at: exp, user };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.25 });
await ctx.addInitScript(s => { localStorage.setItem("sb-mockproj-auth-token", s); localStorage.setItem("theme", "light"); sessionStorage.setItem(`repay-toast-${new Date().toDateString()}`, "1"); }, JSON.stringify(session));
await ctx.route("https://mockproj.supabase.co/**", async route => {
  const url = new URL(route.request().url());
  if (url.pathname.startsWith("/auth/v1/user")) return route.fulfill({ json: user });
  if (url.pathname.startsWith("/auth/v1/token")) return route.fulfill({ json: session });
  const m = url.pathname.match(/\/rest\/v1\/(\w+)/);
  if (!m) return route.fulfill({ json: {} });
  if (route.request().method() !== "GET") return route.fulfill({ status: 201, json: [] });
  let rows = tables[m[1]] || [];
  for (const [k, v] of url.searchParams) {
    if (v.startsWith("in.(")) { const ids = v.slice(4, -1).split(",").map(x => x.replace(/"/g, "")); rows = rows.filter(r => ids.includes(String(r[k]))); }
    else if (v.startsWith("eq.") && k !== "business_id") rows = rows.filter(r => String(r[k]) === v.slice(3));
  }
  const lim = url.searchParams.get("limit"); if (lim) rows = rows.slice(0, +lim);
  if ((route.request().headers()["accept"] || "").includes("vnd.pgrst.object")) return route.fulfill({ json: rows[0] ?? null });
  route.fulfill({ json: rows, headers: { "content-range": `0-${rows.length}/${rows.length}` } });
});
const page = await ctx.newPage();
page.on("pageerror", e => console.log("ERR", e.message));
const pages = (process.env.PAGES || "dashboard,sales,products,gold-rates,customers,karigars,custom-orders,repairs,reports/profit-loss,gold-purity-test").split(",");
for (const p of pages) {
  await page.goto(base + "/" + p, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  if (p === "gold-purity-test") {
    const inputs = page.locator("input");
    await inputs.nth(0).fill("22K Bridal Necklace");
    await inputs.nth(1).fill("Ayesha Khan");
    await inputs.nth(2).fill("12.500");
    await inputs.nth(3).fill("11.786");
    await page.getByRole("button", { name: /Calculate Purity/ }).click();
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: `${out}/${p.replace("/", "_")}.png`, fullPage: p === "dashboard" || p === "gold-purity-test" });
  console.log("shot", p);
}
await browser.close();
