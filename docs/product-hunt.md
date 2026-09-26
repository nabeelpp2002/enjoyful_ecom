# Enjoyful product hunt

Unknown URLs and missing products redirect to `/404`, the public game URL. `/play` also redirects there for existing links. Next.js treats a literal `/404` page as a special error page, so middleware rewrites that URL internally to `/game`; this keeps `/404` playable with HTTP 200 in production and lets the footer and sitemap link to it. The game page has a canonical URL of `/404`.

The first screen on `/404` fills the viewport and explains the wrong path. It offers only Find Joyful, which reveals the game without changing the URL, and Go home. The introduction appears again on a fresh visit or reload. The game fills the viewport without outer padding. On desktop, a fixed left rail holds square treasure cards, progress, Hint/Restart controls, and the Back to home and Shop products buttons at its bottom; the illustrated, interactive scene fills the right side. On phones, three separate 2:3 portrait illustrations fill the search area edge to edge: a beach cabana, a laundry room, and a home fragrance room. The artwork uses cover sizing to avoid side bands; scene-specific coordinates account for its crop so products and movable covers remain grounded on shelves, counters, and sand. Hint, Restart, and the target-list menu float at the scene's lower right. The menu opens a bottom sheet showing target products and progress. Home and Shop buttons with destination icons sit at the bottom of the viewport. The next level's artwork is preloaded while the current round is played.

The game uses three themes, sixteen real Enjoyful products, and ten movable prop types. Each scene has six products and six surface positions; some products appear in more than one theme. Levels require 4, then 5, then 6 finds; the three scenes and product sets cycle for later rounds, with targets and positions reshuffled. The laundry illustration includes generic detergent containers as scenery, but game targets are only products represented by real catalog photography. Correct finds earn 100 points, hinted finds 50, and completed levels 200. There is no timer or penalty for selecting a decoy. Restart resets the current run; the best score persists under `enjoyful-product-hunt-v1` in localStorage. Blocked storage falls back to memory. Scores are entertainment only, not rewards or verified leaderboard entries.

## Assets

Generated with the built-in imagegen tool, then encoded as WebP with Sharp (alpha preserved). All twelve assets are stored in the repository, with no runtime image-generation or product API dependency:

- `public/assets/game/joyful-boutique.webp` — 1536 × 1024, approximately 252 KB.
- `public/assets/game/product-atlas.webp` — 1152 × 768, approximately 100 KB, transparent 3 × 2 atlas; last cell empty.
- `public/assets/game/joyful-beach.webp` — 1536 × 1024, seaside market.
- `public/assets/game/joyful-bathroom.webp` — 1536 × 1024, family bathroom.
- `public/assets/game/product-atlas-2.webp` — 1152 × 768, transparent cutouts for five new products.
- `public/assets/game/product-atlas-3.webp` — 1152 × 768, transparent cutouts for five more products.
- `public/assets/game/cover-props.webp` — 1152 × 768, transparent illustrations of five movable foreground props.
- `public/assets/game/joyful-beach-mobile.webp` — 1024 × 1536, beach cabana for phones.
- `public/assets/game/joyful-laundry-mobile.webp` — 1024 × 1536, laundry room with generic detergent scenery for phones.
- `public/assets/game/joyful-home-mobile.webp` — 1024 × 1536, home fragrance room for phones.
- `public/assets/game/cover-props-2.webp` — 1536 × 1024, transparent atlas with five more movable props.
- `public/assets/game/midnight-velvet.webp` — 1254 × 1254, transparent cutout of the real Midnight Velvet catalog photo.

Scene prompt:

> Use case: illustration-story. Asset type: hidden-object browser game background. Create a polished charming hand-painted cartoon self-care boutique interior, front-facing dollhouse composition, warm cream, sage green, muted lavender and honey wood palette. Landscape 3:2 image. Three broad wooden shelves spanning the image at roughly 30%, 57%, and 85% height, with open counter surfaces for placing clickable skincare product cutouts later. Cozy arched window, trailing plants, folded towels, baskets, seashell, hairbrush, flowers, ceramic bowls, small books, fruit, candles as scattered decorative objects. Moderately detailed but legible on a phone. Keep space distributed evenly across all three rows for products. Warm daylight, soft shadows, sophisticated storybook illustration, inviting playful mood. No text, no letters, no logos, no skincare bottles or tubes (these will be added in code).

Product extraction prompt:

> Use case: background-extraction. All five supplied images are edit targets. Remove backgrounds and compose the five unchanged photographic products into ONE transparent PNG sprite atlas, exact 3 columns by 2 rows of equal square cells, landscape 3:2. Each product centered in its cell, fully inside with 12% padding, same apparent height. Top row left to right: sunscreen yellow tube, Amber Glow gold mist, Baby Powder white bottle. Bottom row left to right: Aloe Bliss green bottle, Orange face wash tube, EMPTY last cell. Preserve original product silhouettes, label typography, logos, artwork, colors and proportions exactly. No redesign, no drawing. Genuinely transparent alpha background, no checkerboard, no ground shadows, no grid lines, no added text.

References under `public/assets/product-images/`: `sunscreen-50-plus/img-1-50.jpeg`, `amber-glow/img-1-250.jpeg`, `baby-powder/img-1-400.jpeg`, `aloe-bliss-shower-gel/img-1-500.jpeg`, `orange-face-wash-c-vit/img-1-60.jpeg`. Generated cutouts are game artwork; the original catalog photography remains unchanged.

## Verification

`node scripts/check-product-hunt.cjs` runs browser assertions against a running local site. It requires Playwright and its Chromium browser in the test environment. Optional environment variables: `PLAYWRIGHT_MODULE` (path to an existing Playwright module), `PLAYWRIGHT_CHROMIUM_EXECUTABLE` (existing Chromium binary), and `HUNT_TEST_URL` (defaults to http://localhost:3000). Playwright is not a production dependency.

Checks cover unknown URLs returning HTTP 404 before the browser navigates to `/404`, `/play` redirecting there, the introductory screen on desktop and mobile, Find Joyful opening the game, three distinct portrait and desktop scenes with six real product appearances each, grounded drag, tap to reveal, decoy feedback, hints, the mobile target sheet and cover sizing, levels 1–4, score bonuses, restart, persisted best after reload, a 320px viewport, canonical URL, browser exceptions, and blocked-storage fallback. Screenshots are written to `artifacts/`. Desktop and mobile layouts were also inspected visually.


## Additional generated prompts and references

Seaside market prompt (built-in imagegen):

> Use case: illustration-story. Asset type: hidden-object game background for level 2 of a self-care product hunt. Landscape 3:2. A detailed, charming, colorful hand-painted cartoon seaside picnic market on a sunny beach boardwalk: striped awning, parasol, shells, fruit crates, woven baskets, towels, beach bag, distant turquoise sea, flowers, playful small objects. Centered broad wooden market counter and two open display shelves, with clear open patches around x=45-75% at y=20%, 46%, 69% for placing five clickable product photos later. Compared with a quiet indoor boutique, visually fresh and distinct, aqua and coral palette. Rich Where's-Waldo-style scenery but readable on a phone. Do not place any product bottles or tubes. No text, letters, labels, or watermarks.

Bathroom prompt (built-in imagegen):

> Use case: illustration-story. Asset type: hidden-object game background for level 3 of a self-care product hunt. Landscape 3:2. A cozy, detailed, whimsical family bathroom and laundry room seen front-on, in a polished hand-painted cartoon style. A large mirror and bathroom cabinet near left, colorful folded towels, bathtub with bubbles, patterned tile, laundry basket, playful rubber duck, washcloth, little indoor plants, bath toys, shelves, hairbrush, soap, small framed pictures. Lavender, mint, peach and warm amber color palette. Use a long central vanity countertop and two broad open shelves or ledges across the middle and lower image, providing seven visible clear places near x=45-75% and y=20%, 46%, 69% to place clickable product bottle photos later. More lively and puzzle-like than a plain boutique, still legible on a phone. No product bottles or tubes, no text, no logos, no watermark.

The second atlas was generated in built-in imagegen background-extraction mode from `coffee-face-scrub/img-1-150.jpeg`, `lemon-face-wash-c-vit/img-1-60.jpeg`, `gentel_baby_wash/img-1-300.jpeg`, `coastal-pulse/img-1-200.jpeg`, and `morning-buzz-shower-gel/img-1-500.jpeg`. The prompt requested unchanged product packaging, 3 × 2 cells, a transparent background and an empty last cell.

The third atlas used the same prompt structure with `vanilla-aura/img-1-250.jpeg`, `walnut-face-scrub/img-1-50.jpeg`, `blossom-veil/img-1-250.jpeg`, `gentel-baby-rash-cream/img-1-200.jpeg`, and `noir-element/img-1-250.jpeg`.


Products begin partially concealed by props. Players drag props sideways along their counter or shelf; a tap also moves one aside. Vertical pointer motion cannot lift a prop away from its support. Position calculations account for the desktop crop and the contained portrait artwork on phones, keeping products and props aligned with the illustrated surfaces.

Cover prop prompt (built-in imagegen):

> Use case: stylized-concept. Asset type: movable foreground props for a hidden-object web game. Create ONE transparent PNG sprite atlas, exact 3 columns by 2 rows of equal square cells, landscape 3:2. Five separate illustrated objects, one centered and fully contained in each cell with 5% padding. Top row: a wide woven picnic basket with lid and small blue cloth, a thick stack of folded lavender and sage towels, a lush potted houseplant in terracotta. Bottom row: a small round fruit crate piled with oranges and lemons, a compact striped canvas beach tote bag, final cell completely empty. Painterly richly textured storybook cartoon illustration, warm light, clean recognizable silhouettes, front-facing 3/4 view, each object visually broad enough to conceal most of a narrow skincare tube or bottle behind it. No people, text, logos, ground plane, shadows, border, checkerboard or duplicate objects. Genuinely transparent alpha background. Keep objects separate and inside their cells.

## New portrait artwork prompts

The following prompts used the built-in imagegen mode. The second prop atlas was generated, then edited in the same mode to remove the residual tinted background while retaining its five props. Midnight Velvet used the catalog photo at `public/assets/product-images/midnight-velvet/img-1-250.jpeg` as an edit target.

Beach cabana:

> Use case: illustration-story. Asset type: portrait mobile background for an interactive hidden-product game. Create a polished, richly detailed hand-painted storybook cartoon beach cabana scene, PORTRAIT 2:3 composition (1024x1536). It should match a charming warm editorial hidden-object illustration style, with readable details on a phone. A sunny turquoise sea and pale sky visible behind an open timber beach cabana, striped parasol, seashells, woven mat, beach towels, driftwood, sunglasses, sunhat, fruit, flowers, playful beach toys. Critical game layout: THREE broad horizontal grounded support surfaces spanning the central 70% of the picture: a timber display ledge around 29% image height, a lower picnic bench/counter around 51%, and a flat dry sand picnic platform around 74%. Leave six small clear patches distributed near x=30%, 52%, 72% along the upper and middle support surfaces where clickable photographic skincare bottles will be added in code. Perspective front-on, flat support planes visible so objects can rest naturally. No people, no skincare or sunscreen bottles/tubes, no readable text, labels, logos, watermark, UI, border. Warm coral, honey, cream, sea glass aqua palette. Do not make a landscape image with extended blank top/bottom; compose all content specifically for a tall phone screen.

Laundry room:

> Use case: illustration-story. Asset type: portrait mobile background for level 2 of a hidden-product game. Generate a polished hand-painted cartoon FAMILY LAUNDRY AND BATH CARE ROOM, portrait 2:3 composition (1024x1536), rich warm storybook detail and same sophisticated cozy style as a whimsical self-care boutique. Front-on view. Warm sage cabinets, a washing machine, tumble dryer, open shelves of folded linens, wicker laundry baskets, soft towels, soap bubbles, clothespins, little plants, wooden stool. Include several unmistakable illustrated UNBRANDED colorful laundry detergent jugs and powder boxes as environmental clutter on upper shelves (these are scenery, not real brand products); no readable text or logos. Critical gameplay composition: broad stable horizontal folding counter at y~30%, two open shelf ledges at y~52% and y~73%, with six visible patches around x=30%, 50%, 72% to add separate clickable photographic product cutouts later. Natural realistic gravity and grounded objects, no floating props. Moderately busy but legible at phone size. Peach, mint, pale lilac, honey wood light. No people, no branded skincare bottles, no words, labels, UI, borders, watermark. Compose naturally for a tall phone screen, no blank bands.

Home fragrance room:

> Use case: illustration-story. Asset type: portrait mobile background for level 3 of a hidden-product game. Generate a polished hand-painted cartoon COZY HOME FRAGRANCE AND DRESSING ROOM, portrait 2:3 composition (1024x1536), rich whimsical storybook detail matching a warm premium self-care boutique. Front-on view. Arch window with evening garden glow, dressing mirror, vanity, a low bookcase, textiles, cushions, framed artwork, flowers, candles, vases, jewelry dish, houseplants. Include a few tiny illustrated generic perfume silhouettes among the clutter as decoys, but NO large branded perfume bottles; photographic real perfume cutouts will be added in code. Critical gameplay composition: three broad physically plausible horizontal grounded surfaces across central 70% at y~29%, 51%, and 73%: an elegant vanity top, open display shelf, and sideboard; leave six clear patches near x=30%,50%,72% to insert clickable bottles. Warm plum, cream, soft amber, sage colors; detailed but readable at phone size. No people, no logos, readable text, UI, border, watermark. Compose specifically for a tall phone screen without blank bands.

Second movable-prop atlas:

> Use case: stylized-concept. Asset type: transparent movable foreground prop atlas for a portrait hidden-object game. Create ONE genuinely transparent PNG sprite sheet, exact 3 equal columns by 2 equal rows, landscape 3:2. Five independent richly textured hand-painted storybook cartoon objects, each centered in its own square cell with at least 8% clear padding; bottom-right cell completely empty. Top row left to right: wide woven straw sunhat with ribbon resting flat, small painted beach bucket filled with shells, lidded wicker laundry hamper with soft towel peeking out. Bottom row left to right: broad tidy stack of folded patterned quilts with wooden clothespins, plush plum velvet throw cushion with tassels, empty cell. Front-facing slight 3/4 perspective, naturally grounded broad silhouettes capable of partly hiding narrow product bottles, same warm premium illustrative style as the existing game, no legs or floating pieces. NO text, logo, labels, duplicate objects, shadow plane, white background, checkerboard, grid lines or border. Preserve true alpha outside every object.

Midnight Velvet catalog cutout:

> Use case: background-extraction. Input image is the edit target: a real Enjoyful Life Midnight Velvet body mist catalog photo. Remove ONLY the white studio background and soft floor shadow. Keep the bottle, clear cap, burgundy packaging, tiny brand marks, label text, colors, silhouette and proportions exactly unchanged. Center the original photographic bottle upright within a transparent square PNG with about 12% empty transparent padding. Do not redraw, retype, recolor, stylize, enlarge the label, add a shadow, add text or any other object. Genuinely transparent alpha, no white fill or checkerboard.

