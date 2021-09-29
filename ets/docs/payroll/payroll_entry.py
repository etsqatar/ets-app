from __future__ import unicode_literals
import frappe
from frappe.desk.form.load import get_attachments
from frappe.utils.data import add_days, get_datetime
from frappe.utils.xlsxutils import read_xls_file_from_attached_file, read_xlsx_file_from_attached_file
from ets.utils import ets_logger

@frappe.whitelist()
def process_timesheet(doc):
    # ### Sample Data
    # data = [
    # ['ENERGY TECHNICAL SERVICES W.L.L', None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None], 
    # ['   MUSTER ROLL FOR THE MONTH OF JULY-2021', None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None], 
    # ['SL.', 'EMP NO', 'NAME', 'DESIGNATION', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 'N.OT', 'H', 'T/P'], 
    # ['PAINTING, INSULATION AND PROTECTION FOR CORROSION UNDER PIPE SUPPORT SERVICES ON CALL OFF BASIS -J-278', None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None], 
    # [None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None], 
    # [1, '2021  JULY', None, None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 'OT', 'H', 'T/P'], 
    # [None, 'ST1607', 'SAKTHIVEL', 'SITE ENGINEER', 5, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31], 
    # [None, None, None, None, 'P', 'W', 'P', 'P', 'P', 'P', 'P', 'P', 'W', 'P', 'P', 'P', 'P', 'P', 'P', 'W', 'P', 'P', 'P', 'H', 'H', 'H', 'W', 'P', 'P', 'P', 'P', 'P', 'P', 'W', 'P', None, None, None], 
    # [None, None, None, None, 'J-278 / J-291', 'H', 'J-278 J-291', 'J-278', 'J-278', 'J-278', 'J-278', 'J-278', 'H', 'J-278', 'J-278', 'J-278', 'J-278', 'J-278', 'J-278', 'H', 'J-278', 'J-278', 'J-278', 'EID', 'H', 'H', 'H', 'J-278', 'J-278', 'J-278', 'J-278', 'J-278', 'J-278', 'H', 'J-278', None, None, None], 
    # ]

    payrollEntry = frappe.get_doc("Payroll Entry",doc)
    
    # payrollEntry.is_timesheet_processing = True
    # payrollEntry.flags.ignore_permissions = True
    # payrollEntry.save()

    attachments = get_attachments("Payroll Entry",doc)

    excel_data =[]
    for attachment in attachments:
        # ets_logger.debug(attachment)
        att_type = (attachment.file_url.split()[-1]).split(".")[-1]
        # ets_logger.debug(att_type)
        if att_type == 'xlsx':
            excel_data = read_xlsx_file_from_attached_file(attachment.file_url)
        elif att_type == 'xls':
            excel_data = read_xls_file_from_attached_file(attachment.file_url)
        
        # return
        if not excel_data:
            return

        dataX = [excel_data[i:i + 4] for i in range(5, len(excel_data), 4)] # Get Only the records for row no 6
        count =  0
        count_dataX =  len(dataX)
        for d in dataX:
            # d0 = d[0] # Not needed
            emp_id = d[1][1] # Employee ID
            emp_Ot = d[1][4:4+31] # Employee OT
            emp_attendence = d[2][4:4+31] # Attendance
            emp_project = d[3][4:4+31] # Project
            ets_logger.debug(emp_id)
            emp = frappe.get_value('Employee', emp_id, 'name')
            company = frappe.get_value('Employee', emp_id, 'company')
            emp = True
            if emp:
                for day in range(0,31):
                    # ets_logger.debug(day)
                    status = 'Present'
                    if emp_attendence[day] is None:
                        status = 'Absent'
                    elif emp_attendence[day] == 'M' or emp_attendence[day] == 'V' or emp_attendence[day] == 'PL': # Medical Leave | Vacation | Paid Leave
                        status = 'On Leave'
                    if emp_attendence[day] == 'T' or  emp_attendence[day] == 'X':  # Transfered to another site
                        continue
                    attendance_date = add_days(payrollEntry.start_date,day)
                    if attendance_date > payrollEntry.end_date:
                        continue
                    
                    # Add OT on the day
                    weekday_ot = 0
                    weekend_ot = 0
                    holiday_ot = 0
                    if emp_attendence[day] == 'P' and emp_Ot[day] is not None:
                        weekday_ot = emp_Ot[day]
                    elif emp_attendence[day] == 'W' and emp_Ot[day] is not None:
                        weekend_ot = emp_Ot[day]
                    elif emp_attendence[day] == 'H' and emp_Ot[day] is not None:
                        holiday_ot = emp_Ot[day]

                    projects = []
                    project = None
                    if emp_project[day] is not None:
                        _projects = list(filter(None, [frappe.get_value('Project', project, 'name') for project in emp_project[day].split() if project is not None and project != '']))
                        # ets_logger.debug(_projects)
                        for _project in _projects:
                            # project = frappe.get_value('Project', _project, 'name')
                            # if project:
                            projects.append({
                                'project' : _project,
                                'weekday_ot_hr': weekday_ot/len(_projects),
                                'weekend_ot_hr': weekend_ot/len(_projects),
                                'holiday_ot_hr': holiday_ot/len(_projects),
                            })
                        project = _projects[0] if _projects else None

                    doc_dict = {
                        'doctype': 'Attendance',
                        # TODO
                        # 'employee': emp_id,
                        'employee': 'ST-8031',
                        'attendance_date': attendance_date,
                        'status': status,
                        'company': company,
                        'payroll_entry': payrollEntry.name,
                        'weekday_ot_hr': weekday_ot,
                        'weekend_ot_hr': weekend_ot,
                        'holiday_ot_hr': holiday_ot,
                        'project': project,
                        'projects': projects, # Multipal Project
                        }
                    # ets_logger.debug(doc_dict)
                    try: 
                        attendance = frappe.get_doc(doc_dict).insert()
                        attendance.submit()
                        frappe.publish_realtime(
                                "data_import_progress",
                                {
                                    "current": count,
                                    "docname": payrollEntry.name,
                                    "total": count_dataX,
                                    "success": True,
                                    "tittle" : "Import Timesheet"
                                },
                            )
                        # payrollEntry.timesheet_progress = count*100/count_dataX
                        # frappe.publish_progress(count*100/len(names), title = _("Creating Delivery Note..."), description = name)
                    except Exception as e:
                        frappe.publish_realtime(
                                "data_import_progress",
                                {
                                    "current": count,
                                    "docname": payrollEntry.name,
                                    "total": count_dataX,
                                    "skipping": True,
                                    "reason" : e,
                                    "tittle" : "Import Timesheet"
                                },
                            )
                        # traceback = frappe.get_traceback()
                        # ets_logger.debug(e)
                        # ets_logger.debug(traceback)
                        # ets_logger.debug(emp_id)
                        # ets_logger.debug(traceback.message)
                        # frappe.log_error(message=traceback)
                        pass 
                    # payrollEntry.timesheet_progress = count*100/count_dataX
                    # payrollEntry.flags.ignore_permissions = True
                    # payrollEntry.save()
                    # frappe.db.commit()
                pass
            count += 1
            pass
    frappe.publish_realtime(
        "data_import_progress",
        {
            "current": count,
            "docname": payrollEntry.name,
            "total": count_dataX,
            "success": True,
            "tittle" : "Import Timesheet"
        },
    )
    
    payrollEntry.flags.ignore_permissions = True
    payrollEntry.flags.ignore_validate_update_after_submit = True
    payrollEntry.is_timesheet_processing = False
    payrollEntry.timesheet_imported = True
    payrollEntry.save()
    # frappe.db.commit()
    # show_alert("Attendance processed")
    # frappe.publish_realtime(event='eval_js', message="Attendance processed", user=frappe.session.user)

@frappe.whitelist()
def process_timesheet_backgroupjob(doc):
    frappe.enqueue(process_timesheet,doc = doc, timeout=6000)
    pass

@frappe.whitelist()
def delete_timesheet_backgroupjob(doc):
    if frappe.get_value("Payroll Entry",doc,"salary_slips_created"):
        frappe.throw("Salary Slips are already created !!! Cannot Delete Timesheet")
    frappe.enqueue(delete_timesheet,doc = doc, timeout=6000)
    pass

@frappe.whitelist()
def delete_timesheet(doc):
    payrollEntry = frappe.get_doc("Payroll Entry",doc)

    attendances = frappe.get_all("Attendance",{'payroll_entry' : payrollEntry.name})
    count = 0
    count_dataX = len(attendances)
    for attendance in attendances:
        try: 
            attendance = frappe.get_doc("Attendance",attendance.name)
            attendance.cancel()
            attendance.delete()
            frappe.publish_realtime(
                    "data_import_progress",
                    {
                        "current": count,
                        "docname": payrollEntry.name,
                        "total": count_dataX,
                        "success": True,
                        "tittle" : "Delete Timesheet"
                    },
                )
            payrollEntry.timesheet_progress = count*100/count_dataX
            # frappe.publish_progress(count*100/len(names), title = _("Creating Delivery Note..."), description = name)
        except Exception as e:
            # ets_logger.debug(e)
            frappe.publish_realtime(
                    "data_import_progress",
                    {
                        "current": count,
                        "docname": payrollEntry.name,
                        "total": count_dataX,
                        "skipping": True,
                        "reason" : e,
                        "tittle" : "Delete Timesheet"
                    },
                )
        count += 1

    frappe.publish_realtime(
        "data_import_progress",
        {
            "current": count,
            "docname": payrollEntry.name,
            "total": count_dataX,
            "success": True,
            "tittle" : "Delete Timesheet"
        },
        )
    payrollEntry.flags.ignore_permissions = True
    payrollEntry.is_timesheet_processing = False
    payrollEntry.timesheet_imported = False
    payrollEntry.save()
    pass