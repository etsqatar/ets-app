# Copyright (c) 2021, oryxerp.qa and contributors
# For license information, please see license.txt

# import frappe
from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils.data import flt
from ets.utils import ets_logger


class ProjectBudgetRevision(Document):
	def validate(self):
		project = frappe.get_doc("Project", self.project)
		task = frappe.get_doc("Task", self.project_task)

		self.actual_project_contract_value = project.actual_contract_value
		self.previous_revised_project_contract_value = project.revised_contract_value
		self.actual_task_budget = task.actual_contract_value
		self.previous_revised_task_budget = task.revised_contract_value
		self.available_task_budget = task.available_budget
		self.previous_revisions = None
		for revision in task.contract_revisions:
			project_contract = {
				"revised_amount": revision.revised_amount,
				"revised_contract_value": revision.revised_contract_value,
				"task": revision.task,
            }
			self.append('previous_revisions', project_contract)

		if self.revised_amount:
			if self.revised_amount < 0:
				if flt(flt(task.available_budget) + flt(self.revised_amount)) < 0:
					frappe.throw(frappe._("Can't drecress budget less than task's available budget."))
				elif flt(flt(task.actual_contract_value) + flt(self.revised_amount)) < 0:
					frappe.throw(frappe._("Can't drecress budget less than task's actual contract value."))
			if flt(self.previous_revised_project_contract_value) > 0 :
				self.revised_project_contract_value = flt(flt(self.previous_revised_project_contract_value) + flt(self.revised_amount))
			else:
				self.revised_project_contract_value = flt(flt(self.actual_project_contract_value) + flt(self.revised_amount))
			if flt(self.previous_revised_task_budget) > 0 :
				self.revised_task_budget = flt(flt(self.previous_revised_task_budget) + flt(self.revised_amount))
			else:
				self.revised_task_budget = flt(flt(self.actual_task_budget) + flt(self.revised_amount))

	def on_submit(self):
		self.update_budget()
	
	def on_cancel(self):
		self.update_budget_on_cancel()

	def update_budget(self):
		project = frappe.get_doc("Project", self.project)
		task = frappe.get_doc("Task", self.project_task)

		project_contract = {
            "revised_amount": self.revised_amount,
            "revised_contract_value": self.revised_task_budget,
            "task": self.project_task,
            }
		project.append('contract_revisions', project_contract)
		project.save()
		task.append('contract_revisions', project_contract)
		task.save()

	def update_budget_on_cancel(self):
		project = frappe.get_doc("Project", self.project)
		task = frappe.get_doc("Task", self.project_task)

		project_contract = {
            "revised_amount": -flt(self.revised_amount),
            "revised_contract_value": flt(flt(task.revised_contract_value) - flt(self.revised_amount)),
            "task": self.project_task,
            }
		project.append('contract_revisions', project_contract)
		project.save()
		task.append('contract_revisions', project_contract)
		task.save()
			
		
