from __future__ import unicode_literals
import frappe
from frappe.utils.data import flt
from ets.utils import ets_logger, get_conditions
import ast

def validate(doc,method):
	if doc.committed_cost and doc.budget:
		doc.available_budget = flt(flt(doc.budget) - flt(doc.committed_cost))
	pass

def on_update(doc,method):
	project_doc = frappe.get_doc("Project",doc.project)
	project_doc.committed_cost, project_doc.incurred_cost, project_doc.utilized_cost = \
		frappe.get_value("Task",{'project':doc.project, 'is_group': 0},\
			["sum(committed_cost) as committed_cost","sum(incurred_cost) as incurred_cost", "sum(utilized_cost) as utilized_cost" ])
	project_doc.available_budget = flt(flt(project_doc.estimated_costing) - flt(project_doc.committed_cost))
	project_doc.save()
	pass

@frappe.whitelist()
def after_save(doc):
	ets_logger.debug(doc)
	if isinstance(doc, str):
		doc = ast.literal_eval(doc)
		doc = frappe._dict(doc)
	if not doc.is_group:
		parent_doc = frappe.get_doc("Task",{'project':doc.project, 'is_group': 1, 'name' : doc.parent_task})
		parent_doc.committed_cost, parent_doc.incurred_cost, parent_doc.utilized_cost, parent_doc.budget = \
			frappe.get_value("Task",{'project':doc.project, 'is_group': 0, 'parent_task' : doc.parent_task},\
				["sum(committed_cost) as committed_cost","sum(incurred_cost) as incurred_cost", "sum(utilized_cost) as utilized_cost","sum(budget) as budget"])
		parent_doc.save()

	# project_doc = frappe.get_doc("Project",doc.project)
	# project_doc.committed_cost, project_doc.incurred_cost, project_doc.utilized_cost = \
	# 	frappe.get_value("Task",{'project':doc.project, 'is_group': 0},\
	# 		["sum(committed_cost) as committed_cost","sum(incurred_cost) as incurred_cost", "sum(utilized_cost) as utilized_cost" ])
	# project_doc.available_budget = flt(flt(project_doc.estimated_costing) - flt(project_doc.committed_cost))
	# project_doc.save()
	pass


@frappe.whitelist()
def get_children(doctype, parent, task=None, project=None, is_root=False):

	filters = [['docstatus', '<', '2']]

	if task:
		filters.append(['parent_task', '=', task])
	elif parent and not is_root:
		# via expand child
		filters.append(['parent_task', '=', parent])
	else:
		filters.append(['ifnull(`parent_task`, "")', '=', ''])

	if project:
		filters.append(['project', '=', project])

	tasks = frappe.get_list(doctype, fields=[
		'name as value',
		'subject as title',
		'is_group as expandable',
		'budget'
	], filters=filters, order_by='name')
    
    # return tasks
	return tasks