let text_to_show = value => {
	return value ? `&nbsp-&nbsp<b>${value}</b>` : '';
};

let init_field_task_title = (frm, link_field_name) => {
	if (!frm.fields_dict[link_field_name].value)
		return;
	frappe.db.get_doc(
		frm.fields_dict[link_field_name].df.options,
		frm.fields_dict[link_field_name].value
	).then(result => {
		render_field_title(frm, link_field_name, text_to_show(result.subject));
	});
};

let render_field_title = (frm, title, text) => {
	let field = frm.fields_dict[title];
	// field.label_span.innerHTML = `${__(field._label)}&nbsp-&nbsp<b>${text}</b>`;
	field.label_span.innerHTML = `${__(field._label)}${text}`;
};

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

frappe.ui.form.on('Purchase Order', {
	refresh: frm => {
		init_field_task_title(frm, 'set_project_task_group');
		init_field_task_title(frm, 'set_project_task');
		if (frm.docstatus == 0){
			autofill_project(frm.doc.items,'task',frm.doc.set_project_task);
			autofill_project(frm.doc.items,'project',frm.doc.set_project);
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
	
		frm.fields_dict['items'].grid.get_field('task').get_query = function(doc, cdt, cdn) {
			var child = locals[cdt][cdn];
			return {    
				filters:[
					['project', '=', child.project],
					['is_group', '=', 0]
				]
			}
		};
		// console.log(frm.selected_workflow_action);
	},
	before_workflow_action: () => {
		console.log(me.frm.selected_workflow_action);
		// frappe.throw(
			if(me.frm.selected_workflow_action == "Reject"){
				reject_items({frm: me.frm});
			}else if(me.frm.selected_workflow_action == "Proceed Approval"){
				console.log("Proceed Approva");
				frappe.call({
					method: "ets.docs.buying.purchase_order.validate_task_budget",
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
				approve_items({
					frm: me.frm,
					child_docname: "items",
					child_doctype: "Purchase Order Detail",
					cannot_add_row: true,
				})
			}

		throw new Error("Manually Stop of workflow");
	}
});




let reject_items = (opts) => {
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
					frm.script_manager.trigger("after_workflow_action");
				});
		},
		primary_action_label: __('Reject')
	});
	dialog.show();
}

// frappe.ui.form.on("Purchase Order", "refresh", function(frm) {
// 	cur_frm.fields_dict.set_project_task_group.get_query = function(doc) {
// 		return {
// 			filters: [
// 				["project", "=", doc.set_project],
// 				["is_group", "=",1]
// 			]
// 		}
// 	}
// 	cur_frm.fields_dict.set_project_task.get_query = function(doc) {
// 		return {
// 			filters: [
// 				["project", "=", doc.set_project],
// 				["is_group", "=",0],
// 				["parent_task", "=",doc.set_project_task_group]
// 			]
// 		}
// 	}

//     frm.fields_dict['items'].grid.get_field('task').get_query = function(doc, cdt, cdn) {
//         var child = locals[cdt][cdn];
//         return {    
//             filters:[
//                 ['project', '=', child.project],
// 				['is_group', '=', 0]
//             ]
//         }
//     }
// });


let approve_items = (opts) => {
		const frm = opts.frm;
		const child_meta = frappe.get_meta(`${frm.doc.doctype} Item`);
		const get_precision = (fieldname) => child_meta.fields.find(f => f.fieldname == fieldname).precision;
		this.data = [];

		frm.doc[opts.child_docname].forEach(d => {
			this.data.push({
				"docname": d.name,
				"name": d.name,
				"item_code": d.item_code,
				"delivery_date": d.delivery_date,
				"schedule_date": d.schedule_date,
				"conversion_factor": d.conversion_factor,
				"item_name": d.item_name,
				"warehouse": d.warehouse,
				"qty": d.qty,
				"rate": d.rate,
				"uom": d.uom,
				"checked": 1,
				"comment": null,
			});
		});

		const fields = [{
			fieldtype: 'Data',
			fieldname: "docname",
			read_only: 1,
			hidden: 1,
			columns:0
		}, {
			fieldtype: 'Link',
			fieldname: "item_code",
			options: 'Item',
			in_list_view: 1,
			bold: 1,
			read_only: 1,
			label: __('Item Code'),
			columns:2
		}, {
			fieldtype: 'Text',
			fieldname: "item_name",
			in_list_view: 1,
			read_only: 1,
			label: __('Item Name'),
			length: 10,
			columns:3
		}, {
			fieldtype: 'Link',
			fieldname: 'uom',
			options: 'UOM',
			read_only: 1,
			in_list_view: 1,
			label: __('UOM'),
			reqd: 1,
			columns:1
		}, {
			fieldtype: 'Float',
			fieldname: "qty",
			default: 0,
			read_only: 0,
			in_list_view: 1,
			label: __('Qty'),
			precision: get_precision("qty"),
			columns:1
		}, 
		{
			fieldtype: 'Currency',
			fieldname: "rate",
			options: "currency",
			default: 0,
			read_only: 1,
			bold: 1,
			in_list_view: 1,
			label: __('Rate'),
			precision: get_precision("rate"),
			columns:1
		},
		{
			fieldtype: 'Data',
			fieldname: "comment",
			in_list_view: 1,
			label: __('Comment'),
			columns:1
		},
		{
			fieldtype: 'Check',
			fieldname: "checked",
			default: 1,
			read_only: 0,
			in_list_view: 1,
			label: __('Approved'),
			columns:1
		}
		];


		const dialog = new frappe.ui.Dialog({
			title: __("Approve Items"),
			fields: [
				{
					fieldtype: 'Small Text', fieldname: 'approver_comment', label: __('Comment'),
				},
				{
					fieldtype: 'HTML', 
					fieldname: 'info', 
					reqd: false,
					options : "<div style='color:red;' >Only Selected rows will be approved! Other will be rejected!!</div>", 
					read_only: 1,
				},
				{
					fieldname: "trans_items",
					fieldtype: "Table",
					label: "Items",
					cannot_add_rows: true,
					cannot_delete_rows: true,
					in_place_edit: true,
					read_only: true,
					data: this.data,
					fields: fields
				},
			],
			primary_action: function () {
				const trans_items = this.get_values()["trans_items"].filter((item) => !!item.item_code);
				console.log(this.get_values()["trans_items"]);
				console.log(trans_items);
				console.log(dialog);
				console.log(cur_dialog);
				console.log(cur_dialog.get_values());
				console.log(frm.selected_workflow_action)
	
				frappe.call({
					method: "ets.docs.buying.purchase_order.validate_task_budget",
					args: { "doc": frm.doc.name},
					freeze: true,
					callback: function (r) {
						console.log(r);
						if(r.budget_aval){
							frappe.xcall('frappe.model.workflow.apply_workflow',
								{doc: frm.doc, action: frm.selected_workflow_action})
								.then((doc) => {
									dialog.hide();
									frappe.model.sync(doc);
									frm.refresh();
									frm.selected_workflow_action = null;
									frm.script_manager.trigger("after_workflow_action");
									
								});
						}else{
							dialog.hide();
							frappe.msgprint(r.mgs);
						}
					}
				})
			},
			secondary_action: function () {
				// console.log(e);
			},

			primary_action_label: __('Approve'),
			secondary_action_label: __('Reject'),
		});

		fields.forEach(element => {
			if(element.read_only){
				dialog.$wrapper.find(".data-row.row").find("div[data-fieldname='"+element.fieldname+"']").addClass('field-disabled');
			}
		});

		dialog.fields_dict.trans_items.$wrapper.find(".data-row.row").find("div[data-fieldname='comment']").removeClass('col-xs-1');
		dialog.fields_dict.trans_items.$wrapper.find(".data-row.row").find(".row-index").addClass('hidden');
		dialog.$wrapper.find('.modal-dialog').css("max-width", "max-content");
		dialog.$wrapper.find('.modal-content').css("width", "max-content");
		dialog.show();
}