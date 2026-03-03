function getRouter(e) {
  const action = e.parameter.action;

  try {
    let result;
    switch (action) {
      case 'health':
        result = getHealth();
        break;
      case 'getAttendees':
        result = getAttendees();
        break;
      case 'getAttendance':
        result = getAttendance(e.parameter.activity, e.parameter.startDate, e.parameter.endDate);
        break;
      case 'getAllAttendance':
        result = getAllAttendance(e.parameter.startDate, e.parameter.endDate);
        break;
      case 'searchAttendee':
        result = searchAttendee(e.parameter.name);
        break;
      case 'getCircleGroups':
        result = getCircleGroups();
        break;
      case 'searchCircleGroup':
        result = searchCircleGroup(e.parameter.name);
        break;
      case 'getActivitySummary':
        result = getActivitySummary(e.parameter.activity, e.parameter.startDate, e.parameter.endDate);
        break;
      case 'getAttendeeSummary':
        result = getAttendeeSummary(e.parameter.attendeeId, e.parameter.startDate, e.parameter.endDate);
        break;
      case 'getAllActivitySummaries':
        result = getAllActivitySummaries(e.parameter.startDate, e.parameter.endDate);
        break;
      case 'getAllAttendeeSummaries':
        result = getAllAttendeeSummaries(e.parameter.startDate, e.parameter.endDate);
        break;    
      case 'getDashboardData':
        result = getDashboardData();
        break;
      case 'getQuarterReport':
        result = generateReport(e.parameter.quarter, e.parameter.year, e.parameter.centre)
        break;
      default:
        result = { success: false, message: 'Invalid action' };
    }

    console.log(result, ">>>>>>>>>><<<<<<<<<<<<")
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


function postRouter(e) {
  const params = e.parameter;
  const action = params.action;

  try {
    let result;
    switch (action) {
      case 'addAttendee':
        result = addAttendee(params);
        break;
      case 'addCircleGroup':
        result = addCircleGroup(params.name);
        break;
      case 'recordAttendance':
        result = recordBulkAttendance(params);
        break;
      case 'removeAttendance':
        result = removeAttendance(params.attendeeId, params.activity, params.date, params.groupId);
        break;
      default:
        result = { success: false, message: 'Invalid action', };
    }
    // disable cache for dashboard
    CacheService.getScriptCache().remove(DASHBOARD_CACHE_KEY);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString(),

    })).setMimeType(ContentService.MimeType.JSON);
  }
}
