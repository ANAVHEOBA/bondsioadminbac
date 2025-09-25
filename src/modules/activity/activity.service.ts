import { Injectable, NotFoundException, BadRequestException, Inject, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Like, LessThanOrEqual, MoreThanOrEqual, Between, Brackets } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { FilterActivityDto } from './dto/filter-activity.dto';
import { User } from '../user/entities/user.entity';
import { UserInterest } from '../user-interests/entities/user-interest.entity';
import { Bond } from '../bonds/entities/bond.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { ActivityResponseDto } from './dto/activity-response.dto';
import { ActivityReport, ReportStatus } from './entities/activity-report.entity';

// Stubs – admin never calls create/update, but TS needs the files to exist
export class CreateActivityDto {}
export class UpdateActivityDto {}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserInterest)
    private readonly userInterestRepo: Repository<UserInterest>,
    @InjectRepository(Bond)
    private readonly bondRepo: Repository<Bond>,
    @InjectRepository(ActivityReport)
    private readonly reportRepo: Repository<ActivityReport>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /* ----------  ADMIN / READ-ONLY  ---------- */

  async findAll(filterDto?: FilterActivityDto, userId?: string): Promise<{ activities: ActivityResponseDto[]; total: number }> {
    const transformed = this.transformFormData(filterDto || {});
    const { page = 1, limit = 20, ...filters } = transformed;
    const skip = (page - 1) * limit;

    const cacheKey = `activities:${JSON.stringify(transformed)}:${userId || 'anon'}:${page}:${limit}`;
    const cached = await this.cacheManager.get<{ activities: ActivityResponseDto[]; total: number }>(cacheKey);
    if (cached) return cached;

    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .leftJoinAndSelect('activity.bonds', 'bonds')
      .skip(skip)
      .take(limit);

    if (userId) {
      qb.leftJoinAndSelect('activity.co_organizers', 'co_organizers')
        .leftJoinAndSelect('activity.liked_by', 'liked_by')
        .andWhere('activity.hidden_at IS NULL');
    }

    if (filters.title) qb.andWhere('activity.title LIKE :title', { title: `%${filters.title}%` });
    if (filters.location) qb.andWhere('activity.location LIKE :loc', { loc: `%${filters.location}%` });
    if (filters.is_public !== undefined) qb.andWhere('activity.is_public = :pub', { pub: filters.is_public });
    if (filters.query)
      qb.andWhere(
        '(activity.title LIKE :q OR activity.description LIKE :q)',
        { q: `%${filters.query}%` },
      );
    if (filters.start_date) qb.andWhere('activity.start_date >= :sd', { sd: filters.start_date });
    if (filters.end_date) qb.andWhere('activity.end_date <= :ed', { ed: filters.end_date });
    if (filters.happening_now) {
      const now = new Date();
      qb.andWhere('activity.start_date <= :now AND activity.end_date >= :now', { now });
    }
    if (filters.interest_ids?.length)
      qb.leftJoin('activity.interests', 'interests').andWhere('interests.id IN (:...ids)', { ids: filters.interest_ids });

    qb.orderBy(filters.trending ? 'activity.likes_count' : 'activity.start_date', 'DESC');

    const [activities, total] = await qb.getManyAndCount();

    const enriched = await Promise.all(
      activities.map(async (act) => {
        const [lastP, totalP] = await Promise.all([
          this.getLastParticipants(act.id),
          this.getTotalParticipantsCount(act.id),
        ]);
        const isLiked = userId ? act.liked_by?.some((u) => u.id === userId) ?? false : false;
        const isCoOrg = userId ? act.co_organizers?.some((u) => u.id === userId) ?? false : false;
        const hasJoined = userId ? await this.hasUserJoinedActivity(act.id, userId) : false;
        return this.cleanActivityArrays({
          ...act,
          participants: lastP,
          total_participants_count: totalP,
          is_liked: isLiked,
          is_organiser: act.creator_id === userId || isCoOrg,
          has_joined: hasJoined,
        });
      }),
    );

    const result = {
      activities: plainToInstance(ActivityResponseDto, enriched, { excludeExtraneousValues: true }),
      total,
    };
    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: number, userId?: string): Promise<Activity> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .leftJoinAndSelect('activity.co_organizers', 'co_organizers')
      .leftJoinAndSelect('activity.interests', 'interests')
      .leftJoinAndSelect('activity.bonds', 'bonds')
      .where('activity.id = :id', { id });
    if (userId) qb.leftJoinAndSelect('activity.liked_by', 'liked_by').andWhere('activity.hidden_at IS NULL');
    const activity = await qb.getOne();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async findOneResponse(id: number, userId?: string): Promise<ActivityResponseDto> {
    const raw = await this.findOne(id, userId);
    const [lastP, totalP] = await Promise.all([this.getLastParticipants(raw.id), this.getTotalParticipantsCount(raw.id)]);
    const isLiked = userId ? raw.liked_by?.some((u) => u.id === userId) ?? false : false;
    const isCoOrg = userId ? raw.co_organizers?.some((u) => u.id === userId) ?? false : false;
    const hasJoined = userId ? await this.hasUserJoinedActivity(raw.id, userId) : false;
    const cleaned = this.cleanActivityArrays({
      ...raw,
      participants: lastP,
      total_participants_count: totalP,
      is_liked: isLiked,
      is_organiser: raw.creator_id === userId || isCoOrg,
      has_joined: hasJoined,
    });
    return plainToInstance(ActivityResponseDto, cleaned, { excludeExtraneousValues: true });
  }

  async remove(id: number): Promise<void> {
    const activity = await this.findOne(id);
    await this.activityRepo.remove(activity);
    await this.clearActivityCache(id);
  }

  async hideActivity(id: number): Promise<{ message: string }> {
    const activity = await this.activityRepo.findOne({ where: { id }, select: ['id', 'hidden_at'] });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    if (activity.hidden_at) return { message: 'Activity is already hidden' };
    await this.activityRepo.update(id, { hidden_at: new Date() });
    await this.clearActivityCache(id);
    return { message: 'Activity hidden' };
  }

  async unhideActivity(id: number): Promise<{ message: string }> {
    const activity = await this.activityRepo.findOne({ where: { id }, select: ['id', 'hidden_at'] });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    if (!activity.hidden_at) return { message: 'Activity is not hidden' };
    await this.activityRepo.update(id, { hidden_at: null });
    await this.clearActivityCache(id);
    return { message: 'Activity un-hidden' };
  }

  async getAllReports(page = 1, limit = 20): Promise<{ reports: any[]; total: number }> {
    const [reports, total] = await this.reportRepo.findAndCount({
      relations: ['activity', 'reporter'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { reports, total };
  }

  async reviewReport(reportId: number, reviewerId: string, status: ReportStatus, notes?: string): Promise<ActivityReport> {
    await this.reportRepo.update(reportId, { status, review_notes: notes ?? null, reviewed_by: reviewerId, reviewed_at: new Date() });
    return this.reportRepo.findOneOrFail({ where: { id: reportId }, relations: ['activity', 'reporter'] });
  }

  async getTrendingActivities(page = 1, limit = 20): Promise<{ activities: ActivityResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .addSelect((sub) =>
        sub.select('COUNT(ap.user_id)', 'participantCount')
          .from('activity_participants', 'ap')
          .where('ap.activity_id = activity.id'),
        'participantCount',
      )
      .orderBy('participantCount', 'DESC')
      .skip(skip)
      .take(limit);

    const [activities, total] = await qb.getManyAndCount();
    return {
      activities: plainToInstance(ActivityResponseDto, activities, { excludeExtraneousValues: true }),
      total,
    };
  }

  /* ----------  HELPERS  ---------- */

  private async hasUserJoinedActivity(activityId: number, userId: string): Promise<boolean> {
    const res = await this.activityRepo.query(
      `SELECT 1 FROM activity_participants WHERE activity_id = ? AND user_id = ? LIMIT 1`,
      [activityId, userId],
    );
    return !!res.length;
  }

  private async getLastParticipants(activityId: number): Promise<any[]> {
    const rows = await this.activityRepo.query(
      `SELECT u.id, u.full_name, u.user_name, u.profile_image
         FROM activity_participants ap
         JOIN users u ON u.id = ap.user_id
        WHERE ap.activity_id = ?
        ORDER BY ap.joined_at DESC
        LIMIT 5`,
      [activityId],
    );
    return rows.map((r: any) => ({
      id: r.id,
      full_name: r.full_name || null,
      user_name: r.user_name || null,
      profile_image: r.profile_image || null,
    }));
  }

  private async getTotalParticipantsCount(activityId: number): Promise<number> {
    const res = await this.activityRepo.query(
      `SELECT COUNT(DISTINCT user_id) AS c FROM activity_participants WHERE activity_id = ?`,
      [activityId],
    );
    return parseInt(res[0]?.c || '0', 10);
  }

  private cleanActivityArrays(activity: any): any {
    const cleaned = { ...activity };
    ['co_organizers', 'interests', 'bonds', 'liked_by'].forEach((key) => {
      if (!Array.isArray(cleaned[key]) || cleaned[key].length === 0) delete cleaned[key];
    });
    if (!Array.isArray(cleaned.participants)) cleaned.participants = [];
    if (!Array.isArray(cleaned.interests)) cleaned.interests = [];
    return cleaned;
  }

  private transformFormData(dto: any): any {
    const t = { ...dto };
    const idx = (field: string) =>
      Object.keys(t)
        .filter((k) => k.startsWith(`${field}[`))
        .sort()
        .map((k) => t[k])
        .filter(Boolean);
    ['interest_ids', 'bond_ids', 'co_organizer_ids', 'invited_participant_ids'].forEach((f) => {
      if (typeof t[f] === 'string') t[f] = t[f].split(',').map((v: string) => v.trim()).filter(Boolean);
      else if (!Array.isArray(t[f])) t[f] = idx(f);
    });
    return t;
  }

  private async clearActivityCache(activityId?: number) {
    const keys = ['activities:all', 'activities:trending'];
    if (activityId) keys.push(`activity:${activityId}`);
    await Promise.all(keys.map((k) => this.cacheManager.del(k)));
  }
}