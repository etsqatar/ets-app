// return placeholder text if link_field value is falsy
let text_to_show = value => {
	return value ? value : '';
};

// this function will be called from the Form's onload/onrefresh 
// to fetch the value from the DB and render the Link field title initially
let init_field_title = (frm, link_field_name) => {
	if (!frm.fields_dict[link_field_name].value)
		return;
	frappe.db.get_doc(
		frm.fields_dict[link_field_name].df.options,
		frm.fields_dict[link_field_name].value
	).then(result => {
		render_field_title(frm, link_field_name, text_to_show(result.subject));
	});
};

// the render function itself, just to be DRY
let render_field_title = (frm, title, text) => {
	let field = frm.fields_dict[title];
	field.label_span.innerHTML = `${__(field._label)}&nbsp-&nbsp<b>${text}</b>`;
};

frappe.ui.form.on('Purchase Order', {
	refresh: frm => {
		// init_field_title(frm, 'parent_task');
	},

	// update the link field title on the selection change
	// link_package: frm => {
	// 	let field = 'parent_task';
	// 	frappe.db.get_doc(frm.fields_dict[field].df.options, frm.fields_dict[field].value).then(result => {
	// 		render_field_title(frm, field, text_to_show(result.subject));   // my Link fields have a display field named 'title'
	// 	});
	// },
});

frappe.ui.form.on("Purchase Order", "refresh", function(frm) {
	// console.log(frm.fields_dict['items'])
	// // var _task = frm.fields_dict['items'].grid.fields_map['task'];
	// // console.log(_task)
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