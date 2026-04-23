# Epaper Performance Improvements

## 1. Preload First Page Image
**File:** `app/epaper/view/[editionId]/page.tsx`

The server knows the first page image URL at render time via `initialData`. Without a preload hint, the browser only discovers the image after parsing the JS bundle, hydrating React, and rendering the component — 3 steps of delay. A `<link rel="preload">` tells the browser to fetch it in parallel with the JS bundle.

**Impact:** Biggest win. Page feels instant.

---

## 2. Limit Thumbnail Rendering
**File:** `components/epaper/StaticEpaperLayout.tsx`

With 20+ pages, all thumbnails hit the DOM at once. Even with `loading="lazy"`, the browser still parses, layouts, and queues them all. On slow connections this creates a burst of 20+ requests competing with the main page image. Filter to ±5 pages around current page — reduces to ~10 requests max.

**Impact:** Faster initial load on large editions.

---

## 3. Debounce Watermark Settings on Focus
**File:** `components/epaper/StaticEpaperLayout.tsx`

Every time the user alt-tabs back, `fetchWatermarkSettings` fires a full API call. A timestamp check — "was this fetched less than 60 seconds ago?" — eliminates 99% of redundant calls.

**Impact:** Reduces unnecessary API traffic.

---

## 4. Pre-warm Area Map Watermarks
**File:** `components/epaper/StaticEpaperLayout.tsx`

Currently: user clicks area → modal opens → watermark generates → image appears. Visible loading gap every time. Pre-warming runs watermark generation silently in the background after page loads, so the cache is hot before the user clicks.

**Impact:** Area maps open instantly instead of showing a loader.

---

## 5. Skip Canvas in handleFullPageClick
**File:** `components/epaper/StaticEpaperLayout.tsx`

The current code loads the image into a canvas, draws it, exports a blob URL — just to show the same image already rendered on screen. Pass `currentPageData.image_url` directly to the modal instead. Eliminates canvas allocation, blob creation, and memory cleanup overhead.

**Impact:** Full page modal opens instantly.

---

## 6. Fix isMobile Hydration Shift
**File:** `components/epaper/StaticEpaperLayout.tsx`

`isMobile` starts as `false` on the server, renders desktop layout, then flips to `true` on the client causing a full re-render and visible layout jump. Read `window.innerWidth` synchronously in the `useState` initializer so the correct value is set on the very first render.

**Impact:** Eliminates layout shift on mobile.
