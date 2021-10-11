from __future__ import unicode_literals
import frappe
from frappe import _, throw
from frappe.utils.data import now_datetime
from frappe.utils.logger import set_log_level

set_log_level("DEBUG")
ets_logger = frappe.logger("ets", allow_site=True, file_count=2)


def get_conditions(filter_list, and_or='and', table = 'Item'):
	from frappe.model.db_query import DatabaseQuery

	if not filter_list:
		return ''

	conditions = []
	DatabaseQuery(table).build_filter_conditions(filter_list, conditions, ignore_permissions=True)
	join_by = ' {0} '.format(and_or)

	return '(' + join_by.join(conditions) + ')'

@frappe.whitelist()
def log_approval(dt,dn,field_name,_comment = None):
	doc = frappe.get_doc(dt,dn)
	user = frappe.session.user
	ets_logger.debug(user)
	approval_log = {
				"user": user,
				"user_name": frappe.get_value("User",user,"full_name"),
				"comment": _comment,
				"approved_on": now_datetime(),
            }
	doc.append(field_name, approval_log)
	doc.flags.ignore_permissions = True
	doc.flags.ignore_validate_update_after_submit = True
	doc.save()
	pass

@frappe.whitelist()
def log_rejection(dt,dn,field_name,_comment = None):
	doc = frappe.get_doc(dt,dn)
	user = frappe.session.user
	rejection_log = {
				"user": user,
				"user_name": frappe.get_value("User",user,"full_name"),
				"comment": _comment,
				"approved_on": now_datetime(),
            }
	doc.append(field_name, rejection_log)
	doc.flags.ignore_permissions = True
	doc.flags.ignore_validate_update_after_submit = True
	doc.save()
	pass