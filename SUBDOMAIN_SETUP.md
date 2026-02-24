# Dynamic Subdomain Routing Setup Guide

## Overview

This guide explains how to set up wildcard subdomain routing for your SaaS website builder application, allowing unlimited businesses to get their own subdomains under `*.limbu.ai` without deploying new instances.

## Architecture

```
┌─────────────────────────────────────────┐
│   User Generates Website on /build-site │
│   Click "Go Live" → Save to Database    │
└─────────────────────├───────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    DNS Request              API Request
    for *.limbu.ai           POST /api/save-site
         │                        │
         ├────► Vercel CDN        └──► MongoDB
         │                             (Site Data)
         │
    Middleware Detects:
    business.limbu.ai → /live/business
         │
         ├──► fetch /api/get-site?slug=business
         │
         └──► Render Site from DB

```

## Prerequisites

- Domain: `limbu.ai` (or your custom domain)
- Vercel deployment
- Nameserver access
- MongoDB database

## Step 1: Domain Configuration at Registrar

### 1.1 Add Wildcard DNS Record

Contact your domain registrar (GoDaddy, Bluehost, NameCheap, etc.) and add:

```
Type:  A or CNAME
Name:  *
Value: cname.vercel-dns.com. (for CNAME) or Vercel IP (for A record)
TTL:   3600 (1 hour) - can be increased later to 86400
```

**For Vercel:**
- If using CNAME: Point to `cname.vercel-dns.com`
- If using A record: Use Vercel's IP (check Vercel docs)

### 1.2 Verify DNS Propagation

```bash
# Linux/Mac
nslookup test.limbu.ai
dig test.limbu.ai +short

# Windows PowerShell
Resolve-DnsName test.limbu.ai
```

Should resolve to your Vercel deployment.

## Step 2: Vercel Configuration

### 2.1 Add Wildcard Domain to Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Navigate to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `*.limbu.ai`
5. Click **Add**

### 2.2 Configure Domain Verification

Vercel will provide configuration options:
- **Option 1**: Update DNS records (recommended for production)
- **Option 2**: Add CNAME records for each subdomain (not scalable for wildcards)

Choose **Option 1** and update your nameservers if needed.

### 2.3 Verify Domain Status

The domain should show as "Valid" in Vercel's domains list.

## Step 3: Application Configuration

### 3.1 Middleware Setup (Already Configured)

The middleware (`middleware.js`) performs:

```javascript
// Detects: business.limbu.ai
// Rewrites to: /live/business
// Fetches from DB: Site with slug="business"
```

**Key features:**
- ✅ Subdomain detection
- ✅ Reserved subdomain protection (api, admin, www)
- ✅ Slug format validation
- ✅ Safe rewrite to `/live/[slug]`

### 3.2 Environment Variables

Ensure these are set in `.env.local` and Vercel:

```env
NEXT_PUBLIC_BASE_URL=https://limbu.ai
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_next_auth_secret
NEXTAUTH_URL=https://limbu.ai
```

## Step 4: Database Setup

### 4.1 Site Model

The MongoDB Site model stores:

```javascript
{
  slug: "business-name",           // Unique identifier
  userId: "user@example.com",      // Owner
  locationId: "123456",            // Associated location
  business: { /* Google Business data */ },
  aiContent: { /* AI-generated content */ },
  mediaImages: ["url1", "url2"],
  isPublished: true,
  customDomain: "custom.com",      // Optional custom domain
  metadata: {
    title: "Business Name",
    description: "...",
    ogImage: "...",
    contactEmail: "..."
  },
  analytics: {
    views: 0,
    lastVisited: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4.2 Create Database Indexes

For performance, ensure these indexes exist:

```javascript
db.sites.createIndex({ slug: 1 }, { unique: true })
db.sites.createIndex({ userId: 1, createdAt: -1 })
db.sites.createIndex({ customDomain: 1 }, { unique: true, sparse: true })
```

## Step 5: Publishing a Site

### 5.1 User Workflow

1. User generates website on `/build-website`
2. Clicks **"Go Live"** button
3. Slugified name → API saves to DB
4. Redirects to `https://businessname.limbu.ai`
5. Middleware detects subdomain
6. `/live/businessname` page loads
7. Fetches data from DB → Renders site

### 5.2 API Endpoints

**Save Site:**
```bash
POST /api/save-site
Content-Type: application/json

{
  "slug": "my-business",
  "business": { /* business data */ },
  "aiContent": { /* AI content */ },
  "mediaImages": ["url1", "url2"],
  "locationId": "12345"
}
```

**Get Site:**
```bash
GET /api/get-site?slug=my-business
```

## Step 6: Custom Domains (Optional)

For businesses wanting their own custom domain:

### 6.1 Add Custom Domain to Site

```javascript
// Save custom domain with site
POST /api/save-site
{
  slug: "my-business",
  customDomain: "mybusiness.com",
  ...
}
```

### 6.2 Users Configure DNS

Users add CNAME to their registrar:

```
Type:  CNAME
Name:  @
Value: my-business.limbu.ai
TTL:   3600
```

Then Vercel maps custom domain to the site.

### 6.3 Vercel SSL Certificate

Vercel automatically provides SSL for all domains:
- Wildcard subdomains: `*.limbu.ai`
- Custom domains: `mybusiness.com`

## Troubleshooting

### DNS not resolving

```bash
# Check DNS propagation
nslookup test.limbu.ai

# Check Vercel DNS
dig test.limbu.ai @ns1.vercel-dns.com
```

**Solutions:**
- Wait 24-48 hours for DNS propagation
- Clear browser cache or use incognito mode
- Verify DNS records at registrar
- Check Vercel domain settings

### Subdomain redirects to main site

**Check:**
1. Middleware is enabled (no _next, API routes excluded)
2. Reserved subdomains not conflicting
3. Site exists in database with correct slug

**Debug:**
```bash
# Check request headers
curl -I https://businessname.limbu.ai -H "Host: businessname.limbu.ai.limbu.ai"

# Monitor API
GET /api/get-site?slug=businessname
```

### SSL Certificate Issues

- Vercel auto-provisions SSL within 24-48 hours
- Wildcard certificates cover `*.limbu.ai`
- Custom domains need separate SSL (Vercel provides)

## Performance Optimization

### 1. Caching Strategy

**API Response Caching:**
```javascript
// Cache for 5 minutes, revalidate if stale
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

**Database Queries:**
- Index on `slug` for fast lookups
- Index on `userId, createdAt` for user dashboards
- Cache frequently accessed sites in Redis (optional)

### 2. Image Optimization

- Use Next.js `Image` component
- Lazy load below-the-fold images
- Implement responsive images with srcset

### 3. CDN Configuration

Vercel's Edge Network automatically:
- Caches static assets globally
- Streams dynamic content from nearest edge
- Provides HTTP/2 Server Push

## Security Considerations

### 1. Slug Validation

✅ Implemented: Only alphanumeric + hyphens
✅ Reserved slugs protected
✅ Unique constraint on database

### 2. User Authorization

✅ Only site owner can update
✅ userId verification in API
✅ NextAuth session required

### 3. Data Protection

- HTTPS/TLS for all subdomains
- Secure database credentials
- CORS properly configured
- Rate limiting on sensitive endpoints

### 4. Content Security

- No arbitrary code execution
- XSS prevention (React/Next.js built-in)
- CSP headers recommended

## Monitoring & Analytics

### 1. View Tracking

```javascript
// Automatically increments with each page load
Site.analytics.views: number
Site.analytics.lastVisited: Date
```

### 2. Vercel Analytics

- Deployment URL analytics
- Edge request metrics
- SSL performance

### 3. Application Monitoring

Consider implementing:
- Error logging (Sentry, LogRocket)
- Performance monitoring (New Relic)
- Database monitoring (MongoDB Atlas)

## Scalability Limits

### Vercel Limitations
- ✅ Unlimited requests per deployment
- ✅ Unlimited subdomains (wildcard)
- ⚠️ Serverless function timeout: 10-60 seconds (plan dependent)
- ⚠️ Concurrent connections per database

### MongoDB Limitations
- ✅ Collections can store billions of documents
- ⚠️ Document size limit: 16MB
- ⚠️ Index size limits on free tier

### Recommendations for Scale
- Implement Redis caching layer
- Use MongoDB connection pooling
- Archive old analytics data
- Implement database sharding (if >100M sites)

## Cost Estimation

### Vercel
- Wildcard domain: Included
- SSL certificate: Included
- CDN bandwidth: ~$0.30/GB overages

### MongoDB
- Document storage: $0.10/1M reads beyond free tier
- Index size: Typically 5-10% of data
- Connection pooling: Recommended for >10k concurrent

### Example Infra for 100k Sites
- Vercel: ~$20-50/month (Pro plan)
- MongoDB Atlas M10: ~$58/month (100GB)
- **Total: ~$100-150/month**

## Additional Resources

- [Vercel Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel Wildcard Subdomains](https://vercel.com/docs/concepts/projects/domains/add-domain#wildcards)
- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)
- [MongoDB Atlas Connection Options](https://docs.mongodb.com/manual/reference/connection-string/)
- [NextAuth Configuration](https://next-auth.js.org/getting-started/introduction)
