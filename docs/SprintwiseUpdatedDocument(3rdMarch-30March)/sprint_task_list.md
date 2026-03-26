# Fix TRF Project Association

## Tasks

- [x] Identify root cause (backend returns all TRFs; frontend ignores projectId)
- [x] Fix backend `trf/routes.py` — add optional `project_id` query param
- [x] Fix frontend `labManagementApi.js` — pass `project_id` in URL when provided
- [x] Fix frontend `ProjectDetail.jsx` — replace nav link with inline "Add TRF" modal
- [x] Add DB migration for enriched TRF fields (`test_type`, `status`, etc.)
- [x] Update Backend TRF Model & Schema
- [x] Add Backend TRF status update routes
- [x] Update Frontend CreateTRFForm
- [x] Redesign TRFs Page to support rich fields and inline status actions
- [x] Run backend DB migration locally
- [x] Create TRFDetail.jsx Page
- [x] Update App.jsx Routing for TRFDetail
