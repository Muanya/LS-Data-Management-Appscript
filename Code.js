const SHEET_NAME_ATTENDEES = 'Attendees';
const SHEET_NAME_CIRCLE_GROUPS = 'Circle_Groups';
const SHEET_NAME_ATTENDANCE = 'Attendance'; // Single unified table
const CONFIG_SHEET_NAME = "Config";
const DASHBOARD_CACHE_KEY = 'dashboard_data';

// Add new activities here ONLY — no other files need to change
const ACTIVITY_CONFIG = {
  Med:          { color: '#0f9d58' },
  Circle:       { color: '#f4b400' },
  Recollection: { color: '#db4437' },
  Retreat:      { color: '#4285f4' },
  Doctrine:     { color: '#f49c42' }
};

const VALID_ACTIVITIES = new Set(Object.keys(ACTIVITY_CONFIG));

// Attendance sheet column indices (0-based)
// ID(0) | Attendee ID(1) | Attendee Name(2) | Activity(3) | Date(4) | Group ID(5) | Group Name(6) | Timestamp(7)
const COL = { ID:0, ATTENDEE_ID:1, ATTENDEE_NAME:2, ACTIVITY:3, DATE:4, GROUP_ID:5, GROUP_NAME:6, TIMESTAMP:7 };

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let attendeesSheet = ss.getSheetByName(SHEET_NAME_ATTENDEES);
  if (!attendeesSheet) {
    attendeesSheet = ss.insertSheet(SHEET_NAME_ATTENDEES);
    attendeesSheet.appendRow(['ID', 'First Name', 'Last Name', 'Email', 'DOB', 'Phone', 'School', 'Graduated', 'Created Date']);
    attendeesSheet.getRange('A1:I1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }

  let circleGroupsSheet = ss.getSheetByName(SHEET_NAME_CIRCLE_GROUPS);
  if (!circleGroupsSheet) {
    circleGroupsSheet = ss.insertSheet(SHEET_NAME_CIRCLE_GROUPS);
    circleGroupsSheet.appendRow(['ID', 'Group Name', 'Created Date']);
    circleGroupsSheet.getRange('A1:C1').setFontWeight('bold').setBackground('#9c27b0').setFontColor('#ffffff');
  }

  let attendanceSheet = ss.getSheetByName(SHEET_NAME_ATTENDANCE);
  if (!attendanceSheet) {
    attendanceSheet = ss.insertSheet(SHEET_NAME_ATTENDANCE);
    attendanceSheet.appendRow(['ID', 'Attendee ID', 'Attendee Name', 'Activity', 'Date', 'Group ID', 'Group Name', 'Timestamp']);
    attendanceSheet.getRange('A1:H1').setFontWeight('bold').setBackground('#37474f').setFontColor('#ffffff');
  }
}

function doGet(e) {
  return getRouter(e);
}

function doPost(e) {
  return postRouter(e);
}
