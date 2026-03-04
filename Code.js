function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let attendeesSheet = ss.getSheetByName(SHEET_NAME_ATTENDEES);
  if (!attendeesSheet) {
    attendeesSheet = ss.insertSheet(SHEET_NAME_ATTENDEES);
    attendeesSheet.appendRow(['ID', 'First Name', 'Last Name', 'Email', 'DOB', 'Phone', 'School', 'Graduated', 'Created Date']);
    attendeesSheet.getRange('A1:I1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }

  // Initialize activity group sheets
  Object.values(ACTIVITY_GROUP_SHEETS).forEach(sheetName => {
    let groupSheet = ss.getSheetByName(sheetName);
    if (!groupSheet) {
      groupSheet = ss.insertSheet(sheetName);
      groupSheet.appendRow(['ID', 'Group Name', 'Created Date', 'Capacity', 'Is Active', 'Level', 'Day', 'Location', 'Instructor', 'Second Instructor']);
      groupSheet.getRange('A1:J1').setFontWeight('bold').setBackground('#9c27b0').setFontColor('#ffffff');
    }
  });

  let attendanceSheet = ss.getSheetByName(SHEET_NAME_ATTENDANCE);
  if (!attendanceSheet) {
    attendanceSheet = ss.insertSheet(SHEET_NAME_ATTENDANCE);
    attendanceSheet.appendRow(['ID', 'Attendee ID', 'Attendee Name', 'Activity', 'Date', 'Group ID', 'Group Name', 'Timestamp']);
    attendanceSheet.getRange('A1:H1').setFontWeight('bold').setBackground('#37474f').setFontColor('#ffffff');
  }

  // Initialize Quarter Report Config sheet
  let quarterReportConfigSheet = ss.getSheetByName(SHEET_NAME_QUARTER_REPORT_CONFIG);
  if (!quarterReportConfigSheet) {
    quarterReportConfigSheet = ss.insertSheet(SHEET_NAME_QUARTER_REPORT_CONFIG);
    quarterReportConfigSheet.appendRow(['Key', 'Label', 'Data Type', 'Is Visible By Default', 'Display Order', 'Description']);
    quarterReportConfigSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#ff9800').setFontColor('#ffffff');


    if (QUARTER_REPORT_FIELDS.length > 0) {
      quarterReportConfigSheet.getRange(2, 1, QUARTER_REPORT_FIELDS.length, QUARTER_REPORT_FIELDS[0].length).setValues(QUARTER_REPORT_FIELDS);
    }

    quarterReportConfigSheet.autoResizeColumns();
    quarterReportConfigSheet.setFrozenRows(1);
  }
}

function doGet(e) {
  return getRouter(e);
}

function doPost(e) {
  return postRouter(e);
}
