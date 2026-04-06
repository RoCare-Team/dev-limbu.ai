# Implementation & Deployment Guide

## Quick Start Checklist

- [ ] Domain registered and nameservers configured
- [ ] Wildcard DNS record added (`*.limbu.ai`)
- [ ] Vercel project created and domain added
- [ ] MongoDB database set up and indexes created
- [ ] Environment variables configured
- [ ] Middleware enabled
- [ ] Site model updated with validation
- [ ] API endpoints tested
- [ ] `/live/[slug]` page functional
- [ ] "Go Live" button tested end-to-end
- [ ] SSL certificate provisioned
- [ ] Custom domains (optional) configured
- [ ] Monitoring set up

## File Structure

```
gmb-app/
├── middleware.js                          # ✅ Subdomain detection
├── next.config.mjs                        # Config file
├── SUBDOMAIN_SETUP.md                     # 📋 Setup guide (NEW)
├── DEPLOYMENT_GUIDE.md                    # 📋 This file
├── src/
│   ├── app/
│   │   ├── build-website/
│   │   │   └── page.jsx                  # ✅ User creates website
│   │   ├── live/
│   │   │   └── [slug]/
│   │   │       └── page.js               # ✅ Renders published site
│   │   └── api/
│   │       ├── save-site/
│   │       │   └── route.js              # ✅ Saves to DB
│   │       ├── get-site/
│   │       │   └── route.js              # ✅ Retrieves from DB
│   │       └── ...
│   ├── lib/
│   │   └── dbConnect.js                  # MongoDB connection
│   └── models/
│       └── Site.js                       # ✅ Database schema
│   └── utils/
│       └── generateSlug.js               # Slug generation
└── ...
```

## Implementation Steps

### Step 1: Database & Models

**Status:** ✅ Complete

The Site model includes:
- Unique slug validation (alphanumeric + hyphens)
- UserId for ownership
- Published status
- Custom domain support
- Metadata for SEO
- Analytics tracking

**Verify indexes:**
```bash
# In MongoDB Atlas dashboard or mongosh
db.sites.getIndexes()

# Should have:
# - { slug: 1 } (unique)
# - { userId: 1, createdAt: -1 }
# - { customDomain: 1 } (sparse, unique)
```

### Step 2: Middleware Configuration

**Status:** ✅ Complete

The middleware:
1. Extracts subdomain from host header
2. Validates subdomain format
3. Protects reserved subdomains
4. Rewrites to `/live/[slug]`
5. Configured with proper path matching

**Features:**
```javascript
// Detects:
// ✅ test.limbu.ai → /live/test
// ✅ my-business.limbu.ai → /live/my-business
// ❌ limbu.ai → passes through
// ❌ www.limbu.ai → passes through
// ❌ api.limbu.ai → passes through (reserved)
// ❌ invalid_domain.limbu.ai → blocked by regex
```

### Step 3: API Endpoints

**Status:** ✅ Complete

#### POST /api/save-site

**Purpose:** Publish a created website

```bash
curl -X POST https://limbu.ai/api/save-site \
  -H "Authorization: Bearer YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-business",
    "business": { /* business data */ },
    "aiContent": { /* AI content */ },
    "mediaImages": ["url1", "url2"],
    "locationId": "12345"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "site": {
    "id": "...mongo id...",
    "slug": "my-business",
    "url": "https://my-business.limbu.ai",
    "createdAt": "2024-02-11T...",
    "updatedAt": "2024-02-11T..."
  }
}
```

**Error Responses:**
- `400`: Invalid slug format or missing fields
- `401`: Not authenticated
- `409`: Slug already taken
- `500`: Server error

**Validation:**
- ✅ Authentication required
- ✅ Slug format: `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`
- ✅ Reserved slugs protected
- ✅ Unique constraint enforced
- ✅ Duplicate key error handling

#### GET /api/get-site

**Purpose:** Retrieve published website data

```bash
curl https://limbu.ai/api/get-site?slug=my-business
```

**Response (200 OK):**
```json
{
  "slug": "my-business",
  "userId": "user@example.com",
  "business": { /* data */ },
  "aiContent": { /* data */ },
  "mediaImages": ["url1", "url2"],
  "metadata": {
    "title": "My Business",
    "description": "...",
    "ogImage": "..."
  },
  "createdAt": "2024-02-11T...",
  "updatedAt": "2024-02-11T..."
}
```

**Caching:**
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```
- Cached 5 min on CDN
- Revalidates if stale within 10 min
- Client gets fresh data after 10 min

**Analytics:**
- View count increments on each request
- Last visited timestamp updated
- Non-blocking (doesn't delay response)

### Step 4: Dynamic Site Rendering

**Status:** ✅ Complete

**File:** `/src/app/live/[slug]/page.js`

**Features:**
- ✅ Server-side rendering (SSR)
- ✅ Dynamic metadata generation
- ✅ Open Graph tags for social sharing
- ✅ Responsive design
- ✅ Image lazy loading
- ✅ Full website structure (Hero → About → Services → Contact → Footer)
- ✅ SEO optimized

**Metadata:**
```javascript
// Dynamically generated per site
{
  title: "Business Name | Limbu Sites",
  description: "Business description",
  openGraph: {
    type: "website",
    images: [{ url: "...", width: 1200, height: 630 }]
  },
  twitter: { card: "summary_large_image", ... }
}
```

**Performance:**
- Edge caching for static content
- Image optimization via Next.js Image component
- Lazy loading for below-fold content
- CSS-in-JS with Tailwind (minimal CSS)

### Step 5: Frontend Integration

**Status:** ⚠️ Needs update in `/build-website/page.jsx`

**Current "Go Live" Button:** Uses plain fetch

**Enhanced Version Needed:**
```javascript
// Add loading state
const [isPublishing, setIsPublishing] = useState(false);
const [publishError, setPublishError] = useState(null);

const handleGoLive = async () => {
  try {
    setIsPublishing(true);
    setPublishError(null);

    const slug = generateSlug(
      business.title,
      business.locality
    );

    const res = await fetch("/api/save-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        business,
        aiContent,
        mediaImages,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to publish");
    }

    // Success - redirect
    window.location.href = data.site.url;

  } catch (err) {
    setPublishError(err.message);
  } finally {
    setIsPublishing(false);
  }
};
```

**UI Improvements:**
- Loading spinner while publishing
- Error message display
- Disabled button during processing
- Success state feedback

## Deployment to Vercel

### Step 1: Deploy Code

```bash
# Ensure all changes are committed
git add .
git commit -m "Add dynamic subdomain routing system"

# Push to main branch triggers auto-deploy
git push origin main
```

### Step 2: Configure Environment Variables

In Vercel Dashboard:

```
Settings → Environment Variables

NEXT_PUBLIC_BASE_URL=https://limbu.ai
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
NEXTAUTH_SECRET=<random 32+ char string>
NEXTAUTH_URL=https://limbu.ai
NEXTAUTH_PROVIDERS=google (or your providers)
```

**Generate NEXTAUTH_SECRET:**
```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Step 3: Deploy

```bash
# Merge to main branch
git push origin main

# Vercel auto-deploys
# Monitor at: https://vercel.com/dashboard
```

### Step 4: Verify Deployment

```bash
# Test main site
curl https://limbu.ai

# Test wildcard domain
curl https://test.limbu.ai -H "Host: test.limbu.ai"

# Check middleware is active
curl https://businessname.limbu.ai/api/get-site?slug=businessname
```

## DNS & Domain Setup

### Quick DNS Setup

1. **Registrar Settings** (GoDaddy, NameCheap, etc.):
   ```
   Type:  A
   Name:  *
   Value: 76.76.19.132 (or your Vercel IP)
   TTL:   3600
   ```

   OR

   ```
   Type:  CNAME
   Name:  *
   Value: cname.vercel-dns.com
   TTL:   3600
   ```

2. **Vercel Settings**:
   - Add `*.limbu.ai` as domain
   - Configure DNS if needed
   - Wait for SSL certificate (24-48 hours)

3. **Verify**:
   ```bash
   nslookup test.limbu.ai
   # Should resolve to Vercel IP
   ```

## Testing Checklist

### Local Testing

```bash
# 1. Start dev server
npm run dev

# 2. Test middleware (modify /etc/hosts)
# Add: 127.0.0.1 test.localhost:3000
# Not recommended - skip for now

# 3. Test API endpoints
curl http://localhost:3000/api/save-site
curl http://localhost:3000/api/get-site?slug=test
```

### Production Testing

```bash
# 1. Create test site
curl -X POST https://limbu.ai/api/save-site \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-site-123",
    "business": { "title": "Test", "locality": "Test City" },
    "aiContent": { "hero": { "headline": "Test" } },
    "mediaImages": []
  }'

# 2. Access site
# https://test-site-123.limbu.ai

# 3. Verify rendering
# - Page loads without errors
# - Metadata shows in browser DevTools
# - Social sharing shows correct preview
# - Images load properly
# - Contact info displays

# 4. Delete if needed
# db.sites.deleteOne({ slug: "test-site-123" })
```

### End-to-End Testing

1. **User Flow**:
   - [ ] Login to `/build-website`
   - [ ] Select business location
   - [ ] Generate AI website
   - [ ] Review content
   - [ ] Click "Go Live"
   - [ ] Verify redirect to `slug.limbu.ai`
   - [ ] Check site renders correctly

2. **Performance**:
   - [ ] Page load < 3 seconds
   - [ ] LCP (Largest Contentful Paint) < 2.5s
   - [ ] Core Web Vitals pass

3. **SEO**:
   - [ ] Title tag set correctly
   - [ ] Meta description present
   - [ ] Open Graph tags for sharing
   - [ ] Mobile responsive (use DevTools)

4. **Analytics**:
   - [ ] View count increments
   - [ ] Last visited timestamp updates
   - [ ] No errors in console

## Monitoring & Maintenance

### 1. Error Tracking

Set up Sentry or similar:

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

Monitor:
- API endpoint errors
- Database connection issues
- Middleware errors
- 404s for missing sites

### 2. Performance Monitoring

Use Vercel Analytics:
- Response time
- Edge vs. serverless execution
- Cache hit rates
- CDN performance

### 3. Database Monitoring

MongoDB Atlas monitoring:
- Connection count
- Query performance
- Storage usage
- Index efficiency

### 4. Regular Maintenance

**Weekly:**
- Check error logs
- Verify DNS is resolving
- Test publishing new sites

**Monthly:**
- Review analytics
- Optimize slow queries
- Clean up old test data
- Update dependencies

**Quarterly:**
- Security audit
- Performance testing
- Cost optimization
- Scaling assessment

## Scaling Considerations

### If you reach 1,000 sites:
- Monitor MongoDB performance
- Consider connection pooling
- Implement Redis cache for popular sites
- Archive analytics older than 1 year

### If you reach 10,000 sites:
- Implement CDN caching strategy
- Shard database by user/region
- Use read replicas for analytics
- Dedicated admin tier for Vercel

### If you reach 100,000+ sites:
- Full database sharding
- Multi-region Vercel deployments
- Hybrid caching (Redis + CDN)
- Dedicated database instances
- API rate limiting and quotas

## Troubleshooting Guide

### "Website not found" on `slug.limbu.ai`

**Check:**
1. Site exists in DB: `db.sites.findOne({ slug: "test" })`
2. Metadata shows correct slug in save-site response
3. Direct API works: `/api/get-site?slug=test`

**Fix:**
- Ensure API returned `{ success: true }`
- Check CloudFront/CDN cache was cleared
- Verify database credentials are correct

### Middleware not detecting subdomain

**Check:**
1. Subdomain matches regex: `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`
2. Not in reserved list: api, admin, www, mail, ftp
3. Middleware config includes route

**Debug:**
```javascript
// Add to middleware.js temporarily
console.log("Host:", host, "Subdomain:", subdomain);
```

### SSL certificate not working

**Check:**
1. Vercel shows domain as "Valid"
2. Wait 24-48 hours after adding domain
3. Wildcard cert covers `*.limbu.ai`

**Fix:**
- Remove and re-add domain in Vercel
- Check registrar DNS is pointing to Vercel
- Clear browser cache (HSTS)

### Slow page loads

**Check:**
1. Image sizes (use DevTools Network tab)
2. API response time: `/api/get-site?slug=test`
3. Database query performance

**Optimize:**
- Enable image optimization
- Add database indexes
- Implement caching
- Use Redis for hot data

## Support & Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **NextAuth.js:** https://next-auth.js.org
- **GitHub Issues:** Open issue for bug reports

## Version History

- **v1.0** (Feb 2026): Initial implementation
  - Wildcard subdomain routing
  - Dynamic site rendering
  - Database-backed publishing
  - Full SEO support
