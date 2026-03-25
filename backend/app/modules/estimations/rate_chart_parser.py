import pdfplumber
import pandas as pd
import os

def parse_rate_chart_pdf(file_path):
    """
    Parses a PDF rate chart and returns a list of test types with hierarchy.
    Expected structure: [Category, Test Name, HSN Code, Rate, Unit]
    """
    results = []
    
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                df = pd.DataFrame(table[1:], columns=table[0])
                
                current_category = None
                
                for _, row in df.iterrows():
                    category = row.get('Category', '').strip()
                    test_name = row.get('Test Name', row.get('Description', '')).strip()
                    hsn = row.get('HSN Code', '').strip()
                    rate_str = row.get('Rate (INR)', row.get('Rate', '0')).strip()
                    unit = row.get('Unit', 'Per Hour').strip()
                    
                    try:
                        rate = float(rate_str.replace(',', ''))
                    except ValueError:
                        rate = 0.0

                    if category:
                        # New Main Category
                        current_category = {
                            "name": category,
                            "hsnCode": hsn,
                            "defaultRate": rate,
                            "unit": unit,
                            "children": []
                        }
                        results.append(current_category)
                    elif test_name and current_category:
                        # Sub-test under current category
                        sub_test = {
                            "name": test_name,
                            "hsnCode": hsn or current_category['hsnCode'],
                            "defaultRate": rate,
                            "unit": unit or current_category['unit'],
                        }
                        current_category['children'].append(sub_test)
                        
    return results

if __name__ == "__main__":
    # Test with the generated sample
    sample_path = "Standard_Rate_Chart.pdf"
    if os.path.exists(sample_path):
        import json
        parsed = parse_rate_chart_pdf(sample_path)
        print(json.dumps(parsed, indent=2))
