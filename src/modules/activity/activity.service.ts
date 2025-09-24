import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityReport, ReportStatus } from './entities/activity-report.entity';
import { FilterActivityDto } from './dto/filter-activity.dto';
import { plainToInstance } from 'class-transformer';
import { ActivityResponseDto } from './dto/activity-response.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityReport)
    private readonly reportRepo: Repository<ActivityReport>,
  ) {}

  /* -------------  BASIC CRUD  ------------- */
  async findAll(dto: FilterActivityDto): Promise<{ activities: Activity[]; total: number }> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .leftJoinAndSelect('activity.co_organizers', 'co_organizers')
      .leftJoinAndSelect('activity.participants', 'participants')
      .leftJoinAndSelect('activity.interests', 'interests')
      .leftJoinAndSelect('activity.bonds', 'bonds')
      .orderBy('activity.created_at', 'DESC')
      .skip((dto.page! - 1) * dto.limit!)
      .take(dto.limit!);

    if (dto.title) qb.andWhere('activity.title LIKE :title', { title: `%${dto.title}%` });
    if (dto.location) qb.andWhere('activity.location LIKE :loc', { loc: `%${dto.location}%` });
    if (dto.is_public !== undefined) qb.andWhere('activity.is_public = :p', { p: dto.is_public });
    if (dto.creator) qb.andWhere('activity.creator_id = :c', { c: dto.creator });

    const [activities, total] = await qb.getManyAndCount();
    return { activities, total };
  }

  async findOne(id: number): Promise<Activity> {
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: [
        'creator',
        'co_organizers',
        'participants',
        'interests',
        'bonds',
        'reports',
      ],
    });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async remove(id: number): Promise<void> {
    await this.activityRepo.delete(id);
  }

  /* -------------  HIDE / UNHIDE  ------------- */
  async hideActivity(id: number): Promise<void> {
    await this.activityRepo.update(id, { hidden_at: new Date() });
  }

  async unhideActivity(id: number): Promise<void> {
    await this.activityRepo.update(id, { hidden_at: null });
  }

  /* -------------  TRENDING  ------------- */
  async getTrendingActivities(
    page = 1,
    limit = 20,
  ): Promise<{ activities: Activity[]; total: number }> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .addSelect((sub) =>
        sub
          .select('COUNT(ap.user_id)', 'participantsCount')
          .from('activity_participants', 'ap')
          .where('ap.activity_id = activity.id'),
        'participantsCount',
      )
      .orderBy('participantsCount', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [activities, total] = await qb.getManyAndCount();
    return { activities, total };
  }

  /* -------------  REPORTS  ------------- */
  async getAllReports(page = 1, limit = 20) {
    const [reports, total] = await this.reportRepo.findAndCount({
      relations: ['activity', 'reporter'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { reports, total };
  }

  async reviewReport(
    reportId: number,
    status: ReportStatus,
    notes?: string,
  ): Promise<ActivityReport> {
    await this.reportRepo.update(
      { id: reportId },
      { status, review_notes: notes, reviewed_at: new Date() },
    );
    return this.reportRepo.findOneOrFail({
      where: { id: reportId },
      relations: ['activity', 'reporter'],
    });
  }
}