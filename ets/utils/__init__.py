from __future__ import unicode_literals
import frappe
from frappe import _, throw
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