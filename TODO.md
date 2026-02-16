# Multi-Tenant Subdomain Fix - TODO

## Issues Found:
1. **CRITICAL: Middleware Route Mismatch** - Middleware rewrites to `/live/${subdomain}` but there's no `/live` route - the actual page is at `/[slug]`
2. Missing Vercel wildcard subdomain configuration

## Plan:
- [ ] 1. Fix `middleware.js` - Change rewrite from `/live/${subdomain}` to `/${subdomain}` to match the `/[slug]` dynamic route
- [ ] 2. Verify `vercel.json` - Add wildcard subdomain routing for Vercel deployment
- [ ] 3. Test the complete flow

## Files to Edit:
1. `middleware.js` - Fix the rewrite path (CRITICAL)
2. `vercel.json` - Add wildcard subdomain routing (if needed for Vercel)

## Flow Verification:
- [ ] GoLiveButton generates slug
- [ ] save-site API creates/updates site in database
- [ ] Middleware detects subdomain and rewrites to /[slug]
- [ ] Dynamic page fetches site data from get-site API
- [ ] Website renders correctly at slug.limbu.ai
