from __future__ import unicode_literals
import frappe
from frappe import _, throw
from frappe.utils.data import flt
from ets.utils import update_budjet_cost


def validate(doc,method):
	pass

def on_update(doc,state):
	pass

def on_submit(doc,method):
	update_budjet_cost(dt="Purchase Receipt", dn=doc.name, task_name = doc.set_project_task, amount = doc.grand_total, update_on = "Incurred", comment="On Submit")
	pass

def on_cancel(doc,method):
	# update_budjet_cost(dt="Purchase Receipt", dn=doc.name, task_name = doc.set_project_task, amount = -doc.grand_total, update_on = "incurred", comment=None)
	pass

@frappe.whitelist()
def before_cancel(name,task_name, amount):
	update_budjet_cost(dt="Purchase Receipt", dn=name, task_name = task_name, amount = -(flt(amount)), update_on = "Incurred", comment="On Cancel")
	pass