from __future__ import unicode_literals

import json

import frappe
from frappe import _, throw


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