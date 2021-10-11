from __future__ import unicode_literals
import frappe
from frappe import _, throw
from ets.utils import ets_logger


def validate(doc,method):
	# ets_logger.debug(f"{doc} - {method}")
	# ets_logger.debug(doc.items)
	# for item in doc.items:
	# 	pass
	pass

def on_update(doc,state):
	ets_logger.debug(f"{doc} - {state}")
	# ets_logger.debug(doc.items)
	# for item in doc.items:
	# 	pass
	pass

@frappe.whitelist()
def validate_task_budget(doc):
	po = frappe.get_doc("Purchase Order",doc)
	project_task = frappe.get_doc("Task",po.set_project_task)

	if po.grand_total > project_task.available_budget:
		# frappe.throw("Budget not avaliable to proceed")
		frappe.response["budget_aval"] = False
		frappe.response["mgs"] = "Budget not avaliable to proceed"
	else: frappe.response["budget_aval"] = True

# def process_workflow_actions(doc, state):
# 	workflow = get_workflow_name(doc.get('doctype'))
# 	if not workflow: return

# 	if state == "on_trash":
# 		clear_workflow_actions(doc.get('doctype'), doc.get('name'))
# 		return

# 	if is_workflow_action_already_created(doc): return

# 	clear_old_workflow_actions(doc)
# 	update_completed_workflow_actions(doc)
# 	clear_doctype_notifications('Workflow Action')

# 	next_possible_transitions = get_next_possible_transitions(workflow, get_doc_workflow_state(doc), doc)

# 	if not next_possible_transitions: return

# 	user_data_map = get_users_next_action_data(next_possible_transitions, doc)

# 	if not user_data_map: return

# 	create_workflow_actions_for_users(user_data_map.keys(), doc)

# 	if send_email_alert(workflow):
# 		enqueue(send_workflow_action_email, queue='short', users_data=list(user_data_map.values()), doc=doc)