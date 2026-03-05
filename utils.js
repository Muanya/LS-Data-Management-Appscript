/**
 * Utility functions for LS Data App Script
 * Centralized validation, error handling, and helper functions
 */

// Response helper for consistent API responses
function createResponse(success, data = null, message = '') {
  const response = { success };
  if (data !== null) response.data = data;
  if (message) response.message = message;
  return response;
}

// Error response helper
function createErrorResponse(message, error = null) {
  const response = createResponse(false, null, message);
  if (error && typeof error === 'object') {
    response.error = error.toString();
  }
  return response;
}

// Input validation helpers
function validateRequired(params, requiredFields) {
  if (!params || typeof params !== 'object') {
    return {
      isValid: false,
      message: 'Invalid parameters object'
    };
  }

  const missing = requiredFields.filter(field => {
    const value = params[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missing.join(', ')}`
    };
  }
  return { isValid: true };
}

function validateActivity(activity) {
  if (!activity) {
    return { isValid: false, message: 'Activity is required' };
  }

  const activityEntry = Object.values(ACTIVITY_CONFIG).find(a => a.id === activity);
  if (!activityEntry) {
    return {
      isValid: false,
      message: `Invalid activity. Must be one of: ${Object.values(ACTIVITY_CONFIG).map(a => a.id).join(', ')}`
    };
  }

  return { isValid: true };
}

function validateDateRange(startDate, endDate) {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return {
        isValid: false,
        message: 'Start date must be before end date'
      };
    }
  }
  return { isValid: true };
}

function validateQuarter(quarter) {
  const validQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  if (quarter === undefined || quarter === null || quarter === '') {
    return {
      isValid: false,
      message: 'Quarter is required'
    };
  }
  if (!validQuarters.includes(quarter)) {
    return {
      isValid: false,
      message: 'Invalid quarter. Must be Q1, Q2, Q3, or Q4'
    };
  }
  return { isValid: true };
}

function validateYear(year) {
  const yearNum = parseInt(year);
  if (year === undefined || year === null || year === '') {
    return {
      isValid: false,
      message: 'Year is required'
    };
  }
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return {
      isValid: false,
      message: 'Invalid year. Must be a valid year between 2000 and 2100'
    };
  }
  return { isValid: true };
}

// Safe function execution with error handling
function safeExecute(fn, ...args) {
  try {
    const result = fn(...args);
    if (result && typeof result === 'object' && result.success !== undefined) {
      return result;
    }
    return createResponse(true, result);
  } catch (error) {
    console.error(`Error in ${fn.name}:`, error);
    return createErrorResponse(error.message, error);
  }
}

// Enhanced logging
function logApiCall(action, params, result) {
  const logData = {
    timestamp: new Date().toISOString(),
    action,
    params: sanitizeParams(params),
    success: result.success,
    executionTime: result.executionTime
  };
  console.log(JSON.stringify(logData));
}

function sanitizeParams(params) {
  const sanitized = { ...params };
  // Remove sensitive data if any
  if (sanitized.password) delete sanitized.password;
  if (sanitized.token) delete sanitized.token;
  return sanitized;
}

// Cache management
function getCache(key) {
  return CacheService.getScriptCache().get(key);
}

function setCache(key, value, expirationSeconds = 300) {
  return CacheService.getScriptCache().put(key, JSON.stringify(value), expirationSeconds);
}

function clearCache(key) {
  return CacheService.getScriptCache().remove(key);
}

// Performance monitoring
function withPerformanceMonitoring(fn, ...args) {
  const startTime = Date.now();
  try {
    const result = fn(...args);
    const endTime = Date.now();
    result.executionTime = endTime - startTime;
    return result;
  } catch (error) {
    const endTime = Date.now();
    const errorResult = createErrorResponse(error.message, error);
    errorResult.executionTime = endTime - startTime;
    return errorResult;
  }
}
