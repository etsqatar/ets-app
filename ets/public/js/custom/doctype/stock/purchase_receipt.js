frappe.ui.form.on('Purchase Receipt', {
	refresh: frm => {
		init_field_task_title(frm, 'set_project_task_group');
		init_field_task_title(frm, 'set_project_task');
		if (frm.docstatus == 0){
			autofill_project(frm.doc.items,'project',frm.doc.set_project);
			autofill_project(frm.doc.items,'task',frm.doc.set_project_task);
        	frm.set_value("project", frm.doc.set_project);
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

    before_cancel: frm =>{
        frappe.call({
            method: "ets.docs.stock.purchase_receipt.before_cancel",
            args: { "name": frm.doc.name, "task_name": frm.doc.set_project_task,  "amount": frm.doc.grand_total},
            callback: function (r) {
                console.log(r);
            }
        });	
    }
});


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

