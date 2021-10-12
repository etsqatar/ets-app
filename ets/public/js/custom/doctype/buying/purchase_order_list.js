frappe.listview_settings['Purchase Order'] = {
	add_fields: ["base_grand_total", "company", "currency", "supplier",
		"supplier_name", "per_received", "per_billed", "status"],
	get_indicator: function (doc) {
		if (doc.status === "Closed") {
			return [__("Closed"), "green", "status,=,Closed"];
		} else if (doc.status === "On Hold") {
			return [__("On Hold"), "orange", "status,=,On Hold"];
		} else if (doc.status === "Delivered") {
			return [__("Delivered"), "green", "status,=,Closed"];
		} else if (flt(doc.per_received, 2) < 100 && doc.status !== "Closed") {
			if (flt(doc.per_billed, 2) < 100) {
				return [__("To Receive and Bill"), "orange",
					"per_received,<,100|per_billed,<,100|status,!=,Closed"];
			} else {
				return [__("To Receive"), "orange",
					"per_received,<,100|per_billed,=,100|status,!=,Closed"];
			}
		} else if (flt(doc.per_received, 2) >= 100 && flt(doc.per_billed, 2) < 100 && doc.status !== "Closed") {
			return [__("To Bill"), "orange", "per_received,=,100|per_billed,<,100|status,!=,Closed"];
		} else if (flt(doc.per_received, 2) >= 100 && flt(doc.per_billed, 2) == 100 && doc.status !== "Closed") {
			return [__("Completed"), "green", "per_received,=,100|per_billed,=,100|status,!=,Closed"];
		}
	},

	formatters: {
		workflow_state(val) {
			// const __color = "green";
			// const _color = frappe.utils.get_indicator_color(val).then(color => this.__color = color);
				if(val) {
					var colour = "";
		
					if(locals["Workflow State"][val] && locals["Workflow State"][val].style) {
						var colour = {
							"Success": "green",
							"Warning": "orange",
							"Danger": "red",
							"Primary": "blue",
							"Inverse": "black",
							"Info": "light-blue",
						}[locals["Workflow State"][val].style];
					}
					if (!colour) colour = "gray";
		
					// return [__(val), colour, workflow_fieldname + ',=,' + val];
					// $li.find("i").attr("title", label).tooltip({ delay: { "show": 600, "hide": 100 }, trigger: "hover" });
					 var ws = 
					//  $(
						 `
						<div class="list-row-col hidden-xs ellipsis">
							<span class="indicator-pill ${colour} filterable ellipsis" data-filter="${'workflow_state,=,' + val}">
								<span class="ellipsis"> ${__(val)}</span>
								<span></span>
							</span>
						</div>
					`;
					// ).attr("title", val).tooltip({ delay: { "show": 600, "hide": 100 }, trigger: "hover" });
					return ws;
				}
        },
	},
	onload: function (listview) {
		var method = "erpnext.buying.doctype.purchase_order.purchase_order.close_or_unclose_purchase_orders";

		listview.page.add_menu_item(__("Close"), function () {
			listview.call_for_selected_items(method, { "status": "Closed" });
		});

		listview.page.add_menu_item(__("Re-open"), function () {
			listview.call_for_selected_items(method, { "status": "Submitted" });
		});
	},

};
