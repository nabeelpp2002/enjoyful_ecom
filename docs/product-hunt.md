# Enjoyful product hunt

Unknown URLs and missing products redirect to `/404`, the public game URL. `/play` also redirects there for existing links. Next.js treats a literal `/404` page as a special error page, so middleware rewrites that URL internally to `/game`; this keeps `/404` playable with HTTP 200 in production and lets the footer and sitemap link to it. The game page has a canonical URL of `/404`.

The first screen on `/404` fills the viewport and explains the wrong path. It offers only Find Joyful, which reveals the game without changing the URL, and Go home. The introduction appears again on a fresh visit or reload. The game fills the viewport without outer padding. On desktop, a fixed left rail holds square treasure cards, progress, Hint/Restart controls, and the Back to home and Shop products buttons at its bottom; the illustrated, interactive scene fills the right side. On narrow phones, the search scene itself has the illustration's 3:2 aspect ratio, showing the complete background with no cropped or blurred extension. Products and covers remain aligned with the artwork. The lower controls area holds a horizontally scrolling target strip, Hint/Restart controls, and shorter Home/Shop buttons at the bottom of the viewport.

The game uses three distinct illustrated scenes and fifteen real Enjoyful products. Each scene has its own set of five products and six surface positions where the products may appear. Levels require 3, then 4, then 5 finds; the three scenes and product sets cycle for later rounds, with targets and positions reshuffled. Correct finds earn 100 points, hinted finds 50, and completed levels 200. There is no timer or penalty for selecting a decoy. Restart resets the current run; the best score persists under `enjoyful-product-hunt-v1` in localStorage. Blocked storage falls back to memory. Scores are entertainment only, not rewards or verified leaderboard entries.

## Assets

Generated with the built-in imagegen tool, then encoded as WebP with Sharp (alpha preserved). All seven assets are stored in the repository, with no runtime image-generation or product API dependency:

- `public/assets/game/joyful-boutique.webp` — 1536 × 1024, approximately 252 KB.
- `public/assets/game/product-atlas.webp` — 1152 × 768, approximately 100 KB, transparent 3 × 2 atlas; last cell empty.
- `public/assets/game/joyful-beach.webp` — 1536 × 1024, seaside market.
- `public/assets/game/joyful-bathroom.webp` — 1536 × 1024, family bathroom.
- `public/assets/game/product-atlas-2.webp` — 1152 × 768, transparent cutouts for five new products.
- `public/assets/game/product-atlas-3.webp` — 1152 × 768, transparent cutouts for five more products.
- `public/assets/game/cover-props.webp` — 1152 × 768, transparent illustrations of five movable foreground props.

Scene prompt:

> Use case: illustration-story. Asset type: hidden-object browser game background. Create a polished charming hand-painted cartoon self-care boutique interior, front-facing dollhouse composition, warm cream, sage green, muted lavender and honey wood palette. Landscape 3:2 image. Three broad wooden shelves spanning the image at roughly 30%, 57%, and 85% height, with open counter surfaces for placing clickable skincare product cutouts later. Cozy arched window, trailing plants, folded towels, baskets, seashell, hairbrush, flowers, ceramic bowls, small books, fruit, candles as scattered decorative objects. Moderately detailed but legible on a phone. Keep space distributed evenly across all three rows for products. Warm daylight, soft shadows, sophisticated storybook illustration, inviting playful mood. No text, no letters, no logos, no skincare bottles or tubes (these will be added in code).

Product extraction prompt:

> Use case: background-extraction. All five supplied images are edit targets. Remove backgrounds and compose the five unchanged photographic products into ONE transparent PNG sprite atlas, exact 3 columns by 2 rows of equal square cells, landscape 3:2. Each product centered in its cell, fully inside with 12% padding, same apparent height. Top row left to right: sunscreen yellow tube, Amber Glow gold mist, Baby Powder white bottle. Bottom row left to right: Aloe Bliss green bottle, Orange face wash tube, EMPTY last cell. Preserve original product silhouettes, label typography, logos, artwork, colors and proportions exactly. No redesign, no drawing. Genuinely transparent alpha background, no checkerboard, no ground shadows, no grid lines, no added text.

References under `public/assets/product-images/`: `sunscreen-50-plus/img-1-50.jpeg`, `amber-glow/img-1-250.jpeg`, `baby-powder/img-1-400.jpeg`, `aloe-bliss-shower-gel/img-1-500.jpeg`, `orange-face-wash-c-vit/img-1-60.jpeg`. Generated cutouts are game artwork; the original catalog photography remains unchanged.

## Verification

`node scripts/check-product-hunt.cjs` runs browser assertions against a running local site. It requires Playwright and its Chromium browser in the test environment. Optional environment variables: `PLAYWRIGHT_MODULE` (path to an existing Playwright module), `PLAYWRIGHT_CHROMIUM_EXECUTABLE` (existing Chromium binary), and `HUNT_TEST_URL` (defaults to http://localhost:3000). Playwright is not a production dependency.

Checks cover unknown URLs returning HTTP 404 before the browser navigates to `/404`, `/play` redirecting there, the introductory screen on desktop and mobile, Find Joyful opening the game, three distinct scenes and product sets, grounded drag, tap to reveal, decoy feedback, hints, levels 1–4, score bonuses, restart, persisted best after reload, a 320px viewport, canonical URL, browser exceptions, and blocked-storage fallback. Screenshots are written to `artifacts/`. Desktop and mobile layouts were also inspected visually.


## Additional generated prompts and references

Seaside market prompt (built-in imagegen):

> Use case: illustration-story. Asset type: hidden-object game background for level 2 of a self-care product hunt. Landscape 3:2. A detailed, charming, colorful hand-painted cartoon seaside picnic market on a sunny beach boardwalk: striped awning, parasol, shells, fruit crates, woven baskets, towels, beach bag, distant turquoise sea, flowers, playful small objects. Centered broad wooden market counter and two open display shelves, with clear open patches around x=45-75% at y=20%, 46%, 69% for placing five clickable product photos later. Compared with a quiet indoor boutique, visually fresh and distinct, aqua and coral palette. Rich Where's-Waldo-style scenery but readable on a phone. Do not place any product bottles or tubes. No text, letters, labels, or watermarks.

Bathroom prompt (built-in imagegen):

> Use case: illustration-story. Asset type: hidden-object game background for level 3 of a self-care product hunt. Landscape 3:2. A cozy, detailed, whimsical family bathroom and laundry room seen front-on, in a polished hand-painted cartoon style. A large mirror and bathroom cabinet near left, colorful folded towels, bathtub with bubbles, patterned tile, laundry basket, playful rubber duck, washcloth, little indoor plants, bath toys, shelves, hairbrush, soap, small framed pictures. Lavender, mint, peach and warm amber color palette. Use a long central vanity countertop and two broad open shelves or ledges across the middle and lower image, providing seven visible clear places near x=45-75% and y=20%, 46%, 69% to place clickable product bottle photos later. More lively and puzzle-like than a plain boutique, still legible on a phone. No product bottles or tubes, no text, no logos, no watermark.

The second atlas was generated in built-in imagegen background-extraction mode from `coffee-face-scrub/img-1-150.jpeg`, `lemon-face-wash-c-vit/img-1-60.jpeg`, `gentel_baby_wash/img-1-300.jpeg`, `coastal-pulse/img-1-200.jpeg`, and `morning-buzz-shower-gel/img-1-500.jpeg`. The prompt requested unchanged product packaging, 3 × 2 cells, a transparent background and an empty last cell.

The third atlas used the same prompt structure with `vanilla-aura/img-1-250.jpeg`, `walnut-face-scrub/img-1-50.jpeg`, `blossom-veil/img-1-250.jpeg`, `gentel-baby-rash-cream/img-1-200.jpeg`, and `noir-element/img-1-250.jpeg`.


Products begin partially concealed by props. Players drag props sideways along their counter or shelf; a tap also moves one aside. Vertical pointer motion cannot lift a prop away from its support. The full-screen stage scales to each viewport. Position calculations account for background-image cropping, keeping products and props aligned with the illustrated surfaces on desktop and phone.

Cover prop prompt (built-in imagegen):

> Use case: stylized-concept. Asset type: movable foreground props for a hidden-object web game. Create ONE transparent PNG sprite atlas, exact 3 columns by 2 rows of equal square cells, landscape 3:2. Five separate illustrated objects, one centered and fully contained in each cell with 5% padding. Top row: a wide woven picnic basket with lid and small blue cloth, a thick stack of folded lavender and sage towels, a lush potted houseplant in terracotta. Bottom row: a small round fruit crate piled with oranges and lemons, a compact striped canvas beach tote bag, final cell completely empty. Painterly richly textured storybook cartoon illustration, warm light, clean recognizable silhouettes, front-facing 3/4 view, each object visually broad enough to conceal most of a narrow skincare tube or bottle behind it. No people, text, logos, ground plane, shadows, border, checkerboard or duplicate objects. Genuinely transparent alpha background. Keep objects separate and inside their cells.

