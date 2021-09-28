from __future__ import unicode_literals
import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

def get_annual_leave_field():
	annual_leave_field = [
		dict(fieldname='is_annual_leave', label='Is Annual Leave',
			fieldtype='Check', insert_after='is_optional_leave', print_hide=1),
	]

	return annual_leave_field

def execute():
    annual_leave_field = get_annual_leave_field()

    custom_fields = {
    'Leave Type': annual_leave_field
    }
    create_custom_fields(custom_fields)
    leave_doc = frappe.get_value("Leave Type","Annual Leave","name")
    if leave_doc: 
        leave_doc = frappe.get_doc("Leave Type","Annual Leave")
        leave_doc.is_annual_leave = True
        leave_doc.flags.ignore_permissions = True
        leave_doc.save()
    else:
        doc_dict = {
            'doctype': 'Leave Type',
            'name': "Annual Leave",
            'leave_type_name': "Annual Leave",
            'include_holiday': True,
            'is_earned_leave': True,
            'is_annual_leave': True,
            'based_on_date_of_joining': True,
            'max_leaves_allowed': 21,
            'earned_leave_frequency': 'Yearly',
            'applicable_after': 365,
            }
        frappe.get_doc(doc_dict).insert()