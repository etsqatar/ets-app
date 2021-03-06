from __future__ import unicode_literals
import frappe
from frappe.utils.data import flt
import ets
from ets.utils import ets_logger

def validate(doc,method):
    # doc.get_emp_and_working_day_details()
    add_earnings_and_deduction(doc)
    doc.calculate_net_pay()
    # doc.compute_year_to_date()
    # doc.compute_month_to_date()
    # doc.compute_component_wise_year_to_date()
    # doc.add_leave_balances()
    # ets_logger.debug(doc.earnings)


    

def add_earnings_and_deduction(doc):
    payroll_setting = frappe.get_single("Payroll Settings")
    salary_structure = frappe.get_doc("Salary Structure", {"name": doc.salary_structure})
    
    def get_emp_ots(doc):
        attendances_ot = frappe.db.sql('''
                    SELECT sum(weekday_ot_hr) as weekday_ot_hr, sum(weekend_ot_hr) as weekend_ot_hr, sum(holiday_ot_hr) as holiday_ot_hr
                    FROM `tabAttendance`
                    WHERE
                        employee = %s
                        AND docstatus = 1
                        AND attendance_date between %s and %s
                ''', values=(doc.employee, doc.start_date, doc.end_date), as_dict=1)
        ets_logger.debug(attendances_ot)
        if attendances_ot:
            doc.weekday_ot = attendances_ot[0].weekday_ot_hr if attendances_ot[0].weekday_ot_hr else 0
            doc.weekend_ot = attendances_ot[0].weekend_ot_hr if attendances_ot[0].weekend_ot_hr else 0
            doc.holiday_ot = attendances_ot[0].holiday_ot_hr if attendances_ot[0].holiday_ot_hr else 0

    def add_ot_to_earnings(doc):
        basic = frappe.get_doc("Salary Component", {"is_basic": True})
        # total_salary_structure = frappe.db.get_values("Salary Structure", filters = {"name": doc.salary_structure}, fieldname = ["total_earning"])
        _basic = None
        hasWeekdayOT = False
        hasWeekendOT = False
        hasHolidayOT = False

        for row in salary_structure.earnings:
            if row.salary_component == basic.name:
                _basic = row
                break

        for earning in doc.earnings:
            if earning.salary_component == "Weekday OT":
                earning.amount = flt((doc.weekday_ot*payroll_setting.weekday_ot_rate)*(_basic.amount/doc.total_working_days/payroll_setting.working_hrs),2)
                hasWeekdayOT = True
                continue
            if earning.salary_component == "Weekday OT":
                earning.amount = flt((doc.weekday_ot*payroll_setting.weekend_ot_rate)*(_basic.amount/doc.total_working_days/payroll_setting.working_hrs),2)
                hasWeekendOT = True
                continue
            if earning.salary_component == "Weekday OT":
                earning.amount = flt((doc.weekday_ot*payroll_setting.holiday_ot_rate)*(_basic.amount/doc.total_working_days/payroll_setting.working_hrs),2)
                hasHolidayOT = True
                continue
 
        if flt(doc.weekday_ot) > 0 and not hasWeekdayOT:
            wages_row = {
            "salary_component": "Weekday OT",
            "abbr": frappe.db.get_value("Salary Component", "Weekday OT", "salary_component_abbr"),
            "amount": flt((flt(doc.weekday_ot)*flt(payroll_setting.weekday_ot_rate))*(flt(_basic.amount)/flt(doc.total_working_days)/flt(payroll_setting.working_hrs)),2),
            "default_amount": 0.0,
            "additional_amount": 0.0
            }
            doc.append('earnings', wages_row)
        if flt(doc.weekend_ot) > 0 and not hasWeekendOT:
            wages_row = {
            "salary_component": "Weekend OT",
            "abbr": frappe.db.get_value("Salary Component", "Weekend OT", "salary_component_abbr"),
            "amount": flt((flt(doc.weekend_ot)*flt(payroll_setting.weekend_ot_rate))*(flt(_basic.amount)/flt(doc.total_working_days)/flt(payroll_setting.working_hrs)),2),
            "default_amount": 0.0,
            "additional_amount": 0.0
            }
            doc.append('earnings', wages_row)
        if flt(doc.holiday_ot) > 0 and not hasHolidayOT:
            wages_row = {
            "salary_component": "Holiday OT",
            "abbr": frappe.db.get_value("Salary Component", "Holiday OT", "salary_component_abbr"),
            "amount": flt((flt(doc.holiday_ot)*flt(payroll_setting.holiday_ot_rate))*(flt(_basic.amount)/flt(doc.total_working_days)/flt(payroll_setting.working_hrs)),2),
            "default_amount": 0.0,
            "additional_amount": 0.0
            }
            doc.append('earnings', wages_row)
    
    def add_deduction(doc):
        if flt(doc.absent_days) > 0:
            for deduction in doc.deductions:
                if deduction.salary_component == "Absent":
                    deduction.amount = flt(flt(doc.absent_days)*flt(flt(salary_structure.total_earning)/flt(doc.total_working_days)),2)
                    return
            
            wages_row = {
                "salary_component": "Absent",
                "abbr": frappe.db.get_value("Salary Component", "Absent", "salary_component_abbr"),
                "amount": flt(flt(doc.absent_days)*flt(flt(salary_structure.total_earning)/flt(doc.total_working_days)),2),
                "default_amount": 0.0,
                "additional_amount": 0.0
                }
            doc.append('deductions', wages_row)
        pass
    
    get_emp_ots(doc)
    add_ot_to_earnings(doc)
    add_deduction(doc)
        