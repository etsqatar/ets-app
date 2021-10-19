frappe.ui.form.on('Material Request', {
	refresh: frm => {
		init_field_title(frm, 'set_project_task_group');
		init_field_title(frm, 'set_project_task');
		if (frm.docstatus == 0){
			autofill_project(frm.doc.items,'project',frm.doc.set_project);
			autofill_project(frm.doc.items,'task',frm.doc.set_project_task);
		}
        cur_frm.fields_dict.set_project_task_group.get_query = function(doc) {
			return {
				filters: [
					["project", "=", doc.set_project],
					["is_group", "=",1]
				]
			}
		};
		cur_frm.fields_dict.set_project_task.get_query = function(doc) {
			return {
				filters: [
					["project", "=", doc.set_project],
					["is_group", "=",0],
					["parent_task", "=",doc.set_project_task_group]
				]
			}
		};
	},

    before_workflow_action: () => {
		console.log(me.frm.selected_workflow_action);
		// frappe.throw(
			if(me.frm.selected_workflow_action == "Reject"){
				reject_({frm: me.frm});
			}else if(me.frm.selected_workflow_action == "Proceed Approval"){
				frappe.call({
					method: "ets.docs.stock.material_request.validate_task_budget",
					args: { "doc": me.frm.doc.name},
					// freeze: true,
					callback: function (r) {
						console.log(r);
						if(r.budget_aval){
							frappe.xcall('frappe.model.workflow.apply_workflow',
								{doc: me.frm.doc, action: me.frm.selected_workflow_action})
								.then((doc) => {
									frappe.model.sync(doc);
									me.frm.refresh();
									me.frm.selected_workflow_action = null;
									me.frm.script_manager.trigger("after_workflow_action");
								});	
						}else{
							frappe.msgprint(r.mgs);
						}
					}
				});	
				
			}else{
				approve_({frm: me.frm});
			}

		throw new Error("Manually Stop of workflow");
	}
    
});

let reject_ = (opts) => {
	const frm = opts.frm;
	const dialog = new frappe.ui.Dialog({
		title: __('Please provide reason for rejection'),
		fields: [
			{
				fieldtype: 'Small Text', fieldname: 'approver_comment', label: __('Comment'),
				reqd: 1,
			}
		],
		primary_action: () => {
			dialog.hide();
			let vals = dialog.get_values();
			if (!vals) return;
			
			frappe.xcall('frappe.model.workflow.apply_workflow',
				{doc: frm.doc, action: frm.selected_workflow_action})
				.then((doc) => {
					frappe.model.sync(doc);
					
					frm.selected_workflow_action = null;
					frappe.call({
						method: "ets.utils.log_rejection",
						args: {  "dt": frm.doctype,"dn": frm.docname, "field_name" : "rejection_log", "_comment" : vals.approver_comment},
						// freeze: true,
						callback: function (r) {
							frm.script_manager.trigger("after_workflow_action");
							frm.refresh();
						}
					});
				});

				
		},
		primary_action_label: __('Reject')
	});
	dialog.show();
}

let approve_ = (opts) => {
	const frm = opts.frm;
	const dialog = new frappe.ui.Dialog({
		title: __('Do you wish to proceed'),
		fields: [
			{
				fieldtype: 'Small Text', fieldname: 'approver_comment', label: __('Comment'),
				reqd: 0,
			}
		],
		primary_action: () => {
			dialog.hide();
			let vals = dialog.get_values();		
			frappe.call({
				method: "ets.docs.stock.material_request.validate_task_budget",
				args: { "doc": me.frm.doc.name},
				// freeze: true,
				callback: function (r) {
					console.log(r);
					if(r.budget_aval){
						frappe.xcall('frappe.model.workflow.apply_workflow',
						{doc: frm.doc, action: frm.selected_workflow_action})
						.then((doc) => {
							frappe.model.sync(doc);
							
							frm.selected_workflow_action = null;
							frappe.call({
								method: "ets.utils.log_approval",
								args: {  "dt": frm.doctype,"dn": frm.docname, "field_name" : "approval_log", "_comment" : vals.approver_comment},
								// freeze: true,
								callback: function (r) {
									frm.script_manager.trigger("after_workflow_action");
									frm.refresh();
								}
							});
						});
					}else{
						frappe.msgprint(r.mgs);
					}
				}
			});		
			
		},
		primary_action_label: __('Approve')
	});
	dialog.show();
}

let autofill_project = (child_table, project_field, project) => {
	if (project && child_table && child_table.length) {
		let doctype = child_table[0].doctype;
		$.each(child_table || [], function(i, item) {
			frappe.model.set_value(doctype, item.name, project_field, project);
		});
	}
};

let autofill_task = (child_table, task_field, task) => {
	if (task && child_table && child_table.length) {
		let doctype = child_table[0].doctype;
		$.each(child_table || [], function(i, item) {
			frappe.model.set_value(doctype, item.name, task_field, task);
		});
	}
};

let text_to_show = value => {
	return value ? `&nbsp-&nbsp<b>${value}</b>` : '';
};

let init_field_title = (frm, link_field_name) => {
	if (!frm.fields_dict[link_field_name].value){
		render_field_title(frm, link_field_name, text_to_show())
		return;
	}
	frappe.db.get_doc(
		frm.fields_dict[link_field_name].df.options,
		frm.fields_dict[link_field_name].value
	).then(result => {
		render_field_title(frm, link_field_name, text_to_show(result.subject));
	});
};

let render_field_title = (frm, title, text) => {
	let field = frm.fields_dict[title];
	field.label_span.innerHTML = `${__(field._label)}${text}`;
};

// Manufacture
// Customer Provided