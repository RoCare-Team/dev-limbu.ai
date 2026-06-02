# Franchise Panel Documentation

## 1. Login & Franchise Code Flow

### Login Page

**File:**

```text
src/app/franchise-panel/login/page.jsx
```

Franchise or team member login is handled from this page.

### Login API

```http
POST /api/franchise-panel/auth/login
```

**API File**

```text
src/app/api/franchise-panel/auth/login/route.js
```

### Local Storage Values

After successful login, the following values are stored:

```javascript
localStorage.setItem("franchise_token", ...)
localStorage.setItem("franchise_user", ...)
localStorage.setItem("franchise_code", ...)
```

### Important

The Leads page fetches data based on:

```javascript
franchise_code
```

### Protected Layout

**File**

```text
src/app/franchise-panel/(protected)/layout.jsx
```

Checks whether:

```javascript
localStorage.getItem("franchise_token")
```

exists.

If not found:

```text
/franchise-panel/login
```

is opened automatically.

---

# 2. Leads Page

### File

```text
src/app/franchise-panel/(protected)/leads/page.jsx
```

### Features

* Users / Leads table
* Search filter
* Add Lead modal
* Remarks modal
* Wallet display
* Lead stage display
* Refer code display
* Created date display

### Initial Data Fetch

```javascript
fetchUsers();
fetchAgents();
```

### Franchise Code Fetch

```javascript
const franchiseCode =
  localStorage.getItem("franchise_code");
```

### API Call

```javascript
/api/franchise-panel/franchise-user?referCode=${franchiseCode}
```

This means the logged-in franchise code is sent to the API.

Only leads belonging to that franchise are returned.

---

# 3. Franchise User API

### File

```text
src/app/api/franchise-panel/franchise-user/route.js
```

### Supported Methods

* GET
* POST
* PUT

---

## GET Flow

### Single User Fetch

```http
/api/franchise-panel/franchise-user?userId=USER_ID
```

Used by the Remarks Modal.

---

### Franchise Leads Fetch

```http
/api/franchise-panel/franchise-user?referCode=FRANCHISE_CODE
```

The API first validates the franchise.

```javascript
FranchisePanel.findOne({
  franchiseCode: regex,
  isActive: true
})
```

### Franchise Model

```text
src/models/franchisePanel.js
```

### Lead Filtering Logic

**File**

```text
src/lib/franchiseLeadsQuery.js
```

**Function**

```javascript
buildFranchiseLeadsFilter(code)
```

### Lead Matching Rules

Users are considered franchise leads when:

#### Rule 1

```javascript
franchiseId === franchiseCode
```

#### Rule 2

```javascript
referCode === franchiseCode
```

and

```javascript
leadTags.includes("franchise-panel")
```

#### Rule 3 (Legacy Leads)

```javascript
source === "manual-upload"
```

---

### User Model

**File**

```text
src/models/User.js
```

### Important Fields

```javascript
referCode
franchiseId
leadTags
wallet
leadStage
remarksHistory
source
subscription
```

---

# 4. Add Lead Flow

### Source

```text
src/app/franchise-panel/(protected)/leads/page.jsx
```

Clicking **Add Lead** opens the modal.

### API Request

```http
POST /api/franchise-panel/franchise-user
```

### Request Body

```json
{
  "fullName": "",
  "email": "",
  "phone": "",
  "referCode": "",
  "plan": ""
}
```

---

## Validation

API validates:

* Full name required
* Email required
* Refer code required
* Duplicate email check
* Franchise code must exist
* Franchise must be active

---

## User Creation

```javascript
User.create({
  userId,
  fullName,
  email,
  phone,

  referCode: franchiseCode,
  franchiseId: franchiseCode,

  leadTags: ["franchise-panel"],

  wallet: 500,
  freeUsedCount: 2,

  leadStage: "Active",

  source: "manual-upload",

  subscription: {
    plan,
    status,
    date
  }
})
```

### Franchise Identification

Every manually created lead is tagged using:

```javascript
franchiseId
referCode
leadTags: ["franchise-panel"]
source: "manual-upload"
```

---

# 5. Remarks Flow

### Component

```text
src/components/FranchiseLeads/RemarksModal.jsx
```

### Open Remarks

```javascript
openRemarks(user)
```

### User Fetch

```http
GET /api/franchise-panel/franchise-user?userId=USER_ID
```

---

## Add Remark

### API

```http
PUT /api/franchise-panel/franchise-user
```

### Body

```json
{
  "userId": "USER_ID",
  "remark": "Remark text"
}
```

---

## Delete Remark

### Body

```json
{
  "userId": "USER_ID",
  "remarkId": "REMARK_ID",
  "action": "delete"
}
```

### Database Update

Updates:

```javascript
remarksHistory
```

inside the User document.

---

# 6. Dashboard Stats Component

### File

```text
src/components/FranchiseLeads/DashboardStats.jsx
```

### Current Issue

Component uses:

```javascript
localStorage.getItem("franchiseCode")
```

But login stores:

```javascript
localStorage.getItem("franchise_code")
```

### Impact

Dashboard stats may return empty data.

### Recommended Fix

Replace:

```javascript
franchiseCode
```

with:

```javascript
franchise_code
```

---

# Overall System Flow

```text
Franchise Login
        │
        ▼
franchise_code saved in localStorage
        │
        ▼
Protected Leads Page Opens
        │
        ▼
Leads Page Sends:
referCode=franchise_code
        │
        ▼
API Validates Franchise
        │
        ▼
Fetch Franchise Leads
        │
        ▼
Display Leads Table
        │
        ▼
Add Lead
        │
        ▼
Create User Under Same Franchise
        │
        ▼
Remarks Update
        │
        ▼
remarksHistory Updated
```

---

# Known Issues

## 1. Dashboard Stats Key Mismatch

### Current

```javascript
localStorage.getItem("franchiseCode")
```

### Expected

```javascript
localStorage.getItem("franchise_code")
```

---

## 2. Misleading fetchAgents()

### Current

```javascript
fetchAgents()
```

Actually calls:

```http
/api/franchise-panel/franchise-user
```

and stores:

```javascript
setAgents(data.users)
```

No dedicated agents API is being used.

---

## 3. Agent Assignment Logic

### Current

```javascript
handleAssignChange()
```

sends:

```javascript
{
  userId,
  agentId
}
```

to:

```http
POST /api/franchise-panel/franchise-user
```

However:

```http
POST /franchise-user
```

is designed for:

* Add Lead

Not:

* Assign Agent

Currently not causing issues because the assignment UI is commented out.
