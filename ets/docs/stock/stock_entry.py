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
	if doc.stock_entry_type == "Material Issue":
		update_budjet_cost(dt="Stock Entry", dn=doc.name, task_name = doc.set_project_task, amount = doc.total_outgoing_value, update_on = "Utilized", comment="On Submit Material Issue")
	pass

def on_cancel(doc,method):
	# update_budjet_cost(dt="Stock Entry", dn=doc.name, task_name = doc.set_project_task, amount = -doc.total_outgoing_value, update_on = "utilized", comment=None)
	pass

@frappe.whitelist()
def before_cancel(name,task_name, amount):
	update_budjet_cost(dt="Stock Entry", dn=name, task_name = task_name, amount = -(flt(amount)), update_on = "Utilized", comment="On Cancel Material Issue")
	pass