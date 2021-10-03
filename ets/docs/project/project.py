from __future__ import unicode_literals
import frappe
from frappe.utils.data import flt
from ets.utils import ets_logger


def validate(doc,method):
	doc.committed_cost, doc.incurred_cost, doc.utilized_cost = frappe.get_value("Task",{'project':doc.name, 'is_group': 0},["sum(committed_cost) as committed_cost","sum(incurred_cost) as incurred_cost", "sum(utilized_cost) as utilized_cost"])
	if doc.committed_cost and doc.budget:
		doc.available_budget = flt(flt(doc.estimated_costing) - flt(doc.committed_cost))

	if len(doc.contract_revisions) > 0:
		doc.revised_contract_value = doc.contract_revisions[-1].revised_contract_value
	else:
		doc.revised_contract_value = 0
	pass

@frappe.whitelist()
def get_project_revised_contract_value(revised_amount = None,actual_contract_value= None,revised_contract_value = None):
	if revised_amount and flt(revised_contract_value) > 0 :
		revised_contract_value = flt(flt(revised_contract_value) + flt(revised_amount))
	else:
		revised_contract_value = flt(flt(actual_contract_value) + flt(revised_amount))
	frappe.response["revised_contract_value"] = revised_contract_value
	pass