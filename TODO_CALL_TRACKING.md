# Call Tracking Implementation Plan

## Task Summary
When remarks are added, count today's remarks to track:
- Total calls made
- Which agent made how many calls
- Properly track agent data in superAdmin

## Information Gathered

### Current System:
1. **User Model** (`src/models/User.js`):
   - Already has `remarksHistory` array with `{text, createdAt}`
   - Has `assignedAgentId` referencing Admin (agent)
   - Has `Remarks` for latest remark

2. **User Management Page** (`src/app/admin/user-management/page.jsx`):
   - Already displays remarks count per user
   - Allows adding remarks with default options (Call Not Picked, Not Interested, Interested, etc.)
   - Shows agent assignment

3. **Agent Model** (`src/models/Admin.js`):
   - Agents have role: "agent"
   - Can be fetched via `/api/admin/user-agent`

### What's Missing:
- No counter for today's calls per agent
- No dashboard/stats showing agent call performance
- No aggregation of remarks by date and agent

## Implementation Plan

### Step 1: Update User Model
Add `callCount` field to track total calls and modify the schema to support call tracking per agent.

### Step 2: Create Call Tracking API
- Create new API endpoint `/api/admin/call-stats` to fetch:
  - Today's call count per agent
  - Total calls per agent
  - Agent-wise breakdown

### Step 3: Modify Remarks API
Update the user update API to:
- Increment call counter when a remark is added
- Track which agent added the remark
- Store the date of the call

### Step 4: Update SuperAdmin Dashboard
- Add call statistics section
- Show today's calls by each agent
- Display total calls per agent

## Files to Modify:
1. `src/models/User.js` - Add call tracking fields
2. `src/app/api/users/route.js` - Update to track calls
3. New: `src/app/api/admin/call-stats/route.js` - API for call statistics
4. `src/app/admin/dashboard/page.jsx` - Display call stats

## Followup Steps:
1. Test the remark addition flow
2. Verify call counts are incremented
3. Check dashboard displays correct data

