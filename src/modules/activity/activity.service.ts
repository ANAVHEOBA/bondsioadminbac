import { Injectable, NotFoundException, BadRequestException, Inject, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Like, LessThanOrEqual, MoreThanOrEqual, Between, Brackets, Not, IsNull } from 'typeorm';
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
import { ActivityStatsDto } from './dto/activity-stats.dto';
import { ActivityAnalyticsDto, LocationAnalyticsDto, PeakTimeAnalyticsDto, EngagementMetricsDto, CreatorAnalyticsDto } from './dto/activity-analytics.dto';
import { AdvancedSearchActivityDto } from './dto/advanced-search-activity.dto';
import { ReportStatsDto, ReportByReasonDto, ReportByStatusDto, ReportTrendsDto } from './dto/report-stats.dto';


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
    if (filters.visibility) qb.andWhere('activity.visibility = :vis', { vis: filters.visibility });
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

  async getPendingReports(page = 1, limit = 20): Promise<{ reports: any[]; total: number }> {
    const [reports, total] = await this.reportRepo.findAndCount({
      where: { status: ReportStatus.PENDING },
      relations: ['activity', 'reporter'],
      order: { created_at: 'ASC' }, // Oldest pending reports first for review priority
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

  async getActivityStats(): Promise<ActivityStatsDto> {
    const cacheKey = 'activity:stats';
    const cached = await this.cacheManager.get<ActivityStatsDto>(cacheKey);
    if (cached) return cached;

    // Get current date boundaries
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for better performance
    const [
      totalActivities,
      hiddenActivities,
      publicActivities,
      privateActivities,
      bondOnlyActivities,
      totalParticipants,
      activitiesLast24h,
      activitiesLast7d,
      activitiesLast30d,
      totalReports,
      pendingReports,
    ] = await Promise.all([
      // Total activities count
      this.activityRepo.count(),
      
      // Hidden activities count
      this.activityRepo.createQueryBuilder('activity')
        .where('activity.hidden_at IS NOT NULL')
        .getCount(),
      
      // Public activities count
      this.activityRepo.count({ where: { visibility: 'public' } }),
      
      // Private activities count
      this.activityRepo.count({ where: { visibility: 'private' } }),
      
      // Bond-only activities count
      this.activityRepo.count({ where: { visibility: 'bond_only' } }),
      
      // Total participants across all activities
      this.activityRepo.query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM activity_participants
      `).then(result => parseInt(result[0]?.count || '0', 10)),
      
      // Activities created in last 24 hours
      this.activityRepo.count({ 
        where: { 
          start_date: MoreThanOrEqual(last24h) 
        } 
      }),
      
      // Activities created in last 7 days
      this.activityRepo.count({ 
        where: { 
          start_date: MoreThanOrEqual(last7d) 
        } 
      }),
      
      // Activities created in last 30 days
      this.activityRepo.count({ 
        where: { 
          start_date: MoreThanOrEqual(last30d) 
        } 
      }),
      
      // Total reports
      this.reportRepo.count(),
      
      // Pending reports
      this.reportRepo.count({ where: { status: ReportStatus.PENDING } }),
    ]);

    const activeActivities = totalActivities - hiddenActivities;
    const averageParticipantsPerActivity = totalActivities > 0 
      ? Math.round((totalParticipants / totalActivities) * 100) / 100 
      : 0;

    const stats: ActivityStatsDto = {
      total_activities: totalActivities,
      active_activities: activeActivities,
      hidden_activities: hiddenActivities,
      public_activities: publicActivities,
      private_activities: privateActivities,
      bond_only_activities: bondOnlyActivities,
      total_participants: totalParticipants,
      average_participants_per_activity: averageParticipantsPerActivity,
      activities_last_24h: activitiesLast24h,
      activities_last_7d: activitiesLast7d,
      activities_last_30d: activitiesLast30d,
      total_reports: totalReports,
      pending_reports: pendingReports,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);
    return stats;
  }

  async getActivityAnalytics(): Promise<ActivityAnalyticsDto> {
    const cacheKey = 'activity:analytics';
    const cached = await this.cacheManager.get<ActivityAnalyticsDto>(cacheKey);
    if (cached) return cached;

    // Execute all analytics queries in parallel
    const [
      popularLocations,
      peakTimes,
      engagementMetrics,
      topCreators,
      activityTrends,
      participationTrends,
    ] = await Promise.all([
      this.getPopularLocations(),
      this.getPeakTimes(),
      this.getEngagementMetrics(),
      this.getTopCreators(),
      this.getActivityTrends(),
      this.getParticipationTrends(),
    ]);

    const analytics: ActivityAnalyticsDto = {
      popular_locations: popularLocations,
      peak_times: peakTimes,
      engagement_metrics: engagementMetrics,
      top_creators: topCreators,
      activity_trends: activityTrends,
      participation_trends: participationTrends,
    };

    // Cache for 10 minutes (analytics can be less frequent)
    await this.cacheManager.set(cacheKey, analytics, 600);
    return analytics;
  }

  private async getPopularLocations(): Promise<LocationAnalyticsDto[]> {
    const result = await this.activityRepo.query(`
      SELECT 
        a.location,
        COUNT(a.id) as activity_count,
        COALESCE(SUM(participant_counts.participant_count), 0) as total_participants,
        COALESCE(AVG(participant_counts.participant_count), 0) as avg_participants
      FROM activities a
      LEFT JOIN (
        SELECT 
          activity_id, 
          COUNT(user_id) as participant_count
        FROM activity_participants 
        GROUP BY activity_id
      ) participant_counts ON a.id = participant_counts.activity_id
      WHERE a.location IS NOT NULL AND a.location != ''
      GROUP BY a.location
      HAVING COUNT(a.id) >= 2
      ORDER BY activity_count DESC, total_participants DESC
      LIMIT 10
    `);

    return result.map((row: any) => ({
      location: row.location,
      activity_count: parseInt(row.activity_count, 10),
      total_participants: parseInt(row.total_participants, 10),
      avg_participants: Math.round(parseFloat(row.avg_participants) * 100) / 100,
    }));
  }

  private async getPeakTimes(): Promise<PeakTimeAnalyticsDto[]> {
    const result = await this.activityRepo.query(`
      SELECT 
        HOUR(start_date) as hour,
        (DAYOFWEEK(start_date) - 1) as day_of_week,
        COUNT(a.id) as activity_count,
        COALESCE(SUM(participant_counts.participant_count), 0) as total_participants
      FROM activities a
      LEFT JOIN (
        SELECT 
          activity_id, 
          COUNT(user_id) as participant_count
        FROM activity_participants 
        GROUP BY activity_id
      ) participant_counts ON a.id = participant_counts.activity_id
      WHERE a.start_date IS NOT NULL
      GROUP BY HOUR(start_date), (DAYOFWEEK(start_date) - 1)
      ORDER BY activity_count DESC
      LIMIT 20
    `);

    return result.map((row: any) => ({
      hour: parseInt(row.hour, 10),
      day_of_week: parseInt(row.day_of_week, 10),
      activity_count: parseInt(row.activity_count, 10),
      total_participants: parseInt(row.total_participants, 10),
    }));
  }

  private async getEngagementMetrics(): Promise<EngagementMetricsDto> {
    const [
      avgLikes,
      avgParticipants,
      completionRate,
      avgDuration,
      popularVisibility,
      reportRate,
    ] = await Promise.all([
      // Average likes per activity
      this.activityRepo.query(`
        SELECT AVG(likes_count) as avg_likes FROM activities
      `).then(result => parseFloat(result[0]?.avg_likes || '0')),

      // Average participants per activity
      this.activityRepo.query(`
        SELECT AVG(participant_count) as avg_participants
        FROM (
          SELECT COUNT(user_id) as participant_count
          FROM activity_participants 
          GROUP BY activity_id
        ) participant_counts
      `).then(result => parseFloat(result[0]?.avg_participants || '0')),

      // Completion rate (activities that have ended vs total)
      this.activityRepo.query(`
        SELECT 
          COUNT(CASE WHEN end_date < NOW() THEN 1 END) * 100.0 / COUNT(*) as completion_rate
        FROM activities
        WHERE end_date IS NOT NULL
      `).then(result => parseFloat(result[0]?.completion_rate || '0')),

      // Average duration in hours
      this.activityRepo.query(`
        SELECT AVG(TIMESTAMPDIFF(SECOND, start_date, end_date) / 3600) as avg_duration_hours
        FROM activities
        WHERE start_date IS NOT NULL AND end_date IS NOT NULL
      `).then(result => parseFloat(result[0]?.avg_duration_hours || '0')),

      // Most popular visibility type
      this.activityRepo.query(`
        SELECT visibility, COUNT(*) as count
        FROM activities
        GROUP BY visibility
        ORDER BY count DESC
        LIMIT 1
      `).then(result => result[0]?.visibility || 'public'),

      // Report rate per 100 activities
      Promise.all([
        this.reportRepo.count(),
        this.activityRepo.count(),
      ]).then(([reports, activities]) => 
        activities > 0 ? (reports / activities) * 100 : 0
      ),
    ]);

    return {
      avg_likes_per_activity: Math.round(avgLikes * 100) / 100,
      avg_participants_per_activity: Math.round(avgParticipants * 100) / 100,
      completion_rate: Math.round(completionRate * 100) / 100,
      avg_duration_hours: Math.round(avgDuration * 100) / 100,
      most_popular_visibility: popularVisibility,
      report_rate: Math.round(reportRate * 100) / 100,
    };
  }

  private async getTopCreators(): Promise<CreatorAnalyticsDto[]> {
    const result = await this.activityRepo.query(`
      SELECT 
        u.id as creator_id,
        u.full_name as creator_name,
        COUNT(a.id) as activity_count,
        COALESCE(SUM(participant_counts.participant_count), 0) as total_participants,
        COALESCE(AVG(participant_counts.participant_count), 0) as avg_participants,
        COALESCE(SUM(a.likes_count), 0) as total_likes
      FROM users u
      JOIN activities a ON u.id = a.creator_id
      LEFT JOIN (
        SELECT 
          activity_id, 
          COUNT(user_id) as participant_count
        FROM activity_participants 
        GROUP BY activity_id
      ) participant_counts ON a.id = participant_counts.activity_id
      WHERE a.hidden_at IS NULL
      GROUP BY u.id, u.full_name
      HAVING COUNT(a.id) >= 2
      ORDER BY activity_count DESC, total_participants DESC
      LIMIT 10
    `);

    return result.map((row: any) => ({
      creator_id: row.creator_id,
      creator_name: row.creator_name || 'Unknown',
      activity_count: parseInt(row.activity_count, 10),
      total_participants: parseInt(row.total_participants, 10),
      avg_participants: Math.round(parseFloat(row.avg_participants) * 100) / 100,
      total_likes: parseInt(row.total_likes, 10),
    }));
  }

  private async getActivityTrends(): Promise<{ date: string; count: number }[]> {
    const result = await this.activityRepo.query(`
      SELECT 
        DATE(start_date) as date,
        COUNT(*) as count
      FROM activities
      WHERE start_date >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(start_date)
      ORDER BY date DESC
    `);

    return result.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));
  }

  private async getParticipationTrends(): Promise<{ date: string; count: number }[]> {
    const result = await this.activityRepo.query(`
      SELECT 
        DATE(ap.joined_at) as date,
        COUNT(DISTINCT ap.user_id) as count
      FROM activity_participants ap
      WHERE ap.joined_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(ap.joined_at)
      ORDER BY date DESC
    `);

    return result.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));
  }

  async advancedSearchActivities(searchDto: AdvancedSearchActivityDto): Promise<{ activities: ActivityResponseDto[]; total: number }> {
    const { q, sort_by = 'start_date', sort_order = 'DESC', page = 1, limit = 20 } = searchDto;
    const skip = (page - 1) * limit;

    // Build the query
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .leftJoinAndSelect('activity.interests', 'interests')
      .leftJoinAndSelect('activity.bonds', 'bonds')
      .skip(skip)
      .take(limit);

    // Full-text search across title, description, and location
    if (q) {
      qb.andWhere(
        '(activity.title LIKE :q OR activity.description LIKE :q OR activity.location LIKE :q)',
        { q: `%${q}%` }
      );
    }

    // Apply filters
    if (searchDto.title) {
      qb.andWhere('activity.title LIKE :title', { title: `%${searchDto.title}%` });
    }

    if (searchDto.location) {
      qb.andWhere('activity.location LIKE :location', { location: `%${searchDto.location}%` });
    }

    if (searchDto.creator) {
      qb.andWhere(
        '(creator.full_name LIKE :creator OR creator.user_name LIKE :creator)',
        { creator: `%${searchDto.creator}%` }
      );
    }

    if (searchDto.visibility) {
      qb.andWhere('activity.visibility = :visibility', { visibility: searchDto.visibility });
    }

    // Date range filters
    if (searchDto.start_date_from) {
      qb.andWhere('activity.start_date >= :start_date_from', { start_date_from: searchDto.start_date_from });
    }

    if (searchDto.start_date_to) {
      qb.andWhere('activity.start_date <= :start_date_to', { start_date_to: searchDto.start_date_to });
    }

    if (searchDto.end_date_from) {
      qb.andWhere('activity.end_date >= :end_date_from', { end_date_from: searchDto.end_date_from });
    }

    if (searchDto.end_date_to) {
      qb.andWhere('activity.end_date <= :end_date_to', { end_date_to: searchDto.end_date_to });
    }

    // Participants count filters
    if (searchDto.min_participants !== undefined) {
      qb.addSelect((subQuery) =>
        subQuery
          .select('COUNT(ap.user_id)', 'participant_count')
          .from('activity_participants', 'ap')
          .where('ap.activity_id = activity.id'),
        'participant_count'
      )
      .having('participant_count >= :min_participants', { min_participants: searchDto.min_participants });
    }

    if (searchDto.max_participants !== undefined) {
      if (searchDto.min_participants === undefined) {
        qb.addSelect((subQuery) =>
          subQuery
            .select('COUNT(ap.user_id)', 'participant_count')
            .from('activity_participants', 'ap')
            .where('ap.activity_id = activity.id'),
          'participant_count'
        );
      }
      qb.having('participant_count <= :max_participants', { max_participants: searchDto.max_participants });
    }

    // Likes count filter
    if (searchDto.min_likes !== undefined) {
      qb.andWhere('activity.likes_count >= :min_likes', { min_likes: searchDto.min_likes });
    }

    // Status filter
    if (searchDto.status) {
      const now = new Date();
      switch (searchDto.status) {
        case 'upcoming':
          qb.andWhere('activity.start_date > :now', { now });
          break;
        case 'ongoing':
          qb.andWhere('activity.start_date <= :now AND activity.end_date >= :now', { now });
          break;
        case 'completed':
          qb.andWhere('activity.end_date < :now', { now });
          break;
        case 'expired':
          qb.andWhere('activity.end_date < :now AND activity.start_date < :now', { now });
          break;
      }
    }

    // Hidden status filter
    if (searchDto.is_hidden !== undefined) {
      if (searchDto.is_hidden) {
        qb.andWhere('activity.hidden_at IS NOT NULL');
      } else {
        qb.andWhere('activity.hidden_at IS NULL');
      }
    }

    // Has reports filter
    if (searchDto.has_reports) {
      qb.leftJoin('activity_reports', 'reports', 'reports.activity_id = activity.id')
        .andWhere('reports.id IS NOT NULL');
    }

    // Interest IDs filter
    if (searchDto.interest_ids) {
      const interestIds = searchDto.interest_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (interestIds.length > 0) {
        qb.andWhere('interests.id IN (:...interestIds)', { interestIds });
      }
    }

    // Bond IDs filter
    if (searchDto.bond_ids) {
      const bondIds = searchDto.bond_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (bondIds.length > 0) {
        qb.andWhere('bonds.id IN (:...bondIds)', { bondIds });
      }
    }

    // Sorting
    let sortField = 'activity.start_date';
    switch (sort_by) {
      case 'created_at':
        sortField = 'activity.created_at';
        break;
      case 'likes_count':
        sortField = 'activity.likes_count';
        break;
      case 'participants_count':
        // For participants count, we need to add a subquery
        qb.addSelect((subQuery) =>
          subQuery
            .select('COUNT(ap.user_id)', 'participant_count')
            .from('activity_participants', 'ap')
            .where('ap.activity_id = activity.id'),
          'participant_count'
        );
        sortField = 'participant_count';
        break;
      case 'title':
        sortField = 'activity.title';
        break;
      case 'location':
        sortField = 'activity.location';
        break;
      default:
        sortField = 'activity.start_date';
    }

    qb.orderBy(sortField, sort_order);

    const [activities, total] = await qb.getManyAndCount();

    // Enrich activities with additional data
    const enriched = await Promise.all(
      activities.map(async (act) => {
        const [lastP, totalP] = await Promise.all([
          this.getLastParticipants(act.id),
          this.getTotalParticipantsCount(act.id),
        ]);
        return this.cleanActivityArrays({
          ...act,
          participants: lastP,
          total_participants_count: totalP,
          is_liked: false, // Admin context, no user-specific data
          is_organiser: false, // Admin context
          has_joined: false, // Admin context
        });
      }),
    );

    return {
      activities: plainToInstance(ActivityResponseDto, enriched, { excludeExtraneousValues: true }),
      total,
    };
  }

  async getActivitiesByCreator(
    creatorId: string, 
    page = 1, 
    limit = 20, 
    includeHidden = true
  ): Promise<{ activities: ActivityResponseDto[]; total: number; creator: any }> {
    const skip = (page - 1) * limit;

    // First, get the creator information
    const creator = await this.userRepo.findOne({
      where: { id: creatorId },
      select: ['id', 'full_name', 'user_name', 'profile_image', 'email', 'created_at']
    });

    if (!creator) {
      throw new NotFoundException(`Creator with ID ${creatorId} not found`);
    }

    // Build the query for activities
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .leftJoinAndSelect('activity.interests', 'interests')
      .leftJoinAndSelect('activity.bonds', 'bonds')
      .where('activity.creator_id = :creatorId', { creatorId })
      .orderBy('activity.start_date', 'DESC')
      .skip(skip)
      .take(limit);

    // Include or exclude hidden activities based on parameter
    if (!includeHidden) {
      qb.andWhere('activity.hidden_at IS NULL');
    }

    const [activities, total] = await qb.getManyAndCount();

    // Enrich activities with additional data
    const enriched = await Promise.all(
      activities.map(async (act) => {
        const [lastP, totalP] = await Promise.all([
          this.getLastParticipants(act.id),
          this.getTotalParticipantsCount(act.id),
        ]);
        return this.cleanActivityArrays({
          ...act,
          participants: lastP,
          total_participants_count: totalP,
          is_liked: false, // Admin context
          is_organiser: false, // Admin context
          has_joined: false, // Admin context
        });
      }),
    );

    return {
      activities: plainToInstance(ActivityResponseDto, enriched, { excludeExtraneousValues: true }),
      total,
      creator: {
        id: creator.id,
        full_name: creator.full_name,
        user_name: creator.user_name,
        profile_image: creator.profile_image,
        email: creator.email,
        member_since: creator.created_at,
      },
    };
  }

  async getReportStats(): Promise<ReportStatsDto> {
    const cacheKey = 'activity:report-stats';
    const cached = await this.cacheManager.get<ReportStatsDto>(cacheKey);
    if (cached) return cached;

    // Get current date boundaries
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel
    const [
      totalReports,
      pendingReports,
      reviewedReports,
      resolvedReports,
      dismissedReports,
      reportsLast24h,
      reportsLast7d,
      reportsLast30d,
      avgResolutionTime,
      reportsByReason,
      reportsByStatus,
      reportTrends,
      mostReportedActivity,
      uniqueReporters,
      uniqueReportedActivities,
    ] = await Promise.all([
      // Total reports count
      this.reportRepo.count(),

      // Reports by status
      this.reportRepo.count({ where: { status: ReportStatus.PENDING } }),
      this.reportRepo.count({ where: { status: ReportStatus.REVIEWED } }),
      this.reportRepo.count({ where: { status: ReportStatus.RESOLVED } }),
      this.reportRepo.count({ where: { status: ReportStatus.DISMISSED } }),

      // Reports in time periods
      this.reportRepo.count({ where: { created_at: MoreThanOrEqual(last24h) } }),
      this.reportRepo.count({ where: { created_at: MoreThanOrEqual(last7d) } }),
      this.reportRepo.count({ where: { created_at: MoreThanOrEqual(last30d) } }),

      // Average resolution time
      this.reportRepo.query(`
        SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, reviewed_at)) as avg_hours
        FROM activity_reports
        WHERE reviewed_at IS NOT NULL
      `).then(result => parseFloat(result[0]?.avg_hours || '0')),

      // Reports by reason
      this.reportRepo.query(`
        SELECT reason, COUNT(*) as count
        FROM activity_reports
        GROUP BY reason
        ORDER BY count DESC
      `),

      // Reports by status
      this.reportRepo.query(`
        SELECT status, COUNT(*) as count
        FROM activity_reports
        GROUP BY status
        ORDER BY count DESC
      `),

      // Report trends (last 30 days)
      this.reportRepo.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM activity_reports
        WHERE created_at >= NOW() - INTERVAL 30 DAY
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `),

      // Most reported activity
      this.reportRepo.query(`
        SELECT activity_id, COUNT(*) as count
        FROM activity_reports
        GROUP BY activity_id
        ORDER BY count DESC
        LIMIT 1
      `).then(result => result[0] || { activity_id: null, count: 0 }),

      // Unique reporters count
      this.reportRepo.query(`
        SELECT COUNT(DISTINCT reporter_id) as count
        FROM activity_reports
      `).then(result => parseInt(result[0]?.count || '0', 10)),

      // Unique reported activities count
      this.reportRepo.query(`
        SELECT COUNT(DISTINCT activity_id) as count
        FROM activity_reports
      `).then(result => parseInt(result[0]?.count || '0', 10)),
    ]);

    // Process reports by reason
    const reasonStats: ReportByReasonDto[] = reportsByReason.map((row: any) => ({
      reason: row.reason,
      count: parseInt(row.count, 10),
      percentage: totalReports > 0 ? Math.round((parseInt(row.count, 10) / totalReports) * 10000) / 100 : 0,
    }));

    // Process reports by status
    const statusStats: ReportByStatusDto[] = reportsByStatus.map((row: any) => ({
      status: row.status,
      count: parseInt(row.count, 10),
      percentage: totalReports > 0 ? Math.round((parseInt(row.count, 10) / totalReports) * 10000) / 100 : 0,
    }));

    // Process report trends
    const trends: ReportTrendsDto[] = reportTrends.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));

    const stats: ReportStatsDto = {
      total_reports: totalReports,
      pending_reports: pendingReports,
      reviewed_reports: reviewedReports,
      resolved_reports: resolvedReports,
      dismissed_reports: dismissedReports,
      reports_last_24h: reportsLast24h,
      reports_last_7d: reportsLast7d,
      reports_last_30d: reportsLast30d,
      avg_resolution_time_hours: Math.round(avgResolutionTime * 100) / 100,
      reports_by_reason: reasonStats,
      reports_by_status: statusStats,
      report_trends: trends,
      most_reported_activity_id: mostReportedActivity.activity_id ? parseInt(mostReportedActivity.activity_id, 10) : null,
      most_reported_activity_count: parseInt(mostReportedActivity.count || '0', 10),
      unique_reporters: uniqueReporters,
      unique_reported_activities: uniqueReportedActivities,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);
    return stats;
  }

  async getUpcomingActivities(page = 1, limit = 20, hoursAhead = 48): Promise<{ activities: ActivityResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;
    
    // Calculate time boundaries
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now (buffer for "starting soon")
    const endTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000); // Default 48 hours from now

    // Build query for upcoming activities
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .leftJoinAndSelect('activity.interests', 'interests')
      .leftJoinAndSelect('activity.bonds', 'bonds')
      .where('activity.start_date BETWEEN :startTime AND :endTime', { 
        startTime: startTime.toISOString(), 
        endTime: endTime.toISOString() 
      })
      .andWhere('activity.hidden_at IS NULL') // Exclude hidden activities
      .orderBy('activity.start_date', 'ASC') // Soonest first
      .skip(skip)
      .take(limit);

    const [activities, total] = await qb.getManyAndCount();

    // Enrich activities with additional data
    const enriched = await Promise.all(
      activities.map(async (act) => {
        const [lastP, totalP] = await Promise.all([
          this.getLastParticipants(act.id),
          this.getTotalParticipantsCount(act.id),
        ]);
        return this.cleanActivityArrays({
          ...act,
          participants: lastP,
          total_participants_count: totalP,
          is_liked: false, // Admin context
          is_organiser: false, // Admin context
          has_joined: false, // Admin context
        });
      }),
    );

    return {
      activities: plainToInstance(ActivityResponseDto, enriched, { excludeExtraneousValues: true }),
      total,
    };
  }

  async getActivityParticipants(
    activityId: number, 
    page = 1, 
    limit = 50
  ): Promise<{ participants: any[]; total: number; activity_info: any }> {
    const skip = (page - 1) * limit;

    // First, verify the activity exists and get basic info
    const activity = await this.activityRepo.findOne({
      where: { id: activityId },
      relations: ['creator'],
      select: ['id', 'title', 'start_date', 'end_date', 'max_participants', 'creator_id']
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    // Get participants with detailed user information using raw query for better control
    const participantsQuery = `
      SELECT 
        u.id,
        u.full_name,
        u.user_name,
        u.email,
        u.profile_image,
        u.created_at as member_since,
        ap.joined_at,
        CASE WHEN u.id = ? THEN 'creator' 
             WHEN ao.user_id IS NOT NULL THEN 'organizer' 
             ELSE 'participant' END as role
      FROM activity_participants ap
      JOIN users u ON ap.user_id = u.id
      LEFT JOIN activity_co_organizers ao ON ao.activity_id = ap.activity_id AND ao.user_id = u.id
      WHERE ap.activity_id = ?
      ORDER BY 
        CASE WHEN u.id = ? THEN 0 ELSE 1 END,
        ap.joined_at ASC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_participants ap
      WHERE ap.activity_id = ?
    `;

    const [participants, countResult] = await Promise.all([
      this.activityRepo.query(participantsQuery, [
        activity.creator_id, 
        activityId, 
        activity.creator_id, 
        limit, 
        skip
      ]),
      this.activityRepo.query(countQuery, [activityId])
    ]);

    const total = parseInt(countResult[0]?.total || '0', 10);

    // Format participant data
    const formattedParticipants = participants.map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      user_name: p.user_name,
      email: p.email,
      profile_image: p.profile_image,
      member_since: p.member_since,
      joined_at: p.joined_at,
      role: p.role,
    }));

    return {
      participants: formattedParticipants,
      total,
      activity_info: {
        id: activity.id,
        title: activity.title,
        start_date: activity.start_date,
        end_date: activity.end_date,
        max_participants: activity.max_participants,
        current_participants: total,
        creator: activity.creator ? {
          id: activity.creator.id,
          full_name: activity.creator.full_name,
          user_name: activity.creator.user_name,
          profile_image: activity.creator.profile_image,
        } : null
      }
    };
  }

  async getTopActivityCreators(queryDto: any): Promise<{ creators: any[]; total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      sort_by = 'activity_count', 
      min_activities = 1, 
      days_back = 0, 
      include_hidden = false 
    } = queryDto;
    
    const skip = (page - 1) * limit;
    
    // Build date filter if days_back is specified
    let dateFilter = '';
    const params: any[] = [];
    
    if (days_back > 0) {
      dateFilter = 'AND a.start_date >= NOW() - INTERVAL ? DAY';
      params.push(days_back);
    }
    
    // Build hidden filter
    const hiddenFilter = include_hidden ? '' : 'AND a.hidden_at IS NULL';
    
    // Build the main query
    const query = `
      SELECT 
        u.id as creator_id,
        u.full_name as creator_name,
        u.user_name,
        u.profile_image,
        u.email,
        u.created_at as member_since,
        COUNT(DISTINCT a.id) as activity_count,
        COALESCE(SUM(participant_counts.participant_count), 0) as total_participants,
        COALESCE(AVG(participant_counts.participant_count), 0) as avg_participants,
        COALESCE(SUM(a.likes_count), 0) as total_likes,
        ROUND(
          (COUNT(DISTINCT a.id) * 0.4) + 
          (COALESCE(SUM(participant_counts.participant_count), 0) * 0.3) + 
          (COALESCE(SUM(a.likes_count), 0) * 0.3), 2
        ) as engagement_score
      FROM users u
      JOIN activities a ON u.id = a.creator_id
      LEFT JOIN (
        SELECT 
          activity_id, 
          COUNT(user_id) as participant_count
        FROM activity_participants 
        GROUP BY activity_id
      ) participant_counts ON a.id = participant_counts.activity_id
      WHERE 1=1 ${dateFilter} ${hiddenFilter}
      GROUP BY u.id, u.full_name, u.user_name, u.profile_image, u.email, u.created_at
      HAVING COUNT(DISTINCT a.id) >= ?
      ORDER BY ${this.getSortField(sort_by)} DESC
      LIMIT ? OFFSET ?
    `;
    
    // Count query for total
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN activities a ON u.id = a.creator_id
      WHERE 1=1 ${dateFilter} ${hiddenFilter}
      GROUP BY u.id
      HAVING COUNT(DISTINCT a.id) >= ?
    `;
    
    // Add parameters
    const queryParams = [...params, min_activities, limit, skip];
    const countParams = [...params, min_activities];
    
    const [creators, countResult] = await Promise.all([
      this.activityRepo.query(query, queryParams),
      this.activityRepo.query(`SELECT COUNT(*) as total FROM (${countQuery}) as subquery`, countParams)
    ]);
    
    const total = parseInt(countResult[0]?.total || '0', 10);
    
    // Format the results
    const formattedCreators = creators.map((creator: any) => ({
      creator_id: creator.creator_id,
      creator_name: creator.creator_name || 'Unknown',
      user_name: creator.user_name,
      profile_image: creator.profile_image,
      email: creator.email,
      member_since: creator.member_since,
      activity_count: parseInt(creator.activity_count, 10),
      total_participants: parseInt(creator.total_participants, 10),
      avg_participants: Math.round(parseFloat(creator.avg_participants || '0') * 100) / 100,
      total_likes: parseInt(creator.total_likes, 10),
      engagement_score: parseFloat(creator.engagement_score || '0'),
    }));
    
    return {
      creators: formattedCreators,
      total,
    };
  }

  private getSortField(sortBy: string): string {
    switch (sortBy) {
      case 'total_participants':
        return 'total_participants';
      case 'avg_participants':
        return 'avg_participants';
      case 'total_likes':
        return 'total_likes';
      case 'engagement_score':
        return 'engagement_score';
      case 'activity_count':
      default:
        return 'activity_count';
    }
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