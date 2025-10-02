import { Controller, Get, Patch, Param, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BondsService } from './bonds.service';
import { AdminGuard } from '../admin/guards/admin/admin.guard';
import { ReviewReportFormDto } from './dto/report-bond.dto';
import { BondStatsDto } from './dto/bond-stats.dto';
import { BondAnalyticsDto } from './dto/bond-analytics.dto';
import { AdvancedSearchBondDto, BondSearchResponseDto } from './dto/advanced-search-bond.dto';
import { AdminListBondsDto, AdminListBondsResponseDto } from './dto/admin-list-bonds.dto';

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
  @ApiOperation({ summary: 'List all bonds that have reports (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
}