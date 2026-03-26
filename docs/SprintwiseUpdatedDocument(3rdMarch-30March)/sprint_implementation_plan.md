# TRF Enrichment — Implementation Plan

## Problem

The `trfs` table has only **5 columns**: `id`, `trfNumber`, `projectId`, `projectName`, `notes`.  
The TRFs page UI already renders `status`, `createdAt`, and other fields — but they don't exist in the DB, so every TRF card shows blank/empty data.

## What Will Change

### 1. Database Migration  
**[NEW]** `backend/db_migrations/006_add_trf_fields.py`  
Adds the following columns to the `trfs` table via `ALTER TABLE … ADD COLUMN IF NOT EXISTS`:

| Column | Type | Default |
|---|---|---|
| `status` | `VARCHAR(50)` | `'Draft'` |
| `test_type` | `VARCHAR(255)` | `NULL` |
| `description` | `TEXT` | `NULL` |
| `sample_description` | `TEXT` | `NULL` |
| `priority` | `VARCHAR(50)` | `'Normal'` |
| `approved_by` | `VARCHAR(255)` | `NULL` |
| `created_at` | `TIMESTAMP` | `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | `CURRENT_TIMESTAMP` |

---

### 2. Backend — TRF Model  
**[MODIFY]** `backend/app/modules/trf/models.py`  
Add the 8 new SQLAlchemy columns matching the migration.

---

### 3. Backend — TRF Schemas  
**[MODIFY]** `backend/app/modules/trf/schemas.py`  
- Add new fields to `TRFCreate` (all optional)
- Add `status`, `createdAt`, `testType`, `description`, `sampleDescription`, `priority`, `approvedBy` to `TRFResponse`

---

### 4. Backend — TRF Routes (status update endpoint)  
**[MODIFY]** `backend/app/modules/trf/routes.py`  
- Add `PATCH /trfs/{id}/status` endpoint to allow updating TRF status (Draft → Submitted → Approved/Rejected)

---

### 5. Frontend — CreateTRFForm  
**[MODIFY]** `src/components/labManagement/forms/CreateTRFForm.jsx`  
Add new fields to the form:
- **Test Type** (dropdown: EMC, RF, Safety, Environmental, Electrical, Chemical, Mechanical)
- **Description** (textarea) — what is being tested
- **Sample Description** (textarea) — sample details
- **Priority** (dropdown: Low, Normal, High, Urgent)

---

### 6. Frontend — TRFs Page  
**[MODIFY]** `src/pages/lab/management/TRFs.jsx`  
Enrich each TRF card to display:
- Test Type badge
- Priority indicator
- Description snippet
- Approved By (when status = Approved)

Also add status-change action button on card (Submit / Approve / Reject) based on user role.

---

### 7. Frontend — labManagementApi.js  
**[MODIFY]** `src/services/labManagementApi.js`  
Add `updateStatus(id, status)` to `trfsService`.

### 8. Frontend — TRF Details Page  
**[NEW]** `src/pages/lab/management/TRFDetail.jsx`  
Create a dedicated detail page that displays all the enriched TRF information, styled consistently with other pages (like `TestPlanDetails.jsx`), and includes the ability to change the TRF's status if allowed.

### 9. Frontend — App Routing  
**[MODIFY]** `src/App.jsx`  
Replace the `PlaceholderPage` route for `/trfs/:id` with the newly created `TRFDetail` component.

---

## Verification Plan

### Automated Tests
None currently exist for TRFs. No new unit tests added (no test framework configured for frontend).

### Manual Verification
1. **Backend restart** — after migration runs, check server logs for `Migration COMPLETED: 006_add_trf_fields.py`
2. **Create a TRF** — Go to `lab/management/projects` → open a project → TRFs tab → click "Add TRF" → fill in test type, priority, description → save
3. **Check TRFs page** — Navigate to `lab/management/trfs` — confirm the card now shows Test Type, Priority, Status badge, and description snippet
4. **Status change** — From the TRF card, click "Submit" → badge updates to Submitted → if logged in as Lab Manager, Approve/Reject becomes available
