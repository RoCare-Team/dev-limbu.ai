# User Settings & Automation — Full Technical Documentation

Scope: `src/app/user-settings/page.jsx` — iske saare APIs, save ke baad ka automation pipeline,
image/text generation, dashboard preview, aur publishing. Webhook vs cron ka clear breakdown.

---

## 1. Quick Overview

```
User → /user-settings (passkey gate)
         │
         ├── LOAD:  5 parallel GET APIs + 2 Meta pages APIs
         │
         └── SAVE:  POST /api/user-settings
                      → AutomationPlan upsert (1 per userId)
                      → PostStatus rows pre-insert (one per schedule slot)
                            │
                            ▼
          cron: /api/cron/automation-fill-queue   (har 5 min)
                      → OpenAI gpt-4o-mini        → image prompt
                      → /api/aiAssetsGenerate     → assets-image.limbutech.in/generate-ad
                                                  → S3 image URL + per-platform captions
                      → Post.aiOutput / description / status='scheduled'
                      → AiSensy WhatsApp preview
                            │
                            ▼
          dashboard: /post-management → GET /api/post-status?status=scheduled
                      (edit / approve / reject / regenerate yahin se)
                            │
                            ▼
          cron: /api/publish-scheduled            (har 5 min)
                      → stored content publish (NO regeneration)
                      → GMB / Facebook / Instagram
```

**Ek line mein:** posting **cron** se hoti hai, webhook se nahi. Image aur caption dono **ek hi
call** (`/api/aiAssetsGenerate` → n8n) se aate hain. OpenAI ka role sirf image prompt banane tak hai.

---

## 2. Page Basics — `src/app/user-settings/page.jsx`

| Cheez | Detail |
|---|---|
| Component | `AutomationSettings` (default export), `"use client"` |
| Route | `/user-settings` |
| Auth | NextAuth `useSession()` — token save ke liye |
| Gate | Passkey `USER_SETTINGS_PASSKEY = "Limbu007"` — [page.jsx:11](../src/app/user-settings/page.jsx#L11) |
| userId source | `localStorage.getItem("userId")` (format `USR_*`) |
| GMB locations | `localStorage` → `locationDetails`, `businessDetails` |

> **⚠ Passkey security note:** passkey client bundle mein plaintext hardcoded hai — koi bhi
> browser DevTools se padh sakta hai. Yeh sirf UI speed-bump hai, real access control nahi.
> Actual tenancy guard `/api/user-settings` route mein hai (session-based).

### Page state (main)

- **Platforms:** `platformGmb`, `platformFb`, `platformIg`
- **Schedule:** `frequency` (`daily` | `alternate` | `weekly` | `monthly` | `custom`),
  `startDate`, `endDate`, `skippedDates[]`, `customDates[]`
- **Timing:** `postingHour` (default 11), `postingMinute` (default 0), tz hardcoded `Asia/Kolkata`
- **Keywords:** `selectedKeywords[]` — **order matters** (drag-to-resequence; Post 1 = keyword #1)
- **Targets:** `selectedLocations[]`, `selectedFbPages[]` (pageIds), `selectedIgPages[]` (igIds)
- **Assets:** `assetInclude` — 5 image slots ka on/off toggle

### Key helper functions

| Function | Line | Kaam |
|---|---|---|
| `pickFirstNonEmpty` | [13](../src/app/user-settings/page.jsx#L13) | userData → savedImageConfig → latestAssetRow priority |
| `toDisplayableImageSrc` | [21](../src/app/user-settings/page.jsx#L21) | URL / data URL / raw base64 → `<img src>` |
| `calculatePostingSchedule` | [125](../src/app/user-settings/page.jsx#L125) | step map `{daily:1, alternate:2, weekly:7}`, skipped dates respect |
| `matchPlanDetail` | [118](../src/app/user-settings/page.jsx#L118) | subPlans.billingCycles se plan ka posts/citations |
| `handleSave` | [986](../src/app/user-settings/page.jsx#L986) | validation + POST |

---

## 3. APIs — Load Time

Saare `Promise.allSettled` se parallel — [page.jsx:773-779](../src/app/user-settings/page.jsx#L773-L779).

| # | Kaam | API | Returns | Auth? |
|---|---|---|---|---|
| 1 | User + plan | `GET /api/auth/signup?userId=` | Poora User doc (minus passwordHash) | ❌ None |
| 2 | Plan matching | `GET /api/home-data?type=subscriptionPlans` | billingCycles → posts/citations | ❌ None |
| 3 | Saved automation | `GET /api/user-settings?userId=` | automationSettings, automationStatus, savedLocations, keywordsRequired | ✅ Session |
| 4 | Keywords | `GET /api/keyword-research?userId=` | Saved keywords | ❌ None |
| 5 | Brand images | `GET /api/assets-manage?userId=` | 5 base64 asset images | ❌ None |
| 6 | FB pages | `GET /api/facebook/pages?userId=` | pages[] **+ pageAccessToken** | ❌ None |
| 7 | IG accounts | `GET /api/instagram/pages?userId=` | pages[] **+ pageAccessToken** | ❌ None |

### 3.1 `/api/auth/signup` (GET)
`src/app/api/auth/signup/route.js:259` — model `User`. Side effect: `packageExpiryDate` ko
`getEffectivePackageExpiry(user)` tak self-heal karke save karta hai ([:285-295](../src/app/api/auth/signup/route.js#L285-L295)).

### 3.2 `/api/home-data?type=subscriptionPlans`
`src/app/api/home-data/route.js:69` — model `HomeData`, `findOne({type:'subscriptionPlans'})`.
Returns `expandSubscriptionPlansForApi(...)`.
> ⚠ POST (`:14`) **koi auth nahi** — public write to homepage/pricing content.

### 3.3 `/api/user-settings` (GET)
`src/app/api/user-settings/route.js:55` — `getServerSession(authOptions)`, 401 without session email.

`resolveUserForSettings` ([:27](../src/app/api/user-settings/route.js#L27)) = **tenancy guard**: session email
regex pehle; `userId` tabhi accept hota hai jab us row ka `email` / `connectedBusinessEmail` /
GMB project link session se match kare.

**Returns:**
- `automationSettings` — poora AutomationPlan doc (ya `{automationEnabled:false}`)
- `selectedBusiness`, `businessName`, `gmbProjectId`, `gmbProjects`
- `savedLocations` (= `plan.locations`)
- `keywordsRequired` = `getPlanPostLimit(paidPackage, planDuration)`
- `automationStatus` ([:190](../src/app/api/user-settings/route.js#L190)) — enabled, nextScheduledDate, lastPostDate,
  postsUsed, remaining, postIndex, totalKeywords, frequency, `usageByPlatform {gmb,fb,ig}`, `postedToday`
- `plan` ([:202](../src/app/api/user-settings/route.js#L202)) — package, planDuration, limit, postsUsed, remaining, expiryDate,
  isValid, isBusinessConnected
- `businessEmail`

**postsUsed priority:** `AutomationPlan.planDetails.postsUsed` > `User.postsUsed` ([:120](../src/app/api/user-settings/route.js#L120)).
`usageByPlatform` / `postedToday` — `Post{status:'posted'}` aggregate ([:125-156](../src/app/api/user-settings/route.js#L125-L156)).

### 3.4 `/api/keyword-research` (GET)
`src/app/api/keyword-research/route.js:25` — inline `Keyword` model, unique `{userId, keyword}`.
- `?userId=` → Mongo se saved keywords **(yeh page isi form ko use karta hai)**
- `?query=` → **outbound n8n webhook** `https://n8n.limbutech.in/webhook/4dc0fc39-…` ([:41](../src/app/api/keyword-research/route.js#L41))

### 3.5 `/api/assets-manage` (GET)
`src/app/api/assets-manage/route.js:89` — model `assets`.
> ⚠ `userId` ke **bina** call karo to **sabhi users ke assets** return ho jaate hain ([:96](../src/app/api/assets-manage/route.js#L96)).

### 3.6 `/api/facebook/pages` + `/api/instagram/pages` (GET)
`src/app/api/facebook/pages/route.js:12`, `src/app/api/instagram/pages/route.js:5` — models
`FacebookPage` / `InstagramPage`, `find({userId}).sort({createdAt:-1})`.

Page inhe `refreshSocialPages` ([page.jsx:705-727](../src/app/user-settings/page.jsx#L705-L727)) se call karta hai — mount par
**aur** har baar tab visible hone par (`visibilitychange` listener), taaki OAuth se laut kar aane
par pages turant dikhein.

---

## 4. Save — `POST /api/user-settings`

Client call: [page.jsx:1041](../src/app/user-settings/page.jsx#L1041). Route: `src/app/api/user-settings/route.js:220`.

### 4.1 Payload

```jsonc
{
  "automationEnabled": true,
  "frequency": "daily",
  "accessToken":  "...",   // session.accessToken  (GMB)
  "refreshToken": "...",   // session.refreshToken
  "startDate": "2026-07-16",
  "endDate":   "2026-10-14",
  "skippedDates": ["2026-07-20"],
  "customDates": [],
  "keywords": ["kw1", "kw2"],        // ORDER = posting sequence
  "platforms": ["gmb", "fb", "ig"],
  "postingHour": 11,
  "postingMinute": 0,
  "postingTimezone": "Asia/Kolkata",
  "fbPages": [{ "pageId": "...", "pageName": "...", "pageAccessToken": "..." }],
  "igPages": [{ "igId": "...", "igUsername": "...", "pageAccessToken": "..." }],
  "selectedBusiness":  { },
  "selectedLocations": [ ],
  "userId": "USR_123",
  "topic": "...",
  "colourPalette": "none",
  "size": "3:4",
  "characterImage": "...", "uniformImage": "...", "productImage": "...",
  "backgroundImage": "...", "logoImage": "...",
  "includeInGeneration": { "characterImage": true, /* ... */ }
}
```

### 4.2 Client-side validation ([page.jsx:1003-1024](../src/app/user-settings/page.jsx#L1003-L1024))
- Kam se kam ek platform select ho
- GMB on → ≥1 location; FB on → ≥1 page; IG on → ≥1 account
- Asset image check aur keyword-count check **comment out hain** ([:992-996](../src/app/user-settings/page.jsx#L992-L996), [:1027-1036](../src/app/user-settings/page.jsx#L1027-L1036))

### 4.3 Server-side kaam

| Step | Line | Detail |
|---|---|---|
| Platform sanitize | [:275-279](../src/app/api/user-settings/route.js#L275-L279) | `gmb\|fb\|ig` only, default `['gmb']` |
| Target validation | [:365-388](../src/app/api/user-settings/route.js#L365-L388) | per-platform |
| Time clamp | [:411-424](../src/app/api/user-settings/route.js#L411-L424) | hour 0-23 (def 11), minute 0-59, tz def `Asia/Kolkata` |
| Token resolve | [:512-542](../src/app/api/user-settings/route.js#L512-L542) | `session.accessToken` pehle, warna `GmbUser.projects[]` |
| Schedule build | [:466](../src/app/api/user-settings/route.js#L466) | `min(endDate, effective package expiry)`; stale past endDate auto-extend |
| Plan upsert | [:627-646](../src/app/api/user-settings/route.js#L627-L646) | 1 AutomationPlan per userId, duplicates `deleteMany` |
| Queue insert | [:736-791](../src/app/api/user-settings/route.js#L736-L791) | ek `PostStatus` per schedule slot |
| Disable cleanup | [:668-672](../src/app/api/user-settings/route.js#L668-L672) | automation off → queued posts delete |

### 4.4 Queue timing (`postQueueMode = 'delay_generate_publish'`, set at [:498](../src/app/api/user-settings/route.js#L498))

```
generateContentAt = saveTime + 30 min + (idx × frequencyStep days)
scheduledDate     = generateContentAt + 24 h
```

Env overrides:
- `AUTOMATION_QUEUE_GENERATE_DELAY_MINUTES` (default 30)
- `AUTOMATION_QUEUE_PUBLISH_AFTER_MINUTES` / `AUTOMATION_QUEUE_PUBLISH_AFTER_HOURS` (default 24h)

Yaani **generate hone aur publish hone ke beech ~24 ghante ka review window** hota hai — usi
window mein dashboard/WhatsApp par preview dikhta hai.

### 4.5 Response
`{ success, automationSettings, keywordsRequired, keywordsChanged, plan, businessName, automationTiming }`

### 4.6 Token storage
- FB/IG `pageAccessToken` → plan par verbatim ([:612-622](../src/app/api/user-settings/route.js#L612-L622)) **aur** har queued post par copy ([:764-781](../src/app/api/user-settings/route.js#L764-L781))
- GMB `accessToken`/`refreshToken` → AutomationPlan **aur** har PostStatus par, **plaintext**

---

## 5. Content Generation — kaise banta hai

### 5.1 Cron: `/api/cron/automation-fill-queue`

`src/app/api/cron/automation-fill-queue/route.js` — har 5 min.

1. Pick: `Post{ automationQueued:true, status:'pending', generateContentAt <= now, aiOutput empty }`,
   batch **15** ([:35-47](../src/app/api/cron/automation-fill-queue/route.js#L35-L47))
2. Lock: `status = 'processing'` ([:64-68](../src/app/api/cron/automation-fill-queue/route.js#L64-L68))
3. Resolve `AutomationPlan` ([:76-84](../src/app/api/cron/automation-fill-queue/route.js#L76-L84))
4. Generate ([:103-115](../src/app/api/cron/automation-fill-queue/route.js#L103-L115)):
   - `generateImagePrompt({ keyword, businessName, cityName })`
   - `generateImageAndText({ imagePrompt, keyword, businessName, cityName, imageConfig, platforms })`
5. Safety gate: `!imageUrl || !postText` → throw ([:117-119](../src/app/api/cron/automation-fill-queue/route.js#L117-L119))
6. Write fields + `status='scheduled'` ([:122-131](../src/app/api/cron/automation-fill-queue/route.js#L122-L131))
7. WhatsApp preview (non-blocking) ([:137-197](../src/app/api/cron/automation-fill-queue/route.js#L137-L197))

### 5.2 Step 1 — Image prompt (OpenAI)

`src/lib/automationPlanContentGeneration.js:22-50`

| | |
|---|---|
| Endpoint | `https://api.openai.com/v1/chat/completions` |
| Model | **`gpt-4o-mini`** |
| Params | temperature 0.8, max_tokens 200 |
| Env | **`OPENAI_API_KEY`** |
| Output | `{"prompt": "..."}` — **sirf image prompt, caption nahi** |
| Fallback | Key missing → silently `null` → `"{keyword} — {businessName}, {cityName}"` ([:53](../src/lib/automationPlanContentGeneration.js#L53)/[:62](../src/lib/automationPlanContentGeneration.js#L62)) |

### 5.3 Step 2 — Image + saare captions (n8n) ⭐

`src/lib/automationPlanContentGeneration.js:76-183`

`POST {NEXT_PUBLIC_API_URL || http://localhost:3000}/api/aiAssetsGenerate` ([:9](../src/lib/automationPlanContentGeneration.js#L9), [:119](../src/lib/automationPlanContentGeneration.js#L119))

Payload ([:94-107](../src/lib/automationPlanContentGeneration.js#L94-L107)):
```jsonc
{
  "topic": "<GPT ka image prompt>",
  "bussiness_name": "...",          // note: spelling as-is in code
  "keywords": "...",
  "colourPalette": "none",
  "size": "3:4",
  "characterImage": "<base64, data:image prefix stripped>",
  "uniformImage": "...", "productImage": "...",
  "backgroundImage": "...", "logoImage": "...",
  "platform": "gmb,fb,ig,pinterest",
  "mode": "ai"
}
```

- `applyIncludeInGeneration` ([:13-20](../src/lib/automationPlanContentGeneration.js#L13-L20)) — `imageConfig.includeInGeneration` mein off slots ko `null` kar deta hai
- Retries: `AUTOMATION_IMAGE_RETRIES` (def **3**), `AUTOMATION_IMAGE_RETRY_DELAY_MS` (def **5000**) ([:114-115](../src/lib/automationPlanContentGeneration.js#L114-L115))
- `{city}` placeholder **jaan-boojh kar** intact chhoda jaata hai — `gmb-post` downstream substitute karta hai ([:152-155](../src/lib/automationPlanContentGeneration.js#L152-L155))

**Actual image service:** `src/app/api/aiAssetsGenerate/route.js:49-56` proxy karta hai
**`https://assets-image.limbutech.in/generate-ad`** par (variable literally `n8nResponse`).
Koi API key / env var nahi — unauthenticated internal service.

Response flatten: `src/lib/normalizeGenerateAdResponse.js` → `output || imageUrl || image || secure_url || url`.

Captions normalize: `src/utils/aiPostDescriptions.js` → `gmb_des`, `fb_des`, `ig_des`, `pin_des`,
`pin_title`, `yt_des` ([:139-151](../src/lib/automationPlanContentGeneration.js#L139-L151)).

> **Gemini / nanobanana / DALL·E is path mein NAHI hai.** DALL·E 3 sirf
> `src/app/api/generate-images/route.js:50` (website builder) mein hai — unrelated.

### 5.4 Storage

Image **base64 ya Mongo mein nahi** — service **hosted S3 URL** deti hai
(`limbuai.s3.ap-south-1.amazonaws.com`). Mongo sirf wo string rakhta hai.

### 5.5 PostStatus fields — naam counter-intuitive hain ⚠

| Field | Kya hota hai ismein |
|---|---|
| **`aiOutput`** | **Image URL** (not `imageUrl`!) |
| **`description`** | **Post text** (not `content`!) |
| `gmbDescription` | GMB-specific caption |
| `fbDescription` | Facebook caption |
| `igDescription` | Instagram caption |
| `piDescription` / `pinTitle` | Pinterest |
| `status` | `'scheduled'` = generated, publish pending |
| `error` | `''` on success |

Same helper reuse: `api/cron/automation-plans/route.js:757-759`, `api/cron/auto-post/route.js:167-172`.

---

## 6. Dashboard Preview — publish se pehle

Page: **`src/app/post-management/page.jsx`**

| Action | Chain | File |
|---|---|---|
| List | `fetchPosts` ([:264](../src/app/post-management/page.jsx#L264)) → `fetchAllPostsAction(userId, page, 12, tab)` → `GET /api/post-status?userId=&page=&limit=12&status=scheduled` | [postActions.js:44-55](../src/app/actions/postActions.js#L44-L55) |
| Edit | `savePostAction` → `POST /api/post-status` | [postActions.js:98-106](../src/app/actions/postActions.js#L98-L106) |
| Approve / Reject | `updatePostStatusAction` → `POST /api/post-status` | [postActions.js:170-178](../src/app/actions/postActions.js#L170-L178) |
| **Regenerate** | `generateWithAssetsAction` → `POST /api/aiAssetsGenerate` — **cron wala hi webhook** | [postActions.js:160-168](../src/app/actions/postActions.js#L160-L168) |
| Manual GMB publish | `/api/gmb/publish` | [page.jsx:1557](../src/app/post-management/page.jsx#L1557) |
| YouTube publish | `/api/youtube/publish` | [page.jsx:1309](../src/app/post-management/page.jsx#L1309) |
| Delete | n8n `n8n.srv968758.hstgr.cloud/webhook/95aebb9c-…` | [postActions.js:210](../src/app/actions/postActions.js#L210) |
| Image download | `/api/downloadImage` proxy | [page.jsx:1822](../src/app/post-management/page.jsx#L1822) |

### PostStatus status enum (`src/models/PostStatus.js`)

```
pending → processing → scheduled → posted
                    ↘  failed / partial_failed
                       rejected  (+ rejectReason field)
                       approved
```

**`scheduled` = "generate ho chuka, publish hona baaki"** — yahi dashboard par preview hota hai.

---

## 7. WhatsApp Preview

Generation ke turant baad, non-blocking — [automation-fill-queue/route.js:137-197](../src/app/api/cron/automation-fill-queue/route.js#L137-L197).

| | |
|---|---|
| Service | **AiSensy** (Interakt/Gupshup/Meta direct nahi) |
| File | `src/lib/dailyPostWhatsApp.js:1` |
| Endpoint | `https://whatsapp.limbu.ai/api/campaigns/send` |
| Campaign | `daily_post_update` |
| Image | `media: { type: 'image', link: imageUrl }` |
| Env key | **`DAILY_POST_WHATSAPP_KEY`** — hardcoded fallback `ws_753f64…` ([:4-9](../src/lib/dailyPostWhatsApp.js#L4-L9)) ⚠ |
| Test override | `AUTOMATION_TEST_WHATSAPP_NUMBER` ([route.js:163](../src/app/api/cron/automation-fill-queue/route.js#L163)) |
| Phone resolve | `User.userId` → phir `User._id` via `plan.userRef`; jisme phone mile ([:150-159](../src/app/api/cron/automation-fill-queue/route.js#L150-L159)) |

---

## 8. Publishing — `/api/publish-scheduled`

`src/app/api/publish-scheduled/route.js` — har 5 min. **Kuch bhi regenerate NAHI karta** (confirmed).

- Query: `status:'scheduled', scheduledDate <= now` ([:387-394](../src/app/api/publish-scheduled/route.js#L387-L394))
- Sirf stored fields padhta hai:
  - FB: `post.fbDescription || post.description` ([:509](../src/app/api/publish-scheduled/route.js#L509))
  - IG: `post.igDescription` ([:618](../src/app/api/publish-scheduled/route.js#L618))
  - GMB: `post.gmbDescription || post.description` ([:734](../src/app/api/publish-scheduled/route.js#L734))
  - Image: `post.aiOutput` ([:513](../src/app/api/publish-scheduled/route.js#L513), [:623](../src/app/api/publish-scheduled/route.js#L623), [:730-732](../src/app/api/publish-scheduled/route.js#L730-L732))
- Generation helpers ka koi import nahi, `aiAssetsGenerate`/OpenAI ko koi fetch nahi

---

## 9. Cron Jobs — Schedule

`vercel.json` mein defined:

| Route | Schedule | Role | Mode |
|---|---|---|---|
| `/api/cron/automation-fill-queue` | `*/5 * * * *` | Generate: image + captions, `status='scheduled'`, WhatsApp | **Live** |
| `/api/publish-scheduled` | `*/5 * * * *` | Publish stored content | **Live** |
| `/api/cron/auto-post` | `*/15 * * * *` | Prefetch-only → `AutomationPlan.prefetchPost` | Legacy |
| `/api/cron/automation-plans?phase=tick` | `*/15 * * * *` | Legacy publish | Legacy |

**Live path** = fill-queue → publish-scheduled, kyunki user-settings hamesha
`postQueueMode='delay_generate_publish'` set karta hai jab automation + GMB + schedule ho
([user-settings/route.js:498](../src/app/api/user-settings/route.js#L498)). auto-post/automation-plans sirf un plans ke liye jo
`legacy` mode mein reh gaye.

### Runtime reality

`vercel.json` ke bawajood, `ecosystem.config.cjs` batata hai ki deploy **PM2 on EC2** se hota
hai. `automation-fill-queue:31` explicitly kehta hai: *"No CRON_SECRET gate — triggered by
localhost curl on EC2"*. Yaani real host par schedule **EC2 crontab** se aata hai; `vercel.json`
sirf intended cadence document karta hai.

**Local dev:** `npm run dev:cron` → `scripts/dev-cron.mjs` — wahi do endpoints har
`INTERVAL_MIN` (default 1 min) hit karta hai.

---

## 10. Webhooks — Poori List

**Automation posting mein koi inbound webhook involved NAHI hai.**

### Inbound (koi bahar se hume call karta hai)

| Webhook | File | Kaam | Automation se relation |
|---|---|---|---|
| FB webhook | `src/app/api/fb-webhook/route.js` | Meta inbound messages / autoreply. Verify token hardcoded `"limbu123"` ([:42](../src/app/api/fb-webhook/route.js#L42)), `hub.challenge` echo ([:50-53](../src/app/api/fb-webhook/route.js#L50-L53)) | ❌ None |
| Limbubot | `src/app/api/webhooks/limbubot/route.js` | Chatbot | ❌ None |

### Outbound (hum bahar call karte hain)

| Purpose | URL | File | Automation? |
|---|---|---|---|
| **Image + captions** | `https://assets-image.limbutech.in/generate-ad` | [aiAssetsGenerate/route.js:49-56](../src/app/api/aiAssetsGenerate/route.js#L49-L56) | ✅ **YES — core** |
| GMB publish | `n8n.srv968758.hstgr.cloud/webhook/cc144420-…` | `api/post-to-gmb/route.js:1` | Partly |
| Post delete | `n8n.srv968758.hstgr.cloud/webhook/95aebb9c-…` | `actions/postActions.js:210` | Dashboard |
| Keyword research | `n8n.limbutech.in/webhook/4dc0fc39-…` | `api/keyword-research/route.js:41` | ❌ (`?query=` only) |
| GMB health score | `n8n.limbutech.in/webhook/10d9cd54-…` (env `HEALTH_SCORE_N8N_URL`) | `lib/chatbotActionHandlers.js:280` | ❌ |
| Video generate | `n8n.limbutech.in/webhook/cgi_video` | `api/video-generate/route.js:60` | ❌ |
| Pinterest inhouse | `n8n.limbutech.in/webhook/limbu_inhouse_pintrest` | — | ❌ |
| Local rank | `n8n.limbutech.in/webhook/keyword-rank-checker` | — | ❌ |
| GMB scraper | `n8n.limbutech.in/webhook/data-gmb-scrapper` | — | ❌ |
| WhatsApp preview | `whatsapp.limbu.ai/api/campaigns/send` (AiSensy) | `lib/dailyPostWhatsApp.js:1` | ✅ Preview |
| Image prompt | `api.openai.com/v1/chat/completions` | `lib/automationPlanContentGeneration.js:22` | ✅ |

---

## 11. Environment Variables

| Env | Default | Kaam |
|---|---|---|
| `OPENAI_API_KEY` | — | gpt-4o-mini image prompt. **Missing → silent fallback** |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | aiAssetsGenerate self-call base |
| `AUTOMATION_IMAGE_RETRIES` | `3` | Image gen retries |
| `AUTOMATION_IMAGE_RETRY_DELAY_MS` | `5000` | Retry gap |
| `AUTOMATION_QUEUE_GENERATE_DELAY_MINUTES` | `30` | Save → first generate |
| `AUTOMATION_QUEUE_PUBLISH_AFTER_HOURS` | `24` | Generate → publish window |
| `AUTOMATION_QUEUE_PUBLISH_AFTER_MINUTES` | — | Above ka minute variant |
| `DAILY_POST_WHATSAPP_KEY` | hardcoded fallback ⚠ | AiSensy |
| `AUTOMATION_TEST_WHATSAPP_NUMBER` | — | Test override |
| `HEALTH_SCORE_N8N_URL` | — | GMB health (unrelated) |
| `CRON_SECRET` | — | **Declared but never checked** ⚠ |

---

## 12. Data Models

| Model | File | Role |
|---|---|---|
| `User` | `src/models/...` | package, planDuration, postsUsed, expiry, assets |
| `GmbUser` | | `projects[]` — GMB tokens |
| `AutomationPlan` | | Settings + schedule + tokens. **1 per userId** |
| `PostStatus` (as `Post`) | `src/models/PostStatus.js` | Har individual post + generated content |
| `HomeData` | | subscriptionPlans |
| `assets` | | Brand base64 images |
| `FacebookPage` / `InstagramPage` | | Meta OAuth cache + tokens |
| `Keyword` (inline) | `api/keyword-research/route.js:7-22` | unique `{userId, keyword}` |

---

## 13. ⚠ Known Issues / Risks

Yeh audit ke dauraan mile — abhi fix nahi kiye gaye.

### Security

1. **Access tokens guessable userId se expose** — `/api/facebook/pages`,
   `/api/instagram/pages`, `/api/assets-manage`, `/api/auth/signup` par koi session check nahi.
   Sirf `userId` pata ho to koi bhi FB/IG `pageAccessToken` aur poora user doc padh sakta hai.
2. **`/api/assets-manage` without userId → sabhi users ke assets** ([:96](../src/app/api/assets-manage/route.js#L96)).
3. **Dono automation crons unauthenticated** — `CRON_SECRET` ka comment hai par code kabhi check
   nahi karta. Koi bhi bahar se pipeline chala sakta hai.
4. **`/api/home-data` POST par koi auth nahi** ([:14](../src/app/api/home-data/route.js#L14)) — public write to pricing content.
5. **Passkey client bundle mein plaintext** ([page.jsx:11](../src/app/user-settings/page.jsx#L11)).
6. **AiSensy key ka hardcoded production fallback committed** ([dailyPostWhatsApp.js:4](../src/lib/dailyPostWhatsApp.js#L4)).
7. **Tokens plaintext** — GMB access/refresh + FB/IG page tokens AutomationPlan aur har
   PostStatus row par bina encryption ke.
8. **`assets-image.limbutech.in/generate-ad` unauthenticated** — koi API key nahi.

### Reliability

9. **`OPENAI_API_KEY` missing → silent degrade** ([automationPlanContentGeneration.js:23-26](../src/lib/automationPlanContentGeneration.js#L23-L26)) — error nahi
   aata, bas `"keyword — business"` fallback prompt use ho jaata hai. Image quality girti hai par
   pata nahi chalta.
10. **Field naming trap** — `aiOutput` = image, `description` = text. Naye code mein
    `imageUrl`/`content` expect karna bug ka source hai.
11. **Client validations commented out** ([page.jsx:992-996](../src/app/user-settings/page.jsx#L992-L996), [:1027-1036](../src/app/user-settings/page.jsx#L1027-L1036)) — asset check aur
    keyword-count check dono disabled.

---

## 14. Debugging Cheatsheet

| Symptom | Kahan dekho |
|---|---|
| Post generate hi nahi hua | `PostStatus.status` — `pending` par atka? `generateContentAt` future mein? cron chal raha? |
| Post `processing` par atka | fill-queue crash — `PostStatus.error`; lock release nahi hua |
| Image blank / poor | `OPENAI_API_KEY` set hai? `assets-image.limbutech.in` up hai? `AUTOMATION_IMAGE_RETRIES` exhaust? |
| Caption mein `{city}` dikha | `gmb-post` substitution skip hua — [automationPlanContentGeneration.js:152-155](../src/lib/automationPlanContentGeneration.js#L152-L155) |
| Dashboard par post nahi | `status='scheduled'` hai? `/api/post-status` sahi userId? |
| WhatsApp nahi aaya | User record par phone hai? `DAILY_POST_WHATSAPP_KEY` valid? (non-blocking — fail silent) |
| Publish nahi hua | `scheduledDate <= now`? tokens expire? `PostStatus.error` |
| Duplicate posts | AutomationPlan duplicates — `deleteMany` guard [:627-646](../src/app/api/user-settings/route.js#L627-L646) |
| Settings save nahi ho rahi | Session valid? `resolveUserForSettings` tenancy guard fail? |

---

*Generated from source audit. File:line refs `main` branch ke us waqt ke state ke hain —
refactor ke baad verify kar lena.*
