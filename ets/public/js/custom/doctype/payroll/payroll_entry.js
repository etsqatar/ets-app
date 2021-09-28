// Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

// var in_progress = false;

// frappe.provide("erpnext.accounts.dimensions");

frappe.ui.form.on('Payroll Entry', {
		refresh: function (frm) {
		frm.add_custom_button(__('Process Timesheet'), () => {
			// frappe.call({
			// 	method: 'ets.docs.payroll.payroll_entry.process_timesheet',
			// 	doc: frm.doc,
			// }).then(r => {
			// 	console.log(r)
			// });
			// console.log(frm)
			frappe.show_alert({
				message: "Processing Timesheet",
				indicator: 'orange'
			});
			frappe.call({
				method: "ets.docs.payroll.payroll_entry.process_timesheet_backgroupjob",
				args: {
					doc: frm.doc.name
				},
				freeze: true,
				freeze_message: __("Processing Timesheet..."),
				callback: function(r) {
					frm.reload_doc();
					// console.log(r)
					// if(!r.exc) {
					// 	clearInterval(frm.page["interval"]);
					// 	frm.page.set_indicator(__('Import Successful'), 'blue');
					// 	create_reset_button(frm);
					// }
				}
			});
		});
	},
	setup(frm) {
		// frappe.realtime.on('data_import_refresh', ({ data_import }) => {
		// 	frm.import_in_progress = false;
		// 	if (data_import !== frm.doc.name) return;
		// 	frappe.model.clear_doc('Data Import', frm.doc.name);
		// 	frappe.model.with_doc('Data Import', frm.doc.name).then(() => {
		// 		frm.refresh();
		// 	});
		// });
		frappe.realtime.on('data_import_progress', data => {
			if (frm.doc.name === data.docname){
				frm.is_timesheet_processing = true;
				// frm.set_value("is_timesheet_processing", true);
				// frm.set_value("timesheet_progress", 0);
				let percent = Math.floor((data.current * 100) / data.total);
				// let seconds = Math.floor(data.eta);
				// let minutes = Math.floor(data.eta / 60);
				// let eta_message =
				// 	// prettier-ignore
				// 	seconds < 60
				// 		? __('About {0} seconds remaining', [seconds])
				// 		: minutes === 1
				// 			? __('About {0} minute remaining', [minutes])
				// 			: __('About {0} minutes remaining', [minutes]);

				let message;
				if (data.success) {
					let message_args = [data.tittle,data.current, data.total];
					message =__('{0} Importing {1} of {2}', message_args);
				}
				if (data.skipping) {
					message = __('{0} Skipping {1} of {2} {3}', [
						data.tittle,
						data.current,
						data.total,
						data.reason
					]);
				}
				frm.dashboard.show_progress(__('Processing Timesheet'), percent, __(message));
				frm.page.set_indicator(__('In Progress'), 'orange');

				// hide progress when complete
				if (data.current === data.total) {
					setTimeout(() => {
						frm.is_timesheet_processing = false;
						// frm.set_value("is_timesheet_processing", false);
						frm.dashboard.hide();
						frm.refresh();
					}, 2000);
				}
			}
		});
	},

	delete_timesheet: function (frm) {
		if (!frm.doc.timesheet_imported) {
			return
		}

		frappe.confirm('Are you sure you want to proceed?',
		() => {
			// action to perform if Yes is selected
			frappe.show_alert({
				message: "Deleteing Timesheet",
				indicator: 'orange'
			});
			frappe.call({
				method: "ets.docs.payroll.payroll_entry.delete_timesheet_backgroupjob",
				args: {
					doc: frm.doc.name
				},
				freeze: true,
				freeze_message: __("Deleting Timesheet..."),
				callback: function(r) {
					frm.reload_doc();
				}
			});
		}, () => {
			// action to perform if No is selected
		})
		
	},
});


// let render_employee_attendance = function (frm, data) {
// 	frm.fields_dict.attendance_detail_html.html(
// 		frappe.render_template('employees_to_mark_attendance', {
// 			data: data
// 		})
// 	);
// };
