// return placeholder text if link_field value is falsy
let text_to_show = value => {
	return value ? `&nbsp-&nbsp<b>${value}</b>` : '';
};

// this function will be called from the Form's onload/onrefresh 
// to fetch the value from the DB and render the Link field title initially
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

// the render function itself, just to be DRY
let render_field_title = (frm, title, text) => {
	let field = frm.fields_dict[title];
	field.label_span.innerHTML = `${__(field._label)}${text}`;
};

frappe.ui.form.on('Task', {
	refresh: frm => {
		init_field_title(frm, 'parent_task');
	},
	after_save: function (frm) {
		frappe.call({
			method:
				"ets.docs.project.task.task.task_after_save",
			args: {
				doc: frm.doc.name,
			},
			callback: (response) => {
				frm.reload_doc();
			},
		});
	},

	// update the link field title on the selection change
	// link_package: frm => {
	// 	let field = 'parent_task';
	// 	frappe.db.get_doc(frm.fields_dict[field].df.options, frm.fields_dict[field].value).then(result => {
	// 		render_field_title(frm, field, text_to_show(result.subject));   // my Link fields have a display field named 'title'
	// 	});
	// },
});