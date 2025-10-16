import { Controller, Get, Patch, Param, Query, UseGuards, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BondsService } from './bonds.service';
import { AdminGuard } from '../admin/guards/admin/admin.guard';
import { ReviewReportFormDto } from './dto/report-bond.dto';
import { BondStatsDto } from './dto/bond-stats.dto';
import { BondAnalyticsDto } from './dto/bond-analytics.dto';
import { AdvancedSearchBondDto, BondSearchResponseDto } from './dto/advanced-search-bond.dto';
import { AdminListBondsDto, AdminListBondsResponseDto } from './dto/admin-list-bonds.dto';
import { TopBondCreatorsQueryDto } from './dto/top-bond-creators-query.dto';
import { BondDetailResponseDto } from './dto/bond-response.dto';
import { BondMembersResponseDto } from './dto/bond-members-response.dto';
import { BondReportStatsResponseDto } from './dto/bond-report-stats.dto';
import { PendingReportsResponseDto, PendingReportsQueryDto } from './dto/pending-reports-response.dto';

@ApiTags('Admin - Bonds')
@ApiBearerAuth('JWT-auth')
@Controller('bonds')
@UseGuards(AdminGuard)
export class BondsAdminController {
  constructor(private readonly bondsService: BondsService) {}

  /* -------------  STATISTICS  ------------- */
  @Get('admin/stats')
  @ApiOperation({ summary: 'Admin: get bond statistics' })
  @ApiResponse({
    status: 200,
    description: 'Bond statistics retrieved successfully',
    type: BondStatsDto,
  })
  async getStats(): Promise<{ code: number; message: string; data: BondStatsDto }> {
    const stats = await this.bondsService.getBondStats();
    return {
      code: 1,
      message: 'Bond statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('admin/analytics')
  @ApiOperation({ summary: 'Admin: get detailed bond analytics' })
  @ApiResponse({
    status: 200,
    description: 'Bond analytics retrieved successfully',
    type: BondAnalyticsDto,
  })
  async getAnalytics(): Promise<{ code: number; message: string; data: BondAnalyticsDto }> {
    const analytics = await this.bondsService.getBondAnalytics();
    return {
      code: 1,
      message: 'Bond analytics retrieved successfully',
      data: analytics,
    };
  }

  /* -------------  SEARCH & FILTERING  ------------- */
  @Get('admin/search')
  @ApiOperation({ summary: 'Admin: advanced search bonds with filters' })
  @ApiResponse({
    status: 200,
    description: 'Bond search results retrieved successfully',
    type: BondSearchResponseDto,
  })
  async searchBonds(@Query() searchDto: AdvancedSearchBondDto): Promise<{ code: number; message: string; data: BondSearchResponseDto }> {
    const results = await this.bondsService.advancedSearchBonds(searchDto);
    return {
      code: 1,
      message: 'Bond search completed successfully',
      data: results,
    };
  }

  /* -------------  LIST & FILTERING  ------------- */
  @Get('admin/list')
  @ApiOperation({ summary: 'Admin: enhanced list/filter bonds with comprehensive options' })
  @ApiResponse({
    status: 200,
    description: 'Bonds list retrieved successfully',
    type: AdminListBondsResponseDto,
  })
  async adminListBonds(@Query() listDto: AdminListBondsDto): Promise<{ code: number; message: string; data: AdminListBondsResponseDto }> {
    const results = await this.bondsService.getAdminBondsList(listDto);
    return {
      code: 1,
      message: 'Bonds list retrieved successfully',
      data: results,
    };
  }

  @Get('admin/trending')
  @ApiOperation({ summary: 'Admin: get trending bonds' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Trending bonds retrieved successfully',
    type: AdminListBondsResponseDto,
  })
  async getTrendingBonds(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<{ code: number; message: string; data: AdminListBondsResponseDto }> {
    const results = await this.bondsService.getTrendingBonds(+page, +limit);
    return {
      code: 1,
      message: 'Trending bonds retrieved successfully',
      data: results,
    };
  }

@Get('admin/all')
@ApiOperation({ summary: 'Get every bond in the system (admin)' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
async getAllBondsAdmin(
  @Query('page') page = 1,
  @Query('limit') limit = 20,
) {
  return this.bondsService.getAllBondsAdmin(page, limit);
}

  @Get('admin/reported-bonds')
  @ApiOperation({ 
    summary: 'List all bonds with reports - comprehensive details',
    description: `
      Returns bonds that have been reported by users, with full bond details,
      all reports, and reporter information.
      
      **Includes:**
      - Full bond details (name, description, cover image, visibility, etc.)
      - Creator information
      - Member counts
      - All interests/tags
      - Report statistics by status
      - Complete list of reports with reporter details
      - Top reporters summary
      
      Sorted by total report count (most reported first)
    `
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Items per page',
    example: 20
  })
  @ApiResponse({
    status: 200,
    description: 'Reported bonds retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        bonds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 11 },
              name: { type: 'string', example: 'Flower Lovers' },
              description: { type: 'string', example: 'A community for flower enthusiasts' },
              banner: { type: 'string', example: 'https://example.com/banner.jpg' },
              city: { type: 'string', example: 'New York' },
              is_public: { type: 'boolean', example: true },
              request_to_join: { type: 'boolean', example: false },
              is_unlimited_members: { type: 'boolean', example: true },
              max_members: { type: 'number', example: 100, nullable: true },
              is_trending: { type: 'boolean', example: false },
              view_count: { type: 'number', example: 250 },
              likes_count: { type: 'number', example: 45 },
              is_hidden: { type: 'boolean', example: false },
              hidden_at: { type: 'string', format: 'date-time', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              creator: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '47c97128-49e0-4234-90a5-94b231b358bd' },
                  full_name: { type: 'string', example: 'John Doe' },
                  user_name: { type: 'string', example: 'johndoe' },
                  email: { type: 'string', example: 'john@example.com' },
                  profile_image: { type: 'string', example: 'https://example.com/profile.jpg' }
                }
              },
              interests: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 5 },
                    name: { type: 'string', example: 'Gardening' }
                  }
                }
              },
              members_count: { type: 'number', example: 45 },
              total_reports: { type: 'number', example: 3 },
              pending_reports: { type: 'number', example: 1 },
              reviewed_reports: { type: 'number', example: 1 },
              resolved_reports: { type: 'number', example: 0 },
              dismissed_reports: { type: 'number', example: 1 },
              unique_reporters: { type: 'number', example: 3 },
              reports: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    report_id: { type: 'number', example: 1 },
                    reason: { type: 'string', enum: ['inappropriate_content', 'spam', 'harassment', 'false_information', 'safety_concerns', 'other'] },
                    description: { type: 'string', example: 'This bond contains inappropriate content' },
                    status: { type: 'string', enum: ['pending', 'reviewed', 'resolved', 'dismissed'] },
                    created_at: { type: 'string', format: 'date-time' },
                    reviewed_by: { type: 'string', nullable: true },
                    review_notes: { type: 'string', nullable: true },
                    reviewed_at: { type: 'string', format: 'date-time', nullable: true },
                    reporter: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: '47c97128-49e0-4234-90a5-94b231b358bd' },
                        full_name: { type: 'string', example: 'Jane Smith' },
                        user_name: { type: 'string', example: 'janesmith' },
                        email: { type: 'string', example: 'jane@example.com' },
                        profile_image: { type: 'string', example: 'https://example.com/jane.jpg' },
                        country: {
                          type: 'object',
                          nullable: true,
                          properties: {
                            id: { type: 'number', example: 1 },
                            name: { type: 'string', example: 'United States' }
                          }
                        }
                      }
                    }
                  }
                }
              },
              reporters_summary: {
                type: 'array',
                description: 'Top 5 unique reporters',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    full_name: { type: 'string' },
                    user_name: { type: 'string' },
                    email: { type: 'string' },
                    profile_image: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        total: { type: 'number', example: 5, description: 'Total number of bonds with reports' }
      }
    }
  })
  async getReportedBondsAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.bondsService.getReportedBondsAdmin(page, limit);
  }

  @Get('admin/reports/:bondId')
  @ApiOperation({ summary: 'Read full reports for a bond (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getReportsAdmin(
    @Param('bondId') bondId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.bondsService.getBondReports(+bondId, null, page, limit);
  }

  @Patch('admin/reports/:reportId')
  @ApiOperation({ summary: 'Review / update a bond report (admin)' })
  @ApiParam({ name: 'reportId', type: Number })
  async adminReviewReport(
    @Param('reportId') reportId: number,
    @Body() body: ReviewReportFormDto,
  ) {
    return this.bondsService.reviewBondReport(reportId, null, body.status, body.notes);
  }

  @Get('admin/reports/stats')
  @ApiOperation({ summary: 'Admin: get overall statistics about bond reports' })
  @ApiResponse({
    status: 200,
    description: 'Report statistics retrieved successfully',
    type: BondReportStatsResponseDto,
  })
  async getBondReportStats(): Promise<BondReportStatsResponseDto> {
    const stats = await this.bondsService.getBondReportStatistics();
    return {
      code: 1,
      message: 'Report statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('admin/reports/pending')
  @ApiOperation({ summary: 'Admin: quick access to pending reports only (for fast review workflow)' })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number',
    example: 1 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Items per page',
    example: 20 
  })
  @ApiQuery({ 
    name: 'sort_by', 
    required: false, 
    enum: ['created_at', 'bond_id'],
    description: 'Sort field',
    example: 'created_at' 
  })
  @ApiQuery({ 
    name: 'sort_order', 
    required: false, 
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
    example: 'DESC' 
  })
  @ApiResponse({
    status: 200,
    description: 'Pending reports retrieved successfully',
    type: PendingReportsResponseDto,
  })
  async getPendingReports(
    @Query() queryDto: PendingReportsQueryDto,
  ): Promise<PendingReportsResponseDto> {
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = queryDto;
    const data = await this.bondsService.getPendingReports(page, limit, sort_by, sort_order);
    return {
      code: 1,
      message: 'Pending reports retrieved successfully',
      data,
    };
  }

  @Get('admin/by-creator/:userId')
  @ApiOperation({ summary: 'Admin: get all bonds by specific creator' })
  @ApiParam({ name: 'userId', type: String, description: 'Creator UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'include_hidden', required: false, type: Boolean, description: 'Include hidden bonds', example: false })
  @ApiResponse({
    status: 200,
    description: 'Bonds by creator retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Bonds by creator retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            bonds: {
              type: 'array',
              items: { type: 'object' }
            },
            total: { type: 'number', example: 5 },
            creator: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                full_name: { type: 'string' },
                user_name: { type: 'string' },
                email: { type: 'string' },
                profile_image: { type: 'string' },
                member_since: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  async getBondsByCreator(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('include_hidden') includeHidden = false,
  ): Promise<{ code: number; message: string; data: any }> {
    const results = await this.bondsService.getBondsByCreator(userId, +page, +limit, includeHidden);
    return {
      code: 1,
      message: 'Bonds by creator retrieved successfully',
      data: results,
    };
  }

  @Get('admin/creators/top')
  @ApiOperation({ summary: 'Admin: get top bond creators by count/engagement' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'sort_by', required: false, enum: ['bond_count', 'total_members', 'avg_members', 'total_likes', 'total_views', 'engagement_score'], description: 'Sort by field', example: 'bond_count' })
  @ApiQuery({ name: 'min_bonds', required: false, type: Number, description: 'Minimum bonds to include', example: 1 })
  @ApiQuery({ name: 'days_back', required: false, type: Number, description: 'Days to look back (0 for all time)', example: 30 })
  @ApiQuery({ name: 'include_hidden', required: false, type: Boolean, description: 'Include hidden bonds', example: false })
  @ApiResponse({
    status: 200,
    description: 'Top bond creators retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Top bond creators retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            creators: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  creator_id: { type: 'string' },
                  creator_name: { type: 'string' },
                  user_name: { type: 'string' },
                  profile_image: { type: 'string' },
                  email: { type: 'string' },
                  member_since: { type: 'string', format: 'date-time' },
                  bond_count: { type: 'number' },
                  total_members: { type: 'number' },
                  avg_members: { type: 'number' },
                  total_likes: { type: 'number' },
                  total_views: { type: 'number' },
                  engagement_score: { type: 'number' }
                }
              }
            },
            total: { type: 'number' },
            query_info: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                sort_by: { type: 'string' },
                min_bonds: { type: 'number' },
                days_back: { type: 'number' },
                include_hidden: { type: 'boolean' },
                total_pages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
  async getTopBondCreators(
    @Query() queryDto: TopBondCreatorsQueryDto,
  ): Promise<{ code: number; message: string; data: any }> {
    const results = await this.bondsService.getTopBondCreatorsRanked(queryDto);
    return {
      code: 1,
      message: 'Top bond creators retrieved successfully',
      data: results,
    };
  }

  /* -------------  SINGLE BOND MANAGEMENT  ------------- */
  @Get('admin/:id')
  @ApiOperation({ summary: 'Admin: get detailed information about a specific bond' })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Bond ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Bond retrieved successfully',
    type: BondDetailResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Bond not found' 
  })
  async getBondById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BondDetailResponseDto> {
    const result = await this.bondsService.findOne(id);
    
    if (result.code === 0) {
      return result;
    }

    return {
      code: 1,
      message: 'Bond retrieved successfully',
      data: result.data,
    };
  }

  /* -------------  BOND VISIBILITY CONTROL  ------------- */
  @Patch('admin/:id/hide')
  @ApiOperation({ summary: 'Admin: hide a bond from public view (soft delete)' })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Bond ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Bond hidden successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Bond hidden successfully' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Bond not found' 
  })
  async hideBond(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ code: number; message: string }> {
    await this.bondsService.hideBond(id);
    return {
      code: 1,
      message: 'Bond hidden successfully',
    };
  }

  @Patch('admin/:id/unhide')
  @ApiOperation({ summary: 'Admin: restore a previously hidden bond' })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Bond ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Bond unhidden successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Bond unhidden successfully' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Bond not found' 
  })
  async unhideBond(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ code: number; message: string }> {
    await this.bondsService.unhideBond(id);
    return {
      code: 1,
      message: 'Bond unhidden successfully',
    };
  }

  /* -------------  MEMBER MANAGEMENT  ------------- */
  @Get('admin/:id/members')
  @ApiOperation({ summary: 'Admin: get detailed list of all members in a bond with pagination' })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Bond ID',
    example: 1
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Items per page',
    example: 20
  })
  @ApiResponse({
    status: 200,
    description: 'Bond members retrieved successfully',
    type: BondMembersResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Bond not found' 
  })
  async getBondMembers(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<BondMembersResponseDto> {
    const data = await this.bondsService.getBondMembers(id, +page, +limit);
    return {
      code: 1,
      message: 'Bond members retrieved successfully',
      data,
    };
  }

}