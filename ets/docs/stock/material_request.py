from __future__ import unicode_literals
import frappe
from frappe import _, throw
from frappe.utils.data import flt
from ets.utils import ets_logger


def validate(doc,method):
	# validate_task_budget(doc.name)
	pass

def on_update(doc,state):
	pass

def on_submit(doc,method):
	pass

def on_cancel(doc,method):
	# update_budjet_cost(dt="Purchase Receipt", dn=doc.name, task_name = doc.set_project_task, amount = -doc.grand_total, update_on = "incurred", comment=None)
	pass


@frappe.whitelist()
def validate_task_budget(doc):
	mr = frappe.get_doc("Material Request",doc)
	project_task = frappe.get_doc("Task",mr.set_project_task)
	mr_items_rate = sum([ item.amount for item in mr.items])
	ets_logger.debug(mr_items_rate)
	if mr_items_rate > project_task.available_budget:
		# frappe.throw("Budget not avaliable to proceed")
		frappe.response["budget_aval"] = False
		frappe.response["mgs"] = "Budget not avaliable to proceed"
	else: frappe.response["budget_aval"] = True