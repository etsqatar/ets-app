frappe.ui.form.on('Project', {
	refresh: frm => {
		
	},

	import_budget: function (frm) {
		frappe.call({
			method: "ets.docs.project.project.import_project_budget",
			args: { "doc": frm.doc},
			freeze: true,
			callback: function (r) {
				frm.reload_doc();
				// console.log(r)
				// frappe.model.set_value(cdt, cdn, "revised_contract_value", r.revised_contract_value);
				// frm.set_value("revised_contract_value", r.revised_contract_value);
			}
		});			
	},

	delete_budget: function (frm) {
		frappe.call({
			method: "ets.docs.project.project.delete_project_budget",
			args: { "doc": frm.doc.name},
			freeze: true,
			callback: function (r) {
				frm.reload_doc();
				// console.log(r)
				// frappe.model.set_value(cdt, cdn, "revised_contract_value", r.revised_contract_value);
				// frm.set_value("revised_contract_value", r.revised_contract_value);
			}
		});			
	}
});


frappe.ui.form.on('Project Contract', {

	revised_amount: function (frm, cdt, cdn) {
		var row = locals[cdt][cdn];
		frappe.call({
			method: "ets.docs.project.project.get_project_revised_contract_value",
			args: { "revised_amount": row.revised_amount , "actual_contract_value" : frm.doc.actual_contract_value, "revised_contract_value" : frm.doc.revised_contract_value },
			callback: function (r) {
				// console.log(r)
				frappe.model.set_value(cdt, cdn, "revised_contract_value", r.revised_contract_value);
				// frm.set_value("revised_contract_value", r.revised_contract_value);
			}
		});			
	}
});