# Gallery & Services Image Enhancement TODO

## Steps

- [x] Step 1: Create `/api/generate-images/route.js` — DALL-E 3 image generation + Cloudinary upload
- [x] Step 2: Edit `/api/ai-genrated-website/route.js` — Add `imageKeywords` to AI response
- [x] Step 3: Edit `src/app/build-website/page.jsx` — AI image fallback when no media + better gallery/services design
  - [x] Added `aiGeneratedImages` state (Set) to track AI-generated image URLs
  - [x] Step 3.5: Calls `/api/generate-images` when `images.length === 0` after media fetch
  - [x] Gallery: threshold `> 3` → `> 0`; masonry layout (1-img featured, 2-img side-by-side, 3+ masonry grid); AI badge; photo count badge
  - [x] Services: image cycling via modulo `mediaImages[i % mediaImages.length]`; gradient accent bar; numbered badge; "Learn More" link; improved card design
- [x] Step 4: Edit `src/app/[slug]/page.jsx` — Better gallery/services design, remove >3 threshold
  - [x] Nav: Gallery link shown when `mediaImages.length >= 1` (was `> 3`)
  - [x] Gallery: max images 8 → 12; threshold `>= 1`; masonry layout with Featured badge on first image
  - [x] Services: image cycling via modulo; gradient accent bar; numbered badge; "Learn More" link; improved card design

## All Steps Complete ✅
