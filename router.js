function getRouter(e) {
  const action = e.parameter.action;
  const params = e.parameter;

  try {
    let result;

    // Route to appropriate handler with validation
    switch (action) {
      // Health check
      case 'health':
        result = safeExecute(getHealth);
        break;

      // Activities
      case 'getActivities':
        result = safeExecute(getActivities);
        break;

      case 'getActivityGroups':
        const activityGroupsValidation = validateRequired(params, ['activityId']);
        if (!activityGroupsValidation.isValid) {
          result = createErrorResponse(activityGroupsValidation.message);
        } else {
          result = safeExecute(getActivityGroups, params.activityId);
        }
        break;

      // Attendee operations
      case 'getAttendees':
        result = safeExecute(getAttendees);
        break;
      case 'searchAttendee':
        const attendeeValidation = validateRequired(params, ['name']);
        if (!attendeeValidation.isValid) {
          result = createErrorResponse(attendeeValidation.message);
        } else {
          result = safeExecute(searchAttendee, params.name);
        }
        break;

      // Attendance operations
      case 'getAttendance':
        const attendanceValidation = validateRequired(params, ['activity']);
        if (!attendanceValidation.isValid) {
          result = createErrorResponse(attendanceValidation.message);
        } else {
          const activityValidation = validateActivity(params.activity);
          if (!activityValidation.isValid) {
            result = createErrorResponse(activityValidation.message);
          } else {
            const dateValidation = validateDateRange(params.startDate, params.endDate);
            if (!dateValidation.isValid) {
              result = createErrorResponse(dateValidation.message);
            } else {
              result = safeExecute(getAttendance, params.activity, params.startDate, params.endDate);
            }
          }
        }
        break;
      case 'getAllAttendance':
        const allAttendanceValidation = validateDateRange(params.startDate, params.endDate);
        if (!allAttendanceValidation.isValid) {
          result = createErrorResponse(allAttendanceValidation.message);
        } else {
          result = safeExecute(getAllAttendance, params.startDate, params.endDate);
        }
        break;

      // Analytics operations
      case 'getActivitySummary':
        const summaryValidation = validateRequired(params, ['activity']);
        if (!summaryValidation.isValid) {
          result = createErrorResponse(summaryValidation.message);
        } else {
          const activityValidation = validateActivity(params.activity);
          if (!activityValidation.isValid) {
            result = createErrorResponse(activityValidation.message);
          } else {
            const dateValidation = validateDateRange(params.startDate, params.endDate);
            if (!dateValidation.isValid) {
              result = createErrorResponse(dateValidation.message);
            } else {
              result = safeExecute(getActivitySummary, params.activity, params.startDate, params.endDate);
            }
          }
        }
        break;
      case 'getAttendeeSummary':
        const attendeeSummaryValidation = validateRequired(params, ['attendeeId']);
        if (!attendeeSummaryValidation.isValid) {
          result = createErrorResponse(attendeeSummaryValidation.message);
        } else {
          const dateValidation = validateDateRange(params.startDate, params.endDate);
          if (!dateValidation.isValid) {
            result = createErrorResponse(dateValidation.message);
          } else {
            result = safeExecute(getAttendeeSummary, params.attendeeId, params.startDate, params.endDate);
          }
        }
        break;
      case 'getAllActivitySummaries':
        const allActivityValidation = validateDateRange(params.startDate, params.endDate);
        if (!allActivityValidation.isValid) {
          result = createErrorResponse(allActivityValidation.message);
        } else {
          result = safeExecute(getAllActivitySummaries, params.startDate, params.endDate);
        }
        break;
      case 'getAllAttendeeSummaries':
        const allAttendeeValidation = validateDateRange(params.startDate, params.endDate);
        if (!allAttendeeValidation.isValid) {
          result = createErrorResponse(allAttendeeValidation.message);
        } else {
          result = safeExecute(getAllAttendeeSummaries, params.startDate, params.endDate);
        }
        break;
      case 'getDashboardData':
        result = withPerformanceMonitoring(getDashboardData);
        break;

      // Report operations
      case 'getQuarterReport':
        const reportValidation = validateRequired(params, ['quarter', 'year', 'centre']);
        if (!reportValidation.isValid) {
          result = createErrorResponse(reportValidation.message);
        } else {
          const quarterValidation = validateQuarter(params.quarter);
          if (!quarterValidation.isValid) {
            result = createErrorResponse(quarterValidation.message);
          } else {
            const yearValidation = validateYear(params.year);
            if (!yearValidation.isValid) {
              result = createErrorResponse(yearValidation.message);
            } else {
              result = safeExecute(generateReport, params.quarter, params.year, params.centre);
            }
          }
        }
        break;

      case 'getQuarterReportConfig':
        result = safeExecute(getQuarterReportConfig);
        break;

      default:
        result = createErrorResponse('Invalid action', `Action '${action}' not found`);
    }

    // Log API call for monitoring
    logApiCall(action, params, result);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const errorResult = createErrorResponse('Internal server error', error);
    logApiCall(action, params, errorResult);

    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


function postRouter(e) {
  const params = e.parameter;
  const action = params.action;

  try {
    let result;

    // Route to appropriate POST handler with validation
    switch (action) {
      case 'addAttendee':
        const addAttendeeValidation = validateRequired(params, ['firstName', 'lastName']);
        if (!addAttendeeValidation.isValid) {
          result = createErrorResponse(addAttendeeValidation.message);
        } else {
          result = safeExecute(addAttendee, params);
        }
        break;

      case 'addActivityGroup':
        const addActivityGroupValidation = validateRequired(params, ['activityId', 'name']);
        if (!addActivityGroupValidation.isValid) {
          result = createErrorResponse(addActivityGroupValidation.message);
        } else {
          const groupData = {
            name: params.name,
            capacity: params.capacity,
            isActive: params.isActive,
            level: params.level,
            day: params.day,
            location: params.location,
            instructor: params.instructor,
            secondInstructor: params.secondInstructor
          };
          result = safeExecute(addActivityGroup, params.activityId, groupData);
        }
        break;

      case 'recordAttendance':
        const recordValidation = validateRequired(params, ['attendeeData', 'activity', 'date']);
        if (!recordValidation.isValid) {
          result = createErrorResponse(recordValidation.message);
        } else {
          const activityValidation = validateActivity(params.activity);
          if (!activityValidation.isValid) {
            result = createErrorResponse(activityValidation.message);
          } else {
            result = safeExecute(recordBulkAttendance, params);
          }
        }
        break;

      case 'removeAttendance':
        const removeValidation = validateRequired(params, ['attendeeId', 'activity', 'date']);
        if (!removeValidation.isValid) {
          result = createErrorResponse(removeValidation.message);
        } else {
          const activityValidation = validateActivity(params.activity);
          if (!activityValidation.isValid) {
            result = createErrorResponse(activityValidation.message);
          } else {
            result = safeExecute(removeAttendance, params.attendeeId, params.activity, params.date, params.groupId);
          }
        }
        break;

      default:
        result = createErrorResponse('Invalid action', `Action '${action}' not found for POST requests`);
    }

    // Clear dashboard cache for data-modifying operations
    if (result.success && ['addAttendee', 'addActivityGroup', 'recordAttendance', 'removeAttendance'].includes(action)) {
      clearCache(DASHBOARD_CACHE_KEY);
    }

    // Log API call for monitoring
    logApiCall(action, params, result);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const errorResult = createErrorResponse('Internal server error', error);
    logApiCall(action, params, errorResult);

    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
