from __future__ import unicode_literals
import frappe
from frappe import _, throw
from frappe.utils.data import flt, now_datetime
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

@frappe.whitelist()
def update_budjet_cost(dt,dn,task_name, amount, update_on = "committed", comment=None):
	task = frappe.get_doc("Task", task_name)
	previous_committed_cost = task.committed_cost
	previous_available_budget = task.available_budget
	previous_utilized_cost = task.utilized_cost
	previous_incurred_cost = task.incurred_cost
	if update_on == "committed":
		task.committed_cost = flt(flt(previous_committed_cost) + flt(amount))
	elif update_on == "utilized":
		task.committed_cost = flt(flt(previous_utilized_cost) + flt(amount))
	elif update_on == "incurred":
		task.committed_cost = flt(flt(previous_incurred_cost) + flt(amount))
	task.flags.ignore_permissions = True
	task.flags.ignore_validate_update_after_submit = True
	task.save()
	frappe.db.commit()
	# Update Project
	if not task.is_group and task.parent_task:
		parent_doc = frappe.get_doc("Task",{'project':task.project, 'is_group': 1, 'name' : task.parent_task})
		parent_doc.committed_cost, parent_doc.incurred_cost, parent_doc.utilized_cost, parent_doc.available_budget = \
			frappe.get_value("Task",{'project':task.project, 'is_group': 0, 'parent_task' : task.parent_task},\
				["sum(committed_cost) as committed_cost","sum(incurred_cost) as incurred_cost", "sum(utilized_cost) as utilized_cost","sum(available_budget) as available_budget"])
		parent_doc.save()

	log_budget(dt=dt, dn=dn, task_name=task_name,\
		 previous_committed_cost=previous_committed_cost,\
			  previous_incurred_cost=previous_incurred_cost,\
				   previous_utilized_cost=previous_utilized_cost,\
					    previous_available_budget=previous_available_budget,\
							 field_name = "budget_log",\
								  _comment=comment if comment else f"Cost Update On {update_on}")

@frappe.whitelist()
def log_budget(dt,dn,task_name,previous_committed_cost,previous_incurred_cost,previous_utilized_cost,previous_available_budget,field_name = "budget_log",_comment=None):
	doc = frappe.get_doc("Task",task_name)
	user = frappe.session.user
	rejection_log = {
				"user": user,
				"user_name": frappe.get_value("User",user,"full_name"),
				"comment": _comment,
				"on": dt,
				"for": dn,
				"at": now_datetime(),
				"previous_committed_cost": previous_committed_cost,
				"new_committed_cost" : doc.committed_cost,
				"previous_incurred_cost":previous_incurred_cost,
				"new_incurred_cost": doc.incurred_cost,
				"previous_utilized_cost": previous_utilized_cost,
				"new_utilized_cost": doc.utilized_cost,
				"previous_available_budget":previous_available_budget,
				"new_available_budget":doc.available_budget,
            }
	doc.append(field_name, rejection_log)
	doc.flags.ignore_permissions = True
	doc.flags.ignore_validate_update_after_submit = True
	doc.save()
	pass
