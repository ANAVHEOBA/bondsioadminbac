# Activity Report Update Process

## Overview
Admins can review and update the status of activity reports submitted by users. This process includes status changes and review notes.

---

## Endpoint Details

**URL:** `PATCH /admin/activity/reports/{reportId}/status`

**Authentication:** Required (Admin JWT Token)

**Content-Type:** `application/json` (changed from multipart/form-data for simplicity)

---

## Request Structure

### Path Parameter
- **reportId** (number, required): The ID of the report to update

### Request Body

```json
{
  "status": "resolved",
  "notes": "Activity violated community guidelines and has been hidden. User warned."
}
```

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | ✅ Yes | New status for the report (see Status Options below) |
| `notes` | string | ❌ No | Admin review notes explaining the decision (max 1000 chars) |

---

## Status Options

| Status | Description | When to Use |
|--------|-------------|-------------|
| `pending` | Initial state | Report created, awaiting review |
| `reviewed` | Under investigation | Admin acknowledged, gathering more info |
| `resolved` | Issue addressed | Violation confirmed, action taken (hidden/deleted) |
| `dismissed` | No action needed | No violation found, report invalid |

---

## Process Flow

### 1. User Reports Activity
```
User sees inappropriate activity
↓
Submits report with reason + description
↓
Report created with status = "pending"
```

### 2. Admin Reviews Report
```
Admin views pending reports
↓
Examines the reported activity
↓
Determines if violation occurred
```

### 3. Admin Updates Status
```
Admin calls PATCH /admin/activity/reports/{reportId}/status
↓
Provides new status + review notes
↓
System records:
  - status (new value)
  - review_notes (admin's explanation)
  - reviewed_by (admin user ID)
  - reviewed_at (timestamp)
```

### 4. Response Returned
```
Updated report with all details returned
↓
Includes activity and reporter information
```

---

## Example Scenarios

### Scenario 1: Violation Confirmed - Activity Hidden

**Step 1: Review Report**
```bash
GET /admin/activity/reports/pending
```

**Step 2: Hide Activity**
```bash
PATCH /admin/activity/{activityId}/hide
```

**Step 3: Mark Report as Resolved**
```bash
PATCH /admin/activity/reports/1/status
Content-Type: application/json

{
  "status": "resolved",
  "notes": "Activity contained inappropriate content and violated community guidelines. Activity has been hidden and creator has been warned."
}
```

**Response:**
```json
{
  "code": 1,
  "message": "Report status updated",
  "data": {
    "id": 1,
    "activity_id": 24,
    "reporter_id": "47c97128-49e0-4234-90a5-94b231b358bd",
    "reason": "inappropriate_content",
    "description": "This activity contains inappropriate content",
    "status": "resolved",
    "reviewed_by": "fdb74f12-92ca-11f0-a7b4-a2aa00234146",
    "review_notes": "Activity contained inappropriate content...",
    "reviewed_at": "2025-10-16T14:30:00.000Z",
    "created_at": "2025-10-16T10:15:00.000Z",
    "updated_at": "2025-10-16T14:30:00.000Z",
    "activity": { /* activity details */ },
    "reporter": { /* reporter user details */ }
  }
}
```

---

### Scenario 2: False Report - Dismissed

**Step 1: Review Report**
Admin examines the activity and finds no violation.

**Step 2: Dismiss Report**
```bash
PATCH /admin/activity/reports/2/status
Content-Type: application/json

{
  "status": "dismissed",
  "notes": "No violation found after review. Content complies with community guidelines. Report appears to be false or based on personal dispute."
}
```

**Response:**
```json
{
  "code": 1,
  "message": "Report status updated",
  "data": {
    "id": 2,
    "status": "dismissed",
    "review_notes": "No violation found after review...",
    "reviewed_by": "fdb74f12-92ca-11f0-a7b4-a2aa00234146",
    "reviewed_at": "2025-10-16T14:35:00.000Z"
    /* ... other fields ... */
  }
}
```

---

### Scenario 3: Under Investigation

**Use Case:** Report requires more investigation or escalation

```bash
PATCH /admin/activity/reports/3/status
Content-Type: application/json

{
  "status": "reviewed",
  "notes": "Report acknowledged. Flagged for senior moderation team review. Awaiting additional context from activity creator."
}
```

---

## Database Changes

When status is updated, the following fields are modified in `activity_reports` table:

| Field | Updated Value | Notes |
|-------|---------------|-------|
| `status` | New status from request | enum: pending/reviewed/resolved/dismissed |
| `review_notes` | Notes from request body | Can be null if not provided |
| `reviewed_by` | Admin user ID | Extracted from JWT token |
| `reviewed_at` | Current timestamp | Automatically set |
| `updated_at` | Current timestamp | Auto-updated by TypeORM |

---

## Related Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /admin/activity/reports` | View all reports with pagination |
| `GET /admin/activity/reports/pending` | View only pending reports |
| `GET /admin/activity/reports/stats` | Report statistics (counts by status) |
| `PATCH /admin/activity/{id}/hide` | Hide reported activity |
| `PATCH /admin/activity/{id}/unhide` | Unhide activity |
| `DELETE /admin/activity/{id}` | Permanently delete activity |

---

## Validation Rules

### Status Field
- Must be one of: `pending`, `reviewed`, `resolved`, `dismissed`
- Case-sensitive
- Required field

### Notes Field
- Optional (can be omitted or empty)
- Maximum length: 1000 characters
- Stored as text in database
- Allows null value

---

## Error Responses

### 400 - Bad Request
Invalid status value or validation error

```json
{
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 404 - Not Found
Report ID doesn't exist

```json
{
  "message": "Report not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### 401 - Unauthorized
Missing or invalid JWT token

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

## Service Layer Implementation

**File:** `src/modules/activity/activity.service.ts`

```typescript
async reviewReport(
  reportId: number, 
  reviewerId: string, 
  status: ReportStatus, 
  notes?: string
): Promise<ActivityReport> {
  // Update report fields
  await this.reportRepo.update(reportId, { 
    status, 
    review_notes: notes ?? null, 
    reviewed_by: reviewerId, 
    reviewed_at: new Date() 
  });
  
  // Return fresh entity with relations
  return this.reportRepo.findOneOrFail({ 
    where: { id: reportId }, 
    relations: ['activity', 'reporter'] 
  });
}
```

---

## Future Enhancements

1. **Extract Admin ID from JWT** - Currently hardcoded, should use `@Req()` decorator
2. **Notification System** - Notify reporter when status changes
3. **Auto-actions** - Automatically hide/delete activity based on status
4. **Audit Trail** - Track all status changes with timestamps
5. **Bulk Actions** - Update multiple reports at once
6. **Report Priority** - Escalate high-priority reports

---

## Testing Examples

### Using cURL
```bash
curl -X 'PATCH' \
  'http://localhost:3001/admin/activity/reports/1/status' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "resolved",
    "notes": "Activity hidden after review"
  }'
```

### Using JavaScript/Fetch
```javascript
const response = await fetch('http://localhost:3001/admin/activity/reports/1/status', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'resolved',
    notes: 'Activity hidden after review'
  })
});

const result = await response.json();
console.log(result);
```

---

## Summary

✅ **Simple Process**: Just 2 fields - status + notes  
✅ **Clear Workflow**: pending → reviewed → resolved/dismissed  
✅ **Audit Trail**: Records who reviewed, when, and why  
✅ **Flexible**: Optional notes field for context  
✅ **Well Documented**: Full Swagger specs with examples
