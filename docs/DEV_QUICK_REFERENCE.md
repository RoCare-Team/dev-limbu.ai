# Developer Quick Reference

## Flow Diagram

```
/build-website (Create)
        ↓
    User inputs → AI generates content → Preview website
        ↓
   Click "Go Live" 
        ↓
  GoLiveButton.jsx
        ↓
  POST /api/save-site
        ↓
  Slug validation + DB upsert
        ↓
  Returns: { slug, url, ... }
        ↓
  Redirect to https://{slug}.limbu.ai
        ↓
  Browser requests with Host: {slug}.limbu.ai
        ↓
  middleware.js detects subdomain
        ↓
  Rewrite to /live/{slug}
        ↓
  /live/[slug]/page.js renders
        ↓
  fetch /api/get-site?slug={slug}
        ↓
  MongoDB returns Site document
        ↓
  Page renders with business + AI content
        ↓
  CDN caches response
        ↓
  User sees published website
```

## File Changes Summary

### ✅ Updated Files (4)

| File | Change | Purpose |
|------|--------|---------|
| **middleware.js** | Complete rewrite | Improved subdomain detection, validation, and reserved slug protection |
| **src/models/Site.js** | Enhanced schema | Added userId, metadata, analytics, validation, indexes |
| **src/app/api/save-site/route.js** | Complete rewrite | Added auth, validation, error handling, upsert logic |
| **src/app/api/get-site/route.js** | Enhanced | Added caching headers, analytics tracking, better error handling |
| **src/app/live/[slug]/page.js** | Complete rewrite | Full website rendering with responsive design, SEO metadata |
| **src/app/build-website/page.jsx** | Updated imports | Added GoLiveButton component usage |

### ✨ New Files (5)

| File | Purpose |
|------|---------|
| **src/components/GoLiveButton.jsx** | Smart publish button with UX enhancements |
| **DYNAMIC_SUBDOMAINS.md** | Feature overview and quick start |
| **SUBDOMAIN_SETUP.md** | Complete DNS, domain, and configuration guide |
| **DEPLOYMENT_GUIDE.md** | Implementation, testing, and deployment checklist |
| **DEV_QUICK_REFERENCE.md** | This file - developer reference |

## Key Code Examples

### 1. Generate & Publish Site

```javascript
// In /build-website/page.jsx
<GoLiveButton 
  business={business}
  aiContent={aiContent}
  mediaImages={mediaImages}
  onSuccess={(site) => console.log(site)}
/>
```

### 2. Save Site to Database

```javascript
// POST /api/save-site
const response = await fetch("/api/save-site", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    slug: "my-business",
    business: { /* data */ },
    aiContent: { /* data */ },
    mediaImages: ["url1", "url2"],
  }),
});

const data = await response.json();
// Returns: { success: true, site: { id, slug, url, ... } }
```

### 3. Fetch & Render Site

```javascript
// In /live/[slug]/page.js
const res = await fetch(
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/get-site?slug=${slug}`,
  { cache: "no-store" }
);
const { business, aiContent, mediaImages } = await res.json();

// Render with data...
```

### 4. Subdomain Detection

```javascript
// middleware.js automatically:
// 1. Extracts subdomain from Host header
// 2. Validates format (alphanumeric + hyphens)
// 3. Checks reserved slugs
// 4. Rewrites to /live/[slug]
// 5. Returns normal response otherwise

// Example:
// Request: https://my-business.limbu.ai/
// Host header: my-business.limbu.ai
// Subdomain: my-business
// Rewrite to: /live/my-business
```

## Database Schema

```javascript
Site {
  _id: ObjectId,
  slug: String (unique, required),                    // "my-business"
  userId: String (indexed, required),                 // "user@example.com"
  locationId: String (optional),                      // Google location ID
  
  // Content
  business: Object,                                   // { title, locality, phoneNumbers, ... }
  aiContent: Object,                                  // { hero, about, services, ... }
  mediaImages: [String],                              // ["url1", "url2", ...]
  
  // Status & Publishing
  isPublished: Boolean (default: true),
  customDomain: String (unique, sparse, optional),    // "mybusiness.com"
  
  // SEO
  metadata: {
    title: String,                                    // "Business Name"
    description: String,                              // "About the business"
    ogImage: String,                                  // Thumbnail URL
    contactEmail: String,                             // Contact email
  },
  
  // Analytics
  analytics: {
    views: Number (default: 0),                       // Total views
    lastVisited: Date,                                // Last access time
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
}
```

## API Responses

### POST /api/save-site

**Success (201 Created):**
```json
{
  "success": true,
  "site": {
    "id": "507f1f77bcf86cd799439011",
    "slug": "my-business",
    "url": "https://my-business.limbu.ai",
    "createdAt": "2024-02-11T10:30:00Z",
    "updatedAt": "2024-02-11T10:30:00Z"
  }
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Invalid slug format. Use only lowercase letters, numbers, and hyphens."
}
```

**Error (409 Conflict):**
```json
{
  "error": "This slug is already taken."
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

### GET /api/get-site?slug=my-business

**Success (200 OK):**
```json
{
  "slug": "my-business",
  "userId": "user@example.com",
  "business": { /* full business object */ },
  "aiContent": { /* full AI content object */ },
  "mediaImages": ["url1", "url2"],
  "metadata": { /* SEO metadata */ },
  "analytics": { "views": 42, "lastVisited": "2024-02-11T..." },
  "createdAt": "2024-02-11T...",
  "updatedAt": "2024-02-11T..."
}
```

**Error (404 Not Found):**
```json
{
  "error": "Website not found"
}
```

## Slug Rules

### Valid Slugs ✅
- `my-business`
- `coffee-shop`
- `abc123`
- `test-site-2024`

### Invalid Slugs ❌
- `My-Business` (uppercase)
- `my_business` (underscore)
- `my business` (space)
- `-my-business` (starts with hyphen)
- `api` (reserved)
- `admin` (reserved)
- `www` (reserved)
- `my--business` (consecutive hyphens - invalid per regex)

### Regex Pattern
```
^[a-z0-9]([a-z0-9-]*[a-z0-9])?$
```

## Environment Variables

Required in `.env.local` and Vercel:

```env
# Public (visible to browser)
NEXT_PUBLIC_BASE_URL=https://limbu.ai

# Private (server-only)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=https://limbu.ai
NEXTAUTH_PROVIDERS=google,github (etc.)
```

## Testing Commands

### Create Site
```bash
curl -X POST https://limbu.ai/api/save-site \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-business-123",
    "business": {
      "title": "Test Business",
      "locality": "Test City",
      "phoneNumbers": { "primaryPhone": "+1234567890" },
      "primaryCategory": "Restaurant"
    },
    "aiContent": {
      "hero": {
        "headline": "Welcome to Test Business",
        "subheadline": "Your local test site",
        "ctaPrimary": "Contact Us"
      },
      "about": {
        "title": "About Us",
        "content": "This is a test website."
      },
      "services": [
        {
          "title": "Service 1",
          "description": "First service"
        }
      ]
    },
    "mediaImages": [
      "https://source.unsplash.com/1600x900/?restaurant"
    ]
  }'
```

### Get Site
```bash
curl https://limbu.ai/api/get-site?slug=test-business-123
```

### Delete Site (MongoDB)
```bash
db.sites.deleteOne({ slug: "test-business-123" })
```

## Debugging Tips

### 1. Check Middleware is Working
```bash
# Verify Host header is being detected
curl -v https://test.limbu.ai/ 2>&1 | grep Host

# Check middleware logs (Vercel function logs)
# Should see rewrite to /live/test
```

### 2. Verify Database Connection
```javascript
// In your Next.js app
const dbConnected = await dbConnect();
console.log("DB Connected:", dbConnected);
```

### 3. Check Subdomain Resolution
```bash
# DNS should resolve
nslookup test.limbu.ai

# Should show Vercel IP or CNAME
```

### 4. Browser DevTools
- Network tab: Check response from /api/get-site
- Application tab: Check cookies/session
- Elements tab: Inspect generated HTML
- Console tab: Check for JavaScript errors

## Performance Checklist

- [ ] Database indexes created for slug, userId, customDomain
- [ ] Caching headers set: `Cache-Control: public, s-maxage=300...`
- [ ] Images optimized with Next.js Image component
- [ ] API responses < 500ms
- [ ] Page renders < 2 seconds (via Lighthouse)
- [ ] Core Web Vitals passing
- [ ] MongoDB connection pooling
- [ ] CDN correctly caching responses

## Security Checklist

- [ ] Slug validation regex applied
- [ ] Reserved slugs protected
- [ ] Authentication required for POST /api/save-site
- [ ] User ownership verified for updates
- [ ] HTTPS enforced (via Vercel)
- [ ] CORS properly configured
- [ ] XSS protection enabled (React default)
- [ ] SQL injection impossible (using MongoDB ODM)
- [ ] Rate limiting on public APIs (optional)

## Common Issues & Solutions

### Issue: "Website not found" (404)

**Check:**
1. Site exists in DB: `db.sites.findOne({ slug: "test" })`
2. Slug is correct (lowercase, no spaces)
3. Site is published: `isPublished: true`

**Solution:**
- Verify save-site returned success
- Check MongoDB connection
- Test `/api/get-site?slug=test`

### Issue: Middleware not detecting subdomain

**Check:**
1. Subdomain matches regex
2. Not in reserved list
3. Middleware config has correct matcher

**Debug:**
```javascript
// Add temporary log in middleware
console.log("Host:", host, "Subdomain:", subdomain, "Match:", isValidSubdomain);
```

### Issue: Slow page loads

**Check:**
1. Image sizes (DevTools Network)
2. API response time
3. Database query performance

**Optimize:**
- Image lazy loading
- Database indexing
- CDN caching
- Reduce payload size

## Deployment Checklist

- [ ] All files committed to git
- [ ] Environment variables set in Vercel
- [ ] DNS records configured
- [ ] Domain added to Vercel
- [ ] SSL certificate provisioned (48 hours)
- [ ] Database indexes created
- [ ] Tested create/read flow
- [ ] Monitored error logs
- [ ] Monitoring configured (Sentry, etc.)

## Links & Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- MongoDB Docs: https://docs.mongodb.com
- NextAuth Docs: https://next-auth.js.org
- This Project Docs: See SUBDOMAIN_SETUP.md, DEPLOYMENT_GUIDE.md

## Contact & Support

- GitHub Issues: Report bugs
- Project Docs: See related .md files
- Error Logs: Check Vercel function logs
- Database: Check MongoDB Atlas console
