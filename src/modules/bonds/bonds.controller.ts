import { Controller, Get, Patch, Param, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { BondsService } from './bonds.service';
import { AdminGuard } from '../admin/guards/admin/admin.guard';
import { ReviewReportFormDto } from './dto/report-bond.dto';

@ApiTags('Admin - Bonds')
@ApiBearerAuth('JWT-auth')
@Controller('bonds')
@UseGuards(AdminGuard)
export class BondsAdminController {
  constructor(private readonly bondsService: BondsService) {}



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