from . import __version__ as app_version

app_name = "ets"
app_title = "Ets"
app_publisher = "oryxerp.qa"
app_description = "ETS ERP"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "lovin@oryxerp.qa"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/ets/css/ets.css"
# app_include_js = "/assets/ets/js/ets.js"

# include js, css files in header of web template
# web_include_css = "/assets/ets/css/ets.css"
# web_include_js = "/assets/ets/js/ets.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "ets/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
	"Task" : "public/js/custom/doctype/project/task/task.js",
	"Project" : "public/js/custom/doctype/project/project.js",
	"Purchase Order" : "public/js/custom/doctype/buying/purchase_order.js",
	"Payroll Entry" : "public/js/custom/doctype/payroll/payroll_entry.js",
	"Material Request" : "public/js/custom/doctype/stock/material_request.js",
	"Purchase Receipt" : "public/js/custom/doctype/stock/purchase_receipt.js",
	"Stock Entry" : "public/js/custom/doctype/stock/stock_entry.js",
	"Purchase Invoice" : "public/js/custom/doctype/accounting/purchase_invoice.js",
	}
doctype_list_js = {"Purchase Order" : "public/js/custom/doctype/buying/purchase_order_list.js" ,}
doctype_tree_js = {"Task" : "public/js/custom/doctype/project/task/task_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "ets.install.before_install"
# after_install = "ets.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "ets.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

doc_events = {
	"Purchase Order": {
        "validate": "ets.docs.buying.purchase_order.validate",
        "on_update": "ets.docs.buying.purchase_order.on_update",
        "on_submit": "ets.docs.buying.purchase_order.on_submit",
        "on_cancel": "ets.docs.buying.purchase_order.on_cancel",
    },
	"Purchase Receipt": {
        "validate": "ets.docs.stock.purchase_receipt.validate",
        "on_update": "ets.docs.stock.purchase_receipt.on_update",
        "on_submit": "ets.docs.stock.purchase_receipt.on_submit",
        "on_cancel": "ets.docs.stock.purchase_receipt.on_cancel",
    },
	"Material Request": {
        "validate": "ets.docs.stock.material_request.validate",
        "on_update": "ets.docs.stock.material_request.on_update",
        "on_submit": "ets.docs.stock.material_request.on_submit",
        "on_cancel": "ets.docs.stock.material_request.on_cancel",
    },
	"Stock Entry": {
        "validate": "ets.docs.stock.stock_entry.validate",
        "on_update": "ets.docs.stock.stock_entry.on_update",
        "on_submit": "ets.docs.stock.stock_entry.on_submit",
        "on_cancel": "ets.docs.stock.stock_entry.on_cancel",
    },
	"Purchase Invoice": {
        "validate": "ets.docs.accounting.purchase_invoice.validate",
        "on_update": "ets.docs.accounting.purchase_invoice.on_update",
        "on_submit": "ets.docs.accounting.purchase_invoice.on_submit",
        "on_cancel": "ets.docs.accounting.purchase_invoice.on_cancel",
    },
	"Salary Slip": {
        "validate": "ets.docs.payroll.salary_slip.validate",
    },
	"Project": {
        "validate": "ets.docs.project.project.validate",
    },
	"Task": {
        "validate": "ets.docs.project.task.task.validate",
        "on_update": "ets.docs.project.task.task.on_update",
    },
	"Salary Information File": {
		"validate": "ets.ets.qatar.utils.validate_payer_details",
		"after_insert": ["ets.ets.qatar.utils.validate_bank_details_and_generate_csv"]
	},
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"ets.tasks.all"
# 	],
# 	"daily": [
# 		"ets.tasks.daily"
# 	],
# 	"hourly": [
# 		"ets.tasks.hourly"
# 	],
# 	"weekly": [
# 		"ets.tasks.weekly"
# 	]
# 	"monthly": [
# 		"ets.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "ets.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "ets.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "ets.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]


# User Data Protection
# --------------------

user_data_fields = [
	{
		"doctype": "{doctype_1}",
		"filter_by": "{filter_by}",
		"redact_fields": ["{field_1}", "{field_2}"],
		"partial": 1,
	},
	{
		"doctype": "{doctype_2}",
		"filter_by": "{filter_by}",
		"partial": 1,
	},
	{
		"doctype": "{doctype_3}",
		"strict": False,
	},
	{
		"doctype": "{doctype_4}"
	}
]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"ets.auth.validate"
# ]

