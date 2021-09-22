import frappe
from ets.utils import ets_logger
@frappe.whitelist(allow_guest=True)
def add_permissions():
	doctypes = ('Sales Invoice', 'Sales Order')
	allow_access('Customer',doctypes,select = 1,write = 1, create=1, submit =1, export= 1, print=1, email = 1)
	

def allow_access(role,doctypes,**kwargs):
	ets_logger.debug(role)
	ets_logger.debug(doctypes)
	ets_logger.debug(kwargs)
	from frappe.permissions import add_permission, update_permission_property
	for doctype in doctypes:
		ets_logger.debug(doctype)
		add_permission(doctype, role, 0)
		update_permission_property(doctype, role, 0, 'if_owner',kwargs.get('if_owner', 0))
		update_permission_property(doctype, role, 0, 'select',kwargs.get('select', 0))
		update_permission_property(doctype, role, 0, 'read',kwargs.get('read', 1))
		update_permission_property(doctype, role, 0, 'write',kwargs.get('write', 0))
		update_permission_property(doctype, role, 0, 'create',kwargs.get('create', 0))
		update_permission_property(doctype, role, 0, 'submit',kwargs.get('submit', 0))
		update_permission_property(doctype, role, 0, 'export',kwargs.get('export', 0))
		update_permission_property(doctype, role, 0, 'print',kwargs.get('print', 0))
		update_permission_property(doctype, role, 0, 'email',kwargs.get('email', 0))
		update_permission_property(doctype, role, 0, 'permlevel',kwargs.get('permlevel', 0))
		update_permission_property(doctype, role, 0, 'delete',kwargs.get('delete', 0))
		update_permission_property(doctype, role, 0, 'cancel',kwargs.get('cancel', 0))
		update_permission_property(doctype, role, 0, 'amend',kwargs.get('amend', 0))
		update_permission_property(doctype, role, 0, 'report',kwargs.get('report', 0))
		update_permission_property(doctype, role, 0, 'import',kwargs.get('import', 0))
		update_permission_property(doctype, role, 0, 'set_user_permissions',kwargs.get('set_user_permissions', 0))
		update_permission_property(doctype, role, 0, 'share',kwargs.get('share', 0))
