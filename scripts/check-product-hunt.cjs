const BASE = process.env.HUNT_TEST_URL || "http://localhost:3000";
/* eslint-disable @typescript-eslint/no-require-imports -- This standalone Node check intentionally uses CommonJS. */
require("node:fs").mkdirSync("artifacts", { recursive: true });
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(BASE + "/hunt-404-verification", {
      waitUntil: "domcontentloaded",
    });
    // Next dev can return 200 for this redirect; the production build returns 404.
    assert.ok([200, 404].includes(response.status()));
    await page.waitForURL(/\/404$/);
    assert.match(page.url(), /\/404$/);
    await page.getByRole("heading", { name: /Wrong turn.*Find a little joy/i }).waitFor();
    assert.equal(await page.locator("ul li").count(), 0);
    assert.equal(await page.getByRole("link", { name: "Go home" }).getAttribute("href"), "/");
    await page.getByRole("button", { name: "Find Joyful" }).click();
    const targets = await page.locator("ul li").allTextContents();
    assert.equal(targets.length, 4);
    assert.match(
      await page.locator("[data-scene-artwork]").getAttribute("style"),
      /joyful-beach/,
    );
    const names = [
      "Sunshine SPF 50+",
      "Orange Face Wash",
      "Lemon Face Wash",
      "Coastal Pulse",
      "Aloe Bliss",
      "Coffee Face Scrub",
    ];
    async function revealAndSelect(targetPage, name) {
      await targetPage
        .getByRole("button", {
          name: `Move the object hiding ${name}`,
          exact: true,
        })
        .click();
      await targetPage
        .getByRole("button", { name: `Select ${name}`, exact: true })
        .click();
    }
    const decoy = names.find((n) => !targets.includes(n));
    await page
      .getByRole("button", {
        name: `Move the object hiding ${decoy}`,
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: `Select ${decoy}`,
        exact: true,
      })
      .click();
    assert.match(
      await page.getByRole("status").textContent(),
      /not on this round/,
    );
    const draggable = page.getByRole("button", {
      name: `Move the object hiding ${targets[0]}`,
      exact: true,
    });
    const beforeDrag = await draggable.boundingBox();
    assert.ok(beforeDrag);
    await page.mouse.move(
      beforeDrag.x + beforeDrag.width / 2,
      beforeDrag.y + beforeDrag.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      beforeDrag.x + beforeDrag.width / 2 + 85,
      beforeDrag.y + beforeDrag.height / 2 - 50,
      { steps: 8 },
    );
    await page.mouse.up();
    assert.equal(await draggable.getAttribute("aria-pressed"), "true");
    const afterDrag = await draggable.boundingBox();
    assert.ok(afterDrag);
    assert.ok(
      Math.abs(
        beforeDrag.y + beforeDrag.height - (afterDrag.y + afterDrag.height),
      ) < 20,
      "the prop stays on its support surface",
    );
    await page
      .getByRole("button", { name: `Select ${targets[0]}`, exact: true })
      .click();
    await page.setViewportSize({ width: 320, height: 740 });
    assert.match(
      await page.locator("[data-mobile-scene-artwork]").getAttribute("style"),
      /joyful-beach-mobile/,
    );
    assert.equal(
      await page.locator("[data-mobile-scene-artwork]").evaluate((node) => getComputedStyle(node).backgroundSize),
      "cover",
    );
    await page.getByRole("button", { name: "Open treasure list" }).click();
    const targetDialog = page.getByRole("dialog", { name: "Products to find" });
    assert.equal(await targetDialog.locator("li").count(), 4);
    await targetDialog.press("Escape");
    await targetDialog.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Hint", exact: true }).click();
    for (const name of targets.slice(1)) await revealAndSelect(page, name);
    await page.getByRole("button", { name: "Next level" }).waitFor();
    await page.waitForFunction(
      () => localStorage.getItem("enjoyful-product-hunt-v1") === "550",
    );
    await page.getByRole("button", { name: "Next level" }).click();
    assert.equal(await page.locator("ul li").count(), 5);
    assert.match(
      await page.locator("[data-mobile-scene-artwork]").getAttribute("style"),
      /joyful-laundry-mobile/,
    );
    await page.setViewportSize({ width: 1280, height: 1000 });
    assert.match(
      await page.locator("[data-scene-artwork]").getAttribute("style"),
      /joyful-bathroom/,
    );
    assert.deepEqual(await page.locator('[aria-label^="Select "]').count(), 6);
    assert.equal(
      await page
        .getByRole("button", { name: "Select Sunshine SPF 50+", exact: true })
        .count(),
      0,
    );
    await page.screenshot({
      path: "artifacts/product-hunt-laundry.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 740 });
    for (const name of await page.locator("ul li").allTextContents())
      await revealAndSelect(page, name);
    await page.getByRole("button", { name: "Next level" }).click();
    assert.equal(await page.locator("ul li").count(), 6);
    assert.match(
      await page.locator("[data-mobile-scene-artwork]").getAttribute("style"),
      /joyful-home-mobile/,
    );
    await page.setViewportSize({ width: 1280, height: 1000 });
    assert.match(
      await page.locator("[data-scene-artwork]").getAttribute("style"),
      /joyful-boutique/,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Select Coffee Face Scrub", exact: true })
        .count(),
      0,
    );
    await page.screenshot({
      path: "artifacts/product-hunt-fragrance.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 740 });
    const artwork = await page.locator("[data-mobile-scene-artwork]").boundingBox();
    const searchScene = await page.locator('[aria-label^="Search the"]').boundingBox();
    assert.ok(artwork);
    assert.ok(searchScene);
    assert.ok(Math.abs(searchScene.height - artwork.height) < 1);
    assert.equal(
      await page.locator("[data-mobile-scene-artwork]").evaluate((node) => getComputedStyle(node).backgroundSize),
      "cover",
    );
    await page.screenshot({
      path: "artifacts/product-hunt-mobile-play.png",
      fullPage: true,
    });
    for (const name of await page.locator("ul li").allTextContents())
      await revealAndSelect(page, name);
    await page.waitForFunction(
      () => localStorage.getItem("enjoyful-product-hunt-v1") === "2050",
    );
    await page.screenshot({
      path: "artifacts/product-hunt-mobile-complete.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Next level" }).click();
    assert.equal(await page.locator("ul li").count(), 6);
    await page.getByRole("button", { name: "Restart game" }).click();
    assert.equal(await page.locator("ul li").count(), 4);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Find Joyful" }).click();
    await page.waitForFunction(() =>
      document.body.textContent.includes("Best 2050"),
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const play = await page.goto(BASE + "/play", {
      waitUntil: "domcontentloaded",
    });
    assert.equal(play.status(), 200);
    assert.match(page.url(), /\/404$/);
    await page.getByRole("button", { name: "Find Joyful" }).waitFor();
    assert.equal(
      await page.locator("link[rel=canonical]").getAttribute("href"),
      "https://www.enjoyfullife.com/404",
    );
    assert.deepEqual(errors, []);
    const blocked = await browser.newPage();
    await blocked.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("blocked");
      };
      Storage.prototype.setItem = () => {
        throw new Error("blocked");
      };
    });
    await blocked.goto(BASE + "/storage-blocked-hunt", {
      waitUntil: "domcontentloaded",
    });
    await blocked.waitForURL(/\/404$/);
    assert.match(blocked.url(), /\/404$/);
    await blocked.getByRole("button", { name: "Find Joyful" }).click();
    for (const name of await blocked.locator("ul li").allTextContents())
      await revealAndSelect(blocked, name);
    await blocked.getByRole("button", { name: "Next level" }).waitFor();
    const mobileIntro = await browser.newPage({ viewport: { width: 320, height: 568 } });
    await mobileIntro.goto(BASE + "/404", { waitUntil: "domcontentloaded" });
    await mobileIntro.getByRole("button", { name: "Find Joyful" }).waitFor();
    await mobileIntro.getByRole("link", { name: "Go home" }).waitFor();
    assert.equal(await mobileIntro.locator("ul li").count(), 0);
    assert.equal(await mobileIntro.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await mobileIntro.screenshot({ path: "artifacts/product-hunt-mobile-intro.png" });
    console.log(
      "PASS: intro to game on /404, three portrait and three desktop scenes, six real products per scene, grounded drag, tap to reveal, decoys, hints, levels 1–4, completion bonus, restart, persisted best after reload, 320px layout, canonical, no browser exceptions, storage blocked fallback.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
