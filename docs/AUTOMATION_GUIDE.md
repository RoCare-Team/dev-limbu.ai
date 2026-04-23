# GMB Automated Posting System - Complete Guide

## Overview

The GMB Automated Posting System is a fully automated solution that creates and publishes posts to Google My Business accounts on a daily basis using AI-generated content based on user-defined keywords. The system operates completely autonomously once configured, continuing until the user's plan expires or all allocated posts are consumed.

## Key Features

✅ **Fully Automated** - No manual intervention required after setup  
✅ **Session-Based Authentication** - Uses NextAuth for secure user sessions  
✅ **AI-Generated Content** - OpenAI GPT-4 generates engaging posts with images  
✅ **Keyword Rotation** - Automatically cycles through saved keywords  
✅ **Plan-Based Limits** - Respects user's subscription plan and post limits  
✅ **Flexible Scheduling** - Daily, alternate days, or weekly posting  
✅ **GMB Integration** - Direct posting to Google My Business via OAuth  

## System Architecture

### 1. User Flow

```
User Login (NextAuth) 
  → Connect GMB Account (OAuth)
  → Add Keywords (Keyword Planner)
  → Configure Automation Settings
  → Enable Automation
  → System Posts Automatically (Daily Cron)
```

### 2. Database Schema

#### User Model (`src/models/User.js`)
```javascript
{
  userId: String,
  email: String,
  paidPackage: String, // "Basic Plan", "Professional Plan", "Enterprise Plan"
  postsUsed: Number,
  packageExpiryDate: Date,
  isBusinessConnected: Boolean,
  connectedBusinessEmail: String,
  
  automationSettings: {
    automationEnabled: Boolean,
    frequency: String, // "daily", "alternate", "weekly"
    keywords: [String],
    startDate: Date,
    lastPostDate: Date
  }
}
```

#### Keyword Model (`src/app/api/keyword-research/route.js`)
```javascript
{
  userId: String,
  keyword: String,
  volume: Number,
  competition: String,
  competitionIndex: Number,
  createdAt: Date
}
```

#### GmbUser Model (`src/models/GmbUser.js`)
```javascript
{
  email: String,
  projects: [{
    googleId: String,
    accessToken: String,
    refreshToken: String,
    createdAt: Date,
    updatedAt: Date
  }]
}
```

### 3. API Endpoints

#### `/api/user-settings` (GET)
- **Purpose**: Fetch user's automation settings and plan details
- **Auth**: NextAuth session required
- **Response**:
```json
{
  "automationSettings": {
    "automationEnabled": true,
    "frequency": "daily",
    "keywords": ["water purifier", "RO service"],
    "startDate": "2026-03-01",
    "lastPostDate": "2026-03-14"
  },
  "plan": {
    "package": "Professional Plan",
    "limit": 60,
    "postsUsed": 15,
    "remaining": 45,
    "expiryDate": "2026-06-01",
    "isValid": true,
    "isBusinessConnected": true
  }
}
```

#### `/api/user-settings` (POST)
- **Purpose**: Save automation settings
- **Auth**: NextAuth session required
- **Body**:
```json
{
  "automationEnabled": true,
  "frequency": "daily",
  "keywords": ["keyword1", "keyword2"],
  "startDate": "2026-03-15"
}
```

#### `/api/keyword-research` (GET)
- **Purpose**: Fetch saved keywords for a user
- **Query**: `?userId=USR123`
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "abc123",
      "userId": "USR123",
      "keyword": "water purifier",
      "volume": 5000,
      "competition": "MEDIUM"
    }
  ]
}
```

#### `/api/keyword-research` (POST)
- **Purpose**: Add a keyword
- **Body**:
```json
{
  "userId": "USR123",
  "keyword": "RO service",
  "volume": 3000,
  "competition": "LOW"
}
```

#### `/api/keyword-research` (DELETE)
- **Purpose**: Delete a keyword
- **Query**: `?id=abc123`

#### `/api/cron/auto-post` (GET)
- **Purpose**: Daily cron job that processes all users and posts
- **Schedule**: Runs at 9:00 AM daily (configured in `vercel.json`)
- **Process**:
  1. Find users with `automationEnabled: true`
  2. Verify plan is active and not expired
  3. Check if posts remaining
  4. Verify GMB connection exists
  5. Check if should post today (based on frequency)
  6. Rotate through keywords
  7. Generate post content using OpenAI
  8. Publish to GMB via n8n webhook
  9. Update `postsUsed` and `lastPostDate`

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` or Vercel environment:

```env
# Google OAuth (for GMB)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://yourdomain.com

# MongoDB
MONGODB_URI=your_mongodb_connection_string
```

### 2. Vercel Cron Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-post",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule Format**: `0 9 * * *` = Every day at 9:00 AM UTC

To change the time:
- `0 6 * * *` = 6:00 AM UTC (11:30 AM IST)
- `30 8 * * *` = 8:30 AM UTC (2:00 PM IST)
- `0 12 * * *` = 12:00 PM UTC (5:30 PM IST)

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google My Business API**
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

### 4. OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add to `.env` as `OPENAI_API_KEY`
4. Ensure you have credits/billing enabled

## User Guide

### For End Users

#### Step 1: Login & Connect GMB
1. Login to the application using NextAuth
2. Navigate to Dashboard
3. Click "Connect Google Business"
4. Authorize GMB access

#### Step 2: Add Keywords
1. Go to **Keyword Planner** (`/keyword-planner`)
2. Search for relevant keywords
3. Add keywords to your saved list
4. Keywords are stored per user

#### Step 3: Configure Automation
1. Navigate to **Automation Settings** (`/automation-settings`)
2. Review your current plan and post limits
3. Select posting frequency:
   - **Daily**: Posts every day
   - **Alternate Days**: Posts every 2 days
   - **Weekly**: Posts once per week
4. Set start date
5. Review schedule preview
6. Toggle automation ON
7. Click "Save settings"

#### Step 4: Monitor
- Automation runs daily at 9:00 AM
- Check post count in dashboard
- Posts will continue until:
  - Plan expires
  - All posts consumed
  - User disables automation

## Technical Details

### Post Generation Logic

The system uses OpenAI GPT-4 to generate posts:

```javascript
const prompt = `Create a Google My Business post for ${businessName} located in ${location}.
Focus keyword: "${keyword}".
Create an engaging post with:
- Text (max 150 characters)
- Relevant emojis
- Call-to-action
- 2-3 relevant hashtags
- Professional image prompt for AI generation

Return ONLY valid JSON in this exact format:
{"text": "post text here", "hashtags": ["#hashtag1", "#hashtag2"], "imagePrompt": "detailed image description"}`;
```

### Posting Frequency Logic

```javascript
function shouldPostToday(startDate, frequency, lastPostDate) {
  const daysSinceLastPost = Math.floor((today - lastPost) / (1000 * 60 * 60 * 24));
  
  if (frequency === 'daily') return daysSinceLastPost >= 1;
  if (frequency === 'alternate') return daysSinceLastPost >= 2;
  if (frequency === 'weekly') return daysSinceLastPost >= 7;
}
```

### Keyword Rotation

Keywords are rotated sequentially:

```javascript
const keywordIndex = (user.postsUsed || 0) % automationSettings.keywords.length;
const keyword = automationSettings.keywords[keywordIndex];
```

**Example**: If you have 3 keywords ["A", "B", "C"] and have posted 5 times:
- Post 1: Keyword A (0 % 3 = 0)
- Post 2: Keyword B (1 % 3 = 1)
- Post 3: Keyword C (2 % 3 = 2)
- Post 4: Keyword A (3 % 3 = 0)
- Post 5: Keyword B (4 % 3 = 1)

### Plan Limits

```javascript
const planLimits = {
  "Basic Plan": 20 posts,
  "Professional Plan": 60 posts,
  "Enterprise Plan": 150 posts
}
```

## Troubleshooting

### Common Issues

#### 1. Posts Not Being Created

**Check**:
- Is automation enabled in settings?
- Is plan active and not expired?
- Are keywords added?
- Is GMB account connected?
- Check cron logs in Vercel dashboard

**Solution**:
```bash
# Test cron manually
curl https://yourdomain.com/api/cron/auto-post
```

#### 2. Authentication Errors

**Check**:
- NextAuth session valid?
- Google OAuth tokens refreshing?
- Refresh token exists in GmbUser?

**Solution**:
- Re-connect GMB account
- Check environment variables

#### 3. OpenAI Errors

**Check**:
- API key valid?
- Credits available?
- Rate limits?

**Solution**:
- Verify `OPENAI_API_KEY` in env
- Check OpenAI dashboard for usage

#### 4. Keywords Not Loading

**Check**:
- `userId` in localStorage?
- API endpoint working?

**Solution**:
```javascript
// Check console
console.log(localStorage.getItem("userId"));

// Test API
fetch("/api/keyword-research?userId=USR123")
  .then(r => r.json())
  .then(console.log);
```

## Monitoring & Logs

### Vercel Logs

View logs in Vercel Dashboard:
1. Go to your project
2. Click "Logs" tab
3. Filter by `/api/cron/auto-post`

### Log Format

```
[AUTO-POST CRON] Started at 2026-03-14T09:00:00Z
[AUTO-POST] Found 5 users with automation enabled
[AUTO-POST] Processing user USR123, keyword: "water purifier"
✅ [AUTO-POST] Successfully posted for USR123, keyword: "water purifier" (15/60)
[AUTO-POST] Completed: {
  "success": true,
  "processed": 5,
  "successCount": 4,
  "skipCount": 1,
  "errorCount": 0
}
```

## Security Considerations

1. **Authentication**: All endpoints use NextAuth sessions
2. **Authorization**: Users can only access their own data
3. **Token Security**: Refresh tokens stored encrypted in database
4. **Rate Limiting**: OpenAI and Google APIs have rate limits
5. **Data Privacy**: User keywords and settings are private

## Future Enhancements

- [ ] Support for multiple GMB locations
- [ ] Custom post templates
- [ ] A/B testing for posts
- [ ] Analytics dashboard
- [ ] Email notifications for posts
- [ ] Social media integration (Facebook, Instagram)
- [ ] Image generation via DALL-E
- [ ] Post performance tracking

## Support

For issues or questions:
- Email: support@yourdomain.com
- WhatsApp: +91 9289344726
- Documentation: `/automation-settings`

---

**Version**: 1.0.0  
**Last Updated**: March 14, 2026  
**Maintained By**: GMB Automation Team
