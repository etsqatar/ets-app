let text_to_show = value => {
	return value ? value : '';
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
	field.label_span.innerHTML = `${__(field._label)}&nbsp-&nbsp<b>${text}</b>`;
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
		autofill_project(frm.doc.items,'project',frm.doc.set_project);
		autofill_project(frm.doc.items,'task',frm.doc.set_project_task);
		// console.log(frm.selected_workflow_action);
	},
	before_workflow_action: () => {
		console.log(me.frm.selected_workflow_action);
		// frappe.throw(
			if(me.frm.selected_workflow_action == "Reject"){
				RejectPopUp();
			}else{
				update_child_items({
					frm: me.frm,
					child_docname: "items",
					child_doctype: "Purchase Order Detail",
					cannot_add_row: true,
				})
				// frappe.confirm(
				// 	'Are you sure you want to proceed?',
				// 	function(frm){
				// 		frappe.xcall('frappe.model.workflow.apply_workflow',
				// 			{doc: me.frm.doc, action: me.frm.selected_workflow_action})
				// 			.then((doc) => {
				// 				frappe.model.sync(doc);
				// 				me.frm.refresh();
				// 				me.frm.selected_workflow_action = null;
				// 				me.frm.script_manager.trigger("after_workflow_action");
				// 			});
				// 	},
				// 	function(frm){
				// 		window.close();
				// 	}
				// );
			}
		// );

		// var d = new frappe.ui.Dialog({
		// 	'fields': [
		// 		{'fieldname': 'ht', 'fieldtype': 'HTML'},
		// 		{'fieldname': 'today', 'fieldtype': 'Date', 'default': frappe.datetime.nowdate()}
		// 	],
		// 	primary_action: function(){
		// 		d.hide();
		// 		show_alert(d.get_values());
		// 	}
		// });
		// d.fields_dict.ht.$wrapper.html('Hello World');
		// d.show();
		// frappe.throw();
		throw new Error("Manually Stop of workflow");
	}



	// update the link field title on the selection change
	// link_package: frm => {
	// 	let field = 'parent_task';
	// 	frappe.db.get_doc(frm.fields_dict[field].df.options, frm.fields_dict[field].value).then(result => {
	// 		render_field_title(frm, field, text_to_show(result.subject));   // my Link fields have a display field named 'title'
	// 	});
	// },
});




let RejectPopUp = () => {
	const dialog = new frappe.ui.Dialog({
		title: __('Add Multiple Service Units'),
		fields: [
			{
				fieldtype: 'Data', fieldname: 'healthcare_service_unit_name', label: __('Service Unit Name'),
				reqd: true, description: __("Will be serially suffixed to maintain uniquness. Example: 'Ward' will be named as 'Ward-####'"),
			},
			{
				fieldtype: 'Int', fieldname: 'count', label: __('Number of Service Units'),
				read_only: true,
				reqd: true
			},
			// {
			// 	fieldtype: 'Link', fieldname: 'service_unit_type', label: __('Service Unit Type'),
			// 	options: 'Healthcare Service Unit Type', description: __('Type of the new Service Unit'),
			// 	depends_on: 'eval:!doc.is_group', default: '', reqd: true,
			// 	onchange: () => {
			// 		if (cur_dialog) {
			// 			if (cur_dialog.fields_dict.service_unit_type.value) {
			// 				frappe.db.get_value('Healthcare Service Unit Type',
			// 					cur_dialog.fields_dict.service_unit_type.value, 'overlap_appointments')
			// 					.then(r => {
			// 						if (r.message.overlap_appointments) {
			// 							cur_dialog.set_df_property('service_unit_capacity', 'hidden', false);
			// 							cur_dialog.set_df_property('service_unit_capacity', 'reqd', true);
			// 						} else {
			// 							cur_dialog.set_df_property('service_unit_capacity', 'hidden', true);
			// 							cur_dialog.set_df_property('service_unit_capacity', 'reqd', false);
			// 						}
			// 					});
			// 			} else {
			// 				cur_dialog.set_df_property('service_unit_capacity', 'hidden', true);
			// 				cur_dialog.set_df_property('service_unit_capacity', 'reqd', false);
			// 			}
			// 		}
			// 	}
			// },
			{
				fieldtype: 'Int', fieldname: 'service_unit_capacity', label: __('Service Unit Capacity'),
				description: __('Sets the number of concurrent appointments allowed'), reqd: false,
				depends_on: "eval:!doc.is_group && doc.service_unit_type != ''", hidden: true
			},
			{
				fieldtype: 'Link', fieldname: 'warehouse', label: __('Warehouse'), options: 'Warehouse',
				description: __('Optional, if you want to manage stock separately for this Service Unit'),
			},
			{
				fieldtype: 'Link', fieldname: 'company', label: __('Company'), options: 'Company', reqd: true,
				// default: () => {
				// 	return cur_page.page.page.fields_dict.company.get_value();
				// }
			}
		],
		primary_action: () => {
			dialog.hide();
			let vals = dialog.get_values();
			if (!vals) return;

			return frappe.call({
				method: 'erpnext.healthcare.doctype.healthcare_service_unit.healthcare_service_unit.add_multiple_service_units',
				args: {
					parent: node.data.value,
					data: vals
				},
				callback: function (r) {
					if (!r.exc && r.message) {
						frappe.treeview_settings['Healthcare Service Unit'].treeview.tree.load_children(node, true);

						frappe.show_alert({
							message: __('{0} Service Units created', [vals.count - r.message.length]),
							indicator: 'green'
						});
					} else {
						frappe.msgprint(__('Could not create Service Units'));
					}
				},
				freeze: true,
				freeze_message: __('Creating {0} Service Units', [vals.count])
			});
		},
		primary_action_label: __('Create')
	});
	dialog.show();
}

frappe.ui.form.on("Purchase Order", "refresh", function(frm) {
	// console.log(frm.fields_dict['items'])
	// // var _task = frm.fields_dict['items'].grid.fields_map['task'];
	console.log(frm)
	// console.log(JSON.stringify(frm))
	// // console.log(frm.fields_dict['items'].grid.grid_rows)

	// frm.fields_dict['items'].grid.grid_rows.forEach(d => {
	// 	console.log(d);
	// 	if (d.doc['task'] == null){
	// 		return;
	// 	}

	// // 	var child = locals[cdt][cdt], 
    // //    grid_row = cur_frm.fields_dict['items'].grid.grid_rows_by_docname[child.name],
    // //    var cfield = frappe.utils.filter_dict(d.docfields, {fieldname: "task"});

	// 	// console.log(d.grid.grid_form.fields_dict);
	// 	// console.log(d.frm.cur_grid);
	// 	// console.log(d.doc['task']);
	// 	frappe.db.get_doc('Task',d.doc['task']).then(result => {
	// 		// render_field_title(d.frm, 'task', text_to_show(result.subject));
	// 		// console.log(result)
	// 		let field = d.grid.fields_map['task'];
	// 		// console.log(field)
	// 		// let field = d.grid.fields_map['task'];
	// 		field.label = `${__(field.label)}&nbsp-&nbsp<b>${text_to_show(result.subject)}</b>`;
	// 	});
	// 	d.refresh();
	// });
	// console.log(frm.fields_dict['items'].grid.get_field('task'))
	// cur_frm.fields_dict.cash_bank_account.get_query = function(doc) {
	// 	return {
	// 		filters: [
	// 			["Account", "account_type", "in", ["Cash", "Bank"]],
	// 			["Account", "is_group", "=",0],
	// 			["Account", "company", "=", doc.set_project],
	// 			["Account", "report_type", "=", "Balance Sheet"]
	// 		]
	// 	}
	// }
	cur_frm.fields_dict.set_project_task_group.get_query = function(doc) {
		return {
			filters: [
				["project", "=", doc.set_project],
				["is_group", "=",1]
			]
		}
	}
	cur_frm.fields_dict.set_project_task.get_query = function(doc) {
		return {
			filters: [
				["project", "=", doc.set_project],
				["is_group", "=",0],
				["parent_task", "=",doc.set_project_task_group]
			]
		}
	}

    frm.fields_dict['items'].grid.get_field('task').get_query = function(doc, cdt, cdn) {
        var child = locals[cdt][cdn];
		// init_field_title(frm, cdt, cdn, 'task');
		// cur_frm.fields_dict

		// frappe.db.get_doc(
		// 	frm.fields_dict['items'].grid.get_field('task').df.options,
		// 	frm.fields_dict['items'].grid.get_field('task').value
		// ).then(result => {
		// 	// render_field_title(frm, link_field_name, text_to_show(result.subject));
		// 	let field = frm.fields_dict['items'].grid.get_field('task');
		// 	field.label_span.innerHTML = `${__(field._label)}&nbsp-&nbsp<b>${ text_to_show(result.subject)}</b>`;
		// });

        // console.log(cdt);
        // console.log(cdn);
        // console.log(child);
        // console.log(doc);
        return {    
            filters:[
                ['project', '=', child.project],
				['is_group', '=', 0]
            ]
        }
    }
});

let approve_items = () => {
	const d = new frappe.ui.form.MultiSelectDialog({
			doctype: opts.source_doctype,
			target: opts.target,
			date_field: opts.date_field || undefined,
			setters: opts.setters,
			get_query: opts.get_query,
			add_filters_group: 1,
			action: function(selections, args) {
				let values = selections;
				if(values.length === 0){
					frappe.msgprint(__("Please select {0}", [opts.source_doctype]))
					return;
				}
				opts.source_name = values;
				opts.setters = args;
				d.dialog.hide();
				_map();
			},
		});

		return d;
}


let update_child_items = (opts) => {
		const frm = opts.frm;
		// console.log(frm);
		const cannot_add_row = (typeof opts.cannot_add_row === 'undefined') ? true : opts.cannot_add_row;
		const child_docname = (typeof opts.cannot_add_row === 'undefined') ? "items" : opts.child_docname;
		const child_meta = frappe.get_meta(`${frm.doc.doctype} Item`);
		const get_precision = (fieldname) => child_meta.fields.find(f => f.fieldname == fieldname).precision;
		// child_meta.editable_grid = false;

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
			title: __("Update Items"),
			fields: [
				{
					fieldtype: 'Small Text', fieldname: 'approver_comment', label: __('Comment'),
				},
				{
					fieldname: "trans_items",
					fieldtype: "Table",
					label: "Items",
					cannot_add_rows: true,
					cannot_delete_rows: true,
					in_place_edit: true,
					read_only: true,
					// editable_grid: false,
					// is_editable: false,
					// reqd: 1,
					data: this.data,
					// get_data: () => {
					// 	return this.data;
					// },
					fields: fields
				},
				{
					fieldtype: 'Data', fieldname: 'info', default : "Only Selected Row will be approved", read_only: 1,
				},
			],
			primary_action: function () {
				const trans_items = this.get_values()["trans_items"].filter((item) => !!item.item_code);
				// let selected_rows = cur_frm.doc["item"].grid.get_selected();
				// dialog.$wrapper.find('.modal-dialog').css("max-width", "max-content")
				console.log(this.get_values()["trans_items"]);
				console.log(trans_items);
				console.log(dialog);
				// console.log(get_checked_values());
				console.log(cur_dialog);
				console.log(cur_dialog.get_values());
				let x = dialog.$wrapper.find(".grid-row").find("div[data-idx=1]");
				console.log(x);
				console.log(x.find("input[type='checkbox']"));
				// frappe.call({
				// 	method: 'erpnext.controllers.accounts_controller.update_child_qty_rate',
				// 	freeze: true,
				// 	args: {
				// 		'parent_doctype': frm.doc.doctype,
				// 		'trans_items': trans_items,
				// 		'parent_doctype_name': frm.doc.name,
				// 		'child_docname': child_docname
				// 	},
				// 	callback: function () {
				// 		frm.reload_doc();
				// 	}
				// });
				// this.hide();
				// refresh_field("items");
			},
			secondary_action: function (e) {
				console.log(e);
			},

			primary_action_label: __('Approve'),
			secondary_action_label: __('Reject'),
		});

		// frm.doc[opts.child_docname].forEach(d => {
		// 	dialog.fields_dict.trans_items.df.data.push({
		// 		"docname": d.name,
		// 		"name": d.name,
		// 		"item_code": d.item_code,
		// 		"delivery_date": d.delivery_date,
		// 		"schedule_date": d.schedule_date,
		// 		"conversion_factor": d.conversion_factor,
		// 		"qty": d.qty,
		// 		"rate": d.rate,
		// 		"uom": d.uom
		// 	});
		// 	dialog.fields_dict.trans_items.df.read_only = 1;
		// 	dialog.fields_dict.trans_items.grid.update_docfield_property('rate',
		// 		'read_only', true);
		// 		// dialog.fields_dict.trans_items.$wrapper.hide();
		// 	// $("div[data-idx='"+grid_row.idx+"']").find("input[data-fieldname='here field name of child table']").css('pointer-events','none');
		// 	// this.data = dialog.fields_dict.trans_items.df.data;
		// 	dialog.fields_dict.trans_items.grid.refresh();
		// });


		// var field = dialog.get_field("trans_items");
		// field.df.read_only = 1; 
		// field.df.reqd = true; 
		// field.refresh();
		// console.log(dialog.fields_dict.trans_items.grid);
		// console.log(dialog.$wrapper.find("input[data-fieldname='uom']"));
		// console.log(dialog.$wrapper.find(".grid-row"));
		// console.log(dialog.$wrapper.find(".form-page"));
		// let x = dialog.$wrapper.find(".data-row.row");
		// x.find("div[data-fieldname='uom']").css('pointer-events','none');
		// console.log(x.find("div[data-fieldname='uom']"));

		fields.forEach(element => {
			if(element.read_only){
				dialog.$wrapper.find(".data-row.row").find("div[data-fieldname='"+element.fieldname+"']").addClass('field-disabled');
				// dialog.$wrapper.find(".data-row.row").find("div[data-fieldname='"+element.fieldname+"']").attr('readonly', true);
				// dialog.$wrapper.find(".data-row.row").find("div[data-fieldname='"+element.fieldname+"']").css('pointer-events','none');
				dialog.$wrapper.find(".awesomplete").find("input[data-fieldname='"+element.fieldname+"']").css('pointer-events','none');
			}
			
			// grid_row = dialog.cur_frm.get_field("trans_items").grid.get_row(element.name); 
			// grid_row.toggle_editable("element.fieldname", false);
		});

		// let get_checked_values = () => {
		// 	// Return name of checked value.
		// 	return dialog.$wrapper.find('.data-row.row').map(function () {
		// 		if ($(this).find('.grid-row-check:checkbox:checked').length > 0) {
		// 			return $(this).attr('data-item-name');
		// 		}
		// 	}).get();
		// }

		// dialog.$wrapper.find(".grid-row").toggle_editable("uom", false);
		
		// console.log(dialog.$wrapper.find(".data-row.row").attributes.find("data-name"));
		// for (let index = 1; index <= this.data.length; index++) {
			// 	// const element = array[index];
			// 	$("div[data-idx='"+index+"']").find("input[data-fieldname='uom']").css('pointer-events','none');
			// 	dialog.$wrapper.find("input[data-fieldname='uom']").css('pointer-events','none')
			// 	// dialog.fields_dict.trans_items.grid.grid_rows[index].$wrapper.find("input[data-fieldname='uom']").css('pointer-events','none');
			// }
			// dialog.$wrapper.find(".data-row.row").css('pointer-events','none');

		console.log(dialog);
		console.log(dialog.fields_dict);
		console.log(dialog.fields_dict.trans_items);
		console.log(dialog.fields_dict.trans_items.$wrapper);
		dialog.fields_dict.trans_items.$wrapper.find(".data-row.row").find("div[data-fieldname='comment']").removeClass('col-xs-1');
		dialog.fields_dict.trans_items.$wrapper.find(".data-row.row").find(".row-index").addClass('hidden');
		dialog.$wrapper.find('.modal-dialog').css("max-width", "max-content");
		dialog.$wrapper.find('.modal-content').css("width", "max-content");
		dialog.show();
}

// let get_checked_values = () => {
// 	// Return name of checked value.
// 	return this.$results.find('.list-item-container').map(function () {
// 		if ($(this).find('.list-row-check:checkbox:checked').length > 0) {
// 			return $(this).attr('data-item-name');
// 		}
// 	}).get();
// }
