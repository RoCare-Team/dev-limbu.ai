# GMB Insights Fix Tasks

## Issues Fixed:
1. ✅ `businessProfileId: Path 'businessProfileId' is required` - validation error
2. ✅ `startDate.getFullYear is not a function` - when selecting 6 months

## All Changes Made:

### 1. `src/app/gmb-insights/page.jsx`
- Updated `fetchLocationInsights` function to:
  - Ensure dates are Date objects with validation
  - Convert string dates to Date objects
  - Added error handling for invalid date formats

### 2. `src/components/PerformanceInsightsModal.jsx`
- Updated `handleApplyDateRange` to ensure dates are proper Date objects
- Updated `handleLast1Month` to store `today` in a variable before passing
- Dates are now explicitly converted to Date objects before passing to parent

### 3. `src/models/PerformanceInsights.js`
- Changed `businessProfileId` field from `required: true` to `default: ""`
- This allows saving insights even when businessProfileId is not available

### 4. `src/app/api/performance-insights/route.js`
- Updated error message to be more descriptive for debugging

