# GMB Automation - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Configure Environment Variables

```bash
# .env.local
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
NEXTAUTH_SECRET=your_nextauth_secret
MONGODB_URI=your_mongodb_connection_string
```

### Step 2: Deploy to Vercel

```bash
# Install dependencies
npm install

# Deploy
vercel --prod
```

The `vercel.json` is already configured with the cron job!

### Step 3: User Workflow

#### For Users:

1. **Login** → `/login`
2. **Connect GMB** → Dashboard → "Connect Google Business"
3. **Add Keywords** → `/keyword-planner`
4. **Enable Automation** → `/automation-settings`

That's it! Posts will be created automatically daily at 9:00 AM.

## 📊 How It Works

```
┌─────────────────┐
│  User Logs In   │
│  (NextAuth)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Connect GMB    │
│  (OAuth 2.0)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Add Keywords   │
│  via Planner    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Enable Auto     │
│ in Settings     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cron Runs      │
│  Daily @ 9 AM   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Generates   │
│  Post Content   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Post to GMB    │
│  via n8n        │
└─────────────────┘
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `/api/cron/auto-post/route.js` | Main cron job - processes all users |
| `/api/keyword-research/route.js` | Keyword CRUD operations |
| `/api/user-settings/route.js` | Automation settings API |
| `/automation-settings/page.jsx` | User-facing settings UI |
| `/keyword-planner/page.jsx` | Keyword management UI |
| `models/User.js` | User schema with automation fields |
| `vercel.json` | Cron configuration |

## 📱 User Interface Pages

### 1. Keyword Planner (`/keyword-planner`)
- Search Google keywords with volume & competition
- Save keywords to database
- View saved keywords

### 2. Automation Settings (`/automation-settings`)
- View plan details and limits
- Configure posting frequency (daily/alternate/weekly)
- Set start date
- Enable/disable automation
- Preview posting schedule

## 🎯 Plan Limits

```javascript
Basic Plan: 20 posts
Professional Plan: 60 posts
Enterprise Plan: 150 posts
```

## 🤖 Automation Logic

### When Does It Post?

The cron runs **daily at 9:00 AM UTC** and checks:

1. ✅ Is automation enabled?
2. ✅ Is plan active (not expired)?
3. ✅ Are posts remaining?
4. ✅ Is GMB connected?
5. ✅ Should post today based on frequency?

If all checks pass → Generate & Post!

### Keyword Rotation

Keywords rotate automatically:
- If you have 3 keywords: A, B, C
- Posts will use: A, B, C, A, B, C, A...

### Frequency Options

- **Daily**: Posts every day
- **Alternate**: Posts every 2 days
- **Weekly**: Posts every 7 days

## 🧪 Testing

### Test Cron Manually

```bash
# Production
curl https://yourdomain.com/api/cron/auto-post

# Local (start dev server first)
npm run dev
curl http://localhost:3000/api/cron/auto-post
```

### Test Keyword API

```bash
# Get keywords
curl "https://yourdomain.com/api/keyword-research?userId=USR123"

# Add keyword
curl -X POST https://yourdomain.com/api/keyword-research \
  -H "Content-Type: application/json" \
  -d '{"userId":"USR123","keyword":"test","volume":1000}'
```

### Test Settings API

Requires authentication - test in browser with active session:

```javascript
// Save settings
fetch('/api/user-settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    automationEnabled: true,
    frequency: 'daily',
    keywords: ['keyword1', 'keyword2'],
    startDate: '2026-03-15'
  })
})
```

## 🐛 Common Issues & Fixes

### Issue: Cron not running
**Fix**: Check Vercel cron logs, ensure vercel.json is deployed

### Issue: No keywords showing
**Fix**: Check localStorage has userId, verify API endpoint

### Issue: Authentication error
**Fix**: Re-login, check NextAuth configuration

### Issue: GMB not connected
**Fix**: Re-authorize Google connection

### Issue: OpenAI errors
**Fix**: Verify API key, check credits/billing

## 📈 Monitoring

### Check Logs in Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs"
4. Filter by `/api/cron/auto-post`

### Expected Log Output

```
✅ [AUTO-POST] Successfully posted for USR123, keyword: "water purifier" (15/60)
```

### Error Indicators

```
❌ [AUTO-POST] Post failed for USR123: Token refresh failed
```

## 🔐 Security Checklist

- [x] NextAuth session validation
- [x] User can only access own data
- [x] OAuth tokens stored securely
- [x] API keys in environment variables
- [x] Refresh tokens encrypted in DB

## 📞 Support

- **Documentation**: See `AUTOMATION_GUIDE.md`
- **WhatsApp**: +91 9289344726
- **Email**: support@limbu.ai

## 🎉 Success Criteria

Your automation is working if:

1. ✅ User can login and see dashboard
2. ✅ GMB connection shows "Connected"
3. ✅ Keywords appear in automation settings
4. ✅ Automation toggle is enabled
5. ✅ Cron logs show successful posts
6. ✅ Posts appear in GMB account

## 🚦 Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 Active · 45d left | Plan is active |
| 🔴 Expired | Plan needs renewal |
| 🟡 Enabled | Automation is ON |
| ⚫ Disabled | Automation is OFF |

---

**Need Help?** Check the full documentation in `AUTOMATION_GUIDE.md`
