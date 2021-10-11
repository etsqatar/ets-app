from __future__ import unicode_literals
import ast
from csv import excel_tab
from warnings import catch_warnings
import frappe
from frappe.utils.data import flt
from frappe.desk.form.load import get_attachments
from frappe.utils.xlsxutils import read_xls_file_from_attached_file, read_xlsx_file_from_attached_file


from ets.utils import ets_logger


def validate(doc,method):
	doc.committed_cost, doc.incurred_cost, doc.utilized_cost = frappe.get_value("Task",{'project':doc.name, 'is_group': 0},["sum(committed_cost) as committed_cost","sum(incurred_cost) as incurred_cost", "sum(utilized_cost) as utilized_cost"])

	if len(doc.contract_revisions) > 0:
		doc.revised_contract_value = doc.contract_revisions[-1].revised_contract_value
		doc.estimated_costing = doc.revised_contract_value
	else:
		doc.revised_contract_value = 0
		
	if doc.committed_cost and doc.budget:
		doc.available_budget = flt(flt(doc.estimated_costing) - flt(doc.committed_cost))
	pass

@frappe.whitelist()
def get_project_revised_contract_value(revised_amount = None,actual_contract_value= None,revised_contract_value = None):
	if revised_amount and flt(revised_contract_value) > 0 :
		revised_contract_value = flt(flt(revised_contract_value) + flt(revised_amount))
	else:
		revised_contract_value = flt(flt(actual_contract_value) + flt(revised_amount))
	frappe.response["revised_contract_value"] = revised_contract_value
	pass

@frappe.whitelist()
def import_project_budget(doc):
	if isinstance(doc, str):
		doc = ast.literal_eval(doc)
		doc = frappe._dict(doc)
	excel_data = []
	att_type = (doc.budget_file.split()[-1]).split(".")[-1]
	if att_type == 'xlsx':
		excel_data = read_xlsx_file_from_attached_file(doc.budget_file)
		pass
	elif att_type == 'xls':
		excel_data = read_xls_file_from_attached_file(doc.budget_file)
		pass

	if not excel_data:
		return
	excel_data.pop(0)
	phase = None
	for data in excel_data:
		p = data[0]
		t = data[1]
		budget = data[2]
		if p:
			_phase = frappe.get_value("Task" , {'subject' : p, 'is_group': 1, 'project': doc.name}, 'name')
			# ets_logger.debug(_phase)
			if not _phase:
				doc_dict = {
							'doctype': 'Task',
							'project': doc.name,
							'subject': p,
							'is_group': 1,
							'naming_series': f'PHASE-{doc.name}-.YYYY.-.####',
							}
						# # ets_logger.debug(doc_dict)
				try: 
					phase = frappe.get_doc(doc_dict).insert()
				except Exception as e:
					pass
			else:
				phase = frappe.get_doc("Task" , _phase)
		
		if t:
			# _task = frappe.get_value("Task" , {'subject' : t, 'is_group': 0, 'project': doc.name}, 'name')
			# # ets_logger.debug(_task)
			# if not _task:
			doc_dict = {
						'doctype': 'Task',
						'project': doc.name,
						'subject': t,
						'is_group': 0,
						'budget': flt(budget),
						'available_budget': flt(budget),
						'actual_contract_value': flt(budget),
						'committed_cost': 0,
						'incurred_cost': 0,
						'utilized_cost': 0,
						'parent_task': phase.name,
						'naming_series': f'TASK-{doc.name}-.YYYY.-.####',
						}
					# # ets_logger.debug(doc_dict)
			try: 
				frappe.get_doc(doc_dict).insert()
			except Exception as e:
				pass

		# # ets_logger.debug(phase)
		# ets_logger.debug(data)

	frappe.db.commit()
	for _phase in frappe.get_all("Task" , {'is_group': 1, 'project': doc.name}, ['name']):
		# ets_logger.debug(_phase)
		phase = frappe.get_doc("Task" , _phase.name)	
		# ets_logger.debug(phase)
		phase.committed_cost, phase.incurred_cost, phase.utilized_cost, phase.available_budget, phase.budget , phase.actual_contract_value = \
			frappe.get_value("Task",{'project':doc.name, 'is_group': 0, 'parent_task': _phase.name},\
				["sum(committed_cost) as committed_cost","sum(incurred_cost) as incurred_cost", "sum(utilized_cost) as utilized_cost", "sum(available_budget) as available_budget" , "sum(budget) as budget" ,  "sum(actual_contract_value) as actual_contract_value"])
		# ets_logger.debug(f'{phase.committed_cost}, {phase.incurred_cost}, {phase.utilized_cost} , {phase.available_budget}, {phase.budget}')
		phase.save()

	project = frappe.get_doc("Project",doc.name)
	project.budget_imported = True
	project.committed_cost, project.incurred_cost, project.utilized_cost, project.available_budget =\
			frappe.get_value("Task",{'project':doc.name, 'is_group': 0},\
				["sum(committed_cost) as committed_cost","sum(incurred_cost) as incurred_cost", "sum(utilized_cost) as utilized_cost", "sum(available_budget) as available_budget"])
	project.estimated_costing = project.available_budget
	project.actual_contract_value = project.available_budget
	project.save()
	pass



@frappe.whitelist()
def delete_project_budget(doc):
	for _phase in frappe.get_all("Task" , {'is_group': 1, 'project': doc}, ['name']):
		phase = frappe.get_doc("Task" , _phase.name)	
		phase.depends_on = None
		phase.save()
	for _phase in frappe.get_all("Task" , {'is_group': 0, 'project': doc}, ['name']):
		phase = frappe.get_doc("Task" , _phase.name)	
		phase.delete()
	for _phase in frappe.get_all("Task" , {'is_group': 1, 'project': doc}, ['name']):
		phase = frappe.get_doc("Task" , _phase.name)	
		phase.delete()
	project = frappe.get_doc("Project",doc)
	project.budget_imported = False
	project.save()
	pass
