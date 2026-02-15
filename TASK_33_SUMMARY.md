# Task #33: UI Testing for Atomic Transaction - Summary

## ✅ Created & Scheduled

**Task #33** has been added to your task tracking with the following details:

### 📋 Task Definition
- **Title:** UI Testing for Atomic Transaction (Post-Inventory Completion)
- **Estimated Time:** 2-3 hours
- **Priority:** High (Data integrity verification)
- **Status:** Pending (awaiting inventory prerequisites)

---

## 🔗 Dependencies

Task #33 **cannot start** until these tasks are complete:

| Task | Description | Status |
|------|-------------|--------|
| #9 | Implement "Add Material" dialog | ❌ Pending |
| #13 | Implement "Add Plant" dialog | ❌ Pending |
| #14 | Implement "Add Equipment" dialog | ❌ Pending |
| #15 | Implement "Add Team" dialog | ❌ Pending |

**Why dependencies?**
- Need working inventory dialogs to create test materials quickly
- Need to verify inventory updates in UI
- Cannot test order→inventory flow without functional inventory management

---

## 📊 Task Placement in Timeline

```
Week 1: Security Foundation (Tasks #20-29, #3) 🔴 CRITICAL
Week 2: Monitoring & Integrity (Tasks #30, #4, #31) + RLS (#3)
Week 3: Core Polish (Tasks #5-8, #10-11)
        └── AFTER inventory dialogs (#9, #13-15) complete → START Task #33
Week 4: Beta & Testing (Tasks #12, #16-18, #19)
```

**Recommended Scheduling:**
- Complete all Tier 2 Core Fixes first (Tasks #5-11)
- When inventory dialogs (#9, #13-14-15) are done → **immediately run Task #33**
- This validates the atomic transaction before moving to export features

---

## 🧪 What Task #33 Tests

### From the App UI (Not SQL)

1. **End-to-end workflow:**
   - Operator creates order with materials via UI
   - Operator submits order
   - Engineer approves order from orders page
   - Verify: Order status changes
   - Verify: Inventory quantities deducted in real-time

2. **Atomic behavior validation:**
   - Rollback on insufficient inventory
   - No partial state (order NOT approved if inventory fails)

3. **Permission enforcement:**
   - Operators cannot approve orders (error shown in UI)

4. **Real-time sync:**
   - Multiple users see updates instantly

---

## 📁 Deliverables for Task #33

When you complete the UI testing, you'll need:

1. ✅ Run all test cases in `UI_ATOMIC_TEST_GUIDE.md`
2. ✅ Document results (pass/fail, screenshots if issues)
3. ✅ Update `active-tasks.md` → mark Task #33 complete
4. ✅ Update `SECURITY_FIRST_SUMMARY.md` → atomic verification status
5. ✅ Update `ATOMIC_TRANSACTION_TESTING_GUIDE.md` with UI test results

---

## 🎯 Success Criteria

Task #33 is **complete** when:

- ✅ All 6 UI test cases passed (TC-UI-01 through TC-UI-06)
- ✅ Atomic behavior confirmed end-to-end
- ✅ No integration issues discovered
- ✅ Documentation updated
- ✅ Task tracking updated

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `UI_ATOMIC_TEST_GUIDE.md` | Detailed step-by-step UI testing procedures |
| `ATOMIC_TRANSACTION_TESTING_GUIDE.md` | SQL-based testing (lower level) |
| `test-atomic-transaction.js` | Automated Node.js test script (optional) |
| `verify-atomic-setup.sql` | SQL verification queries |
| `src/migrations/002_atomic_approval_transaction.sql` | Database function |
| `src/lib/hooks/useProductionOrders.ts:364-411` | Integration code |

---

## ⚠️ Important Notes

1. **Do NOT skip inventory dependencies:** Trying to test atomic transaction without working inventory dialogs will fail (you can't create test data efficiently).

2. **Use test accounts:** Create separate engineer and operator accounts for testing. Do not use real production data.

3. **Test data cleanup:** After testing, either delete test orders/materials or reset quantities to avoid polluting dev database.

4. **Document issues:** If you discover bugs during UI testing, create new tasks and reference Task #33.

---

## 🔄 When to Run

**Trigger:** As soon as **all 4 inventory dialogs** (#9, #13, #14, #15) are functional.

**Why early?**
- Atomic transaction is data integrity critical
- Must verify it works BEFORE you enable full testing or move to export features
- Early detection prevents inventory → order data corruption in later testing phases

---

**Created:** 2026-02-15
**Status:** Pending (awaiting inventory dialogs)
**Next:** Complete Tasks #9, #13, #14, #15 → then execute Task #33
