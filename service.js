
function getHealth() {
  return { success: true, data: "Health is Okay" };
}

function getActivities() {
  const activities = Object.values(ACTIVITY_CONFIG).map(activity => ({
    id: activity.id,
    name: activity.name,
    displayName: activity.displayName,
    category: activity.category,
    frequency: activity.frequency,
    type: activity.type,
    icon: activity.icon,
    color: activity.color,
    dataType: activity.dataType,
    reportKey: activity.reportKey,
    displayOrder: activity.displayOrder,
    requiresGroup: activity.requiresGroup || false,
    groupType: activity.groupType,
    allowMultipleGroups: activity.allowMultipleGroups || false,
    includeInQuarterReport: activity.includeInQuarterReport,
    includeInAttendanceTracking: activity.includeInAttendanceTracking,
    aggregationMethod: activity.aggregationMethod
  }));

  const categories = Object.values(ACTIVITY_CATEGORIES);

  return {
    success: true,
    data: {
      activities: activities.sort((a, b) => a.displayOrder - b.displayOrder),
      categories: categories.sort((a, b) => a.displayOrder - b.displayOrder)
    }
  };
}

function getActivityGroups(activityId) {
  // Validate activityId exists in our configuration
  const activityConfig = Object.values(ACTIVITY_CONFIG).find(activity => activity.id === activityId);
  if (!activityConfig) {
    return { success: false, message: 'Invalid activity ID' };
  }

  // Get activity key from config (e.g., 'circles' -> 'Circle')
  const activityKey = Object.keys(ACTIVITY_CONFIG).find(key => ACTIVITY_CONFIG[key].id === activityId);

  // Use unified group loading for all activities
  const groups = getActivityGroupsUnified(activityKey, activityId);
  const activeGroups = groups.filter(group => group.isActive);

  return {
    success: true,
    data: {
      groups: groups,
      activityId: activityId,
      totalCount: groups.length,
      activeCount: activeGroups.length
    }
  };
}

function getActivityGroupsUnified(activityKey, activityId) {
  const sheetName = ACTIVITY_GROUP_SHEETS[activityKey];
  if (!sheetName) {
    // Activity doesn't support groups
    return [];
  }

  const sheet = getSheetSafe(sheetName);
  if (!sheet) {
    // Sheet doesn't exist yet, return empty array
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const groups = [];

  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue; // Skip empty rows

    const createdDate = data[i][2] ? new Date(data[i][2]) : new Date();
    const groupName = data[i][1] || '';

    groups.push({
      id: data[i][0].toString(),
      name: groupName,
      activityId: activityId,
      activityType: activityKey.toLowerCase(),
      description: `${activityKey} group: ${groupName || 'Unnamed'}`,
      capacity: data[i][3] ? Number(data[i][3]) : 20, // Capacity from column 4
      isActive: data[i][4] !== undefined ? Boolean(data[i][4]) : true, // Active status from column 5
      metadata: {
        // Additional metadata from columns 6+
        level: data[i][5] || 'standard',
        day: data[i][6] || 'varies',
        location: data[i][7] || '',
        instructor: data[i][8] || '',
        secondInstructor: data[i][9] || ''
      },
      createdAt: createdDate.toISOString()
      // Removed updatedAt field
    });
  }

  return groups;
}

function addActivityGroup(activityId, groupData) {
  // Validate activityId exists in our configuration
  const activityConfig = Object.values(ACTIVITY_CONFIG).find(activity => activity.id === activityId);
  if (!activityConfig) {
    return { success: false, message: 'Invalid activity ID' };
  }

  // Check if activity supports groups
  if (!activityConfig.requiresGroup) {
    return { success: false, message: 'Activity does not support groups' };
  }

  // Get activity key from config (e.g., 'circles' -> 'Circle')
  const activityKey = Object.keys(ACTIVITY_CONFIG).find(key => ACTIVITY_CONFIG[key].id === activityId);
  const sheetName = ACTIVITY_GROUP_SHEETS[activityKey];

  if (!sheetName) {
    return { success: false, message: 'Activity group sheet not configured' };
  }

  const sheet = getSheetSafe(sheetName);
  if (!sheet) {
    return { success: false, message: 'Group sheet not found' };
  }

  // Validate required fields
  const { name, capacity, isActive, level, day, location, instructor, secondInstructor } = groupData;
  if (!name || name.trim() === '') {
    return { success: false, message: 'Group name is required' };
  }

  // Check for duplicate names
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toLowerCase().trim() === name.toLowerCase().trim()) {
      return {
        success: false,
        message: 'Group with this name already exists',
        data: { id: data[i][0].toString(), name: data[i][1] }
      };
    }
  }

  // Add new group
  const id = new Date().getTime().toString();
  const createdDate = new Date();
  const updatedDate = new Date();

  sheet.appendRow([
    id,
    name.trim(),
    createdDate,
    capacity || 20,
    isActive !== undefined ? Boolean(isActive) : true,
    level || 'standard',
    day || 'varies',
    location || '',
    instructor || '',
    secondInstructor || ''
  ]);

  return {
    success: true,
    message: 'Activity group added successfully',
    data: {
      id,
      name: name.trim(),
      activityId,
      activityType: activityKey.toLowerCase(),
      capacity: capacity || 20,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      metadata: {
        level: level || 'standard',
        day: day || 'varies',
        location: location || '',
        instructor: instructor || '',
        secondInstructor: secondInstructor || ''
      },
      createdAt: createdDate.toISOString()
    }
  };
}

function getAttendees() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_ATTENDEES);
  const data = sheet.getDataRange().getValues();

  const attendees = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      attendees.push({
        id: data[i][0].toString(),
        firstName: data[i][1],
        lastName: data[i][2],
        email: data[i][3],
        dob: data[i][4],
        phone: data[i][5],
        school: data[i][6],
        graduated: data[i][7]
      });
    }
  }
  return { success: true, data: attendees };
}

function addAttendee(inputData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_ATTENDEES);
  const { firstName, lastName, email, phone } = inputData;
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const sheetFirstName = data[i][1]?.toString().toLowerCase().trim();
    const sheetLastName = data[i][2]?.toString().toLowerCase().trim();
    const sheetEmail = data[i][3]?.toString().toLowerCase().trim();

    if (
      (sheetFirstName === firstName.toLowerCase().trim() && sheetLastName === lastName.toLowerCase().trim()) ||
      (email && sheetEmail && sheetEmail === email.toLowerCase().trim())
    ) {
      return {
        success: false,
        message: 'Attendee already exists',
        data: { id: data[i][0].toString(), firstName: data[i][1], lastName: data[i][2] }
      };
    }
  }

  const id = new Date().getTime().toString();
  const createdDate = new Date();
  sheet.appendRow([id, firstName.trim(), lastName.trim(), email.trim(), '', phone?.trim(), '', false, createdDate]);

  return {
    success: true,
    message: 'Attendee added successfully',
    data: { id, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), createdDate }
  };
}

// ── ATTENDANCE: single-table versions ────────────────────────────────────────

function recordBulkAttendance(params) {
  const attendees = JSON.parse(params.attendeeData || '[]');
  const activity = params.activity;
  const date = params.date;
  const groupId = params.groupId || '';
  const groupName = params.groupName || '';

  if (!attendees.length || !activity || !date) {
    return { success: false, message: 'Missing required parameters' };
  }
  if (!VALID_ACTIVITIES.has(activity)) {
    return { success: false, message: 'Invalid activity' };
  }
  if (activity === 'Circle' && (!groupId || !groupName)) {
    return { success: false, message: 'Circle activity requires group information' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_ATTENDANCE);
  const timestamp = new Date();

  const results = { success: true, total: attendees.length, successful: 0, failed: 0, errors: [], records: [] };
  const dataToInsert = [];

  attendees.forEach((attendee, index) => {
    try {
      const id = new Date().getTime().toString() + index;
      // Row: ID | Attendee ID | Attendee Name | Activity | Date | Group ID | Group Name | Timestamp
      dataToInsert.push([id, attendee.id, attendee.name, activity, date, groupId, groupName, timestamp]);

      results.records.push({
        id,
        attendeeId: attendee.id,
        attendeeName: attendee.name,
        activity,
        groupId: groupId || null,
        groupName: groupName || null,
        date,
        timestamp
      });
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({ attendee, error: error.toString(), index });
    }
  });

  if (dataToInsert.length > 0) {
    const lastRow = sheet.getLastRow();
    const targetRange = sheet.getRange(lastRow + 1, 1, dataToInsert.length, dataToInsert[0].length);
    targetRange.setValues(dataToInsert);
  }

  return results;
}

function removeAttendance(attendeeId, activity, date, groupId) {
  if (!VALID_ACTIVITIES.has(activity)) {
    return { success: false, message: 'Invalid activity' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_ATTENDANCE);
  if (!sheet) {
    return { success: false, message: 'Attendance sheet not found' };
  }

  const data = sheet.getDataRange().getValues();
  let deletedCount = 0;

  // Scan bottom-up so row deletion doesn't shift indices
  for (let i = data.length - 1; i >= 1; i--) {
    const rowActivity = data[i][COL.ACTIVITY];
    const rowAttendeeId = data[i][COL.ATTENDEE_ID];
    const rowDate = data[i][COL.DATE];
    const rowGroupId = data[i][COL.GROUP_ID];

    // Convert to strings for comparison to handle type mismatches
    if (String(rowActivity) !== String(activity)) continue;
    if (String(rowAttendeeId) !== String(attendeeId)) continue;
    if (String(rowDate) !== String(date)) continue;
    if (activity === 'Circle' && String(rowGroupId) !== String(groupId)) continue;

    sheet.deleteRow(i + 1);
    deletedCount++;

    // Only delete one record per call to be safe
    break;
  }

  return deletedCount > 0
    ? { success: true, message: 'Attendance removed successfully' }
    : { success: false, message: 'Attendance record not found' };
}

function getAttendance(activity, startDate, endDate) {
  if (!VALID_ACTIVITIES.has(activity)) {
    return { success: false, message: 'Invalid activity' };
  }

  const sheet = getSheetSafe(SHEET_NAME_ATTENDANCE);
  if (!sheet) {
    return { success: false, message: 'Attendance sheet not found' };
  }

  const data = sheet.getDataRange().getValues();

  const start = startDate ? parseDateForComparison(startDate) : new Date('2000-01-01');
  const end = endDate ? parseDateForComparison(endDate) : new Date('2099-12-31');
  if (startDate) start.setHours(0, 0, 0, 0);
  if (endDate) end.setHours(23, 59, 59, 999);

  const attendance = [];

  for (let i = 1; i < data.length; i++) {
    if (!data[i][COL.ID]) continue;
    if (data[i][COL.ACTIVITY] !== activity) continue;

    const recordDate = parseDateForComparison(data[i][COL.DATE]);
    if (recordDate < start || recordDate > end) continue;

    const record = {
      id: data[i][COL.ID].toString(),
      attendeeId: data[i][COL.ATTENDEE_ID].toString(),
      attendeeName: data[i][COL.ATTENDEE_NAME],
      activity: data[i][COL.ACTIVITY],
      date: formatDateForOutput(data[i][COL.DATE]),
      timestamp: data[i][COL.TIMESTAMP]
    };

    // Include group fields for Circle (mirrors old response shape)
    if (activity === 'Circle') {
      record.groupId = data[i][COL.GROUP_ID] ? data[i][COL.GROUP_ID].toString() : null;
      record.groupName = data[i][COL.GROUP_NAME] || null;
    }

    attendance.push(record);
  }

  return { success: true, data: attendance };
}

function getAllAttendance(startDate, endDate) {
  const sheet = getSheetSafe(SHEET_NAME_ATTENDANCE);
  if (!sheet) {
    return { success: false, message: 'Attendance sheet not found' };
  }

  const data = sheet.getDataRange().getValues();

  const start = startDate ? parseDateForComparison(startDate) : new Date('2000-01-01');
  const end = endDate ? parseDateForComparison(endDate) : new Date('2099-12-31');
  if (startDate) start.setHours(0, 0, 0, 0);
  if (endDate) end.setHours(23, 59, 59, 999);

  const allAttendance = [];

  for (let i = 1; i < data.length; i++) {
    if (!data[i][COL.ID]) continue;

    const recordDate = parseDateForComparison(data[i][COL.DATE]);
    if (recordDate < start || recordDate > end) continue;

    const activity = data[i][COL.ACTIVITY];
    const record = {
      id: data[i][COL.ID].toString(),
      attendeeId: data[i][COL.ATTENDEE_ID].toString(),
      attendeeName: data[i][COL.ATTENDEE_NAME],
      activity,
      date: formatDateForOutput(data[i][COL.DATE]),
      timestamp: data[i][COL.TIMESTAMP]
    };

    if (activity === 'Circle') {
      record.groupId = data[i][COL.GROUP_ID] ? data[i][COL.GROUP_ID].toString() : null;
      record.groupName = data[i][COL.GROUP_NAME] || null;
    }

    allAttendance.push(record);
  }

  return { success: true, data: allAttendance };
}

// ── SUMMARIES (logic identical, now just uses unified query) ──────────────────

function getActivitySummary(activity, startDate, endDate) {
  const result = getAttendance(activity, startDate, endDate);
  if (!result.success) return result;

  const attendance = result.data;
  const uniqueDates = [...new Set(attendance.map(a => a.date))];
  const uniqueAttendees = [...new Set(attendance.map(a => a.attendeeId))];

  const attendanceByDate = {};
  uniqueDates.forEach(date => {
    attendanceByDate[date] = attendance.filter(a => a.date === date).length;
  });

  const attendeeCounts = {};
  attendance.forEach(a => {
    if (!attendeeCounts[a.attendeeId]) {
      attendeeCounts[a.attendeeId] = { id: a.attendeeId, name: a.attendeeName, count: 0 };
    }
    attendeeCounts[a.attendeeId].count++;
  });

  const topAttendees = Object.values(attendeeCounts).sort((a, b) => b.count - a.count).slice(0, 10);

  return {
    success: true,
    data: {
      activity,
      dateRange: { start: startDate || 'All time', end: endDate || 'All time' },
      totalSessions: uniqueDates.length,
      totalAttendance: attendance.length,
      averageAttendance: uniqueDates.length > 0 ? (attendance.length / uniqueDates.length).toFixed(2) : 0,
      uniqueAttendees: uniqueAttendees.length,
      attendanceByDate,
      topAttendees,
      sessions: uniqueDates.sort().reverse()
    }
  };
}

function getAttendeeSummary(attendeeId, startDate, endDate) {
  const allAttendance = getAllAttendance(startDate, endDate);
  if (!allAttendance.success) return allAttendance;

  const attendeeRecords = allAttendance.data.filter(a => a.attendeeId === attendeeId);
  if (attendeeRecords.length === 0) {
    return { success: false, message: 'No attendance records found for this attendee in the specified date range' };
  }

  const attendeeName = attendeeRecords[0].attendeeName;

  const activityBreakdown = {};
  const activityDates = {};
  for (const activity of VALID_ACTIVITIES) {
    const records = attendeeRecords.filter(a => a.activity === activity);
    activityBreakdown[activity] = records.length;
    activityDates[activity] = records.map(a => a.date).sort();
  }

  const monthlyAttendance = {};
  attendeeRecords.forEach(record => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyAttendance[monthKey] = (monthlyAttendance[monthKey] || 0) + 1;
  });

  return {
    success: true,
    data: {
      attendeeId,
      attendeeName,
      dateRange: { start: startDate || 'All time', end: endDate || 'All time' },
      totalAttendance: attendeeRecords.length,
      activityBreakdown,
      activityDates,
      monthlyAttendance,
      recentAttendance: attendeeRecords
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .map(a => ({ activity: a.activity, date: a.date, timestamp: a.timestamp }))
    }
  };
}

function getAllActivitySummaries(startDate, endDate) {
  const summaries = {};
  for (const activity of VALID_ACTIVITIES) {
    const result = getActivitySummary(activity, startDate, endDate);
    if (result.success) summaries[activity] = result.data;
  }
  return { success: true, data: summaries };
}

function getAllAttendeeSummaries(startDate, endDate) {
  const attendeesResult = getAttendees();
  if (!attendeesResult.success) return attendeesResult;

  const summaries = [];
  attendeesResult.data.forEach(attendee => {
    const result = getAttendeeSummary(attendee.id, startDate, endDate);
    if (result.success) summaries.push(result.data);
  });

  summaries.sort((a, b) => b.totalAttendance - a.totalAttendance);
  return { success: true, data: summaries };
}

// ── DATE HELPERS (unchanged) ──────────────────────────────────────────────────

function parseDateForComparison(dateValue) {
  if (dateValue instanceof Date) return new Date(dateValue);
  if (typeof dateValue === 'number') return new Date((dateValue - 25569) * 86400 * 1000);
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }
  if (typeof dateValue === 'string' && dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [month, day, year] = dateValue.split('/').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? new Date('1970-01-01') : date;
}

function formatDateForOutput(dateValue) {
  if (dateValue instanceof Date) {
    return `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`;
  }
  if (typeof dateValue === 'number') {
    const d = new Date((dateValue - 25569) * 86400 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (typeof dateValue === 'string') {
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue;
    if (dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [month, day, year] = dateValue.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
  return String(dateValue);
}

function getSortedCategories() {
  return Object.values(ACTIVITY_CATEGORIES).sort((a, b) => a.displayOrder - b.displayOrder);
}

function getQuarterReportConfig() {
  // Read configuration from Google Sheet
  const sheet = getSheetSafe(SHEET_NAME_QUARTER_REPORT_CONFIG);

  if (!sheet) {
    // Return basic configuration if sheet doesn't exist
    return {
      success: true,
      data: {
        fields: [],
        categories: getSortedCategories(),
        version: "1.0.0",
        lastUpdated: new Date().toISOString()
      }
    };
  }

  try {
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return {
        success: true,
        data: {
          fields: [],
          categories: getSortedCategories(),
          version: "1.0.0",
          lastUpdated: new Date().toISOString()
        }
      };
    }

    // Parse fields from sheet (assuming headers in row 1)
    const fields = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue; // Skip empty rows

      const field = {
        key: data[i][0] || '',
        label: data[i][1] || '',
        dataType: data[i][2] || 'text',
        isVisibleByDefault: data[i][3] === true || data[i][3] === 'TRUE' || data[i][3] === true,
        category: data[i][4] || 'other',
        displayOrder: parseInt(data[i][5]) || 999,
        description: data[i][6] || ''
      };

      if (field.key) {
        fields.push(field);
      }
    }

    const categories = getSortedCategories();

    // Sort fields by display order
    fields.sort((a, b) => a.displayOrder - b.displayOrder);

    return {
      success: true,
      data: {
        fields: fields,
        categories: categories,
        version: "1.0.0",
        lastUpdated: new Date().toISOString()
      }
    };

  } catch (error) {
    Logger.log('Error reading QuarterReportConfig sheet: ' + error.toString());
    return {
      success: true,
      data: {
        fields: [],
        categories: getSortedCategories(),
        version: "1.0.0",
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

