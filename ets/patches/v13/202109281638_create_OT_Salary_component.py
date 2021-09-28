import frappe

def execute():
    OTs = ["Weekday OT", "Weekend OT", "Holiday OT"]
    for ot in OTs:
        ot_doc = frappe.get_value("Salary Component", ot,'name')
        if ot_doc:
            ot_doc = frappe.get_doc("Salary Component", ot)
            ot_doc.is_weekday_ot = True if ot == "Weekday OT" else False
            ot_doc.is_weekend_ot = True if ot == "Weekend OT" else False
            ot_doc.is_holiday_ot = True if ot == "Holiday OT" else False
            pass
        else:
            salary_component_abbr = ''
            if ot == "Weekday OT":
                salary_component_abbr = 'WD-OT'
            elif ot == "Weekend OT":
                salary_component_abbr = 'WE-OT'
            elif ot == "Holiday OT":
                salary_component_abbr = 'HD-OT'
            doc_dict = {
                        'doctype': 'Salary Component',
                        'name': ot,
                        'salary_component': ot,
                        'salary_component_abbr': salary_component_abbr, 
                        'type': "Earning",
                        'is_weekday_ot': True if ot == "Weekday OT" else False,
                        'is_weekend_ot': True if ot == "Weekend OT" else False,
                        'is_holiday_ot': True if ot == "Holiday OT" else False,
                        }
            ot = frappe.get_doc(doc_dict).insert()
 