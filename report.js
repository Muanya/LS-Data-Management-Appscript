
const QUARTER_MONTHS = {
  Q1: ["January", "February", "March"],
  Q2: ["April", "May", "June"],
  Q3: ["July", "August", "September"],
  Q4: ["October", "November", "December"],
};

const MONTH_NUM = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
};

function parseDate(cell) {
  return cell instanceof Date ? cell : new Date(cell);
}

function inMonth(dateStr, month, yr) {
  const d = new Date(dateStr);
  return d.getMonth() + 1 === MONTH_NUM[month] && d.getFullYear() === yr;
}

// Load all attendance rows from the single table, filtered by activity
function loadActivity(activity) {
  const sheet = getSpreadsheet().getSheetByName(SHEET_NAME_ATTENDANCE);
  if (!sheet) {
    console.error(`Sheet '${SHEET_NAME_ATTENDANCE}' not found`);
    return [];
  }

  const tz = Session.getScriptTimeZone();
  return sheet.getDataRange().getValues().slice(1)
    .filter(r => r[COL.ACTIVITY] === activity)
    .map(r => {
      const d = parseDate(r[COL.DATE]);
      const dateStr = Utilities.formatDate(d, tz, "yyyy-MM-dd");
      return {
        attendeeId: r[COL.ATTENDEE_ID],
        attendeeName: r[COL.ATTENDEE_NAME],
        date: dateStr,
        groupId: r[COL.GROUP_ID],
        groupName: r[COL.GROUP_NAME]
      };
    });
}

function catBreakdown(cfg) {
  const parts = [];
  if (cfg["catLakeside"] !== undefined && cfg["catLakeside"] !== null) {
    parts.push("Lakeside – " + cfg["catLakeside"]);
  }
  if (cfg["catKC"] !== undefined && cfg["catKC"] !== null) {
    parts.push("KC – " + cfg["catKC"]);
  }
  if (cfg["catFSTC"] !== undefined && cfg["catFSTC"] !== null) {
    parts.push("FSTC – " + cfg["catFSTC"]);
  }
  return parts.join("\n") || "—";
}

function generateReport(quarter, year, centre) {
  try {
    const ss = getSpreadsheet();
    const months = QUARTER_MONTHS[quarter];

    if (!months) {
      return { error: 'Invalid quarter. Must be Q1, Q2, Q3, or Q4' };
    }

    if (!year || isNaN(year)) {
      return { error: 'Invalid year. Must be a valid number' };
    }

    // Single-table reads per activity (replaces loadSheet with per-sheet logic)
    const medRows = loadActivity('Med');
    const circleRows = loadActivity('Circle');
    const recollRows = loadActivity('Recollection');
    const retreatRows = loadActivity('Retreat');
    const doctrineClsRows = loadActivity('Doctrine');

    const cfgSh = ss.getSheetByName(CONFIG_SHEET_NAME);
    const cfg = {};
    if (cfgSh) {
      cfgSh.getDataRange().getValues().slice(1).forEach(r => {
        if (r[0]) cfg[r[0]] = r[1];
      });
    }

    const monthStats = months.map(month => {
      const filterMonth = r => inMonth(r.date, month, Number(year));

      const medMonth = medRows.filter(filterMonth);
      const retreatMonth = retreatRows.filter(filterMonth);
      const circleMonth = circleRows.filter(filterMonth);
      const recollMonth = recollRows.filter(filterMonth);
      const doctrineClsMonth = doctrineClsRows.filter(filterMonth);

      const uniq = arr => new Set(arr.map(r => r.attendeeId)).size;
      const uniqueDates = arr => new Set(arr.map(r => r.date)).size;

      // Calculate weeks in month more accurately
      const getWeeksInMonth = (month, year) => {
        const firstDay = new Date(year, MONTH_NUM[month] - 1, 1);
        const lastDay = new Date(year, MONTH_NUM[month], 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay();
        const weeks = Math.ceil((daysInMonth + firstDayOfWeek) / 7);
        return weeks || 4;
      };

      const weeksInMonth = getWeeksInMonth(month, Number(year));
      const avgPerWeek = arr => arr.length > 0 ? Math.round(arr.length / weeksInMonth) : 0;
      const uniqueCircles = new Set(circleMonth.map(r => r.groupId)).size;

      return {
        month,
        personsInWork: Number(cfg["personsInWork"]) || 0,
        boysInContact: Number(cfg["boysInContact"]) || 0,
        boysGoingToSD: Number(cfg["boysGoingToSD"]) || 0,
        numCircles: uniqueCircles || Number(cfg["numCircles"]) || 0,
        numProfClasses: Number(cfg["numProfClasses"]) || 0,
        boysAttendingProfClasses: Number(cfg["boysAttendingProfClasses"]) || 0,
        boysVisitedPoor: Number(cfg["boysVisitedPoor"]) || 0,
        boysTeachingCatechism: Number(cfg["boysTeachingCatechism"]) || 0,
        catechismBreakdown: catBreakdown(cfg),
        numMeditations: uniqueDates(medMonth),
        boysAttendingMeditationsAvg: avgPerWeek(medMonth),
        numMonthlyRetreats: uniqueDates(recollMonth),
        boysMonthlyRetreats: uniq(recollMonth),
        numLongRetreats: uniqueDates(retreatMonth),
        boysLongRetreats: uniq(retreatMonth),
        boysDoctrineAvg: avgPerWeek(doctrineClsMonth),
        numDoctrineCls: uniqueDates(doctrineClsMonth),
        boysAttendingCircles: uniq(circleMonth),
        boysAttendedCV: 0,
        totalSRBoys: Number(cfg["totalSRBoys"]) || 0,
      };
    });

    return { success: true, data: { centre, quarter, year, months: monthStats } };
  } catch (err) {
    console.error('Error generating report:', err);
    return { error: err.message };
  }
}