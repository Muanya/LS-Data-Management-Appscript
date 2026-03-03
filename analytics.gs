function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getDashboardData() {
  const cache  = CacheService.getScriptCache();
  const cached = cache.get(DASHBOARD_CACHE_KEY);
  if (cached) return { success: true, data: JSON.parse(cached) };

  const dashboardData = {
    summary:       getSummaryStats(),
    activities:    [...VALID_ACTIVITIES].map(activity => ({ activity, stats: getActivityStats(activity) })),
    trends:        getWeeklyTrends(),
    crossActivity: getCrossActivityData(),
    lastUpdated:   new Date().toISOString()
  };

  cache.put(DASHBOARD_CACHE_KEY, JSON.stringify(dashboardData), 300);
  return { success: true, data: dashboardData };
}

// Single-pass read of the Attendance sheet, filtered by activity
function getActivityStats(activity) {
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_ATTENDANCE);

  if (!sheet || sheet.getLastRow() <= 1) {
    return { totalAttendees: 0, attendanceRate: '0%', peakTime: 'N/A', topAttendee: 'N/A', dailyAverage: 0, uniqueAttendees: 0 };
  }

  const data = sheet.getDataRange().getValues();
  // Filter rows for this activity
  const rows = data.slice(1).filter(row => row[COL.ACTIVITY] === activity);

  if (rows.length === 0) {
    return { totalAttendees: 0, attendanceRate: '0%', peakTime: 'N/A', topAttendee: 'N/A', dailyAverage: 0, uniqueAttendees: 0 };
  }

  const uniqueAttendees = new Set(rows.map(row => row[COL.ATTENDEE_ID]));

  const timeCounts = {};
  rows.forEach(row => {
    const time = row[COL.DATE];
    timeCounts[time] = (timeCounts[time] || 0) + 1;
  });
  const peakTime = Object.entries(timeCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['N/A', 0])[0];

  const attendeeCounts = {};
  rows.forEach(row => {
    const id = row[COL.ATTENDEE_ID];
    attendeeCounts[id] = (attendeeCounts[id] || 0) + 1;
  });
  const topAttendeeId = Object.entries(attendeeCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];

  return {
    totalAttendees:   rows.length,
    attendanceRate:   `${Math.round((rows.length / 100) * 100)}%`,
    peakTime,
    topAttendee:      getAttendeeName(topAttendeeId) || 'N/A',
    dailyAverage:     Math.round(rows.length / 30),
    uniqueAttendees:  uniqueAttendees.size
  };
}

function getSummaryStats() {
  const sheet = getSpreadsheet().getSheetByName(SHEET_NAME_ATTENDANCE);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { totalParticipants: 0, totalRecords: 0, avgAttendanceRate: '0%', mostPopularActivity: 'N/A', peakHours: 'N/A', crossActivityRate: '0%' };
  }

  const data             = sheet.getDataRange().getValues().slice(1);
  const uniqueAttendees  = new Set(data.map(row => row[COL.ATTENDEE_ID]));

  return {
    totalParticipants:  uniqueAttendees.size,
    totalRecords:       data.length,
    avgAttendanceRate:  '82%',
    mostPopularActivity: getMostPopularActivity(),
    peakHours:          getPeakHours(),
    crossActivityRate:  getCrossActivityRate()
  };
}

function getWeeklyTrends() {
  const trends = { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [] };
  for (const activity of VALID_ACTIVITIES) {
    trends.datasets.push({ label: activity, data: Array(7).fill(0), borderColor: getRandomColor() });
  }
  return trends;
}

function getCrossActivityData() {
  const sheet = getSpreadsheet().getSheetByName(SHEET_NAME_ATTENDANCE);
  const attendeesMap = new Map();

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues().slice(1);
    data.forEach(row => {
      const attendeeId = row[COL.ATTENDEE_ID];
      const activity   = row[COL.ACTIVITY];
      if (!attendeesMap.has(attendeeId)) attendeesMap.set(attendeeId, new Set());
      attendeesMap.get(attendeeId).add(activity);
    });
  }

  const multiActivityAttendees = Array.from(attendeesMap.entries())
    .filter(([_, acts]) => acts.size > 1)
    .map(([attendeeId, acts]) => ({
      attendeeId,
      attendeeName:  getAttendeeName(attendeeId),
      activities:    Array.from(acts),
      activityCount: acts.size
    }))
    .sort((a, b) => b.activityCount - a.activityCount);

  const activities = [...VALID_ACTIVITIES];
  const activityOverlaps = [];
  for (let i = 0; i < activities.length; i++) {
    for (let j = i + 1; j < activities.length; j++) {
      const overlap = calculateActivityOverlap(activities[i], activities[j], attendeesMap);
      activityOverlaps.push({
        pair:        `${activities[i]} & ${activities[j]}`,
        overlap:     `${overlap}%`,
        correlation: overlap > 60 ? 'High' : overlap > 30 ? 'Medium' : 'Low'
      });
    }
  }

  return {
    multiActivityAttendees: multiActivityAttendees.slice(0, 10),
    activityOverlaps,
    crossActivityRate: `${Math.round((multiActivityAttendees.length / (attendeesMap.size || 1)) * 100)}%`
  };
}

// Reuses already-loaded attendeesMap instead of re-reading sheets
function calculateActivityOverlap(activityA, activityB, attendeesMap) {
  const setA = new Set();
  const setB = new Set();

  attendeesMap.forEach((activities, attendeeId) => {
    if (activities.has(activityA)) setA.add(attendeeId);
    if (activities.has(activityB)) setB.add(attendeeId);
  });

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union        = new Set([...setA, ...setB]);
  return union.size > 0 ? Math.round((intersection.size / union.size) * 100) : 0;
}

function getAttendeeName(attendeeId) {
  const sheet = getSpreadsheet().getSheetByName(SHEET_NAME_ATTENDEES);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const row  = data.find(r => r[0].toString() === attendeeId);
  return row ? `${row[1]} ${row[2]}` : null;
}

function getMostPopularActivity() {
  let maxCount = 0, popularActivity = 'N/A';
  for (const activity of VALID_ACTIVITIES) {
    const stats = getActivityStats(activity);
    if (stats.totalAttendees > maxCount) {
      maxCount = stats.totalAttendees;
      popularActivity = activity;
    }
  }
  return popularActivity;
}

function getPeakHours() {
  return '5:00 PM - 6:00 PM';
}

function getCrossActivityRate() {
  return getCrossActivityData().crossActivityRate;
}

function getRandomColor() {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}
