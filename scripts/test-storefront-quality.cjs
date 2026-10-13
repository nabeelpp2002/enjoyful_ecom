/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS Node test runner. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const { NextRequest, NextResponse } = require("next/server");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function sessionRoute(proxyRequest) {
  const exports = {};
  const code = ts.transpileModule(read("src/app/api/auth/me/route.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name) => name === "next/server" ? { NextRequest, NextResponse } : { proxyRequest },
  });
  return exports.GET;
}

test("guests get a private, non-error session response without calling the backend", async () => {
  const route = sessionRoute(() => { throw new Error("Unexpected backend request"); });
  const response = await route(new NextRequest("https://example.com/api/auth/me"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("vary"), "Cookie");
  assert.equal((await response.json()).data, null);
});

test("expired sessions become guests, while valid sessions remain intact", async () => {
  for (const status of [401, 200, 503]) {
    let called = false;
    const route = sessionRoute(async (_request, routePath) => {
      called = true;
      assert.equal(routePath, "/auth/me");
      return NextResponse.json({ data: status === 200 ? { firstName: "Test" } : null }, { status });
    });
    const response = await route(new NextRequest("https://example.com/api/auth/me", {
      headers: { Cookie: "access_token=test-token" },
    }));
    assert.equal(called, true);
    assert.equal(response.status, status === 401 ? 200 : status);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    const body = await response.json();
    if (status === 200) assert.equal(body.data.firstName, "Test");
    if (status === 401) assert.equal(body.data, null);
  }
});

test("hero uses a single optimized, eager image with a breakpoint-selected source", () => {
  const hero = read("src/components/sections/StaticHeroCarousel.tsx");
  assert.equal((hero.match(/<img\b/g) || []).length, 1);
  assert.ok(hero.includes("getImageProps"));
  assert.ok(hero.includes('<source media="(min-width: 768px)"'));
  assert.ok(hero.includes('loading: "eager"'));
  assert.ok(hero.includes('fetchPriority: "high"'));
  assert.ok(!hero.includes("unoptimized"));
  assert.ok(!read("src/components/ui/ProductCard.tsx").includes("priority={index"));
});

test("llms.txt resource sections contain Markdown links and are discoverable", () => {
  const text = read("public/llms.txt");
  assert.ok(text.startsWith("# Enjoyful Life\n\n> "));
  assert.equal((text.match(/^# /gm) || []).length, 1);
  const sections = text.split(/^## /m).slice(1);
  assert.ok(sections.length >= 2);
  for (const section of sections) {
    const entries = section.split("\n").slice(1).filter(line => line.trim());
    assert.ok(entries.length > 0);
    for (const entry of entries) assert.match(entry, /^- \[[^\]]+\]\(https:\/\/[^)]+\)(?:: .+)?$/);
  }
  assert.ok(read("src/app/layout.tsx").includes('rel="describedby" href="/llms.txt"'));
});

test("updated text colors meet 4.5:1 contrast on their solid backgrounds", () => {
  function luminance(hex) {
    const rgb = hex.match(/\w\w/g).map(part => parseInt(part, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  for (const [foreground, background] of [["595959", "ffffff"], ["595959", "f5f4ef"], ["3e2118", "ef6e79"], ["3e2118", "f29a08"]]) {
    const a = luminance(foreground), b = luminance(background);
    assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5);
  }
});
