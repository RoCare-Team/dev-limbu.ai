# Chatbot Action API - Implementation Flow Diagram

## Complete System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           CHATBOT CLIENT                                    │
│                    (Mobile App / Web Chat Interface)                       │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │
                    1. First Time: Setup Business Connection
                    ┌────────────────────────────────────────────┐
                    │  POST /api/chatbot/business-map             │
                    │  • sessionId                                 │
                    │  • locationId (GMB location)                │
                    │  • businessData (name, address, etc)        │
                    │  • gmbDetails (GMB-specific info)           │
                    └────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  ChatbotBusinessMap Collection (MongoDB)   │
                    │  • Stores session → business mapping       │
                    │  • Status: active/inactive                 │
                    │  • Indexed on: sessionId + locationId      │
                    └────────────────────────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  Response: { success: true, mappingId: ... }
                    └────────────────────────────────────────────┘

                    2. Trigger Action: Every User Interaction
                    ┌────────────────────────────────────────────┐
                    │  POST /api/chatbot/action                   │
                    │  • action: website|health_score|magic_qr|insights
                    │  • session_id                               │
                    │  • locationId                               │
                    │  • email                                    │
                    └────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  API: Validate Input                        │
                    │  ✓ Check action type valid                 │
                    │  ✓ Check all required fields               │
                    └────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  API: Verify Business Mapping Exists       │
                    │  Query ChatbotBusinessMap by:              │
                    │  • sessionId + locationId                  │
                    └────────────────────┬──────────────────────────┘
                                         │
                         ┌───────────────┴────────────────┐
                         │                                 │
                    Not Found                          Found
                         │                                 │
                         ▼                                 ▼
                    ┌─────────────┐       ┌────────────────────────────┐
                    │ Return 404  │       │ Create ChatbotActions      │
                    │ "Business   │       │ • sessionId                │
                    │  not        │       │ • action                   │
                    │ connected"  │       │ • status: "pending"        │
                    └─────────────┘       │ • result: {}               │
                                         │ • maxRetries: 3            │
                                         └────────────┬───────────────┘
                                                      │
                                                      ▼
                                         ┌────────────────────────────┐
                                         │ MongoDB: Save Action       │
                                         │ Status: PENDING            │
                                         └────────────┬───────────────┘
                                                      │
                                                      ▼
                                         ┌────────────────────────────┐
                                         │ Queue for Processing       │
                                         │ processingQueue.push(_id)  │
                                         └────────────┬───────────────┘
                                                      │
                                                      ▼
                                         ┌────────────────────────────┐
                                         │ Response 202 ACCEPTED      │
                                         │ { success: true,           │
                                         │   actionId: "...",         │
                                         │   status: "pending" }      │
                                         └────────────────────────────┘
                                                      │
                                                      │ (IMMEDIATE RETURN TO CLIENT)
                                                      │
                                                      ▼
                    ┌────────────────────────────────────────────┐
                    │         BACKGROUND ASYNC PROCESSOR        │
                    │      (Triggered immediately or from cron)  │
                    └────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  While Queue Not Empty:                    │
                    │  1. Shift action from queue                │
                    │  2. Fetch action from MongoDB              │
                    │  3. Update status to "processing"          │
                    └────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  Fetch Business Mapping from MongoDB       │
                    │  Using: sessionLocationKey                 │
                    └────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  Process Based on Action Type:             │
                    └────────────────────┬──────────────────────────┘
                                         │
                   ┌─────────────────────┼─────────────────────┬──────────┐
                   │                     │                     │          │
                   ▼                     ▼                     ▼          ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   ┌──────────────┐
        │   WEBSITE        │  │  HEALTH_SCORE    │  │  MAGIC_QR    │   │  INSIGHTS    │
        ├──────────────────┤  ├──────────────────┤  ├──────────────┤   ├──────────────┤
        │ • Generate slug  │  │ • Calc score     │  │ • Generate   │   │ • Get mock   │
        │ • Create URL     │  │   (65-95%)       │  │   QR URL     │   │   analytics  │
        │ • Mock website   │  │ • Metrics data   │  │ • QR image   │   │ • Metrics    │
        │   description    │  │                  │  │ • Link to    │   │ • Growth %   │
        │                  │  │                  │  │   reviews    │   │              │
        └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘   └──────┬──────┘
                 │                     │                   │                  │
                 └─────────────────────┼───────────────────┼──────────────────┘
                                       │
                                       ▼
                    ┌────────────────────────────────────────────┐
                    │  Update MongoDB: ChatbotActions            │
                    │  • status: "success"                       │
                    │  • result: { action specific data }        │
                    │  • updatedAt: now()                        │
                    └────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  Send Webhook Notification (with retries)  │
                    │  POST to:                                  │
                    │  https://limbubot.limbutech.in/webhook/    │
                    │  action-complete                           │
                    └────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  Webhook Payload: Success                  │
                    │  {                                         │
                    │    session_id: "...",                      │
                    │    action: "website",                      │
                    │    status: "success",                      │
                    │    result: { url: "...", message: "..." }  │
                    │  }                                         │
                    └────────────────────────────────────────────┘
                                         │
                                         │ (Process Queue continues with next item)
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  3. Check Status (Client Polling)          │
                    │  GET /api/chatbot/action?actionId=...      │
                    └────────────────────┬──────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────────┐
                    │  Response: Action Status                   │
                    │  {                                         │
                    │    success: true,                          │
                    │    status: "success",                      │
                    │    result: { ... action results ... }      │
                    │  }                                         │
                    └────────────────────────────────────────────┘
```

## Timeline Sequence Diagram

```
┌──────────┐                          ┌────────────────┐
│  Client  │                          │  API Server    │
└──────────┘                          └────────────────┘
      │                                       │
      │ 1. POST /api/chatbot/action          │
      ├───────────────────────────────────────>
      │                                       │ ✓ Validate
      │                                       │ ✓ Check mapping
      │                                       │ ✓ Create record
      │                                       │ ✓ Queue action
      │                                       │ 📤 Queue item
      │                                       │    to processor
      │                                       │
      │ 2. 202 Accepted (immediately)        │
      │    { actionId: "abc123", ... }       │
      <───────────────────────────────────────┤
      │                                       │
      │                          🔄 Background Processing
      │                          ┌────────────┘
      │                          │
      │                          │ • Fetch action
      │                          │ • Fetch mapping
      │                          │ • Process action
      │                          │ • Update DB
      │                          │ ⏱️  ~100-500ms
      │                          │
      │                          │ 📡 Send webhook
      │                          │    (with retries)
      │                          │
      │                          ✓ Complete
      │
      │ 3. GET /api/chatbot/action?actionId=...
      ├───────────────────────────────────────>
      │                                       │
      │                                       │ ✓ Fetch action
      │                                       │   from MongoDB
      │                                       │
      │ 4. 200 OK                            │
      │    { status: "success",              │
      │      result: { ... } }               │
      <───────────────────────────────────────┤
      │                                       │
      │ 5. (Optional) Receive Webhook        │
      │    notification on callback URL      │
      ─────────────────────────────────────> (configured endpoint)
      │
      ✓ Done
```

## Retry Flow on Failure

```
┌─────────────────────────────────────────┐
│  Action Processing Fails                 │
│  (e.g., DB error, timeout)              │
└──────────────┬────────────────────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Increment retryCount     │
    │ Check: retryCount < 3?   │
    └──────────────┬────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
       YES                   NO
        │                     │
        ▼                     ▼
    ┌────────────┐       ┌──────────────────┐
    │ Set status │       │ Set status       │
    │ "pending"  │       │ "failed"         │
    │            │       │                  │
    │ Re-queue   │       │ Save error msg   │
    │ for retry  │       │                  │
    │            │       │ Send failure     │
    │ Wait: 1s   │       │ webhook:         │
    │ (exp. bo.) │       │ { status:        │
    │            │       │   "failed",      │
    │ Will retry │       │   result: {      │
    │ on next    │       │   message: "..." │
    │ cron call  │       │ } }              │
    └────────────┘       └──────────────────┘
```

## Database Schema Relationships

```
┌────────────────────────────────────────────┐
│   ChatbotBusinessMap                       │
├────────────────────────────────────────────┤
│ _id: ObjectId                              │
│ sessionId: String (indexed)                │
│ locationId: String (indexed)               │
│ sessionLocationKey: String (unique key)◄──────┐
│ email: String (indexed)                   │  │
│ businessData: {                            │  │
│   title, locality, address, ...            │  │
│ }                                          │  │
│ status: String (active/inactive)           │  │
│ createdAt, updatedAt: Date                 │  │
└────────────────────────────────────────────┘  │
                                                │
                                                │
┌────────────────────────────────────────────┐  │
│   ChatbotActions                           │  │
├────────────────────────────────────────────┤  │
│ _id: ObjectId                              │  │
│ sessionId: String (indexed)                │  │
│ action: String (website|health|...)        │  │
│ locationId: String (indexed)               │  │
│ email: String                              │  │
│ status: String (pending→processing→success)  │ Uses mapping via
│ result: Object { action specific }         │  sessionLocation
│ error: String                              │  Key lookup
│ retryCount: Number                         │  │
│ maxRetries: Number (default: 3)            │  │
│ createdAt, updatedAt: Date                 │  │
└────────────────────────────────────────────┘  │
                                                │
                                    ┌───────────┘
                                    │
                          (Lookup by compound key)
```

## Queue Processing Loop

```
Start
  │
  ▼
┌─────────────────────────────┐
│ isProcessing === false?     │
│ processingQueue.length > 0? │
└──────────┬──────────────────┘
           │
         YES (both true)
           │
           ▼
    ┌──────────────────┐
    │ isProcessing =   │
    │ true             │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ While queue not empty:   │
    │ 1. actionId = queue.shift
    │ 2. processActionItem(id) │
    │ 3. wait 100ms            │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ isProcessing =   │
    │ false            │
    │ return           │
    └─────────────────┘
           │
           ▼
         Done
```

## Action Result Examples

### Website Action Result
```json
{
  "url": "https://abc-restaurant-mumbai.limbu.ai",
  "slug": "abc-restaurant-mumbai",
  "message": "Aapki website ready hai",
  "description": "Beautiful website for ABC Restaurant in Mumbai",
  "timestamp": "2024-01-15T10:35:24.521Z"
}
```

### Health Score Result
```json
{
  "score": 85,
  "percentage": "85%",
  "message": "Your business health score is 85%",
  "metrics": {
    "profileCompleteness": 87.3,
    "reviewRating": 4.2,
    "responseTime": 2,
    "photosCount": 18
  },
  "recommendation": "Your profile is looking great!",
  "timestamp": "2024-01-15T10:35:24.521Z"
}
```

### Magic QR Result
```json
{
  "qrUrl": "https://qr.limbu.ai/abc-restaurant-mumbai",
  "slug": "abc-restaurant-mumbai",
  "message": "Magic QR generated successfully",
  "qrImageUrl": "https://qr.limbu.ai/abc-restaurant-mumbai/qr-code.png",
  "destinationUrl": "https://abc-restaurant-mumbai.limbu.ai/reviews",
  "timestamp": "2024-01-15T10:35:24.521Z"
}
```

### Insights Result
```json
{
  "period": "last_30_days",
  "message": "Analytics data for your business",
  "metrics": {
    "totalViews": 3200,
    "totalInteractions": 850,
    "reviewsCount": 25,
    "callsCount": 120,
    "messagesCount": 280,
    "websiteClicks": 420
  },
  "topInteractions": [
    { "type": "phone_calls", "count": 120 },
    { "type": "reviews", "count": 25 },
    { "type": "messages", "count": 280 },
    { "type": "website_visits", "count": 420 }
  ],
  "growthRate": "32.50",
  "timestamp": "2024-01-15T10:35:24.521Z"
}
```

## Key Design Decisions

### 1. **Immediate 202 Response**
- Client gets instant feedback without waiting
- Improves user experience
- Backend processing doesn't block the request

### 2. **Background Queue Processing**
- Simple in-memory queue for MVP
- Can upgrade to Redis for production
- Processing happens in parallel with other requests

### 3. **Webhook Notifications**
- Asynchronous updates to external service
- Retries with exponential backoff
- Reliable delivery mechanism

### 4. **Compound Indexing**
- Fast lookups on sessionId + locationId
- Optimized for common queries
- Reduced database load

### 5. **Retry Logic**
- Max 3 retries for failed actions
- Exponential backoff (1s, 2s, 4s)
- Clear failure state after max retries

---

This flow ensures:
✅ Non-blocking client experience
✅ Reliable background processing
✅ External service notifications
✅ Automatic error handling & retries
✅ Optimized database queries
