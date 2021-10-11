import frappe

def execute():
    ot_doc = frappe.get_value("Salary Component", "Absent",'name')
    if not ot_doc:
        salary_component_abbr = 'Ab'
        doc_dict = {
                    'doctype': 'Salary Component',
                    'name': "Absent",
                    'salary_component': "Absent",
                    'salary_component_abbr': salary_component_abbr, 
                    'type': "Deduction",
                    }
        frappe.get_doc(doc_dict).insert()
 