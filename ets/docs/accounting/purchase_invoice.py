from __future__ import unicode_literals
import frappe
from frappe import _, throw
from frappe.utils.data import flt
from ets.utils import update_budjet_cost,ets_logger


def validate(doc,method):
	pass

def on_update(doc,state):
	pass

def on_submit(doc,method):
	po = list(set([item.purchase_order for item in doc.items if item.purchase_order]))
	if not po:
		update_budjet_cost(dt="Purchase Invoice", dn=doc.name, task_name = doc.set_project_task, amount = doc.grand_total, update_on = "Committed|Incurred|Utilized", comment="On Submit Mannual Invoice")

def on_cancel(doc,method):
	# update_budjet_cost(dt="Purchase Invoice", dn=doc.name, task_name = doc.set_project_task, amount = -doc.grand_total, update_on = "utilized", comment=None)
	pass

@frappe.whitelist()
def before_cancel(name,task_name, amount):
	update_budjet_cost(dt="Purchase Invoice", dn=name, task_name = task_name, amount = -(flt(amount)), update_on = "Committed|Incurred|Utilized", comment="On Cancel Mannual Invoice")
	pass