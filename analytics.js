
let attendeeNameCache = null;

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Helper function to get sheet with error handling
function getSheetSafe(sheetName) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.error(`Sheet '${sheetName}' not found`);
      return null;
    }
    return sheet;
  } catch (error) {
    console.error(`Error accessing sheet '${sheetName}': ${error.message}`);
    return null;
  }
}

function getDashboardData() {
  const cache  = CacheService.getScriptCache();
  const cached = cache.get(DASHBOARD_CACHE_KEY);
  if (cached) return { success: true, data: JSON.parse(cached) };

  const dashboardData = {
    summary:       getSummaryStats(),
    activities:    Object.keys(ACTIVITY_CONFIG).map(activityKey => {
      const config = ACTIVITY_CONFIG[activityKey];
      return {
        id: config.id,
        name: config.name,
        color: config.color,
        stats: getActivityStats(activityKey)
      };
    }),
    trends: getSessionTrends(),
    crossActivity: getCrossActivityData(),
    lastUpdated:   new Date().toISOString()
  };

  cache.put(DASHBOARD_CACHE_KEY, JSON.stringify(dashboardData), 300);
  return { success: true, data: dashboardData };
}

// Single-pass read of the Attendance sheet, filtered by activity
function getActivityStats(activity) {
  const sheet = getSheetSafe(SHEET_NAME_ATTENDANCE);

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
  const uniqueDates = new Set(rows.map(row => formatDateForOutput(row[COL.DATE])));
  const daysInPeriod = uniqueDates.size || 1;

  const timeCounts = {};
  rows.forEach(row => {
    const date = formatDateForOutput(row[COL.DATE]);
    timeCounts[date] = (timeCounts[date] || 0) + 1;
  });
  const peakDate = Object.entries(timeCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['N/A', 0])[0];

  const attendeeCounts = {};
  rows.forEach(row => {
    const id = row[COL.ATTENDEE_ID];
    attendeeCounts[id] = (attendeeCounts[id] || 0) + 1;
  });
  const topAttendeeId = Object.entries(attendeeCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];

  // Calculate attendance rate based on unique attendees per session
  const avgAttendancePerSession = daysInPeriod > 0 ? rows.length / daysInPeriod : 0;
  const attendanceRate = uniqueAttendees.size > 0 ? 
    Math.round((avgAttendancePerSession / uniqueAttendees.size) * 100) : 0;

  return {
    totalAttendees:   rows.length,
    attendanceRate:   `${attendanceRate}%`,
    peakTime:        peakDate,
    topAttendee:      getAttendeeName(topAttendeeId.toString()) || 'N/A',
    dailyAverage:     Math.round(rows.length / daysInPeriod),
    uniqueAttendees:  uniqueAttendees.size
  };
}

function getSummaryStats() {
  const sheet = getSheetSafe(SHEET_NAME_ATTENDANCE);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { totalParticipants: 0, totalRecords: 0, avgAttendanceRate: '0%', mostPopularActivity: 'N/A', peakHours: 'N/A', crossActivityRate: '0%' };
  }

  const data             = sheet.getDataRange().getValues().slice(1);
  const uniqueAttendees  = new Set(data.map(row => row[COL.ATTENDEE_ID]));
  
  // Calculate actual average attendance rate across all activities
  let totalAttendanceRate = 0;
  let activityCount = 0;
  for (const activity of VALID_ACTIVITIES) {
    const stats = getActivityStats(activity);
    const rate = parseInt(stats.attendanceRate) || 0;
    if (rate > 0) {
      totalAttendanceRate += rate;
      activityCount++;
    }
  }
  const avgRate = activityCount > 0 ? Math.round(totalAttendanceRate / activityCount) : 0;

  return {
    totalParticipants:  uniqueAttendees.size,
    totalRecords:       data.length,
    avgAttendanceRate:  `${avgRate}%`,
    mostPopularActivity: getMostPopularActivity(),
    peakHours:          getPeakHours(),
    crossActivityRate:  getCrossActivityRate()
  };
}

function getSessionTrends() {
  const sheet = getSheetSafe(SHEET_NAME_ATTENDANCE);
  const sessionData = new Map();

  if (sheet && sheet.getLastRow() > 1) {
    const data = sheet.getDataRange().getValues().slice(1);
    
    data.forEach(row => {
      const activity = row[COL.ACTIVITY];
      const date = formatDateForOutput(row[COL.DATE]);
      const sessionKey = `${activity}_${date}`;
      
      if (!sessionData.has(sessionKey)) {
        sessionData.set(sessionKey, {
          activity,
          date,
          attendees: new Set(),
          timestamp: row[COL.TIMESTAMP]
        });
      }
      
      sessionData.get(sessionKey).attendees.add(row[COL.ATTENDEE_ID]);
    });
  }

  // Convert to array and sort by date
  const sessions = Array.from(sessionData.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Group sessions by activity for trend analysis
  const trends = { labels: [], datasets: [] };
  const activitySessions = {};
  
  // Organize sessions by activity
  sessions.forEach(session => {
    if (!activitySessions[session.activity]) {
      activitySessions[session.activity] = [];
    }
    activitySessions[session.activity].push(session);
  });

  // Create datasets for each activity
  for (const activity of VALID_ACTIVITIES) {
    const activitySessionList = activitySessions[activity] || [];
    const attendanceData = activitySessionList.map(session => session.attendees.size);
    const sessionLabels = activitySessionList.map(session => {
      const date = new Date(session.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    trends.datasets.push({
      label: activity,
      data: attendanceData,
      borderColor: getActivityColor(activity),
      backgroundColor: getActivityColor(activity) + '20',
      sessions: activitySessionList.length,
      totalAttendance: attendanceData.reduce((sum, count) => sum + count, 0),
      averageAttendance: attendanceData.length > 0 ? 
        Math.round(attendanceData.reduce((sum, count) => sum + count, 0) / attendanceData.length) : 0
    });
  }

  // Create unified labels from all session dates
  const allSessionDates = [...new Set(sessions.map(session => {
    const date = new Date(session.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }))].sort((a, b) => {
    const [aMonth, aDay] = a.split('/').map(Number);
    const [bMonth, bDay] = b.split('/').map(Number);
    const dateA = new Date(2024, aMonth - 1, aDay);
    const dateB = new Date(2024, bMonth - 1, bDay);
    return dateA - dateB;
  });
  
  trends.labels = allSessionDates.slice(-20); // Show last 20 sessions

  // Calculate overall statistics
  const totalSessions = sessions.length;
  const totalAttendance = sessions.reduce((sum, session) => sum + session.attendees.size, 0);
  const averageSessionAttendance = totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0;

  return {
    trends,
    summary: {
      totalSessions,
      totalAttendance,
      averageSessionAttendance,
      mostRecentSession: sessions[sessions.length - 1] || null,
      sessionGrowth: calculateSessionGrowth(sessions)
    }
  };
}

function getActivityColor(activity) {
  // activity is the key from ACTIVITY_CONFIG (e.g., 'Circle', 'Workshop')
  const activityConfig = ACTIVITY_CONFIG[activity];
  return activityConfig ? activityConfig.color : '#6B7280';
}

function calculateSessionGrowth(sessions) {
  if (sessions.length < 2) return 'Insufficient data';
  
  const recentSessions = sessions.slice(-5); // Last 5 sessions
  const previousSessions = sessions.slice(-10, -5); // Previous 5 sessions
  
  if (previousSessions.length === 0) return 'Insufficient data';
  
  const recentAvg = recentSessions.reduce((sum, session) => sum + session.attendees.size, 0) / recentSessions.length;
  const previousAvg = previousSessions.reduce((sum, session) => sum + session.attendees.size, 0) / previousSessions.length;
  
  const growth = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  if (growth > 10) return 'Growing';
  if (growth < -10) return 'Declining';
  return 'Stable';
}

function getCrossActivityData() {
  const sheet = getSheetSafe(SHEET_NAME_ATTENDANCE);
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

  const totalAttendees = attendeesMap.size || 1;
  const multiActivityAttendees = Array.from(attendeesMap.entries())
    .filter(([_, acts]) => acts.size > 1)
    .map(([attendeeId, acts]) => ({
      attendeeId,
      attendeeName:  getAttendeeName(attendeeId.toString()),
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

  const crossActivityRate = Math.round((multiActivityAttendees.length / totalAttendees) * 100);

  return {
    multiActivityAttendees: multiActivityAttendees.slice(0, 10),
    activityOverlaps,
    crossActivityRate: `${crossActivityRate}%`
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
  if (!attendeeNameCache) {
    attendeeNameCache = new Map();
    const sheet = getSheetSafe(SHEET_NAME_ATTENDEES);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      data.slice(1).forEach(row => {
        if (row[0]) {
          const firstName = row[1] || '';
          const lastName = row[2] || '';
          const fullName = `${firstName} ${lastName}`.trim();
          attendeeNameCache.set(row[0].toString(), fullName);
        }
      });
    }
  }
  return attendeeNameCache.get(attendeeId.toString()) || null;
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
