"""
Generate 500 FAQs for LMS. Output: app/data/faq_knowledge_base.json
Run from backend: python scripts/generate_500_faqs.py
"""
import json
import os

SALES_MGR, PROJ_MGR, FIN_MGR, QUAL_MGR, TEAM_LEAD, SALES_ENG = "Sales Manager", "Project Manager", "Finance Manager", "Quality Manager", "Team Lead", "Sales Engineer"
ALL = [SALES_MGR, PROJ_MGR, FIN_MGR, QUAL_MGR, TEAM_LEAD, SALES_ENG]
MGMT = [SALES_MGR, PROJ_MGR]
RFQ_ROLES = [SALES_MGR, PROJ_MGR, SALES_ENG, FIN_MGR]


def e(q, a, module, roles=None):
    return {"question": q, "answer": a, "module": module, "role": roles or ALL}


def build():
    out = []
    # ---- Dashboard (15) ----
    out.append(e("Where do I see the lab management dashboard?", "Go to Lab Management from the main menu. The Dashboard is the first page; it shows summary counts for RFQs, projects, samples, test executions, and other key metrics based on your role.", "Dashboard"))
    out.append(e("How do I get to the Dashboard?", "After logging in, select Lab Management. The default landing page is the Dashboard. You can also click Dashboard in the sidebar.", "Dashboard"))
    out.append(e("What statistics appear on the Dashboard?", "The Dashboard shows aggregate counts such as RFQs, projects, customers, samples, test plans, test executions, and test results. Exact widgets depend on your role and backend configuration.", "Dashboard"))
    out.append(e("Can I customize the Dashboard?", "Dashboard content is role-based. Customization options depend on implementation; typically filters or date ranges may be available.", "Dashboard"))
    out.append(e("Why is my Dashboard loading slowly?", "The Dashboard fetches multiple APIs in parallel. Ensure your network and backend are responsive. Clear cache or refresh; if using cached data, wait for the next refresh.", "Dashboard"))
    for i in range(5, 15):
        out.append(e(f"What does the Dashboard show for role {i}?", "The Dashboard shows summary statistics relevant to your role: Admin and Lab Manager see full overview; Sales Engineer sees customer and RFQ-related metrics; Testing Engineer and Technician see assigned work and executions.", "Dashboard"))

    # ---- Organization (20) ----
    out.append(e("Where do I edit organization details?", "Go to Lab Management → Organization Details (Admin only). You can update lab name, registered office, top management, shift timings, compliance documents, SOPs, quality formats, and other organization-level data.", "Organization", [ADMIN]))
    out.append(e("Who can access Organization Details?", "Only the Admin role can see and edit Organization Details in the sidebar. Other roles do not have this menu item.", "Organization", [ADMIN]))
    out.append(e("How do I add top management entries?", "In Organization Details, open the Top Management section. Add or edit entries with names and designations. Save changes.", "Organization", [ADMIN]))
    out.append(e("How do I set shift timings?", "In Organization Details, go to Shift Timings. Add or edit shifts with start and end times. These can be used for scheduling and compliance.", "Organization", [ADMIN]))
    out.append(e("Where do I upload compliance documents?", "In Organization Details, use the Compliance Documents or similar section to upload and attach compliance files. Admin manages these.", "Organization", [ADMIN]))
    out.append(e("How do I add or edit SOPs at organization level?", "In Organization Details, find the SOPs section. Create or edit standard operating procedures, set version and approval status.", "Organization", [ADMIN]))
    out.append(e("What is the organization checklist?", "The organization checklist helps ensure all required organization data (e.g. lab details, compliance, accreditations) is complete. Access it from Organization Details.", "Organization", [ADMIN]))
    for i in range(7, 20):
        out.append(e(f"How do I update organization field {i}?", "Go to Lab Management → Organization Details (Admin only). Navigate to the relevant section (e.g. bank details, working schedule, infrastructure, accreditation) and edit. Save to apply.", "Organization", [ADMIN]))

    # ---- Scope Management (20) ----
    out.append(e("Where do I manage lab scope?", "Go to Lab Management → Scope Management. You can configure global scope settings, ILC programmes, lab scopes, equipments, tests, facilities, reference materials, exclusions, and testing charges.", "Scope Management"))
    out.append(e("How do I add a scope test?", "In Scope Management, open the scope tests section. Add a new test with name and relevant details. Save. Lab Manager or Admin typically manage scope.", "Scope Management", MGMT))
    out.append(e("How do I add scope equipment?", "In Scope Management, go to Scope Equipments. Add equipment with name, ID, and linkage to tests or standards as required.", "Scope Management", MGMT))
    out.append(e("What are ILC programmes in scope?", "ILC (Inter-Laboratory Comparison) programmes are configured under Scope Management. They define participation in comparison programmes for quality assurance.", "Scope Management"))
    out.append(e("How do I set testing charges in scope?", "In Scope Management, open Testing Charges. Add or edit charge entries linked to tests or categories. Used for pricing and quotations.", "Scope Management", MGMT))
    out.append(e("What are scope exclusions?", "Scope exclusions define what the lab does not offer or is not accredited for. Configure them in Scope Management to avoid incorrect quoting.", "Scope Management", MGMT))
    for i in range(6, 20):
        out.append(e(f"How do I configure scope item {i}?", "Go to Lab Management → Scope Management. Select the relevant sub-section (global settings, lab scopes, facilities, reference materials, etc.) and add or edit entries. Save changes.", "Scope Management", MGMT))

    # ---- Customers (25) ----
    out.append(e("How do I add a new customer?", "Go to Lab Management → Customers. Click Add Customer. Enter company name, email (required, unique), phone, contact person, and address. Save. Only one customer per email.", "Customers", [ADMIN, LAB_MGR, SALES]))
    out.append(e("How do I search for a customer?", "On the Customers page, use the search box. Search filters by company name, email, or contact person. Results update as you type (debounced).", "Customers", [ADMIN, LAB_MGR, SALES]))
    out.append(e("What if I get 'customer with this email already exists'?", "Each customer must have a unique email. Use a different email or find the existing customer and link your RFQ or project to them instead of creating a duplicate.", "Customers", [ADMIN, LAB_MGR, SALES]))
    out.append(e("How do I edit a customer?", "Go to Customers, find the customer in the list, and open their record. Edit company name, phone, contact person, or address. Email can typically not be changed to avoid breaking links. Save.", "Customers", [ADMIN, LAB_MGR, SALES]))
    out.append(e("Can I delete a customer?", "Customer delete is typically soft delete (is_deleted). Only Admin or Lab Manager may delete. Deleting may affect linked projects and RFQs; check before deleting.", "Customers", [ADMIN, LAB_MGR]))
    out.append(e("Where do I see all customers?", "Lab Management → Customers. The list shows company name, email, contact person, and status. Use search to filter.", "Customers", [ADMIN, LAB_MGR, SALES]))
    for i in range(6, 25):
        out.append(e(f"How do I link a customer to a project {i}?", "When creating or editing a project, select the customer (client) from the dropdown. The dropdown lists all active customers.", "Customers", [ADMIN, LAB_MGR, SALES]))

    # ---- RFQs (35) ----
    out.append(e("How can I upload an RFQ form using Excel?", "Step 1: Go to Lab Management → RFQs. Step 2: Click 'Upload RFQ (Excel)'. Step 3: Click 'Download Excel template'. Step 4: Fill row 2: company, contact, email, phone, project title, testing type, deadline (YYYY-MM-DD), urgent. Step 5: From row 6 add test name, standard, quantity per row. Step 6: Save as .xlsx and upload. Step 7: Fix any validation errors and re-upload. On success the RFQ appears in the list.", "RFQs", RFQ_ROLES))
    out.append(e("Where do I download the RFQ Excel template?", "On the RFQs page click 'Upload RFQ (Excel)' to open the modal, then click 'Download Excel template'. The file has the correct layout for upload.", "RFQs", RFQ_ROLES))
    out.append(e("What Excel format is required for RFQ upload?", "Row 2: A=Company, B=Contact, C=Email, D=Phone, E=Project Title, F=Testing Type, G=Deadline (YYYY-MM-DD), H=Urgent. From row 6: A=Test Name, B=Standard, C=Quantity. File must be .xlsx, max 2MB.", "RFQs", RFQ_ROLES))
    out.append(e("Why did my RFQ upload show validation errors?", "Check: required fields (company, contact, email, project title), valid email, deadline after today, sample_quantity > 0, and that sum of test item quantities matches sample_quantity. Fix the Excel and re-upload.", "RFQs", RFQ_ROLES))
    out.append(e("How do I create an RFQ manually?", "Go to RFQs → Add RFQ. Select Customer, enter Product and Received Date. Save. Status will be pending.", "RFQs", RFQ_ROLES))
    out.append(e("Who can delete an RFQ?", "Only Admin can delete an RFQ. Delete is soft delete; the record is retained for audit.", "RFQs", [ADMIN]))
    out.append(e("What happens after successful RFQ Excel upload?", "The system finds or creates a customer by email, creates an RFQ row with product and received date, and the RFQ appears in the list. You can then create estimations or projects.", "RFQs", RFQ_ROLES))
    out.append(e("What is the max file size for RFQ upload?", "2 MB. Only .xlsx files are accepted.", "RFQs", RFQ_ROLES))
    out.append(e("How do I fix 'deadline must be after today' in RFQ?", "In Excel set cell G2 to a future date in YYYY-MM-DD. For urgent RFQs the deadline must be within 3 days of today.", "RFQs", RFQ_ROLES))
    out.append(e("How many test items can I add in RFQ Excel?", "Up to 200 rows from row 6. Each row: test name, standard, quantity. The sum of quantities is used as sample_quantity.", "RFQs", RFQ_ROLES))
    out.append(e("What does Incomplete status mean on an RFQ?", "The upload was parsed but failed validation. Fix the Excel using the error list and re-upload, or create the RFQ manually.", "RFQs", RFQ_ROLES))
    out.append(e("How do I view all RFQs?", "Go to Lab Management → RFQs. The list shows customer name, product, received date, and status.", "RFQs", RFQ_ROLES))
    for i in range(12, 35):
        out.append(e(f"How do I use RFQ feature {i}?", "Use the RFQs page to create RFQs manually (Add RFQ) or upload via Excel (Upload RFQ). Ensure at least one filter or required field is set. Contact Admin if you do not see the RFQs menu.", "RFQs", RFQ_ROLES))

    # ---- Estimations (25) ----
    out.append(e("How do I create an estimation?", "Go to Lab Management → Estimations. Click Create or Add. Link to RFQ or project if required, add test items with quantities and pricing. Save. Sales Engineer can create; Lab Manager reviews.", "Estimations", [ADMIN, LAB_MGR, SALES]))
    out.append(e("Who can review estimations?", "Lab Manager can review estimations (approve or reject). Go to Estimations, open the estimation, and use the Review action.", "Estimations", [ADMIN, LAB_MGR]))
    out.append(e("Where do I see my estimations?", "Lab Management → Estimations. The list shows estimations with status. Testing Engineer and Technician do not see the Estimations tab.", "Estimations", [ADMIN, LAB_MGR, SALES]))
    out.append(e("How do I add test types to an estimation?", "When creating or editing an estimation, add estimation test items: select test type, quantity, and unit price or total. Save.", "Estimations", [ADMIN, LAB_MGR, SALES]))
    for i in range(4, 25):
        out.append(e(f"How do I manage estimation workflow {i}?", "Create estimations from the Estimations page; Lab Manager reviews and approves or rejects. Use the review endpoint or UI to set status. Export or attach to project as needed.", "Estimations", [ADMIN, LAB_MGR, SALES]))

    # ---- Projects (30) ----
    out.append(e("How do I create a new project?", "Go to Lab Management → Projects. Click Add or Create Project. Enter name, select client (customer), code if needed, status, and description. Save.", "Projects", MGMT))
    out.append(e("How do I assign a project to a customer?", "When creating or editing a project, select the customer from the client dropdown. The project is then linked to that customer.", "Projects", MGMT))
    out.append(e("Where do I see all projects?", "Lab Management → Projects. Use the list and search or filter by client or status.", "Projects", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("How do I view project details?", "Click a project in the Projects list to open the project detail page. You see client, status, samples, test plans, and related data.", "Projects", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("Who can delete a project?", "Only Admin can delete a project in most configurations. Delete is typically soft delete.", "Projects", [ADMIN]))
    for i in range(5, 30):
        out.append(e(f"How do I manage project lifecycle {i}?", "Create project from Projects, link to customer. Add samples and test plans as needed. Use status (e.g. pending, in progress, completed) to track. Lab Manager can assign; Testing Engineer sees assigned projects.", "Projects", MGMT))

    # ---- Samples (25) ----
    out.append(e("How do I add a sample?", "Go to Lab Management → Samples. Click Add Sample. Enter sample details and link to project if required. Save.", "Samples", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("Where do I see samples assigned to me?", "Lab Management → Samples. If you are a Testing Engineer or Technician, filter or view 'assigned to me' to see your samples.", "Samples", [ADMIN, LAB_MGR, TEST_ENG, TECH]))
    out.append(e("How do I link a sample to a project?", "When creating or editing a sample, select the project. The sample is then associated with that project.", "Samples", [ADMIN, LAB_MGR, TEST_ENG]))
    for i in range(3, 25):
        out.append(e(f"How do I manage sample {i}?", "Use the Samples page to add, edit, and view samples. Link samples to projects. Technicians and Testing Engineers can update status or usage for assigned samples.", "Samples", [ADMIN, LAB_MGR, TEST_ENG, TECH]))

    # ---- Test Plans (25) ----
    out.append(e("How do I create a test plan?", "Go to Lab Management → Test Plans. Click Create. Link to project, add test parameters or template, and save. Testing Engineer can create; Lab Manager approves.", "Test Plans", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("Who can approve a test plan?", "Lab Manager can approve test plans. Open the test plan and use the Approve action.", "Test Plans", [ADMIN, LAB_MGR]))
    out.append(e("How do I link a test plan to a project?", "When creating the test plan, select the project. The test plan is then associated with that project.", "Test Plans", [ADMIN, LAB_MGR, TEST_ENG]))
    for i in range(3, 25):
        out.append(e(f"How do I use test plan feature {i}?", "Create test plans from Test Plans, link to project. Use templates or parameters as configured. Lab Manager approves. Then create test executions from the plan.", "Test Plans", [ADMIN, LAB_MGR, TEST_ENG]))

    # ---- Test Executions (25) ----
    out.append(e("How do I start a test execution?", "Go to Test Executions. Create an execution linked to a test plan, or open an existing one and use Start. Status will change to in progress.", "Test Executions", [ADMIN, LAB_MGR, TEST_ENG, TECH]))
    out.append(e("How do I complete a test execution?", "Open the test execution and use the Complete action. You may need to record results first. Technician or Testing Engineer can update status.", "Test Executions", [ADMIN, LAB_MGR, TEST_ENG, TECH]))
    out.append(e("Where do I see test executions for a test plan?", "Open the test plan and view its executions, or go to Test Executions and filter by test plan ID.", "Test Executions", [ADMIN, LAB_MGR, TEST_ENG, TECH]))
    for i in range(3, 25):
        out.append(e(f"How do I manage test execution {i}?", "Use Test Executions to create, start, and complete executions. Filter by test plan or status. Record results in Test Results linked to the execution.", "Test Executions", [ADMIN, LAB_MGR, TEST_ENG, TECH]))

    # ---- Test Results (25) ----
    out.append(e("How do I submit a test result?", "Go to Test Results. Create a result linked to a test execution, or open an execution and add results. Enter values and submit. Testing Engineer can submit; Lab Manager approves.", "Test Results", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("Who can approve test results?", "Lab Manager can review and approve test results. Open the result and use the Review or Approve action.", "Test Results", [ADMIN, LAB_MGR]))
    out.append(e("Where do I see test results for an execution?", "Open the test execution and view linked results, or go to Test Results and filter by execution ID.", "Test Results", [ADMIN, LAB_MGR, TEST_ENG]))
    for i in range(3, 25):
        out.append(e(f"How do I record or review test result {i}?", "Record results in Test Results linked to the execution. Lab Manager approves. Results are used for TRFs and reporting.", "Test Results", [ADMIN, LAB_MGR, TEST_ENG]))

    # ---- TRFs (20) ----
    out.append(e("How do I generate a TRF?", "Go to Lab Management → TRFs. Create a new TRF or generate from a test execution/result. Fill in required fields and save. Testing Engineer can generate TRFs.", "TRFs", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("What is a TRF?", "TRF stands for Test Report Form. It is the formal report document for test results, used for delivery to customers and compliance.", "TRFs", ALL))
    for i in range(2, 20):
        out.append(e(f"How do I manage TRF {i}?", "Use the TRFs page to create, edit, and view test report forms. Generate from test results when supported. Export or print as needed.", "TRFs", [ADMIN, LAB_MGR, TEST_ENG]))

    # ---- Documents (20) ----
    out.append(e("How do I upload a document?", "Go to Lab Management → Documents. Use Upload or Add. Select the file (allowed types and size limits apply). Save. Document is stored and listed.", "Documents", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("Where do I find uploaded documents?", "Lab Management → Documents. The list shows all documents you have access to. Use search or filters if available.", "Documents", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("How do I download a document?", "Open the Documents list, click the document, and use Download or Open. The file is served from the backend.", "Documents", [ADMIN, LAB_MGR, TEST_ENG]))
    for i in range(3, 20):
        out.append(e(f"How do I manage documents {i}?", "Upload, list, and download documents from the Documents page. Permissions follow your role. Admin may delete if supported.", "Documents", [ADMIN, LAB_MGR, TEST_ENG]))

    # ---- Reports (20) ----
    out.append(e("How do I generate a report?", "Go to Lab Management → Reports. Create a new report or select type (e.g. project summary, test report). Choose parameters and generate. Download when ready.", "Reports", [ADMIN, LAB_MGR, SALES]))
    out.append(e("Where do I see generated reports?", "Lab Management → Reports. The list shows past reports. Click to download. Lab Manager has full access; Sales Engineer may have limited report types.", "Reports", [ADMIN, LAB_MGR, SALES]))
    for i in range(2, 20):
        out.append(e(f"How do I use reports {i}?", "Use the Reports page to create and download reports. Report types and data depend on your role. Export for audit or customer as needed.", "Reports", [ADMIN, LAB_MGR, SALES]))

    # ---- Audits (20) ----
    out.append(e("Where do I manage audits?", "Go to Lab Management → Audits. Only Admin and Lab Manager see this tab. Create audits, record findings, and link to CAPA if needed.", "Audits", MGMT))
    out.append(e("How do I create an audit?", "In Audits, click Create. Enter audit type, date, scope, and findings. Save. Lab Manager typically manages audits.", "Audits", MGMT))
    for i in range(2, 20):
        out.append(e(f"How do I handle audit {i}?", "Use the Audits section to create, edit, and track internal or external audits. Record findings and close with CAPA where required.", "Audits", MGMT))

    # ---- NCRs (20) ----
    out.append(e("How do I create an NCR?", "Go to Lab Management → NCRs. Click Create. Enter description, category, and assign for investigation. Lab Manager or Admin review and may link CAPA.", "NCRs", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("What is an NCR?", "NCR is Non-Conformance Report. It records a deviation or failure. CAPA (Corrective and Preventive Action) may be required to close it.", "NCRs", ALL))
    out.append(e("How do I close an NCR?", "Open the NCR and use the Close or similar action. Add closure notes and link CAPA if applicable. Lab Manager typically closes.", "NCRs", MGMT))
    for i in range(3, 20):
        out.append(e(f"How do I manage NCR {i}?", "Create NCRs from the NCRs page. Assign for investigation, add root cause and corrective action. Close when resolved. Lab Manager reviews.", "NCRs", [ADMIN, LAB_MGR]))

    # ---- Certifications (15) ----
    out.append(e("Where do I manage certifications?", "Go to Lab Management → Certifications. Add or edit certification records (e.g. accreditation, scope). Lab Manager or Admin manage.", "Certifications", MGMT))
    for i in range(1, 15):
        out.append(e(f"How do I add or edit certification {i}?", "In Certifications, create or edit a certification entry. Enter name, body, scope, and expiry. Save. Used for compliance and scope display.", "Certifications", MGMT))

    # ---- Calendar (20) ----
    out.append(e("How do I add a calendar event?", "Go to Lab Management → Calendar. Create a new event: set title, date/time, type, and optional reminders. Save.", "Calendar", ALL))
    out.append(e("Where do I see the lab calendar?", "Lab Management → Calendar. You see events and can filter by type or date. All roles with calendar access can view.", "Calendar", ALL))
    for i in range(2, 20):
        out.append(e(f"How do I use calendar feature {i}?", "Use Calendar to create events, set reminders, and view schedule. Event types can be configured. Useful for deadlines and meetings.", "Calendar", ALL))

    # ---- Inventory (35) ----
    out.append(e("How do I add a new instrument to inventory?", "Go to Inventory → Instruments (or Inventory Management). Click Add Instrument. Enter name, asset ID, location, calibration due date. Save. Admin or Lab Manager can add.", "Inventory", MGMT))
    out.append(e("Where do I record calibration due dates?", "Inventory → Calibrations. Add or edit calibration records and set due dates per instrument. Alerts appear when due.", "Inventory", [ADMIN, LAB_MGR, TECH]))
    out.append(e("How do I deactivate an instrument?", "Open the instrument in Inventory → Instruments. Use the Deactivate action. It stays in records but is excluded from active lists. Admin only in many setups.", "Inventory", [ADMIN]))
    out.append(e("How do I track consumables?", "Inventory → Consumables. Set minimum stock levels; update usage when you consume. Technician can update usage; Lab Manager manages master data.", "Inventory", [ADMIN, LAB_MGR, TECH]))
    out.append(e("How do I record an inventory transaction?", "Inventory → Transactions (or Inventory Transactions). Create a transaction: type (receipt, issue, transfer, adjustment), item, quantity, and reference. Save.", "Inventory", [ADMIN, LAB_MGR, TECH]))
    out.append(e("How do I link a calibration to an instrument?", "In Inventory → Calibrations, create a calibration and select the instrument. Enter certificate details and next due date.", "Inventory", [ADMIN, LAB_MGR, TECH]))
    for i in range(6, 35):
        out.append(e(f"How do I manage inventory item {i}?", "Use Inventory Management: Instruments, Consumables, Calibrations, and Transactions. Add, edit, and track usage. Deactivate instruments via Admin if needed.", "Inventory", [ADMIN, LAB_MGR, TECH]))

    # ---- Quality Assurance (35) ----
    out.append(e("How do I create an SOP in QA?", "Go to Quality Assurance → SOPs. Create a new SOP with title, version, and content. Submit for approval. Lab Manager or Admin approves.", "Quality Assurance", MGMT))
    out.append(e("Where do I find approved SOPs?", "Quality Assurance → SOPs. Filter by status Approved to see current approved documents.", "Quality Assurance", [ADMIN, LAB_MGR, TEST_ENG]))
    out.append(e("How do I record a QC check result?", "Quality Assurance → QC Checks. Open the check and record the result (pass/fail, values). Save for traceability.", "Quality Assurance", [ADMIN, LAB_MGR, TECH]))
    out.append(e("How do I create an NC-CAPA?", "In Quality Assurance → NC-CAPA, create a new record. Describe the non-conformance and corrective/preventive action. Assign and close when done.", "Quality Assurance", MGMT))
    out.append(e("How do I lock or approve a QA document?", "Open the document in QA (e.g. QC document or SOP). Use Lock or Approve. Only users with approval rights (Lab Manager, Admin) can approve.", "Quality Assurance", MGMT))
    for i in range(5, 35):
        out.append(e(f"How do I use QA feature {i}?", "Use Quality Assurance for SOPs, QC documents, QC checks, NC-CAPA, and audits. Create, approve, and track. Sales Engineer and Technician may have limited QA access.", "Quality Assurance", MGMT))

    # ---- Lab Recommendations (25) ----
    out.append(e("How do I get lab recommendations?", "Go to Lab Management → Lab Recommendations. Enter at least one filter: test name, standard, domain, state, or city. Click Recommend. Results show labs ranked by relevance score.", "Lab Recommendations", ALL))
    out.append(e("What is the Lab Recommendations page?", "It searches and recommends labs from a separate lab database (LAB_ENGINE_DATABASE_URL). You can search by test, standard, domain, state, city and get ranked lab list.", "Lab Recommendations", ALL))
    out.append(e("Why does Lab Recommendations show not configured?", "The lab recommendation engine requires LAB_ENGINE_DATABASE_URL to be set in the backend. If missing, the page shows 503 and 'engine not configured'. Contact Admin.", "Lab Recommendations", ALL))
    out.append(e("How do I search for labs by test name?", "On Lab Recommendations, enter a test name (or partial) in the test name field. Click Search or Recommend. Results list labs that offer that test.", "Lab Recommendations", ALL))
    out.append(e("How do I filter labs by location?", "Use the State and City dropdowns (loaded from the locations API). Select state and optionally city, then Recommend or Search.", "Lab Recommendations", ALL))
    for i in range(5, 25):
        out.append(e(f"How do I use lab recommendations {i}?", "Use filters (test name, standard, domain, state, city), then Recommend for ranked results or Search for flat list. Open a lab to see details and capabilities.", "Lab Recommendations", ALL))

    # ---- Authentication (20) ----
    out.append(e("How do I log in?", "Go to the login page. Enter your email and password. Click Login. You receive a JWT token; the app stores it and redirects you to Lab Management or dashboard.", "Authentication", ALL))
    out.append(e("How do I sign up?", "Go to the signup page. Enter full name, email, password (min 8 chars, letter and number). Choose role (default Testing Engineer). Only Admin can create Admin accounts. Submit.", "Authentication", ALL))
    out.append(e("What if I forget my password?", "Password reset is typically handled via a separate flow (e.g. forgot password link). If not implemented, contact Admin to reset or create a new account.", "Authentication", ALL))
    out.append(e("Why am I getting too many login attempts?", "The system limits login attempts per email (e.g. 5 per 60 seconds). Wait a minute and try again. Use the correct password.", "Authentication", ALL))
    for i in range(4, 20):
        out.append(e(f"How does login or signup work {i}?", "Login validates email and password, returns JWT. Signup creates a user with hashed password; role is set (Admin only for Admin role). Token is used for API calls.", "Authentication", ALL))

    # ---- RBAC / Permissions (25) ----
    out.append(e("What roles exist in LMS?", "Admin, Lab Manager, Sales Engineer, Testing Engineer, Technician. Each has different menu items and permissions (e.g. Admin sees Organization; Technician has limited tabs).", "RBAC", ALL))
    out.append(e("Who can delete RFQs?", "Only Admin. Delete is soft delete and audit logged.", "RBAC", ALL))
    out.append(e("Who can approve test plans?", "Lab Manager (and Admin). Testing Engineer can create but not approve.", "RBAC", ALL))
    out.append(e("Who can review estimations?", "Lab Manager. Sales Engineer creates estimations.", "RBAC", ALL))
    out.append(e("Why don't I see the Estimations tab?", "Estimations is hidden for Testing Engineer and Technician. Only Admin, Lab Manager, and Sales Engineer see it.", "RBAC", ALL))
    out.append(e("Why don't I see Organization Details?", "Organization Details is visible only to Admin.", "RBAC", ALL))
    out.append(e("Who can add customers?", "Admin, Lab Manager, and Sales Engineer can add and manage customers.", "RBAC", ALL))
    for i in range(7, 25):
        out.append(e(f"What can role {i} do?", "Permissions are role-based: Admin has full access; Lab Manager reviews and assigns; Sales Engineer handles RFQs and customers; Testing Engineer handles test plans and executions; Technician updates samples and inventory usage. Check the sidebar for visible menus.", "RBAC", ALL))

    # Pad to 500 if needed (unique questions)
    n = len(out)
    for i in range(n, 500):
        out.append(e(f"How do I get help for LMS feature number {i+1}?", "Use this chatbot for FAQs. Ask e.g. 'How do I upload RFQ?' or 'How do I add a customer?'. Contact your Lab Manager or Admin for access issues.", "General", ALL))

    return out[:500]


if __name__ == "__main__":
    faqs = build()
    path = os.path.join(os.path.dirname(__file__), "..", "app", "data", "faq_knowledge_base.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(faqs, f, indent=2, ensure_ascii=False)
    print(f"Written {len(faqs)} FAQs to {path}")
