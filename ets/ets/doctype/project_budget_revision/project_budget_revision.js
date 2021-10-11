// Copyright (c) 2021, oryxerp.qa and contributors
// For license information, please see license.txt

frappe.ui.form.on('Project Budget Revision', {
	refresh: function(frm) {
		init_field_title(frm, 'project_phase');
		init_field_title(frm, 'project_task');
		cur_frm.fields_dict.project_phase.get_query = function(doc) {
			return {
				filters: [
					["project", "=", doc.project],
					["is_group", "=",1]
				]
			}
		};
		cur_frm.fields_dict.project_task.get_query = function(doc) {
			return {
				filters: [
					["project", "=", doc.project],
					["is_group", "=",0],
					["parent_task", "=",doc.project_phase]
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
				frappe.xcall('frappe.model.workflow.apply_workflow',
					{doc: me.frm.doc, action: me.frm.selected_workflow_action})
					.then((doc) => {
						frappe.model.sync(doc);
						me.frm.refresh();
						me.frm.selected_workflow_action = null;
						me.frm.script_manager.trigger("after_workflow_action");
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
					frm.refresh();
					frm.selected_workflow_action = null;
					frappe.call({
						method: "ets.utils.log_rejection",
						args: {  "dt": "Project Budget Revision","dn": frm.doc.name, "field_name" : "rejection_log", "_comment" : vals.approver_comment},
						// freeze: true,
						callback: function (r) {
							frm.script_manager.trigger("after_workflow_action");
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
			frappe.xcall('frappe.model.workflow.apply_workflow',
				{doc: frm.doc, action: frm.selected_workflow_action})
				.then((doc) => {
					frappe.model.sync(doc);
					frm.refresh();
					frm.selected_workflow_action = null;
					frappe.call({
						method: "ets.utils.log_approval",
						args: {  "dt": "Project Budget Revision","dn": frm.doc.name, "field_name" : "approval_log", "_comment" : vals.approver_comment},
						// freeze: true,
						callback: function (r) {
							frm.script_manager.trigger("after_workflow_action");
						}
					});
				});
		},
		primary_action_label: __('Approve')
	});
	dialog.show();
}



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
