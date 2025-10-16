import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { AdminGuard } from '../admin/guards/admin/admin.guard';
import { FilterActivityDto } from './dto/filter-activity.dto';
import { ActivityResponseDto } from './dto/activity-response.dto';
import { UpdateReportStatusFormDto } from './dto/update-report-status.dto';
import { plainToInstance } from 'class-transformer';
import { ReportStatus } from './entities/activity-report.entity';
import { ReportResponseDto } from './dto/report-activity.dto';
import { ActivityStatsDto } from './dto/activity-stats.dto';
import { ActivityAnalyticsDto } from './dto/activity-analytics.dto';
import { AdvancedSearchActivityDto } from './dto/advanced-search-activity.dto';
import { ReportStatsDto } from './dto/report-stats.dto';
import { TopCreatorsQueryDto } from './dto/top-creators-query.dto';

@ApiTags('Admin – Activities')
@ApiBearerAuth('JWT-auth')
@UseGuards(AdminGuard)
@Controller('admin/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /* -------------  STATISTICS  ------------- */
  @Get('stats')
  @ApiOperation({ summary: 'Admin: get activity statistics' })
  @ApiResponse({
    status: 200,
    description: 'Activity statistics retrieved successfully',
    type: ActivityStatsDto,
  })
  async getStats(): Promise<{ code: number; message: string; data: ActivityStatsDto }> {
    const stats = await this.activityService.getActivityStats();
    return {
      code: 1,
      message: 'Activity statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Admin: get detailed activity analytics' })
  @ApiResponse({
    status: 200,
    description: 'Activity analytics retrieved successfully',
    type: ActivityAnalyticsDto,
  })
  async getAnalytics(): Promise<{ code: number; message: string; data: ActivityAnalyticsDto }> {
    const analytics = await this.activityService.getActivityAnalytics();
    return {
      code: 1,
      message: 'Activity analytics retrieved successfully',
      data: analytics,
    };
  }

  /* -------------  ADVANCED SEARCH  ------------- */
  @Get('search')
  @ApiOperation({ summary: 'Admin: advanced search activities with full-text search and filters' })
  @ApiResponse({
    status: 200,
    description: 'Activities search results retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Activities search completed successfully' },
        data: {
          type: 'object',
          properties: {
            activities: {
              type: 'array',
              items: { $ref: '#/components/schemas/ActivityResponseDto' }
            },
            total: { type: 'number', example: 150 }
          }
        }
      }
    }
  })
  async searchActivities(@Query() searchDto: AdvancedSearchActivityDto) {
    const { activities, total } = await this.activityService.advancedSearchActivities(searchDto);
    return {
      code: 1,
      message: 'Activities search completed successfully',
      data: { activities, total },
    };
  }

  /* -------------  BY CREATOR  ------------- */
  @Get('by-creator/:userId')
  @ApiOperation({ summary: 'Admin: get all activities by specific creator' })
  @ApiParam({ 
    name: 'userId', 
    type: String, 
    description: 'Creator user ID',
    example: '47c97128-49e0-4234-90a5-94b231b358bd'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number (starts from 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of items per page',
    example: 20
  })
  @ApiQuery({ 
    name: 'include_hidden', 
    required: false, 
    type: Boolean, 
    description: 'Include hidden activities',
    example: true
  })
  @ApiResponse({
    status: 200,
    description: 'Activities by creator retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Activities by creator retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            activities: {
              type: 'array',
              items: { $ref: '#/components/schemas/ActivityResponseDto' }
            },
            total: { type: 'number', example: 25 },
            creator: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '47c97128-49e0-4234-90a5-94b231b358bd' },
                full_name: { type: 'string', example: 'John Doe' },
                user_name: { type: 'string', example: 'johndoe' },
                profile_image: { type: 'string', example: 'https://example.com/image.jpg' },
                email: { type: 'string', example: 'john@example.com' },
                member_since: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  async getActivitiesByCreator(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('include_hidden') includeHidden?: boolean,
  ) {
    const { activities, total, creator } = await this.activityService.getActivitiesByCreator(
      userId,
      page || 1,
      limit || 20,
      includeHidden !== false // Default to true unless explicitly set to false
    );
    
    return {
      code: 1,
      message: 'Activities by creator retrieved successfully',
      data: { activities, total, creator },
    };
  }

  /* -------------  TOP CREATORS  ------------- */
  @Get('creators/top')
  @ApiOperation({ summary: 'Admin: get top activity creators by count/engagement' })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number (starts from 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of creators per page',
    example: 10
  })
  @ApiQuery({ 
    name: 'sort_by', 
    required: false, 
    enum: ['activity_count', 'total_participants', 'avg_participants', 'total_likes', 'engagement_score'],
    description: 'Sort creators by metric',
    example: 'activity_count'
  })
  @ApiQuery({ 
    name: 'min_activities', 
    required: false, 
    type: Number, 
    description: 'Minimum number of activities to be included',
    example: 2
  })
  @ApiQuery({ 
    name: 'days_back', 
    required: false, 
    type: Number, 
    description: 'Number of days to look back (0 for all time)',
    example: 30
  })
  @ApiQuery({ 
    name: 'include_hidden', 
    required: false, 
    type: Boolean, 
    description: 'Include hidden activities in the count',
    example: false
  })
  @ApiResponse({
    status: 200,
    description: 'Top activity creators retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Top activity creators retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            creators: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  creator_id: { type: 'string', example: '47c97128-49e0-4234-90a5-94b231b358bd' },
                  creator_name: { type: 'string', example: 'John Doe' },
                  user_name: { type: 'string', example: 'johndoe' },
                  profile_image: { type: 'string', example: 'https://example.com/image.jpg' },
                  email: { type: 'string', example: 'john@example.com' },
                  member_since: { type: 'string', format: 'date-time' },
                  activity_count: { type: 'number', example: 15 },
                  total_participants: { type: 'number', example: 250 },
                  avg_participants: { type: 'number', example: 16.67 },
                  total_likes: { type: 'number', example: 89 },
                  engagement_score: { type: 'number', example: 127.7 }
                }
              }
            },
            total: { type: 'number', example: 25 },
            query_info: {
              type: 'object',
              properties: {
                sort_by: { type: 'string', example: 'activity_count' },
                min_activities: { type: 'number', example: 2 },
                days_back: { type: 'number', example: 30 },
                include_hidden: { type: 'boolean', example: false }
              }
            }
          }
        }
      }
    }
  })
  async getTopActivityCreators(@Query() queryDto: TopCreatorsQueryDto) {
    const { creators, total } = await this.activityService.getTopActivityCreators(queryDto);
    
    return {
      code: 1,
      message: 'Top activity creators retrieved successfully',
      data: { 
        creators, 
        total,
        query_info: {
          sort_by: queryDto.sort_by,
          min_activities: queryDto.min_activities,
          days_back: queryDto.days_back,
          include_hidden: queryDto.include_hidden
        }
      },
    };
  }

  /* -------------  LIST / FILTER  ------------- */
  @Get('upcoming')
  @ApiOperation({ summary: 'Admin: get activities starting soon (next 24-48 hours)' })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number (starts from 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of items per page',
    example: 20
  })
  @ApiQuery({ 
    name: 'hours_ahead', 
    required: false, 
    type: Number, 
    description: 'Hours ahead to look for upcoming activities (default: 48)',
    example: 48
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming activities retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Upcoming activities retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            activities: {
              type: 'array',
              items: { $ref: '#/components/schemas/ActivityResponseDto' }
            },
            total: { type: 'number', example: 15 }
          }
        }
      }
    }
  })
  async getUpcomingActivities(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('hours_ahead') hoursAhead?: number,
  ) {
    const { activities, total } = await this.activityService.getUpcomingActivities(
      page || 1,
      limit || 20,
      hoursAhead || 48
    );
    
    return {
      code: 1,
      message: 'Upcoming activities retrieved successfully',
      data: { activities, total },
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'Admin: list/filter all activities' })
  async adminList(@Query() dto: FilterActivityDto) {
    const { activities, total } = await this.activityService.findAll(dto);
    return {
      code: 1,
      message: 'Activities retrieved (admin)',
      data: { activities, total },
    };
  }


  /* -------------  TRENDING  ------------- */
  @Get('trending')
  @ApiOperation({ summary: 'Admin: trending activities' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'interest_ids', required: false, type: String })
  async trending(@Query() dto: FilterActivityDto) {
    const { activities, total } = await this.activityService.getTrendingActivities(
      dto.page,
      dto.limit,
    );
    return {
      code: 1,
      message: 'Admin trending activities',
      data: { activities, total },
    };
  }

  /* -------------  REPORTS  ------------- */
  @Get('reports/stats')
  @ApiOperation({ summary: 'Admin: get report statistics' })
  @ApiResponse({
    status: 200,
    description: 'Report statistics retrieved successfully',
    type: ReportStatsDto,
  })
  async getReportStats(): Promise<{ code: number; message: string; data: ReportStatsDto }> {
    const stats = await this.activityService.getReportStats();
    return {
      code: 1,
      message: 'Report statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('reports/pending')
  @ApiOperation({ summary: 'Admin: get only pending reports for quick review' })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number (starts from 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of items per page',
    example: 20
  })
  @ApiResponse({
    status: 200,
    description: 'Pending reports retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Pending reports retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            reports: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  activity_id: { type: 'number', example: 24 },
                  reporter_id: { type: 'string', example: '47c97128-49e0-4234-90a5-94b231b358bd' },
                  reason: { type: 'string', example: 'inappropriate_content' },
                  description: { type: 'string', example: 'This activity contains inappropriate content' },
                  status: { type: 'string', example: 'pending' },
                  created_at: { type: 'string', format: 'date-time' },
                  activity: { type: 'object' },
                  reporter: { type: 'object' }
                }
              }
            },
            total: { type: 'number', example: 5 }
          }
        }
      }
    }
  })
  async getPendingReports(@Query() q: { page?: number; limit?: number }) {
    const { reports, total } = await this.activityService.getPendingReports(
      q.page || 1,
      q.limit || 20,
    );
    return {
      code: 1,
      message: 'Pending reports retrieved successfully',
      data: { reports, total },
    };
  }

  @Get('reports')
  @ApiOperation({ summary: 'Admin: view all activity reports' })
  async getAllReports(@Query() q: { page?: number; limit?: number }) {
    const { reports, total } = await this.activityService.getAllReports(
      q.page,
      q.limit,
    );
    return {
      code: 1,
      message: 'All reports retrieved',
      data: { reports, total },
    };
  }

  @Patch('reports/:reportId/status')
  @ApiOperation({ 
    summary: 'Admin: update activity report status and add review notes',
    description: `
      Updates the status of an activity report and optionally adds admin review notes.
      
      **Process:**
      1. Admin reviews the reported activity
      2. Changes status (pending → reviewed/resolved/dismissed)
      3. Adds review notes explaining the decision
      4. System records: reviewer ID, review timestamp, notes
      
      **Status Options:**
      - **pending**: Initial state when report is created
      - **reviewed**: Admin has reviewed but action pending
      - **resolved**: Issue addressed (e.g., activity hidden/deleted)
      - **dismissed**: Report found invalid or unsubstantiated
      
      **Example Workflow:**
      1. User reports activity with inappropriate content
      2. Admin reviews → sets status to "reviewed"
      3. Admin hides the activity
      4. Admin updates report to "resolved" with notes
    `
  })
  @ApiConsumes('application/json')
  @ApiParam({ 
    name: 'reportId', 
    type: Number,
    description: 'Report ID to update',
    example: 1
  })
  @ApiBody({ 
    type: UpdateReportStatusFormDto,
    description: 'Report status and optional review notes',
    examples: {
      resolved: {
        summary: 'Mark as resolved',
        value: {
          status: 'resolved',
          notes: 'Activity violated community guidelines and has been hidden. User warned.'
        }
      },
      dismissed: {
        summary: 'Dismiss report',
        value: {
          status: 'dismissed',
          notes: 'No violation found after review. Content complies with guidelines.'
        }
      },
      reviewed: {
        summary: 'Mark as reviewed',
        value: {
          status: 'reviewed',
          notes: 'Report acknowledged. Investigating further with moderation team.'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Report status updated successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Report status updated' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            activity_id: { type: 'number', example: 24 },
            reporter_id: { type: 'string', example: '47c97128-49e0-4234-90a5-94b231b358bd' },
            reason: { type: 'string', example: 'inappropriate_content' },
            description: { type: 'string', example: 'This activity contains inappropriate content' },
            status: { type: 'string', example: 'resolved' },
            reviewed_by: { type: 'string', example: 'fdb74f12-92ca-11f0-a7b4-a2aa00234146' },
            review_notes: { type: 'string', example: 'Activity hidden after review' },
            reviewed_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            activity: { type: 'object', description: 'Reported activity details' },
            reporter: { type: 'object', description: 'User who reported' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Report not found'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid status value'
  })
  async updateReportStatus(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() updateDto: UpdateReportStatusFormDto,
  ) {
    const adminId = 'fdb74f12-92ca-11f0-a7b4-a2aa00234146'; // TODO: Extract from JWT token

    // Update report with new status and review notes
    const updated = await this.activityService.reviewReport(
      reportId, 
      adminId, 
      updateDto.status, 
      updateDto.notes
    );

    return {
      code: 1,
      message: 'Report status updated',
      data: plainToInstance(ReportResponseDto, updated),
    };
  }

  /* -------------  SINGLE DETAIL  ------------- */
  @Get(':id')
  @ApiOperation({ summary: 'Admin: single activity details' })
  async adminGetOne(@Param('id', ParseIntPipe) id: number) {
    const activity = await this.activityService.findOne(id);
    return {
      code: 1,
      message: 'Activity details (admin)',
      data: plainToInstance(ActivityResponseDto, activity, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /* -------------  DELETE  ------------- */
  @Delete(':id')
  @ApiOperation({ summary: 'Admin: permanently delete an activity' })
  async adminDelete(@Param('id', ParseIntPipe) id: number) {
    await this.activityService.remove(id);
    return { code: 1, message: 'Activity permanently deleted by admin' };
  }

  /* -------------  HIDE / UNHIDE  ------------- */
  @Patch(':id/hide')
  @ApiOperation({ summary: 'Admin: hide activity' })
  async hide(@Param('id', ParseIntPipe) id: number) {
    await this.activityService.hideActivity(id);
    return { code: 1, message: 'Activity hidden' };
  }

  @Patch(':id/unhide')
  @ApiOperation({ summary: 'Admin: un-hide activity' })
  async unhide(@Param('id', ParseIntPipe) id: number) {
    await this.activityService.unhideActivity(id);
    return { code: 1, message: 'Activity un-hidden' };
  }

  /* -------------  PARTICIPANTS  ------------- */
  @Get(':id/participants')
  @ApiOperation({ summary: 'Admin: get detailed participant list with user info' })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Activity ID',
    example: 27
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number (starts from 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of participants per page',
    example: 50
  })
  @ApiResponse({
    status: 200,
    description: 'Activity participants retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Activity participants retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            participants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '47c97128-49e0-4234-90a5-94b231b358bd' },
                  full_name: { type: 'string', example: 'John Doe' },
                  user_name: { type: 'string', example: 'johndoe' },
                  email: { type: 'string', example: 'john@example.com' },
                  profile_image: { type: 'string', example: 'https://example.com/image.jpg' },
                  member_since: { type: 'string', format: 'date-time' },
                  joined_at: { type: 'string', format: 'date-time' },
                  role: { type: 'string', enum: ['creator', 'organizer', 'participant'] }
                }
              }
            },
            total: { type: 'number', example: 25 },
            activity_info: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 27 },
                title: { type: 'string', example: 'Book Club Meeting' },
                start_date: { type: 'string', format: 'date-time' },
                end_date: { type: 'string', format: 'date-time' },
                max_participants: { type: 'number', example: 50 },
                current_participants: { type: 'number', example: 25 },
                creator: { type: 'object' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async getActivityParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const { participants, total, activity_info } = await this.activityService.getActivityParticipants(
      id,
      page || 1,
      limit || 50
    );
    
    return {
      code: 1,
      message: 'Activity participants retrieved successfully',
      data: { participants, total, activity_info },
    };
  }

  
}