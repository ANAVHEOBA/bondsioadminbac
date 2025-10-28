# User Reporting System - Architecture Analysis & Design Guide

## Executive Summary

This is a **comprehensive architectural analysis** of the BondsIO Admin backend to help design a **User Reporting System** where users can report other users for violations, and admins can review and manage those reports.

The project is a **NestJS-based admin API** with strong patterns already established for reporting activities and bonds. We'll leverage these existing patterns to create a user reporting system.

---

## 1. Overall Project Structure

### 1.1 Technology Stack
- **Framework**: NestJS 11.0 (TypeScript)
- **Database**: MySQL with TypeORM
- **Authentication**: JWT (Bearer token)
- **Documentation**: Swagger (OpenAPI)
- **Caching**: Cache Manager
- **Email**: Zeptomail API

### 1.2 Directory Layout
```
src/
├── modules/
│   ├── user/                    # User management (admin endpoints)
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.module.ts
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── notification-preferences.entity.ts
│   │   │   └── country.entity.ts
│   │   ├── dto/
│   │   │   ├── find-all-users.dto.ts
│   │   │   ├── user-response.dto.ts
│   │   │   └── pagination.dto.ts
│   │   └── guards/
│   │       └── view-user/
│   │
│   ├── activity/                # Activity reporting (EXISTING PATTERN)
│   │   ├── activity.controller.ts
│   │   ├── activity.service.ts
│   │   ├── activity.module.ts
│   │   ├── entities/
│   │   │   ├── activity.entity.ts
│   │   │   └── activity-report.entity.ts  ← REFERENCE THIS
│   │   └── dto/
│   │       ├── report-activity.dto.ts     ← REFERENCE THIS
│   │       ├── report-stats.dto.ts        ← REFERENCE THIS
│   │       └── update-report-status.dto.ts
│   │
│   ├── bonds/                   # Bond reporting (EXISTING PATTERN)
│   │   ├── bonds.controller.ts
│   │   ├── bonds.service.ts
│   │   ├── bonds.module.ts
│   │   ├── entities/
│   │   │   ├── bond.entity.ts
│   │   │   └── bond-report.entity.ts      ← REFERENCE THIS
│   │   └── dto/
│   │       └── report-bond.dto.ts         ← REFERENCE THIS
│   │
│   ├── admin/                   # Admin authentication & authorization
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   ├── admin.module.ts
│   │   ├── guards/
│   │   │   └── admin/
│   │   │       └── admin.guard.ts         ← AUTH GUARD PATTERN
│   │   ├── decorators/
│   │   └── entities/
│   │       └── admin.entity.ts
│   │
│   ├── country/
│   ├── follows/
│   └── user-interests/
│
├── app.module.ts                # Root module (imports all feature modules)
└── main.ts                      # Bootstrap & Swagger setup
```

### 1.3 Module Imports & Dependencies
- All feature modules import `AdminModule` for authentication
- Modules use `TypeOrmModule.forFeature([Entity])` to inject repositories
- Caching is centralized via `CacheModule`
- JWT is configured globally

---

## 2. Routes/Endpoints Organization

### 2.1 Admin Endpoints Structure
All admin endpoints use the `AdminGuard` which checks:
1. Valid JWT token (Bearer auth)
2. Role is `admin` or `super_admin`
3. Admin account is active

**Endpoint Pattern**: All admin endpoints follow this structure:
```typescript
@Controller('resource')
@UseGuards(AdminGuard)
@ApiBearerAuth('JWT-auth')
export class ResourceController {
  // endpoints here
}
```

### 2.2 Activity Reporting Endpoints (REFERENCE)
```
GET    /admin/activity/list                    List all activities
GET    /admin/activity/reports                 List all activity reports
GET    /admin/activity/reports/stats           Get report statistics
GET    /admin/activity/reports/pending         Get pending reports only
PATCH  /admin/activity/reports/:reportId/status Update report status + notes
GET    /admin/activity/by-creator/:userId      Get activities by creator
GET    /admin/activity/creators/top            Get top activity creators
GET    /admin/activity/:id/participants        Get activity participants
```

### 2.3 Bond Reporting Endpoints (REFERENCE)
```
GET    /bonds/admin/list                       List all bonds
GET    /bonds/admin/reports/:bondId            Get reports for a bond
GET    /bonds/admin/reported-bonds             List bonds with reports
GET    /bonds/admin/reports/stats              Get report statistics
GET    /bonds/admin/reports/pending            Get pending reports
PATCH  /bonds/admin/reports/:reportId          Review/update report status
GET    /bonds/admin/by-creator/:userId         Get bonds by creator
GET    /bonds/admin/creators/top               Get top bond creators
```

### 2.4 User Endpoints (ADMIN ONLY)
```
GET    /user                                   List all users (paginated)
GET    /user/analytics/overview                User analytics
GET    /user/analytics/demography              User demography
```

---

## 3. Controllers & Services Architecture

### 3.1 Controller Pattern
**Location**: `src/modules/{feature}/{feature}.controller.ts`

**Structure**:
```typescript
@ApiTags('Admin – Resource')
@ApiBearerAuth('JWT-auth')
@UseGuards(AdminGuard)
@Controller('admin/resource')
export class ResourceController {
  constructor(private readonly service: ResourceService) {}
  
  // List endpoint
  @Get('list')
  @ApiOperation({ summary: 'Admin: list/filter all resources' })
  async list(@Query() dto: FilterDto) {
    const { items, total } = await this.service.findAll(dto);
    return { code: 1, message: 'Resources retrieved', data: { items, total } };
  }
  
  // Reports endpoints
  @Get('reports/pending')
  @ApiOperation({ summary: 'Admin: get pending reports' })
  async getPendingReports(@Query() q: { page?: number; limit?: number }) {
    const { reports, total } = await this.service.getPendingReports(q.page, q.limit);
    return { code: 1, message: 'Pending reports retrieved', data: { reports, total } };
  }
  
  // Review endpoint
  @Patch('reports/:reportId/status')
  @ApiOperation({ summary: 'Admin: update report status' })
  async updateReportStatus(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() updateDto: UpdateReportStatusDto
  ) {
    const updated = await this.service.reviewReport(reportId, adminId, updateDto.status, updateDto.notes);
    return { code: 1, message: 'Report updated', data: updated };
  }
}
```

### 3.2 Service Pattern
**Location**: `src/modules/{feature}/{feature}.service.ts`

**Structure**:
```typescript
@Injectable()
export class ResourceService {
  constructor(
    @InjectRepository(Resource) private readonly repo: Repository<Resource>,
    @InjectRepository(Report) private readonly reportRepo: Repository<Report>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}
  
  // Core methods
  async findAll(filterDto: FilterDto): Promise<{ items: any[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['creator', 'reports']
    });
    return { items, total };
  }
  
  // Report methods
  async getPendingReports(page = 1, limit = 20) {
    const [reports, total] = await this.reportRepo.findAndCount({
      where: { status: ReportStatus.PENDING },
      relations: ['resource', 'reporter'],
      skip: (page - 1) * limit,
      take: limit
    });
    return { reports, total };
  }
  
  async reviewReport(
    reportId: number,
    reviewerId: string,
    status: ReportStatus,
    notes?: string
  ): Promise<Report> {
    await this.reportRepo.update(reportId, {
      status,
      review_notes: notes ?? null,
      reviewed_by: reviewerId,
      reviewed_at: new Date()
    });
    return this.reportRepo.findOneOrFail({
      where: { id: reportId },
      relations: ['resource', 'reporter']
    });
  }
  
  // Statistics
  async getReportStats(): Promise<ReportStatsDto> {
    const [total, pending, reviewed, resolved, dismissed] = await Promise.all([
      this.reportRepo.count(),
      this.reportRepo.count({ where: { status: ReportStatus.PENDING } }),
      this.reportRepo.count({ where: { status: ReportStatus.REVIEWED } }),
      this.reportRepo.count({ where: { status: ReportStatus.RESOLVED } }),
      this.reportRepo.count({ where: { status: ReportStatus.DISMISSED } })
    ]);
    return { total_reports: total, pending_reports: pending, ... };
  }
}
```

### 3.3 Response Pattern
All endpoints return a consistent response wrapper:
```typescript
{
  code: 1,                           // 1 = success, 0 = error
  message: 'Description of action',
  data: {                            // Payload (varies)
    items: [...],
    total: 100,
    pagination: { ... }
  }
}
```

---

## 4. Authentication & Authorization Architecture

### 4.1 Authentication Flow

#### Admin Login
```
POST /admin/login
Body: { email, password }
├─> AdminService.validateAdmin()
│   └─> Verify password
├─> JwtService.sign({ sub: admin.id, role: admin.role })
└─> Return { access_token, admin }
```

#### Using JWT Token
```
All admin endpoints require:
Authorization: Bearer <jwt_token>

AdminGuard validates:
1. Token exists
2. Token is valid
3. payload.role in ['admin', 'super_admin']
4. Admin account is active
5. Sets request.admin = admin object
```

### 4.2 AdminGuard Implementation
**Location**: `src/modules/admin/guards/admin/admin.guard.ts`

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.substring(7);
    
    if (!token) throw new UnauthorizedException('No token provided');
    
    const payload = this.jwtService.verify(token);
    
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      throw new UnauthorizedException('Insufficient permissions');
    }
    
    const admin = await this.adminService.findById(payload.sub);
    if (!admin.isActive) throw new UnauthorizedException('Admin deactivated');
    
    request.admin = admin;  // Available in controller via @AdminUser() or request.admin
    return true;
  }
}
```

### 4.3 Getting Current Admin in Controller
```typescript
// Method 1: Using @AdminUser() decorator
@Patch('reports/:reportId/status')
async updateReportStatus(
  @AdminUser() admin: Admin,
  @Body() dto: UpdateDto
) {
  // admin.id = current admin ID
}

// Method 2: Manually from request
async updateReportStatus(@Req() request: Request, @Body() dto: UpdateDto) {
  const admin = request.admin;  // Set by AdminGuard
}

// Method 3: Hardcoded (CURRENT PATTERN IN PROJECT - NOT RECOMMENDED)
const adminId = 'fdb74f12-92ca-11f0-a7b4-a2aa00234146'; // TODO: Extract from JWT
```

---

## 5. Database Models & Entity Structure

### 5.1 User Entity
**Location**: `src/modules/user/entities/user.entity.ts`

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'varchar', length: 255 })
  full_name: string;
  
  @Column({ type: 'varchar', length: 255, unique: true })
  user_name: string;
  
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;
  
  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;
  
  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_image: string;
  
  @Column({ type: 'text', nullable: true })
  bio: string;
  
  @Column({ type: 'varchar', length: 50, nullable: true })
  gender: string;
  
  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  role: 'user' | 'admin';
  
  @Column({ type: 'boolean', default: false })
  email_verified: boolean;
  
  @Column({ type: 'boolean', default: false })
  phone_verified: boolean;
  
  @Column({ type: 'boolean', default: false })
  deleted_at: Date | null;
  
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
  
  /* Relations */
  @OneToMany(() => Bond, (bond) => bond.creator)
  created_bonds: Bond[];
  
  @ManyToMany(() => Bond, (bond) => bond.users)
  bonds: Bond[];
  
  @ManyToMany(() => Activity)
  liked_activities: Activity[];
  
  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({ name: 'follows' })
  following: User[];
  
  @ManyToMany(() => User, (user) => user.following)
  followers: User[];
}
```

### 5.2 Activity Report Entity (REFERENCE PATTERN)
**Location**: `src/modules/activity/entities/activity-report.entity.ts`

```typescript
export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  FALSE_INFORMATION = 'false_information',
  SAFETY_CONCERNS = 'safety_concerns',
  OTHER = 'other'
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

@Entity('activity_reports')
@Index(['activity_id', 'reporter_id'], { unique: true })
export class ActivityReport {
  @PrimaryGeneratedColumn('increment')
  id: number;
  
  @Column({ type: 'int' })
  activity_id: number;
  
  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;
  
  @Column({ type: 'uuid' })
  reporter_id: string;
  
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;
  
  @Column({ type: 'enum', enum: ReportReason, nullable: false })
  reason: ReportReason;
  
  @Column({ type: 'text', nullable: true })
  description: string;
  
  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;
  
  @Column({ type: 'json', nullable: true })
  metadata: any;  // screenshots, links, etc.
  
  @CreateDateColumn()
  created_at: Date;
  
  @UpdateDateColumn()
  updated_at: Date;
  
  @Column({ type: 'uuid', nullable: true })
  reviewed_by: string;
  
  @Column({ type: 'text', nullable: true })
  review_notes: string | null;
  
  @Column({ type: 'datetime', nullable: true })
  reviewed_at: Date;
}
```

### 5.3 Bond Report Entity (REFERENCE PATTERN)
**Location**: `src/modules/bonds/entities/bond-report.entity.ts`

- **Same structure** as ActivityReport
- Uses `bond_id` instead of `activity_id`
- Same ReportReason and ReportStatus enums
- Unique index on `[bond_id, reporter_id]`

---

## 6. Existing Admin Endpoints for Viewing Lists

### 6.1 User List Endpoint
```
GET /user
Query: page, limit, search, email_verified, phone_verified, notification

Response:
{
  code: 1,
  message: 'Users retrieved successfully',
  data: {
    users: [UserResponseDto, ...],
    pagination: {
      page, limit, total, totalPages, hasNextPage, hasPreviousPage
    }
  }
}
```

### 6.2 Activity List Endpoint
```
GET /admin/activity/list
Query: page, limit, title, location, is_public, visibility, trending, interest_ids

Response:
{
  code: 1,
  message: 'Activities retrieved (admin)',
  data: {
    activities: [ActivityResponseDto, ...],
    total: number
  }
}
```

### 6.3 Bond List Endpoint
```
GET /bonds/admin/list
Query: page, limit, name, created_by, is_public, status, etc.

Response:
{
  code: 1,
  message: 'Bonds list retrieved successfully',
  data: {
    bonds: [BondResponseDto, ...],
    total: number
  }
}
```

### 6.4 Report List Endpoints (Pattern)
```
GET /admin/activity/reports
GET /admin/activity/reports/pending
GET /bonds/admin/reports/:bondId
GET /bonds/admin/reports/pending

Response:
{
  code: 1,
  message: 'Reports retrieved',
  data: {
    reports: [ReportResponseDto, ...],
    total: number
  }
}
```

---

## 7. Existing Reporting Features

### 7.1 Activity Reporting
- **Report Entity**: `ActivityReport` (int id, enum reason, enum status)
- **Unique Constraint**: One report per user per activity
- **Reasons**: INAPPROPRIATE_CONTENT, SPAM, HARASSMENT, FALSE_INFORMATION, SAFETY_CONCERNS, OTHER
- **Statuses**: PENDING, REVIEWED, RESOLVED, DISMISSED
- **Admin Operations**:
  - List all reports
  - Filter pending reports
  - Get statistics (by status, by reason, trends)
  - Review & update status with notes
- **Fields**: id, activity_id, reporter_id, reason, description, status, metadata, created_at, updated_at, reviewed_by, review_notes, reviewed_at

### 7.2 Bond Reporting
- **Report Entity**: `BondReport` (identical structure to ActivityReport)
- **Unique Constraint**: One report per user per bond
- **Same reasons and statuses as activity**
- **Admin Operations**: List, filter, review, statistics
- **Fields**: Same as ActivityReport (just bond_id instead of activity_id)

### 7.3 Report DTOs Pattern
```typescript
// Request DTOs
export class ReportActivityDto {
  @IsNotEmpty() @IsString()
  reason: string;  // Can be enum value or free text
  
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;
  
  @IsOptional()
  metadata?: any;  // Screenshots, links, etc.
}

export class ReportActivityFormDto extends ReportActivityDto {
  @IsOptional()
  screenshots?: Express.Multer.File[];
}

// Response DTO
export class ReportResponseDto {
  @Expose() id: number;
  @Expose() activity_id: number;
  @Expose() reporter_id: string;
  @Expose() reason: string;
  @Expose() description?: string;
  @Expose() status: ReportStatus;
  @Expose() created_at: Date;
  @Expose() review_notes?: string;
  @Expose() reviewed_at?: Date;
}

// Status Update DTO
export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;
  
  @IsOptional() @IsString()
  notes?: string;
}
```

### 7.4 Report Statistics
```typescript
export class ReportStatsDto {
  total_reports: number;
  pending_reports: number;
  reviewed_reports: number;
  resolved_reports: number;
  dismissed_reports: number;
  reports_last_24h: number;
  reports_last_7d: number;
  reports_last_30d: number;
  avg_resolution_time_hours: number;
  reports_by_reason: ReportByReasonDto[];
  reports_by_status: ReportByStatusDto[];
  report_trends: ReportTrendsDto[];
  most_reported_activity_id: number | null;
  most_reported_activity_count: number;
  unique_reporters: number;
  unique_reported_activities: number;
}
```

---

## 8. User Reporting System - Design Recommendations

### 8.1 Entity Design (Recommended)

#### UserReport Entity
```typescript
// src/modules/user/entities/user-report.entity.ts

export enum UserReportReason {
  INAPPROPRIATE_PROFILE = 'inappropriate_profile',
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  IMPERSONATION = 'impersonation',
  FAKE_ACCOUNT = 'fake_account',
  SCAM = 'scam',
  SAFETY_CONCERNS = 'safety_concerns',
  OTHER = 'other'
}

export enum UserReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

@Entity('user_reports')
@Index(['reported_user_id', 'reporter_id'], { unique: true })
@Index(['status'], {})
@Index(['created_at'], {})
export class UserReport {
  @PrimaryGeneratedColumn('increment')
  id: number;
  
  // The user being reported
  @Column({ type: 'uuid' })
  reported_user_id: string;
  
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_user_id' })
  reported_user: User;
  
  // The user making the report
  @Column({ type: 'uuid' })
  reporter_id: string;
  
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;
  
  // Report details
  @Column({ type: 'enum', enum: UserReportReason, nullable: false })
  reason: UserReportReason;
  
  @Column({ type: 'text', nullable: true })
  description: string;
  
  @Column({ type: 'enum', enum: UserReportStatus, default: UserReportStatus.PENDING })
  status: UserReportStatus;
  
  // Evidence/metadata
  @Column({ type: 'json', nullable: true })
  metadata: any;  // Can store: links to posts, screenshots, message IDs, etc.
  
  // Admin review fields
  @Column({ type: 'uuid', nullable: true })
  reviewed_by: string;
  
  @Column({ type: 'text', nullable: true })
  review_notes: string | null;
  
  @Column({ type: 'datetime', nullable: true })
  reviewed_at: Date;
  
  // Actions taken (optional)
  @Column({ type: 'varchar', length: 255, nullable: true })
  action_taken: string | null;  // e.g., 'user_suspended', 'user_warned', 'no_action'
  
  // Timestamps
  @CreateDateColumn()
  created_at: Date;
  
  @UpdateDateColumn()
  updated_at: Date;
}
```

### 8.2 DTO Design

```typescript
// src/modules/user/dto/report-user.dto.ts

export class ReportUserDto {
  @ApiProperty({
    description: 'Reason for reporting the user',
    enum: UserReportReason,
    example: UserReportReason.HARASSMENT
  })
  @IsNotEmpty()
  @IsEnum(UserReportReason)
  reason: UserReportReason;
  
  @ApiProperty({
    description: 'Additional details about the report',
    required: false,
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
  
  @ApiProperty({
    description: 'Links to evidence (posts, profiles, etc.)',
    required: false,
    example: { links: ['https://example.com/post/123'] }
  })
  @IsOptional()
  metadata?: any;
}

export class UserReportResponseDto {
  @Expose() id: number;
  @Expose() reported_user_id: string;
  @Expose() reporter_id: string;
  @Expose() reason: string;
  @Expose() description?: string;
  @Expose() status: UserReportStatus;
  @Expose() created_at: Date;
  @Expose() reviewed_by?: string;
  @Expose() review_notes?: string;
  @Expose() reviewed_at?: Date;
  @Expose() action_taken?: string;
  @Expose() @Type(() => UserResponseDto) reported_user?: UserResponseDto;
  @Expose() @Type(() => UserResponseDto) reporter?: UserResponseDto;
}

export class UpdateUserReportStatusDto {
  @ApiProperty({
    description: 'New status',
    enum: UserReportStatus,
    example: UserReportStatus.RESOLVED
  })
  @IsEnum(UserReportStatus)
  status: UserReportStatus;
  
  @ApiProperty({
    description: 'Admin review notes',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
  
  @ApiProperty({
    description: 'Action taken on the reported user',
    required: false,
    example: 'user_suspended'
  })
  @IsOptional()
  @IsString()
  action_taken?: string;
}

export class UserReportStatsDto {
  @Expose() total_reports: number;
  @Expose() pending_reports: number;
  @Expose() reviewed_reports: number;
  @Expose() resolved_reports: number;
  @Expose() dismissed_reports: number;
  @Expose() reports_by_reason: ReportByReasonDto[];
  @Expose() reports_by_status: ReportByStatusDto[];
  @Expose() most_reported_user_id: string | null;
  @Expose() most_reported_user_count: number;
  @Expose() unique_reporters: number;
  @Expose() unique_reported_users: number;
}
```

### 8.3 Controller Design

```typescript
// src/modules/user/user.controller.ts - ADD THESE ENDPOINTS

@Controller('user')
@UseGuards(AdminGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  // ... existing endpoints ...
  
  /* --------- REPORTS ENDPOINTS --------- */
  
  @Get('reports/stats')
  @ApiOperation({ summary: 'Admin: get user report statistics' })
  async getReportStats() {
    const stats = await this.userService.getUserReportStats();
    return {
      code: 1,
      message: 'User report statistics retrieved successfully',
      data: stats
    };
  }
  
  @Get('reports/pending')
  @ApiOperation({ summary: 'Admin: get pending user reports' })
  async getPendingReports(
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    const { reports, total } = await this.userService.getPendingUserReports(page, limit);
    return {
      code: 1,
      message: 'Pending user reports retrieved successfully',
      data: { reports, total }
    };
  }
  
  @Get('reports')
  @ApiOperation({ summary: 'Admin: list all user reports with filters' })
  async listAllReports(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: UserReportStatus,
    @Query('reason') reason?: UserReportReason
  ) {
    const { reports, total } = await this.userService.listUserReports(page, limit, status, reason);
    return {
      code: 1,
      message: 'User reports retrieved successfully',
      data: { reports, total }
    };
  }
  
  @Get('reports/:reportId')
  @ApiOperation({ summary: 'Admin: get detailed report information' })
  async getReportDetail(@Param('reportId', ParseIntPipe) reportId: number) {
    const report = await this.userService.getUserReportDetail(reportId);
    return {
      code: 1,
      message: 'Report retrieved successfully',
      data: report
    };
  }
  
  @Patch('reports/:reportId/status')
  @ApiOperation({ summary: 'Admin: update user report status and add review notes' })
  async updateReportStatus(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() updateDto: UpdateUserReportStatusDto,
    @AdminUser() admin: Admin
  ) {
    const updated = await this.userService.reviewUserReport(
      reportId,
      admin.id,
      updateDto.status,
      updateDto.notes,
      updateDto.action_taken
    );
    return {
      code: 1,
      message: 'Report status updated successfully',
      data: updated
    };
  }
  
  @Get('reported/:userId')
  @ApiOperation({ summary: 'Admin: get all reports against a specific user' })
  async getReportsForUser(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    const { reports, total, user_info } = await this.userService.getReportsForUser(userId, page, limit);
    return {
      code: 1,
      message: 'Reports for user retrieved successfully',
      data: { reports, total, user_info }
    };
  }
  
  @Get('most-reported')
  @ApiOperation({ summary: 'Admin: get most reported users' })
  async getMostReportedUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('days_back') daysBack = 30
  ) {
    const { users, total } = await this.userService.getMostReportedUsers(page, limit, daysBack);
    return {
      code: 1,
      message: 'Most reported users retrieved successfully',
      data: { users, total }
    };
  }
}
```

### 8.4 Service Design (Excerpt)

```typescript
// src/modules/user/user.service.ts - ADD THESE METHODS

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserReport) private readonly reportRepo: Repository<UserReport>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}
  
  /* --------- REPORT METHODS --------- */
  
  async getUserReportStats(): Promise<UserReportStatsDto> {
    const [total, pending, reviewed, resolved, dismissed] = await Promise.all([
      this.reportRepo.count(),
      this.reportRepo.count({ where: { status: UserReportStatus.PENDING } }),
      this.reportRepo.count({ where: { status: UserReportStatus.REVIEWED } }),
      this.reportRepo.count({ where: { status: UserReportStatus.RESOLVED } }),
      this.reportRepo.count({ where: { status: UserReportStatus.DISMISSED } })
    ]);
    
    // Get breakdown by reason
    const byReason = await this.reportRepo.query(`
      SELECT reason, COUNT(*) as count 
      FROM user_reports 
      GROUP BY reason
    `);
    
    return {
      total_reports: total,
      pending_reports: pending,
      reviewed_reports: reviewed,
      resolved_reports: resolved,
      dismissed_reports: dismissed,
      reports_by_reason: byReason.map(r => ({
        reason: r.reason,
        count: r.count,
        percentage: (r.count / total) * 100
      })),
      // ... more stats
    };
  }
  
  async getPendingUserReports(page = 1, limit = 20) {
    const [reports, total] = await this.reportRepo.findAndCount({
      where: { status: UserReportStatus.PENDING },
      relations: ['reported_user', 'reporter'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' }
    });
    
    return { 
      reports: plainToInstance(UserReportResponseDto, reports), 
      total 
    };
  }
  
  async reviewUserReport(
    reportId: number,
    adminId: string,
    status: UserReportStatus,
    notes?: string,
    action_taken?: string
  ): Promise<UserReport> {
    await this.reportRepo.update(reportId, {
      status,
      review_notes: notes ?? null,
      action_taken: action_taken ?? null,
      reviewed_by: adminId,
      reviewed_at: new Date()
    });
    
    // Clear cache
    await this.cacheManager.del('user:reports:stats');
    
    return this.reportRepo.findOneOrFail({
      where: { id: reportId },
      relations: ['reported_user', 'reporter']
    });
  }
  
  async getReportsForUser(userId: string, page = 1, limit = 20) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    const [reports, total] = await this.reportRepo.findAndCount({
      where: { reported_user_id: userId },
      relations: ['reporter'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' }
    });
    
    return {
      reports: plainToInstance(UserReportResponseDto, reports),
      total,
      user_info: toUserResponseDto(user)
    };
  }
}
```

### 8.5 Module Configuration

```typescript
// src/modules/user/user.module.ts - UPDATE

import { UserReport } from './entities/user-report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, NotificationPreferences, Country, UserReport]),
    AdminModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule]
})
export class UserModule {}
```

### 8.6 Database Migration Script

```sql
-- Migration: Create user_reports table

CREATE TABLE `user_reports` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `reported_user_id` varchar(36) NOT NULL,
  `reporter_id` varchar(36) NOT NULL,
  `reason` enum('inappropriate_profile', 'harassment', 'spam', 'impersonation', 'fake_account', 'scam', 'safety_concerns', 'other') NOT NULL,
  `description` longtext,
  `status` enum('pending', 'reviewed', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  `metadata` json,
  `reviewed_by` varchar(36),
  `review_notes` longtext,
  `action_taken` varchar(255),
  `reviewed_at` datetime,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY `uq_user_reports_reported_reporter` (`reported_user_id`, `reporter_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`reported_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 9. Key Patterns Summary

| Aspect | Pattern |
|--------|---------|
| **Controllers** | Decorated with `@UseGuards(AdminGuard)`, `@ApiBearerAuth('JWT-auth')` |
| **Response Format** | `{ code: 1, message: string, data: {...} }` |
| **Pagination** | `{ page, limit }` query params, response includes `total` |
| **Relations** | Use `relations: ['entity1', 'entity2']` in findAndCount |
| **Unique Constraints** | Prevent duplicate reports from same reporter for same resource |
| **Statuses** | Enum: PENDING, REVIEWED, RESOLVED, DISMISSED |
| **Review Fields** | `reviewed_by` (admin ID), `review_notes`, `reviewed_at` (timestamp) |
| **Admin ID** | Should come from JWT token via `@AdminUser()` decorator or `request.admin` |
| **Caching** | Clear relevant caches after mutations |
| **DTOs** | Separate for request (form), request (JSON), and response |

---

## 10. Implementation Checklist

- [ ] Create `UserReport` entity with all fields
- [ ] Create migration script for `user_reports` table
- [ ] Create DTOs (Request, Response, Update)
- [ ] Inject `UserReport` repository in `UserService`
- [ ] Implement service methods (get, list, review, stats)
- [ ] Add controller endpoints with proper decorators and documentation
- [ ] Create indexes on frequently queried columns
- [ ] Handle caching on statistics endpoints
- [ ] Use `@AdminUser()` decorator to extract admin ID from JWT
- [ ] Test authentication/authorization on all endpoints
- [ ] Test pagination and filtering
- [ ] Test unique constraint (one report per user pair)
- [ ] Document all endpoints in Swagger
- [ ] Add integration tests

---

## 11. Security Considerations

1. **Authentication**: All endpoints protected by AdminGuard
2. **Authorization**: Only admins can review reports
3. **Data Isolation**: Users only see their own data in non-admin endpoints
4. **Audit Trail**: Track who reviewed each report (reviewed_by field)
5. **Unique Reports**: Prevent spam by enforcing one report per user pair
6. **Rate Limiting**: Consider adding rate limiting to prevent abuse
7. **Sensitive Data**: Exclude passwords and OTP codes from responses

---

## 12. Performance Optimization Tips

1. **Indexing**: Create indexes on `status`, `created_at`, `reported_user_id`
2. **Pagination**: Always paginate report lists (don't return all at once)
3. **Relations**: Only join related entities when needed
4. **Caching**: Cache statistics for 5-10 minutes (low update frequency)
5. **Batch Operations**: Group multiple updates in one query when possible
6. **Query Limits**: Set reasonable defaults for page size (20-50)

---

## Conclusion

The project follows clean, well-documented NestJS patterns. The user reporting system should:

1. **Reuse existing patterns** from Activity and Bond reporting
2. **Follow the response format** standard: `{ code, message, data }`
3. **Use AdminGuard** for all admin endpoints
4. **Implement DTOs** for type safety and validation
5. **Create indexes** for performance
6. **Track admin actions** via reviewed_by and reviewed_at fields
7. **Provide statistics** endpoint for dashboards
8. **Document thoroughly** in Swagger annotations

This creates a consistent, maintainable, and scalable solution for user reporting management.
