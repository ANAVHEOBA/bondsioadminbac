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

@ApiTags('Admin – Activities')
@ApiBearerAuth('JWT-auth')
@UseGuards(AdminGuard)
@Controller('admin/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /* -------------  LIST / FILTER  ------------- */
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

  /* -------------  REPORTS  ------------- */
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
  @Patch('admin/reports/:reportId/status')
@ApiOperation({ summary: 'Admin: update report status / resolve report (form-data)' })
@ApiConsumes('multipart/form-data')
@ApiParam({ name: 'reportId', type: Number })
@ApiBody({ type: UpdateReportStatusFormDto })
async updateReportStatus(
  @Param('reportId', ParseIntPipe) reportId: number,
  @Body() updateDto: UpdateReportStatusFormDto,
) {
  const adminId = 'fdb74f12-92ca-11f0-a7b4-a2aa00234146'; // real admin ID from JWT

  // ✅ Use the returned fresh entity
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

  
}