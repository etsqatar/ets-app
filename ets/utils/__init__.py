from __future__ import unicode_literals
import frappe
from frappe import _, throw
from frappe.utils.logger import set_log_level

set_log_level("DEBUG")
ets_logger = frappe.logger("ets", allow_site=True, file_count=2)