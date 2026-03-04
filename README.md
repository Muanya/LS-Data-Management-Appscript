# LS Data App Script

Backend for LS data attendance system - A comprehensive Google Apps Script application for managing attendance, analytics, and reporting.

## 📋 Overview

This project provides a robust backend system for:
- **Attendance Management**: Track attendance across multiple activities
- **Analytics Dashboard**: Real-time metrics and insights
- **Quarterly Reports**: Generate comprehensive reports
- **Data Management**: Attendees, circle groups, and activities

## 🏗️ Architecture

### File Organization

```
├── Code.js          # Constants, configuration, and entry points
├── router.js        # HTTP request routing and validation
├── service.js       # Core business logic and data operations
├── analytics.js     # Dashboard calculations and metrics
├── report.js        # Report generation functionality
├── utils.js         # Shared utilities, validation, and error handling
└── appsscript.json  # App Script configuration
```

### Responsibilities

#### **Code.js** - Configuration & Entry Points
- Global constants and configuration
- Sheet initialization (`initializeSheets`)
- HTTP entry points (`doGet`, `doPost`)
- Activity definitions and validation sets

#### **router.js** - Request Routing & Validation
- HTTP request routing
- Input validation and sanitization
- Error handling and response formatting
- API logging and monitoring

#### **service.js** - Business Logic
- CRUD operations for attendees and groups
- Attendance recording and retrieval
- Data summaries and aggregations
- Sheet interactions

#### **analytics.js** - Dashboard Metrics
- Real-time dashboard data calculation
- Activity statistics and trends
- Cross-activity analysis
- Performance optimization with caching

#### **report.js** - Report Generation
- Quarterly report generation
- Data aggregation and formatting
- Configuration-based reporting
- Error handling for missing data

#### **utils.js** - Shared Utilities
- Response formatting helpers
- Input validation functions
- Error handling wrappers
- Cache management
- Performance monitoring

## 🚀 Setup & Deployment

### Prerequisites
- Google Apps Script account
- CLASP CLI tool installed
- Node.js (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LS-Data-Appscript
   ```

2. **Login to Google Apps Script**
   ```bash
   clasp login
   ```

3. **Push to Apps Script**
   ```bash
   clasp push
   ```

### Configuration

Update `.clasp.json` with your script ID:
```json
{
  "scriptId": "your-script-id-here",
  "rootDir": "./"
}
```

## 📊 API Endpoints

### Health Check
- `GET /?action=health` - Service health status

### Activities
- `GET /?action=getActivities` - List all activities with comprehensive metadata and categories
- `GET /?action=getActivityGroups&activityId=<activityId>` - Get groups for a specific activity

### Attendees
- `GET /?action=getAttendees` - List all attendees
- `GET /?action=searchAttendee&name=<name>` - Search attendees
- `POST /?action=addAttendee` - Add new attendee

### Circle Groups
- `GET /?action=getCircleGroups` - List all groups
- `GET /?action=searchCircleGroup&name=<name>` - Search groups
- `POST /?action=addCircleGroup` - Add new group

### Attendance
- `GET /?action=getAttendance&activity=<type>` - Get attendance by activity
- `GET /?action=getAllAttendance` - Get all attendance records
- `POST /?action=recordAttendance` - Record attendance
- `POST /?action=removeAttendance` - Remove attendance record

### Analytics
- `GET /?action=getDashboardData` - Dashboard metrics
- `GET /?action=getActivitySummary&activity=<type>` - Activity summary
- `GET /?action=getAttendeeSummary&attendeeId=<id>` - Attendee summary

### Reports
- `GET /?action=getQuarterReport&quarter=<Q1-4>&year=<year>&centre=<name>` - Generate quarterly report



## 📈 Best Practices Implemented

### Error Handling
- Centralized error handling with `safeExecute()`
- Consistent error response format
- Comprehensive input validation
- Graceful degradation for missing data

### Performance
- Caching for dashboard data (5-minute cache)
- Optimized sheet reads with single-pass operations
- Performance monitoring with execution time tracking
- Efficient data structures (Sets, Maps)

### Security
- Input validation and sanitization
- Activity type validation
- Date range validation
- Error message sanitization

### Maintainability
- Clear separation of concerns
- Consistent naming conventions
- Comprehensive documentation
- Modular architecture

## 🎯 Activities Supported

### Spiritual Activities
| Activity | Frequency | Type | Report Key | Groups |
|----------|-----------|-------|------------|--------|
| Meditations | Weekly | Simple | numMeditations | No |
| Recollections | Monthly | Simple | numMonthlyRetreats | No |
| Retreats | Quarterly | Simple | numLongRetreats | No |

### Educational Activities
| Activity | Frequency | Type | Report Key | Group Required | Groups |
|----------|-----------|-------|------------|---------------|--------|
| Circles | Weekly | Grouped | numCircles | Yes | Yes |
| Doctrine | Weekly | Simple | numDoctrineCls | No | No |

### Activity Groups

#### Unified Group Structure
All activities now support groups with a unified structure:

**Standard Group Sheet Columns**:
```
ID | Group Name | Created Date | Capacity | Is Active | Level | Day | Location | Instructor | Updated Date
```

**Activity Sheet Mappings**:
- **Circles**: `Circle_Groups` sheet
- **Meditations**: `Meditation_Groups` sheet
- **Recollections**: `Recollection_Groups` sheet
- **Retreats**: `Retreat_Groups` sheet
- **Doctrine**: `Doctrine_Groups` sheet

**API Endpoint**: `GET /?action=getActivityGroups&activityId=<activityId>`

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": "group-id",
        "name": "Group Name",
        "activityId": "activity-id",
        "activityType": "activity-type",
        "description": "Activity group: Group Name",
        "capacity": 20,
        "isActive": true,
        "metadata": {
          "level": "standard",
          "day": "varies",
          "location": "",
          "instructor": ""
        },
        "createdAt": "2026-01-15T10:00:00Z",
        "updatedAt": "2026-03-01T14:30:00Z"
      }
    ],
    "activityId": "activity-id",
    "totalCount": 1,
    "activeCount": 1
  }
}
```

#### Adding Group Support for New Activities

To add group support for other activities:

1. **Update Activity Configuration**:
```javascript
NewActivity: {
  // ... other properties
  requiresGroup: true,
  groupType: 'new-activity-type'
}
```

2. **Add Sheet Mapping** in `Code.js`:
```javascript
const ACTIVITY_GROUP_SHEETS = {
  // ... existing mappings
  NewActivity: 'NewActivity_Groups'
};
```

3. **Done!** The unified `getActivityGroupsUnified()` function will automatically handle the new activity.

### Activity Metadata
Each activity includes comprehensive metadata:
- **Display Name**: Human-readable name for reports
- **Icon & Styling**: Visual representation with colors and gradients
- **Data Type**: How data should be processed (number/grouped)
- **Aggregation**: How to calculate totals (count/sum/average)
- **Group Support**: Whether group information is required
- **Report Integration**: Inclusion in quarterly reports

### Adding New Activities

To add a new activity, update `ACTIVITY_CONFIG` in `Code.js`:

```javascript
const ACTIVITY_CONFIG = {
  // ... existing activities
  NewActivity: {
    id: 'new-activity',
    name: 'New Activity',
    displayName: 'Display Name for Reports',
    category: 'Spiritual', // or 'Educational' or add new category
    frequency: 'Weekly', // Daily, Weekly, Monthly, Quarterly
    type: 'simple', // 'simple' or 'grouped'
    icon: 'IconName',
    color: '#hex-color',
    gradient: 'from-color-500 to-color-500',
    dataType: 'number', // 'number' or 'grouped'
    reportKey: 'reportKey',
    displayOrder: 16, // Sort order
    requiresGroup: false, // true if needs group info
    groupType: 'optional-group-type', // only if requiresGroup: true
    allowMultipleGroups: false, // only if requiresGroup: true
    includeInQuarterReport: true,
    includeInAttendanceTracking: true,
    aggregationMethod: 'count' // 'count', 'sum', 'average'
  }
};
```

### Adding New Categories

To add a new category, update `ACTIVITY_CATEGORIES` in `Code.js`:

```javascript
const ACTIVITY_CATEGORIES = {
  // ... existing categories
  NewCategory: {
    id: 'new-category',
    name: 'New Category Name',
    displayOrder: 3
  }
};
```

No other files need to be changed - the system will automatically:
- Validate new activity types
- Include them in activity lists with proper sorting
- Handle group requirements if specified
- Apply appropriate styling with colors and gradients
- Include in reports and analytics as configured

## 📝 Data Structure

### Attendance Records
```
ID | Attendee ID | Attendee Name | Activity | Date | Group ID | Group Name | Timestamp
```

### Attendee Records
```
ID | First Name | Last Name | Email | DOB | Phone | School | Graduated | Created Date
```

### Circle Groups
```
ID | Group Name | Created Date
```

### Activity Groups
```
ID | Group Name | Created Date | Capacity | Is Active | Level | Day | Location | Instructor | Updated Date
```

### Activity Groups API Response
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": "group-id",
        "name": "Group Name",
        "activityId": "activity-id",
        "activityType": "activity-type",
        "description": "Activity group: Group Name",
        "capacity": 20,
        "isActive": true,
        "metadata": {
          "level": "standard",
          "day": "varies",
          "location": "",
          "instructor": ""
        },
        "createdAt": "2026-01-15T10:00:00Z",
        "updatedAt": "2026-03-01T14:30:00Z"
      }
    ],
    "activityId": "activity-id",
    "totalCount": 1,
    "activeCount": 1
  }
}
```

## 🔍 Monitoring & Logging

All API calls are automatically logged with:
- Timestamp
- Action/endpoint
- Parameters (sanitized)
- Success/failure status
- Execution time

## 🐛 Troubleshooting

### Common Issues
1. **Sheet not found errors** - Check sheet names in `Code.js`
2. **Permission errors** - Ensure proper spreadsheet permissions
3. **Cache issues** - Clear cache with `CacheService.getScriptCache().removeAll()`

### Debug Mode
Enable detailed logging by setting development environment variables.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Follow the established code patterns
2. Add comprehensive error handling
3. Update documentation for new features
4. Test thoroughly before deployment
