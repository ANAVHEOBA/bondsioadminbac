# Missing Bonds Admin Endpoints

This document outlines the missing admin endpoints for the Bonds module that should be implemented to match the functionality of the Activity module.

---

## 📊 Current Status

- **Existing Endpoints**: 11
- **Missing Endpoints**: 9
- **Completion**: ~55%

---

## ❌ Missing Endpoints

### 1. Single Bond Management

#### **GET** `/bonds/admin/:id`
Get detailed information about a specific bond (admin view).

**Parameters:**
- `id` (path, number) - Bond ID

**Response:**
```json
{
  "code": 1,
  "message": "Bond retrieved successfully",
  "data": {
    "id": 1,
    "name": "Tech Enthusiasts",
    "city": "New York",
    "description": "...",
    "creator": {...},
    "member_count": 150,
    "likes_count": 45,
    "view_count": 1200,
    "is_trending": false,
    "is_public": true,
    "created_at": "2024-01-15T10:30:00Z",
    "lastMembers": [...],
    "userInterests": [...],
    "recentActivities": [...]
  }
}
```

---

#### **PATCH** `/bonds/admin/:id`
Update bond details (name, description, settings, etc.).

**Parameters:**
- `id` (path, number) - Bond ID

**Request Body:**
```json
{
  "name": "Updated Bond Name",
  "description": "Updated description",
  "city": "Updated City",
  "max_members": 200,
  "is_unlimited_members": false,
  "request_to_join": true,
  "is_public": true,
  "post_to_story": true,
  "rules": "Updated rules..."
}
```

**Response:**
```json
{
  "code": 1,
  "message": "Bond updated successfully",
  "data": {...}
}
```

---

#### **DELETE** `/bonds/admin/:id`
Permanently delete a bond from the system.

**Parameters:**
- `id` (path, number) - Bond ID

**Response:**
```json
{
  "code": 1,
  "message": "Bond deleted permanently"
}
```

---

### 2. Bond Visibility Control

#### **PATCH** `/bonds/admin/:id/hide`
Hide a bond from public view (soft delete).

**Parameters:**
- `id` (path, number) - Bond ID

**Response:**
```json
{
  "code": 1,
  "message": "Bond hidden successfully"
}
```

**Implementation Notes:**
- Sets `metadata.hidden_at` to current timestamp
- Hidden bonds should not appear in public listings
- Can be reversed with unhide endpoint

---

#### **PATCH** `/bonds/admin/:id/unhide`
Restore a previously hidden bond.

**Parameters:**
- `id` (path, number) - Bond ID

**Response:**
```json
{
  "code": 1,
  "message": "Bond unhidden successfully"
}
```

**Implementation Notes:**
- Removes `metadata.hidden_at` from bond
- Bond becomes visible in public listings again

---

#### **PATCH** `/bonds/admin/:id/toggle-trending`
Toggle the trending status of a bond.

**Parameters:**
- `id` (path, number) - Bond ID

**Response:**
```json
{
  "code": 1,
  "message": "Bond trending status toggled",
  "data": {
    "id": 1,
    "is_trending": true
  }
}
```

**Implementation Notes:**
- Flips the `is_trending` boolean field
- Trending bonds appear in `/bonds/admin/trending` endpoint
- Used for manual curation of trending content

---

### 3. Member Management

#### **GET** `/bonds/admin/:id/members`
Get detailed list of all members in a bond with pagination.

**Parameters:**
- `id` (path, number) - Bond ID
- `page` (query, number, optional) - Page number (default: 1)
- `limit` (query, number, optional) - Items per page (default: 20)

**Response:**
```json
{
  "code": 1,
  "message": "Bond members retrieved successfully",
  "data": {
    "members": [
      {
        "id": "user-uuid-1",
        "full_name": "John Doe",
        "user_name": "johndoe",
        "email": "john@example.com",
        "profile_image": "https://...",
        "joined_at": "2024-01-20T14:30:00Z",
        "is_co_organizer": false
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

**Implementation Notes:**
- Include co-organizer status for each member
- Show when each member joined
- Useful for admin oversight and moderation

---

### 4. Enhanced Report Endpoints

#### **GET** `/bonds/admin/reports/stats`
Get overall statistics about bond reports.

**Query Parameters:**
None

**Response:**
```json
{
  "code": 1,
  "message": "Report statistics retrieved successfully",
  "data": {
    "total_reports": 125,
    "pending_reports": 23,
    "reviewed_reports": 87,
    "resolved_reports": 10,
    "dismissed_reports": 5,
    "reports_last_24h": 5,
    "reports_last_7d": 18,
    "reports_last_30d": 45,
    "most_reported_bond": {
      "bond_id": 42,
      "name": "Controversial Bond",
      "report_count": 12
    },
    "most_common_reason": "spam"
  }
}
```

**Implementation Notes:**
- Provides dashboard-level overview
- Helps admins prioritize moderation work
- Should be cached for performance

---

#### **GET** `/bonds/admin/reports/pending`
Quick access to pending reports only (for fast review workflow).

**Query Parameters:**
- `page` (query, number, optional) - Page number (default: 1)
- `limit` (query, number, optional) - Items per page (default: 20)
- `sort_by` (query, string, optional) - Sort field: `created_at`, `bond_id` (default: `created_at`)
- `sort_order` (query, string, optional) - Sort order: `ASC`, `DESC` (default: `DESC`)

**Response:**
```json
{
  "code": 1,
  "message": "Pending reports retrieved successfully",
  "data": {
    "reports": [
      {
        "id": 123,
        "bond_id": 42,
        "bond_name": "Test Bond",
        "reporter_id": "user-uuid",
        "reporter_name": "Jane Smith",
        "reason": "inappropriate_content",
        "description": "Contains offensive material",
        "created_at": "2024-10-14T12:00:00Z",
        "status": "pending"
      }
    ],
    "total": 23,
    "page": 1,
    "limit": 20,
    "total_pages": 2
  }
}
```

**Implementation Notes:**
- Filter to only show `status = 'pending'`
- Most recent reports first by default
- Include bond and reporter info for context
- Streamlines admin review workflow

---

## 📋 Implementation Checklist

### DTOs to Create/Update
- [ ] `update-bond.dto.ts` - Currently empty, needs full definition
- [ ] `bond-member-response.dto.ts` - For member list endpoint
- [ ] `report-stats.dto.ts` - For report statistics
- [ ] `pending-reports-response.dto.ts` - For pending reports list

### Service Methods to Add (`bonds.service.ts`)
- [ ] `findOneAdmin(id: number)` - Get single bond with admin context
- [ ] `updateBond(id: number, updateDto: UpdateBondDto)` - Update bond details
- [ ] `deleteBond(id: number)` - Permanently delete bond
- [ ] `hideBond(id: number)` - Hide bond (soft delete)
- [ ] `unhideBond(id: number)` - Unhide bond
- [ ] `toggleTrending(id: number)` - Toggle trending status
- [ ] `getBondMembers(id: number, page, limit)` - Get member list
- [ ] `getReportStats()` - Get report statistics
- [ ] `getPendingReports(page, limit, sortBy, sortOrder)` - Get pending reports

### Controller Endpoints to Add (`bonds.controller.ts`)
- [ ] `GET /bonds/admin/:id`
- [ ] `PATCH /bonds/admin/:id`
- [ ] `DELETE /bonds/admin/:id`
- [ ] `PATCH /bonds/admin/:id/hide`
- [ ] `PATCH /bonds/admin/:id/unhide`
- [ ] `PATCH /bonds/admin/:id/toggle-trending`
- [ ] `GET /bonds/admin/:id/members`
- [ ] `GET /bonds/admin/reports/stats`
- [ ] `GET /bonds/admin/reports/pending`

---

## 🎯 Priority Order

### **High Priority** (Core CRUD + Moderation)
1. GET `/bonds/admin/:id` - View single bond
2. PATCH `/bonds/admin/:id` - Update bond
3. DELETE `/bonds/admin/:id` - Delete bond
4. PATCH `/bonds/admin/:id/hide` - Hide bond
5. PATCH `/bonds/admin/:id/unhide` - Unhide bond

### **Medium Priority** (Enhanced Features)
6. GET `/bonds/admin/:id/members` - View members
7. GET `/bonds/admin/reports/pending` - Quick report access
8. PATCH `/bonds/admin/:id/toggle-trending` - Manage trending

### **Low Priority** (Nice to Have)
9. GET `/bonds/admin/reports/stats` - Report statistics dashboard

---

## 📝 Additional Notes

### Consistency with Activity Module
The activity module already has all these endpoints implemented. The bonds module should follow the same:
- Response structure patterns
- Error handling approach
- Swagger documentation style
- Authorization guards
- Caching strategy

### Database Considerations
- Ensure `metadata` column exists on `bonds` table (JSON type) for `hidden_at`
- May need to add indexes for frequently queried fields
- Consider cascading deletes for bond relationships

### Testing Requirements
Each endpoint should have:
- Unit tests for service methods
- Integration tests for controller endpoints
- Authorization tests (admin-only access)
- Edge cases (non-existent bond, invalid data, etc.)

---

## 🔄 Related Existing Endpoints

These endpoints already exist and work well:
- ✅ `GET /bonds/admin/stats` - Bond statistics
- ✅ `GET /bonds/admin/analytics` - Detailed analytics
- ✅ `GET /bonds/admin/search` - Advanced search
- ✅ `GET /bonds/admin/list` - Enhanced list/filter
- ✅ `GET /bonds/admin/trending` - Trending bonds
- ✅ `GET /bonds/admin/all` - All bonds
- ✅ `GET /bonds/admin/reported-bonds` - Bonds with reports
- ✅ `GET /bonds/admin/reports/:bondId` - Reports for specific bond
- ✅ `PATCH /bonds/admin/reports/:reportId` - Review report
- ✅ `GET /bonds/admin/by-creator/:userId` - Bonds by creator
- ✅ `GET /bonds/admin/creators/top` - Top creators

---

**Generated on:** October 15, 2025  
**Status:** Ready for implementation  
**Estimated Development Time:** 4-6 hours
