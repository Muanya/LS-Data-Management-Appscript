// Configuration constants and data

// Sheet names
const SHEET_NAME_ATTENDEES = 'Attendees';
const SHEET_NAME_ATTENDANCE = 'Attendance'; // Single unified table
const SHEET_NAME_QUARTER_REPORT_CONFIG = 'Quarter_Report_Config';
const CONFIG_SHEET_NAME = "Config";
const DASHBOARD_CACHE_KEY = 'dashboard_data';

// Activity group sheet mappings
const ACTIVITY_GROUP_SHEETS = {
  Circle: 'Circle_Groups',
};

// Column indices for attendance sheet
const COL = { ID: 0, ATTENDEE_ID: 1, ATTENDEE_NAME: 2, ACTIVITY: 3, DATE: 4, GROUP_ID: 5, GROUP_NAME: 6, TIMESTAMP: 7 };

// Activity configuration
const ACTIVITY_CONFIG = {
  Med: {
    id: 'meditations',
    name: 'Meditations',
    displayName: 'Weekly Meditations',
    category: 'Spiritual',
    frequency: 'Weekly',
    type: 'simple',
    icon: 'Moon',
    color: '#0f9d58',
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
    displayName: 'Circles',
    category: 'Doctrinal',
    frequency: 'Weekly',
    type: 'grouped',
    icon: 'Users',
    color: '#f4b400',
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
    displayName: 'Monthly Recollections',
    category: 'Spiritual',
    frequency: 'Monthly',
    type: 'simple',
    icon: 'Calendar',
    color: '#db4437',
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
    dataType: 'number',
    reportKey: 'numLongRetreats',
    displayOrder: 10,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  },
  Doctrine: {
    id: 'doctrineClasses',
    name: 'Doctrine Classes',
    displayName: 'Doctrine classes',
    category: 'Doctrinal',
    frequency: 'Weekly',
    type: 'simple',
    icon: 'Book',
    color: '#f49c42',
    dataType: 'number',
    reportKey: 'numDoctrineCls',
    displayOrder: 14,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  },
  EucharisticVigil: {
    id: 'eucharisticVigils',
    name: 'Eucharistic Vigils',
    displayName: 'Eucharistic Vigils',
    category: 'Spiritual',
    frequency: 'Monthly',
    type: 'simple',
    icon: 'Heart',
    color: '#8e24aa',
    dataType: 'number',
    reportKey: 'numEucharisticVigils',
    displayOrder: 16,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  },
  ProfessionalGetTogether: {
    id: 'professionalGetTogethers',
    name: 'Professional Get-Togethers',
    displayName: 'Professional Get-togethers',
    category: 'Professional',
    frequency: 'Monthly',
    type: 'simple',
    icon: 'Briefcase',
    color: '#546e7a',
    dataType: 'number',
    reportKey: 'numProfessionalGetTogethers',
    displayOrder: 18,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  },
  SpiritualDirection: {
    id: 'spiritualDirection',
    name: 'Spiritual Direction',
    displayName: 'Spiritual Direction',
    category: 'Spiritual',
    frequency: 'Weekly',
    type: 'simple',
    icon: 'Cross',
    color: '#2e7d32',
    dataType: 'number',
    reportKey: 'numSpiritualDirection',
    displayOrder: 20,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  },
  VisitToThePoor: {
    id: 'visitsToThePoor',
    name: 'Visits to the Poor',
    displayName: 'Visits to the Poor',
    category: 'Spiritual',
    frequency: 'Monthly',
    type: 'simple',
    icon: 'Heart',
    color: '#d32f2f',
    dataType: 'number',
    reportKey: 'numVisitsToThePoor',
    displayOrder: 24,
    requiresGroup: false,
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count'
  },
  Workshop: {
    id: 'workshops',
    name: 'Workshops',
    displayName: 'Professional Workshops',
    category: 'Professional',
    frequency: 'Monthly',
    type: 'simple',
    icon: 'Tool',
    color: '#0277bd',
    dataType: 'number',
    reportKey: 'numWorkshops',
    displayOrder: 22,
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
  Doctrinal: {
    id: 'doctrinal',
    name: 'Doctrinal Activities',
    displayOrder: 2
  },
  Professional: {
    id: 'professional',
    name: 'Professional Activities',
    displayOrder: 3
  }
};

const VALID_ACTIVITIES = new Set(Object.values(ACTIVITY_CONFIG).map(a => a.id));

// Quarter report configuration data
const QUARTER_REPORT_FIELDS = [
  ['personsInWork', 'Number of persons in work of sr Apostolate', 'number', 'TRUE', 1, 'Total persons actively working'],
  ['boysInContact', 'Number of boys in contact', 'number', 'TRUE', 2, ''],
  ['boysGoingToSD', 'Number of boys going regularly to spiritual direction', 'number', 'TRUE', 3, ''],
  ['boysDoctrineAvg', 'Number of boys attending doctrine classes (avg per week)', 'number', 'TRUE', 4, ''],
  ['numDoctrineCls', 'Number of classes of doctrine', 'number', 'FALSE', 5, ''],
  ['catechismBreakdown', 'Number of boys that attend catechism classes', 'text', 'TRUE', 6, ''],
  ['numCircles', 'Number of circles (prep classes)', 'number', 'TRUE', 7, ''],
  ['boysAttendingCircles', 'Number of boys attending circles', 'number', 'TRUE', 8, ''],
  ['numProfClasses', 'Number of professional classes', 'number', 'TRUE', 9, ''],
  ['boysAttendingProfClasses', 'Number of boys attending professional classes', 'number', 'TRUE', 10, ''],
  ['boysVisitedPoor', 'Number of boys that have visited the poor', 'number', 'FALSE', 11, ''],
  ['boysTeachingCatechism', 'Number of boys teaching catechism', 'number', 'FALSE', 12, ''],
  ['numMeditations', 'Number of meditations held', 'number', 'TRUE', 13, ''],
  ['boysAttendingMeditationsAvg', 'Number of boys attending meditations (avg per week)', 'number', 'TRUE', 14, ''],
  ['numMonthlyRetreats', 'Number of Monthly retreats', 'number', 'TRUE', 15, ''],
  ['boysMonthlyRetreats', 'Boys attending monthly retreats (Total for the month)', 'number', 'TRUE', 16, ''],
  ['numLongRetreats', 'Number of Long retreats', 'number', 'TRUE', 17, ''],
  ['boysLongRetreats', 'Boys that have attended long retreats', 'number', 'TRUE', 18, ''],
  ['numEucharisticVigils', 'Number of Eucharistic vigils', 'number', 'FALSE', 19, ''],
  ['numSpiritualDirection', 'Number of spiritual direction sessions', 'number', 'FALSE', 20, ''],
  ['numVisitsToThePoor', 'Number of visits to the poor', 'number', 'FALSE', 21, ''],
  ['numProfessionalGetTogethers', 'Number of professional get-togethers', 'number', 'FALSE', 22, ''],
  ['numWorkshops', 'Number of workshops', 'number', 'FALSE', 23, ''],
  ['boysAttendedCV', 'Boys that have attended cv', 'number', 'FALSE', 24, ''],
  ['totalSRBoys', 'Total number of sr boys', 'number', 'TRUE', 25, '']
];

