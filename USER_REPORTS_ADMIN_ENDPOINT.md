# User Reports Admin Endpoint - Implementation Guide

## Overview

This document describes the implementation of the **User Reports Admin Endpoint** that allows administrators to view all user reports submitted by users through the main application.

**Implementation Date:** October 27, 2025
**Status:** ✅ Complete and Ready for Testing

---

## Background

The main user-facing API (port 3333) already has a user reporting system where users can report other users for violations. This admin endpoint provides administrators with the ability to view, filter, and manage these reports through the admin panel (port 3001).

### Existing Infrastructure

- **Database Table:** `user_reports` (already exists in the database)
- **User API Endpoints:** Already implemented in the main codebase (port 3333)
- **Current Reports:** 2 pending reports in the database awaiting admin review

---

## Implementation Details

### Files Created/Modified

#### 1. **Entity** - `/src/modules/user/entities/user-report.entity.ts`
```typescript
@Entity('user_reports')
export class UserReport {
  id: number;
  reported_user_id: string;
  reporter_id: string;
  reason: string;
  description: string;
  status: UserReportStatus; // pending, reviewed, resolved, dismissed
  metadata: any;
  reviewed_by: string;
  review_notes: string;
  reviewed_at: Date;
  created_at: Date;
  updated_at: Date;

  // Relations
  reported_user: User;
  reporter: User;
}
```

#### 2. **DTOs** - `/src/modules/user/dto/user-report-response.dto.ts`
- `UserReportResponseDto` - Individual report response
- `UserReportUserDto` - Sanitized user information
- `UserReportsListResponseDto` - Paginated list response

#### 3. **Service Method** - `/src/modules/user/user.service.ts`
```typescript
async getUserReports(
  page = 1,
  limit = 20,
  status?: string,
  reason?: string,
): Promise<UserReportsListResponseDto>
```

#### 4. **Controller Endpoint** - `/src/modules/user/user.controller.ts`
```typescript
@Get('reports')
@UseGuards(AdminGuard)
@ApiBearerAuth('JWT-auth')
async getUserReports(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('status') status?: string,
  @Query('reason') reason?: string,
)
```

#### 5. **Module Update** - `/src/modules/user/user.module.ts`
- Added `UserReport` entity to TypeORM imports

---

## API Endpoint Documentation

### **GET `/user/reports`**

View all user reports with full details including reporter and reported user information.

#### **Authentication**
- **Required:** Yes (Admin JWT Bearer token)
- **Guard:** `AdminGuard`

#### **Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 20 | Number of results per page |
| `status` | string | No | - | Filter by status (pending, reviewed, resolved, dismissed) |
| `reason` | string | No | - | Filter by reason (harassment, spam, etc.) |

#### **Response Format**

```json
{
  "code": 1,
  "message": "User reports retrieved successfully",
  "data": {
    "reports": [
      {
        "id": 2,
        "reported_user_id": "85254985-6395-4667-ba60-22fa4edf940e",
        "reporter_id": "9fa6e3b0-504a-48ab-9642-0b742055bdb3",
        "reason": "harassment",
        "description": "This is a test report...",
        "status": "pending",
        "metadata": null,
        "created_at": "2025-10-27T18:03:55.000Z",
        "updated_at": "2025-10-27T18:03:55.000Z",
        "reviewed_by": null,
        "review_notes": null,
        "reviewed_at": null,
        "reported_user": {
          "id": "85254985-6395-4667-ba60-22fa4edf940e",
          "full_name": "John Doe",
          "user_name": "johndoe",
          "email": "john@example.com",
          "profile_image": "https://example.com/image.jpg"
        },
        "reporter": {
          "id": "9fa6e3b0-504a-48ab-9642-0b742055bdb3",
          "full_name": "Jane Smith",
          "user_name": "janesmith",
          "email": "jane@example.com",
          "profile_image": "https://example.com/image2.jpg"
        }
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

#### **Status Codes**

| Code | Description |
|------|-------------|
| 200 | Success - Reports retrieved |
| 401 | Unauthorized - Invalid or missing admin token |
| 500 | Server Error |

---

## Usage Examples

### 1. **Get All Pending Reports**

```bash
curl -X GET "http://localhost:3001/user/reports?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 2. **Filter by Reason**

```bash
curl -X GET "http://localhost:3001/user/reports?reason=harassment" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 3. **Paginated Results**

```bash
curl -X GET "http://localhost:3001/user/reports?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 4. **JavaScript/Axios Example**

```javascript
const axios = require('axios');

const getReports = async () => {
  try {
    const response = await axios.get('http://localhost:3001/user/reports', {
      params: {
        page: 1,
        limit: 20,
        status: 'pending'
      },
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    console.log(`Total reports: ${response.data.data.total}`);
    console.log('Reports:', response.data.data.reports);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

getReports();
```

---

## Database Schema

### Table: `user_reports`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK, Auto-increment) | Unique report ID |
| `reported_user_id` | VARCHAR(36) | UUID of user being reported |
| `reporter_id` | VARCHAR(36) | UUID of user making the report |
| `reason` | VARCHAR(100) | Reason for report (harassment, spam, etc.) |
| `description` | TEXT | Detailed description from reporter |
| `status` | ENUM | pending, reviewed, resolved, dismissed |
| `metadata` | JSON | Additional context (screenshots, links, etc.) |
| `reviewed_by` | VARCHAR(36) | Admin UUID who reviewed the report |
| `review_notes` | TEXT | Admin notes about the review |
| `reviewed_at` | TIMESTAMP | When the report was reviewed |
| `created_at` | TIMESTAMP | When report was created |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Constraint: `(reported_user_id, reporter_id)` - Prevents duplicate reports
- Index on `status` - For filtering
- Index on `created_at` - For sorting

**Foreign Keys:**
- `reported_user_id` → `users.id` (ON DELETE CASCADE)
- `reporter_id` → `users.id` (ON DELETE CASCADE)

---

## Report Statuses

| Status | Description | Use Case |
|--------|-------------|----------|
| `pending` | Initial state when report is submitted | Awaiting admin review |
| `reviewed` | Admin has viewed the report | Under investigation |
| `resolved` | Action taken, issue addressed | User warned/suspended, content removed |
| `dismissed` | Report found invalid or unsubstantiated | No violation found |

---

## Common Report Reasons

Based on the existing user API implementation:

- `harassment` - Harassment or bullying behavior
- `spam` - Spam or unwanted promotional content
- `inappropriate_content` - Inappropriate or offensive content
- `fake_account` - Suspected fake or impersonation account
- `impersonation` - Impersonating another person
- `scam` - Scam or fraudulent activity
- `safety_concerns` - Safety or security concerns
- `other` - Other violations

---

## Data Flow

```
1. User A reports User B (via main API on port 3333)
   ↓
2. Report saved to `user_reports` table with status='pending'
   ↓
3. Admin views reports via GET /user/reports (admin API on port 3001)
   ↓
4. Admin reviews report and takes action
   ↓
5. Admin updates report status (future endpoint: PATCH /user/reports/:id/status)
```

---

## Current Database State

As of implementation:
- **Total Reports:** 2
- **Pending Reports:** 2
- **Reviewed Reports:** 0
- **Resolved Reports:** 0
- **Dismissed Reports:** 0

### Sample Reports in Database:

**Report #1:**
- Reported User: `ca0dbf61-b39a-46fa-9b40-0fb2c97813bf`
- Reason: `Spam`
- Status: `pending`
- Created: September 26, 2025

**Report #2:**
- Reported User: `85254985-6395-4667-ba60-22fa4edf940e`
- Reason: `harassment`
- Status: `pending`
- Created: October 27, 2025

---

## Security Features

✅ **Admin Authentication Required** - All endpoints protected by `AdminGuard`
✅ **Sensitive Data Filtering** - Passwords, OTPs, social IDs excluded from responses
✅ **Role-Based Access** - Only users with admin role can access
✅ **Input Validation** - Query parameters validated and sanitized
✅ **Pagination** - Prevents loading too much data at once

---

## Testing

### Manual Testing Steps

1. **Start the Server**
   ```bash
   npm run start:dev
   ```

2. **Login as Admin** (Get JWT Token)
   ```bash
   curl -X POST http://localhost:3001/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"your_password"}'
   ```

3. **Test the Reports Endpoint**
   ```bash
   curl -X GET "http://localhost:3001/user/reports?page=1&limit=20" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Test Filtering**
   ```bash
   # By status
   curl -X GET "http://localhost:3001/user/reports?status=pending" \
     -H "Authorization: Bearer YOUR_TOKEN"

   # By reason
   curl -X GET "http://localhost:3001/user/reports?reason=harassment" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Expected Results

- **200 OK** with list of reports
- Each report includes full user details for both reporter and reported user
- Pagination metadata included (total, page, limit, total_pages)
- Sensitive user data (passwords, OTPs) excluded

---

## API Documentation

The endpoint is fully documented in Swagger/OpenAPI:

**Access Swagger UI:**
```
http://localhost:3001/api/docs
```

Navigate to **"Admin - Users"** section to find the `/user/reports` endpoint with:
- Full parameter descriptions
- Request/response examples
- Authentication requirements
- Filter options

---

## Future Enhancements

### Recommended Additional Endpoints

1. **PATCH `/user/reports/:reportId/status`**
   - Update report status and add review notes
   - Record admin who reviewed it

2. **GET `/user/reports/stats`**
   - Overall statistics (total by status, trending reasons)
   - Reports by time period (last 7/30 days)

3. **GET `/user/reports/pending`**
   - Quick access to only pending reports
   - Optimized for review workflow

4. **GET `/user/:userId/reports`**
   - All reports filed against a specific user
   - Useful for identifying problematic accounts

5. **GET `/user/reports/most-reported`**
   - Users with the most reports
   - Sorted by report count

---

## Troubleshooting

### Common Issues

**1. 401 Unauthorized**
- Ensure you're using a valid admin JWT token
- Check that the token hasn't expired
- Verify the user has admin role

**2. Empty Results**
- Check database has reports: `SELECT COUNT(*) FROM user_reports;`
- Verify filter parameters are correct
- Try without filters to see all reports

**3. Server Won't Start**
- Check port 3001 is not already in use: `lsof -i :3001`
- Kill existing processes: `pkill -f "nest start"`
- Check for TypeScript compilation errors

---

## Related Documentation

- **Main API User Reporting:** See `USER_REPORTING_SYSTEM_DOCUMENTATION.md` (port 3333)
- **Admin Authentication:** See admin module documentation
- **Database Schema:** See `USER_REPORTING_SYSTEM_ARCHITECTURE_ANALYSIS.md`

---

## Support

For issues or questions:
1. Check the Swagger documentation at `/api/docs`
2. Review server logs for error details
3. Verify database connectivity and table structure
4. Ensure all dependencies are installed: `npm install`

---

**Last Updated:** October 27, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
