/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS Node test runner. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(relativePath) {
  const filename = path.resolve(root, relativePath);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    URL,
    require(specifier) {
      const dependency = specifier.startsWith("@/")
        ? path.join(root, "src", specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier);
      return load(`${dependency}.ts`);
    },
  }, { filename });
  return exports;
}

const seo = load("src/lib/product-seo.ts");
const merchant = load("src/lib/seo.ts");
const availability = load("src/lib/product-availability.ts");

test("repairs truncated imported titles, preserving valid custom titles", () => {
  assert.equal(seo.productSeoTitle("Ultra Clean Toilet Cleaner Pine", "750ml", "Ultra Clean | enJoyful L"),
    "Enjoyful Life Ultra Clean Toilet Cleaner Pine 750ml | UAE");
  assert.equal(seo.productSeoTitle("Cleaner", "750ml", "My custom title"), "My custom title");
  assert.equal(seo.productSeoTitle("Cleaner", "750ml", "Cleaner | Enjoyful Life"), "Cleaner | Enjoyful Life");
});

test("uses factual available descriptions before a nonempty fallback", () => {
  assert.equal(seo.productDescription("Cleaner", "750ml", "  ", "Pine cleaner"), "Pine cleaner");
  assert.equal(seo.productDescription("Cleaner", "750ml", "Long description", "Short description"), "Long description");
  assert.equal(seo.productDescription("Enjoyful Life Cleaner", "750ml"),
    "Enjoyful Life Cleaner, 750ml. View product details and available options.");
  assert.ok(seo.productDescription(undefined, undefined).length > 0);
});

test("shipping matches the UAE zero-charge checkout without invented courier times", () => {
  const policy = merchant.MERCHANT_SHIPPING_POLICY;
  assert.equal(policy.shippingConditions.shippingDestination.addressCountry, "AE");
  assert.equal(policy.shippingConditions.shippingRate.currency, "AED");
  assert.equal(policy.shippingConditions.shippingRate.value, 0);
  assert.equal(policy.handlingTime, undefined);
  assert.equal(policy.shippingConditions.transitTime, undefined);
  const orderService = fs.readFileSync(path.join(root, "enjoyful-api/src/modules/orders/orders.service.ts"), "utf8");
  assert.match(orderService, /const shippingCost = 0;/);
});

test("returns match the confirmed free courier pickup and no restocking fee policy", () => {
  const policy = merchant.MERCHANT_RETURN_POLICY;
  assert.equal(policy.merchantReturnDays, 14);
  assert.equal(policy.applicableCountry, "AE");
  assert.equal(policy.returnMethod, "https://schema.org/ReturnByMail");
  assert.equal(policy.returnFees, "https://schema.org/FreeReturn");
  assert.equal(policy.restockingFee.value, 0);
  assert.equal(policy.restockingFee.currency, "AED");
  assert.equal(policy.returnShippingFeesAmount, undefined);
  // The policy is expressed in business days, not schema's unqualified days.
  assert.equal(policy.refundProcessingDays, undefined);
  assert.equal(policy.merchantReturnLink, `${merchant.SITE_URL}/shipping-returns`);
});

test("offers reference the policies emitted by the storefront", () => {
  const product = fs.readFileSync(path.join(root, "src/app/(storefront)/product/[id]/layout.tsx"), "utf8");
  const storefront = fs.readFileSync(path.join(root, "src/app/(storefront)/layout.tsx"), "utf8");
  for (const policy of ["MERCHANT_SHIPPING_POLICY", "MERCHANT_RETURN_POLICY"]) {
    assert.ok(product.includes(`${policy}["@id"]`));
    assert.ok(storefront.includes(`: ${policy},`));
  }
});

test("published products are in stock without relying on or exposing a stock count", () => {
  assert.equal(availability.isStorefrontAvailable({
    isHidden: false,
    isActive: true,
    price: 6.56,
    stock: 0,
  }), true);
  assert.equal(availability.isStorefrontAvailable({ isHidden: true, isActive: true, price: 6.56 }), false);
  assert.equal(availability.isStorefrontAvailable({ isHidden: false, isActive: false, price: 6.56 }), false);
  assert.equal(availability.isStorefrontAvailable({ isHidden: false, isActive: true, price: 0 }), false);

  const badge = fs.readFileSync(path.join(root, "src/components/ui/ProductAvailability.tsx"), "utf8");
  assert.match(badge, />\s*In stock\s*</);
  assert.doesNotMatch(badge, /product\.stock|stock\s*count/i);
});
