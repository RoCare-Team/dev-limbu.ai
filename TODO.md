# Franchise Leads Fix TODO

## Plan Breakdown
1. **[x]** Edit src/app/admin/franchise/franchise-lead/page.jsx:
   - Disable FU table filtering for franchiseAdmin (tabs/stats only).
   - Remove "Table filter" banner for franchiseAdmin.
   - Ensure default "all" tab.
2. **[x]** Test as franchiseAdmin:
   - Full leads table always visible.
   - FU tabs show correct stats (0 if none).
   - Add FU remark → stats update.
3. **[ ]** attempt_completion

Progress: All edits complete. Test: franchiseAdmin login → table always full own leads (no "Today" filter), stats update on tabs.

