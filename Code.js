const SHEET_NAME_ATTENDEES = 'Attendees';
const SHEET_NAME_ATTENDANCE = 'Attendance'; // Single unified table
const CONFIG_SHEET_NAME = "Config";
const DASHBOARD_CACHE_KEY = 'dashboard_data';

// Activity group sheet mappings
const ACTIVITY_GROUP_SHEETS = {
  Circle: 'Circle_Groups',
};

// Add new activities here ONLY — no other files need to change
const ACTIVITY_CONFIG = {
  Med: {
    id: 'meditations',
    name: 'Meditations',
    displayName: 'Number of meditations held',
    category: 'Spiritual',
    frequency: 'Weekly',
    type: 'simple',
    icon: 'Moon',
    color: '#0f9d58',
    gradient: 'from-green-500 to-emerald-500',
    dataType: 'number',
    reportKey: 'numMeditations',
    displayOrder: 12,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  },
  Circle: {
    id: 'circles',
    name: 'Circles',
    displayName: 'Number of circles (prep classes)',
    category: 'Educational',
    frequency: 'Weekly',
    type: 'grouped',
    icon: 'Users',
    color: '#f4b400',
    gradient: 'from-yellow-500 to-orange-500',
    dataType: 'grouped',
    reportKey: 'numCircles',
    displayOrder: 6,
    requiresGroup: true,
    groupType: 'circle',
    allowMultipleGroups: true,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'sum'
  },
  Recollection: {
    id: 'recollections',
    name: 'Recollections',
    displayName: 'Monthly recollections',
    category: 'Spiritual',
    frequency: 'Monthly',
    type: 'simple',
    icon: 'Calendar',
    color: '#db4437',
    gradient: 'from-red-500 to-pink-500',
    dataType: 'number',
    reportKey: 'numMonthlyRetreats',
    displayOrder: 8,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  },
  Retreat: {
    id: 'retreats',
    name: 'Retreats',
    displayName: 'Long retreats',
    category: 'Spiritual',
    frequency: 'Quarterly',
    type: 'simple',
    icon: 'Mountain',
    color: '#4285f4',
    gradient: 'from-blue-500 to-indigo-500',
    dataType: 'number',
    reportKey: 'numLongRetreats',
    displayOrder: 10,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  },
  Doctrine: {
    id: 'doctrine',
    name: 'Doctrine',
    displayName: 'Doctrine classes',
    category: 'Educational',
    frequency: 'Weekly',
    type: 'simple',
    icon: 'Book',
    color: '#f49c42',
    gradient: 'from-orange-500 to-amber-500',
    dataType: 'number',
    reportKey: 'numDoctrineCls',
    displayOrder: 14,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  }
};

// Activity categories configuration
const ACTIVITY_CATEGORIES = {
  Spiritual: {
    id: 'spiritual',
    name: 'Spiritual Activities',
    displayOrder: 1
  },
  Educational: {
    id: 'educational',
    name: 'Educational Activities',
    displayOrder: 2
  }
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
}

function doGet(e) {
  return getRouter(e);
}

function doPost(e) {
  return postRouter(e);
}
