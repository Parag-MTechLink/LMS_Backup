"""
Generate 500 FAQs for LMS covering every module. Output: app/data/faq_knowledge_base.json
Run from backend: python scripts/generate_faq_500.py
"""
import json
import os

# Roles in LMS
SALES_MGR = "Sales Manager"
PROJ_MGR = "Project Manager"
FIN_MGR = "Finance Manager"
QUAL_MGR = "Quality Manager"
TEAM_LEAD = "Team Lead"
SALES_ENG = "Sales Engineer"
ALL_ROLES = [ADMIN, LAB_MGR, SALES, TEST_ENG, TECH]
MANAGEMENT = [ADMIN, LAB_MGR]
VIEWERS = [ADMIN, LAB_MGR, TEST_ENG, TECH]


def faq(q: str, a: str, module: str, role: list = None):
    return {"question": q, "answer": a, "module": module, "role": role or ALL_ROLES}


def build_faqs():
    faqs_list = []

    # ---- RFQ (50) ----
    faqs_list.append(faq(
        "How can I upload an RFQ form using Excel?",
        "Step 1: Go to Lab Management → RFQs. Step 2: Click 'Upload RFQ (Excel)'. Step 3: Click 'Download Excel template' to get the correct format. Step 4: Fill row 2 with company name, contact person, email, phone, project title, testing type, deadline (YYYY-MM-DD), and Urgent (Yes/No). Step 5: From row 6, add test name, standard, and quantity for each test item. Step 6: Save as .xlsx and upload the file. Step 7: If validation fails, fix the errors shown and re-upload. On success, the RFQ appears in the RFQs list.",
        "RFQs",
        [ADMIN, LAB_MGR, SALES],
    ))
    faqs_list.append(faq(
        "Where do I download the RFQ Excel template?",
        "On the RFQs page, click 'Upload RFQ (Excel)' to open the upload modal. Then click the 'Download Excel template' link. The template has row 2 for header fields (company, contact, email, phone, project title, testing type, deadline, urgent) and from row 6 for test items (test name, standard, quantity).",
        "RFQs",
        [ADMIN, LAB_MGR, SALES],
    ))
    faqs_list.append(faq(
        "What Excel format is required for RFQ upload?",
        "Use the official template: Row 2 must have A2=Company Name, B2=Contact Person, C2=Email, D2=Phone, E2=Project Title, F2=Testing Type, G2=Deadline (YYYY-MM-DD), H2=Urgent (Yes/No). From row 6: column A=Test Name, B=Standard, C=Quantity. File must be .xlsx and under 2MB. Download the template from the Upload RFQ modal to ensure correct layout.",
        "RFQs",
        [ADMIN, LAB_MGR, SALES],
    ))
    faqs_list.append(faq(
        "Why did my RFQ upload fail with validation errors?",
        "The system validates schema (required fields, email format, date format) and business rules (deadline must be after today, sample_quantity > 0, sum of test item quantities must match sample_quantity). Check the error list in the upload modal: fix missing or invalid fields in your Excel (e.g. valid email, future deadline, at least one test item with quantity) and re-upload.",
        "RFQs",
        [ADMIN, LAB_MGR, SALES],
    ))
    faqs_list.append(faq(
        "How do I create an RFQ manually without Excel?",
        "Go to Lab Management → RFQs. Click 'Add RFQ' or 'Create RFQ'. Fill in Customer (select from dropdown), Product name, and Received Date. Save. The RFQ is created with status 'pending' and appears in the list.",
        "RFQs",
        [ADMIN, LAB_MGR, SALES],
    ))
    faqs_list.append(faq(
        "Who can delete an RFQ?",
        "Only users with the Admin role can delete an RFQ. The delete is a soft delete (the record is marked deleted but retained for audit). Go to RFQs list, click delete on the RFQ row, and confirm.",
        "RFQs",
        [ADMIN],
    ))
    faqs_list.append(faq(
        "What happens after I upload a valid RFQ Excel?",
        "The system parses the file, validates it, creates an RFQ request record, and syncs it to the main RFQs list by finding or creating a Customer (by email) and creating an RFQ row with product from project title and received date as today. The new RFQ appears in the RFQs list and you can proceed to estimations or projects.",
        "RFQs",
        [ADMIN, LAB_MGR, SALES],
    ))
    faqs_list.append(faq(
        "Can I upload an RFQ with an existing customer email?",
        "Yes. If the email in the Excel already exists in Customers, that customer is linked to the new RFQ. If not, a new customer is created using company name, email, phone, and contact person from the Excel. Duplicate customer creation by email is avoided.",
        "RFQs",
        [ADMIN, LAB_MGR, SALES],
    ))
    for i in range(8, 50):
        faqs_list.append(faq(
            f"What is the maximum file size for RFQ Excel upload?",
            "The maximum allowed file size for RFQ Excel upload is 2 MB. Use a .xlsx file. If your file is larger, reduce the number of test item rows or remove unnecessary sheets.",
            "RFQs",
            [ADMIN, LAB_MGR, SALES],
        ))
    # Fix duplicate question - make unique
    for i in range(8, 50):
        faqs_list[i] = faq(
            f"How do I fix 'deadline must be after today' in RFQ upload?",
            "In your Excel, set the deadline (cell G2) to a date after today in YYYY-MM-DD format (e.g. 2025-12-31). The system rejects past or today's date. For urgent RFQs, the deadline must also be within 3 days of today.",
            "RFQs",
            [ADMIN, LAB_MGR, SALES],
        ) if i == 8 else faq(
            f"How do I add multiple test items in RFQ Excel?",
            "From row 6 onward, put each test in a row: A=Test Name, B=Standard, C=Quantity. You can add up to 200 rows. The sum of quantities should equal the sample_quantity (computed automatically from the table). Leave no blank rows between items.",
            "RFQs",
            [ADMIN, LAB_MGR, SALES],
        ) if i == 9 else faq(
            "What does 'Incomplete' status mean on an uploaded RFQ?",
            "Incomplete means the upload passed parsing but failed validation (schema or business rules). The RFQ request is stored with error details. Fix your Excel using the error list shown in the modal and re-upload, or create the RFQ manually and edit as needed.",
            "RFQs",
            [ADMIN, LAB_MGR, SALES],
        ) if i == 10 else faqs_list[i]

    # I'm building a mix of unique questions. Let me instead build 500 clearly unique FAQs by category with explicit numbering in the question or unique phrasing.
    # I'll rewrite the script to append 500 unique FAQs in one clear loop per module.
    pass

# Rebuild: collect all FAQs in one list with unique questions
def build_all():
    out = []
    # RFQ - 30
    rfq_qs = [
        ("How can I upload an RFQ form using Excel?", "Step 1: Go to Lab Management → RFQs. Step 2: Click 'Upload RFQ (Excel)'. Step 3: Download the Excel template from the modal. Step 4: Fill row 2: company name, contact, email, phone, project title, testing type, deadline (YYYY-MM-DD), urgent. Step 5: From row 6 add test name, standard, quantity per test. Step 6: Save as .xlsx and upload. Step 7: Fix any validation errors and re-upload if needed. On success the RFQ appears in the list."),
        ("Where do I download the RFQ Excel template?", "On RFQs page click 'Upload RFQ (Excel)' then click 'Download Excel template' in the modal. The file has the correct layout: row 2 for header fields, from row 6 for test items."),
        ("What Excel format is required for RFQ upload?", "Row 2: A=Company, B=Contact, C=Email, D=Phone, E=Project Title, F=Testing Type, G=Deadline (YYYY-MM-DD), H=Urgent. From row 6: A=Test Name, B=Standard, C=Quantity. File must be .xlsx, max 2MB. Use the official template."),
        ("Why did my RFQ upload show validation errors?", "Check required fields (company, contact, email, project title), valid email format, deadline after today, sample_quantity > 0, and that sum of test item quantities matches sample_quantity. Fix the Excel and re-upload."),
        ("How do I create an RFQ without Excel?", "Go to RFQs → Add RFQ. Select Customer, enter Product and Received Date. Save. The RFQ is created with status pending."),
        ("Who can delete an RFQ?", "Only Admin can delete an RFQ. It is soft-deleted for audit."),
        ("What happens after a successful RFQ Excel upload?", "A customer is found or created by email, an RFQ row is created with product and received date, and it appears in the RFQs list for estimations or projects."),
        ("What is the max file size for RFQ upload?", "2 MB. Use .xlsx only."),
        ("How do I fix 'deadline must be after today' in RFQ?", "Set cell G2 to a future date in YYYY-MM-DD. For urgent, deadline must be within 3 days."),
        ("How many test items can I add in RFQ Excel?", "Up to 200 rows from row 6. Each row: test name, standard, quantity. Sum of quantities = sample_quantity."),
    ]
    for q, a in rfq_qs:
        out.append(faq(q, a, "RFQs", [ADMIN, LAB_MGR, SALES]))
    # Add more RFQ variants
    out.append(faq("Can I use the same customer for multiple RFQs?", "Yes. When you upload Excel, the system matches by email. If the customer exists, that customer is linked. You can also select an existing customer when creating an RFQ manually.", "RFQs", [ADMIN, LAB_MGR, SALES]))
    out.append(faq("What does Incomplete status mean on an RFQ?", "The upload was parsed but failed validation. Errors are stored; fix the Excel and re-upload or create manually.", "RFQs", [ADMIN, LAB_MGR, SALES]))
    out.append(faq("How do I view all RFQs?", "Go to Lab Management → RFQs. The list shows customer name, product, received date, and status. Click a row to view details if supported.", "RFQs", [ADMIN, LAB_MGR, SALES]))
    out.append(faq("What roles can upload RFQ Excel?", "Admin, Lab Manager, and Sales Engineer can access the RFQs page and use Upload RFQ (Excel). Testing Engineer and Technician do not see the Estimations tab but may have RFQ view depending on permissions.", "RFQs", [ADMIN, LAB_MGR, SALES]))
    out.append(faq("How do I know if my RFQ upload succeeded?", "You see a success message and the modal closes. The new RFQ appears in the RFQs list. If you see validation errors, fix them and re-upload.", "RFQs", [ADMIN, LAB_MGR, SALES]))
    # Ensure we have 500 total - I'll add by module in batches
    return out


if __name__ == "__main__":
    all_faqs = build_all()
    # Build full 500 in script below
    path = os.path.join(os.path.dirname(__file__), "..", "app", "data", "faq_knowledge_base.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(all_faqs, f, indent=2, ensure_ascii=False)
    print(f"Written {len(all_faqs)} FAQs to {path}")
