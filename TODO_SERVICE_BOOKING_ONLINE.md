# TODO: Add Online Payment for Service & Package Booking

## Progress: [X/6]

### Step 1: Update ServiceBooking Model ✅
- [ ] Add `referCode` field for franchise tracking

### Step 2: Create Razorpay Order API ✅
- [ ] Create `/api/service-booking/create-order` route

### Step 3: Update Service Booking API ✅
- [ ] Add verify payment endpoint in `/api/service-booking/route.js`

### Step 4: Create Service Booking Modal ✅
- [ ] Create `src/components/ServiceBookingModal.jsx`

### Step 5: Create Package Booking Modal ✅
- [ ] Create `src/components/PackageBookingModal.jsx`

### Step 6: Fix Package Booking Admin Page ✅
- [ ] Fix the table body rendering in `/src/app/admin/our-package/page.jsx`

---

## Implementation Notes:
- Use existing Razorpay integration pattern from subscribe API
- Support both online and offline payment methods
- Include referCode for franchise tracking
- Auto-set status to "paid" for online payments

