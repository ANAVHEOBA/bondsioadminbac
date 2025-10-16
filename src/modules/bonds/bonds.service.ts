/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { FilterBondsDto, BondFilterType, GetBondMembersDto } from './dto/filter-bonds.dto';
import {
  BondResponseDto,
  BondListResponseDto,
  BondDetailResponseDto,
  CreatorResponseDto,
} from './dto/bond-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Like, MoreThanOrEqual } from 'typeorm';
import { Bond } from './entities/bond.entity';
import { User } from '../user/entities/user.entity';
import { UserInterest } from '../user-interests/entities/user-interest.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { v2 as cloudinary } from 'cloudinary';
import { Follow } from '../follows/entities/follow.entity';
import { Activity } from '../activity/entities/activity.entity';
import { ReportBondDto, BondReportResponseDto } from './dto/report-bond.dto';
import { BondReport, ReportReason, ReportStatus } from './entities/bond-report.entity';
import { ZeptomailApiService } from '../../third-party/zeptomail-api/zeptomail-api.service';
import { BondStatsDto } from './dto/bond-stats.dto';
import { BondAnalyticsDto, BondLocationAnalyticsDto, BondEngagementMetricsDto, BondCreatorAnalyticsDto, BondInterestAnalyticsDto, BondGrowthMetricsDto } from './dto/bond-analytics.dto';
import { AdvancedSearchBondDto, BondSearchResponseDto } from './dto/advanced-search-bond.dto';
import { AdminListBondsDto, AdminListBondsResponseDto } from './dto/admin-list-bonds.dto';
import { BondReportStatsDto } from './dto/bond-report-stats.dto';
import { PendingReportDto } from './dto/pending-reports-response.dto';

@Injectable()
export class BondsService {
  private readonly logger = new Logger(BondsService.name);

  constructor(
    @InjectRepository(Bond)
    private readonly bondRepository: Repository<Bond>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserInterest)
    private readonly userInterestRepository: Repository<UserInterest>,
    @InjectRepository(BondReport)
    private readonly bondReportRepository: Repository<BondReport>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly zeptoMailService: ZeptomailApiService,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  MISSING HELPERS  (used internally)                                */
  /* ------------------------------------------------------------------ */
  private logQueryPerformance(method: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.logger.log(`${method} executed in ${duration}ms`);
    if (duration > 1000) this.logger.warn(`Slow query: ${method} took ${duration}ms`);
  }

  private async enrichBondsWithUserData(bonds: any[], userId?: string): Promise<any[]> {
    if (!bonds.length) return bonds;
    const bondIds = bonds.map((b) => b.id);

    // hasJoined
    const joined = userId
      ? await this.bondRepository
          .createQueryBuilder('bond')
          .select('bond.id', 'bondId')
          .innerJoin('bond.users', 'u', 'u.id = :userId', { userId })
          .where('bond.id IN (:...bondIds)', { bondIds })
          .getRawMany()
      : [];
    const joinedSet = new Set(joined.map((j) => j.bondId));

    // lastMembers
    const membersRaw = await this.bondRepository.query(
      `
      SELECT bu.bond_id  as "bondId",
             u.id        as "userId",
             u.full_name as "fullName",
             u.user_name as "userName",
             u.profile_image as "profileImage"
      FROM   bonds_users bu
      JOIN   users u ON u.id = bu.user_id
      WHERE  bu.bond_id IN (${bondIds.map(() => '?').join(',')})
      ORDER  BY bu.bond_id ASC, u.id ASC
      `,
      bondIds,
    );

    const membersMap = new Map<number, any[]>();
    membersRaw.forEach((r: any) => {
      if (!membersMap.has(r.bondId)) membersMap.set(r.bondId, []);
      const arr = membersMap.get(r.bondId)!;
      if (arr.length < 5) arr.push(r);
    });

    bonds.forEach((b) => {
      (b as any).hasJoined = joinedSet.has(b.id);
      (b as any).lastMembers = membersMap.get(b.id) || [];
    });

    return bonds;
  }

  private transformBondResponse(
    bond: any,
    userId?: string,
    recentActivities: any[] = [],
    isCoOrganizer = false,
  ): BondResponseDto {
    return {
      id: bond.id,
      name: bond.name,
      city: bond.city,
      latitude: bond.latitude,
      longitude: bond.longitude,
      description: bond.description,
      max_members: bond.max_members,
      is_unlimited_members: bond.is_unlimited_members,
      request_to_join: bond.request_to_join,
      is_public: bond.is_public,
      post_to_story: bond.post_to_story,
      banner: bond.banner,
      rules: bond.rules,
      is_trending: bond.is_trending,
      view_count: bond.view_count,
      member_count: bond.member_count,
      likes_count: bond.likes_count,
      created_at: bond.created_at,
      updated_at: bond.updated_at,
      hasJoined: userId ? bond.hasJoined || false : false,
      lastMembers: bond.lastMembers || [],
      creator: bond.creator
        ? {
            id: bond.creator.id,
            full_name: bond.creator.full_name,
            user_name: bond.creator.user_name,
            profile_image: bond.creator.profile_image,
          }
        : null,
      userInterests: bond.userInterests || [],
      recentActivities: recentActivities ?? [],
      isCoOrganizer,
    };
  }

  private async loadRecentActivities(bondIds: number[]): Promise<Map<number, any[]>> {
    if (!bondIds.length) return new Map();
    const rows = await this.bondRepository.query(
      `
      SELECT ab.bond_id,
             a.id        AS act_id,
             a.title,
             a.description,
             a.cover_image,
             a.start_date,
             a.end_date,
             a.location
      FROM   activity_bonds ab
      JOIN   activities a ON a.id = ab.activity_id
      WHERE  ab.bond_id IN (${bondIds.map(() => '?').join(',')})
      ORDER  BY a.start_date DESC
      `,
      bondIds,
    );

    const map = new Map<number, any[]>();
    rows.forEach((r: any) => {
      if (!map.has(r.bond_id)) map.set(r.bond_id, []);
      const arr = map.get(r.bond_id)!;
      if (arr.length < 3)
        arr.push({
          id: r.act_id,
          title: r.title,
          description: r.description,
          cover_image: r.cover_image,
          start_date: r.start_date,
          end_date: r.end_date,
          location: r.location,
        });
    });
    bondIds.forEach((id) => {
      if (!map.has(id)) map.set(id, []);
    });
    return map;
  }

  /* ------------------------------------------------------------------ */
  /*  ADMIN – LIST / REVIEW REPORTS                                     */
  /* ------------------------------------------------------------------ */
  async getReportedBondsAdmin(page = 1, limit = 20): Promise<{
    bonds: any[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    // Get bond IDs with report counts
    const bondIdsWithCounts = await this.bondReportRepository
      .createQueryBuilder('br')
      .select('br.bond_id', 'bond_id')
      .addSelect('COUNT(*)', 'total_reports')
      .addSelect(
        'SUM(CASE WHEN br.status = :pending THEN 1 ELSE 0 END)',
        'pending_reports',
      )
      .groupBy('br.bond_id')
      .orderBy('total_reports', 'DESC')
      .offset(skip)
      .limit(limit)
      .setParameter('pending', ReportStatus.PENDING)
      .getRawMany();

    if (bondIdsWithCounts.length === 0) {
      return { bonds: [], total: 0 };
    }

    const bondIds = bondIdsWithCounts.map((b) => b.bond_id);

    // Get full bond details with relations
    const bonds = await this.bondRepository
      .createQueryBuilder('bond')
      .leftJoinAndSelect('bond.creator', 'creator')
      .leftJoinAndSelect('bond.userInterests', 'userInterests')
      .where('bond.id IN (:...bondIds)', { bondIds })
      .getMany();

    // Enrich bonds with member counts
    const enriched = await this.enrichBondsWithUserData(bonds);

    // Get all reports for these bonds (without JOINs to avoid collation issues)
    const reports = await this.bondReportRepository
      .createQueryBuilder('br')
      .where('br.bond_id IN (:...bondIds)', { bondIds })
      .orderBy('br.created_at', 'DESC')
      .getMany();

    // Get unique reporter IDs
    const reporterIds = [...new Set(reports.map(r => r.reporter_id))];
    
    // Manually fetch reporters if there are any
    let reporters: User[] = [];
    if (reporterIds.length > 0) {
      reporters = await this.bondRepository.manager
        .createQueryBuilder(User, 'user')
        .leftJoinAndSelect('user.country', 'country')
        .where('user.id IN (:...reporterIds)', { reporterIds })
        .getMany();
    }
    
    // Create reporter lookup map
    const reporterMap = new Map<string, User>(reporters.map(r => [r.id, r]));

    // Group reports by bond_id and attach reporter details
    const reportsByBond = new Map<number, any[]>();
    reports.forEach((report) => {
      if (!reportsByBond.has(report.bond_id)) {
        reportsByBond.set(report.bond_id, []);
      }
      
      // Get reporter from map
      const reporter = reporterMap.get(report.reporter_id);
      
      reportsByBond.get(report.bond_id)!.push({
        report_id: report.id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        created_at: report.created_at,
        reviewed_by: report.reviewed_by,
        review_notes: report.review_notes,
        reviewed_at: report.reviewed_at,
        reporter: reporter ? {
          id: reporter.id,
          full_name: reporter.full_name,
          user_name: reporter.user_name,
          email: reporter.email,
          profile_image: reporter.profile_image,
          country: reporter.country ? {
            id: reporter.country.id,
            name: reporter.country.name
          } : null
        } : null
      });
    });

    // Combine everything
    const result = enriched.map((bond) => {
      const counts = bondIdsWithCounts.find((b) => b.bond_id === bond.id);
      const bondReports = reportsByBond.get(bond.id) || [];
      
      return {
        // Full bond details
        id: bond.id,
        name: bond.name,
        description: bond.description,
        banner: bond.banner,
        city: bond.city,
        is_public: bond.is_public,
        request_to_join: bond.request_to_join,
        is_unlimited_members: bond.is_unlimited_members,
        max_members: bond.max_members,
        is_trending: bond.is_trending,
        view_count: bond.view_count,
        likes_count: bond.likes_count,
        is_hidden: bond.metadata?.hidden_at !== null && bond.metadata?.hidden_at !== undefined,
        hidden_at: bond.metadata?.hidden_at || null,
        created_at: bond.created_at,
        updated_at: bond.updated_at,
        
        // Creator details
        creator: bond.creator ? {
          id: bond.creator.id,
          full_name: bond.creator.full_name,
          user_name: bond.creator.user_name,
          email: bond.creator.email,
          profile_image: bond.creator.profile_image
        } : null,
        
        // Interests (using 'interest' field, not 'name')
        interests: bond.userInterests?.map((i) => ({
          id: i.id,
          name: i.interest  // The field is called 'interest' in UserInterest entity
        })) || [],
        
        // Member counts
        members_count: bond.members_count || 0,
        
        // Report statistics
        total_reports: Number(counts?.total_reports || 0),
        pending_reports: Number(counts?.pending_reports || 0),
        reviewed_reports: bondReports.filter(r => r.status === ReportStatus.REVIEWED).length,
        resolved_reports: bondReports.filter(r => r.status === ReportStatus.RESOLVED).length,
        dismissed_reports: bondReports.filter(r => r.status === ReportStatus.DISMISSED).length,
        
        // Full reports list with reporter details
        reports: bondReports,
        
        // Unique reporters
        unique_reporters: [...new Set(bondReports.map(r => r.reporter?.id))].length,
        reporters_summary: bondReports
          .map(r => r.reporter)
          .filter((r, i, arr) => r && arr.findIndex(x => x?.id === r.id) === i)
          .slice(0, 5) // Top 5 unique reporters
      };
    });

    // Get total count
    const total = await this.bondReportRepository
      .createQueryBuilder('br')
      .select('COUNT(DISTINCT br.bond_id)', 'count')
      .getRawOne()
      .then((r) => Number(r.count));

    return { bonds: result, total };
  }

  /* ------------------------------------------------------------------ */
  /*  ADMIN – list bonds with full details (parity with activities)      */
  /* ------------------------------------------------------------------ */
  async getAllBondsDetailedAdmin(
    page = 1,
    limit = 20,
  ): Promise<{ bonds: BondResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [bonds, total] = await this.bondRepository
      .createQueryBuilder('bond')
      .leftJoinAndSelect('bond.creator', 'creator')
      .leftJoinAndSelect('bond.userInterests', 'userInterests')
      .orderBy('bond.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const enriched = await this.enrichBondsWithUserData(bonds);
    const recentMap = await this.loadRecentActivities(enriched.map((b) => b.id));

    const transformed: BondResponseDto[] = enriched.map((b) =>
      this.transformBondResponse(b, undefined, recentMap.get(b.id) ?? [], false),
    );

    return { bonds: transformed, total };
  }

  async reviewBondReport(
    reportId: number,
    reviewerId: string | null,
    status: ReportStatus,
    notes?: string,
  ): Promise<BondReportResponseDto> {
    const report = await this.bondReportRepository.findOne({
      where: { id: reportId },
      relations: ['bond'],
    });
    if (!report) throw new NotFoundException('Report not found');

    report.status = status;
    report.review_notes = notes ?? null;
    report.reviewed_by = 'admin';
    report.reviewed_at = new Date();
    const updated = await this.bondReportRepository.save(report);

    const reviewer = { id: 'admin', full_name: 'Administrator' } as User;
    await this.notifyReporterOnStatusChange(updated, reviewer);

    return {
      id: updated.id,
      bond_id: updated.bond_id,
      reporter_id: updated.reporter_id,
      reason: updated.reason,
      description: updated.description,
      status: updated.status,
      created_at: updated.created_at,
      reviewed_at: updated.reviewed_at,
    };
  }

  async getBondReportStats(bondId: number): Promise<{
    total_reports: number;
    pending_reports: number;
    recent_reports: number;
  }> {
    const thirty = new Date();
    thirty.setDate(thirty.getDate() - 30);

    const [total, pending, recent] = await Promise.all([
      this.bondReportRepository.count({ where: { bond_id: bondId } }),
      this.bondReportRepository.count({
        where: { bond_id: bondId, status: ReportStatus.PENDING },
      }),
      this.bondReportRepository.count({
        where: { bond_id: bondId, created_at: MoreThanOrEqual(thirty) },
      }),
    ]);

    return { total_reports: total, pending_reports: pending, recent_reports: recent };
  }

  async getBondStats(): Promise<BondStatsDto> {
    const cacheKey = 'bond:stats';
    const cached = await this.cacheManager.get<BondStatsDto>(cacheKey);
    if (cached) return cached;

    // Get current date boundaries
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for better performance
    const [
      totalBonds,
      hiddenBonds,
      publicBonds,
      privateBonds,
      totalMembers,
      bondsLast24h,
      bondsLast7d,
      bondsLast30d,
      totalReports,
      pendingReports,
      trendingBonds,
      totalLikes,
      unlimitedMemberBonds,
      requestToJoinBonds,
    ] = await Promise.all([
      // Total bonds count
      this.bondRepository.count(),
      
      // Hidden bonds count (assuming hidden_at field exists, if not we'll use a different approach)
      this.bondRepository.query(`
        SELECT COUNT(*) as count 
        FROM bonds 
        WHERE JSON_EXTRACT(COALESCE(metadata, '{}'), '$.hidden_at') IS NOT NULL
      `).then(result => parseInt(result[0]?.count || '0', 10)).catch(() => 0),
      
      // Public bonds count
      this.bondRepository.count({ where: { is_public: true } }),
      
      // Private bonds count
      this.bondRepository.count({ where: { is_public: false } }),
      
      // Total members across all bonds
      this.bondRepository.query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM bonds_users
      `).then(result => parseInt(result[0]?.count || '0', 10)),
      
      // Bonds created in last 24 hours
      this.bondRepository.count({ 
        where: { 
          created_at: MoreThanOrEqual(last24h) 
        } 
      }),
      
      // Bonds created in last 7 days
      this.bondRepository.count({ 
        where: { 
          created_at: MoreThanOrEqual(last7d) 
        } 
      }),
      
      // Bonds created in last 30 days
      this.bondRepository.count({ 
        where: { 
          created_at: MoreThanOrEqual(last30d) 
        } 
      }),
      
      // Total reports
      this.bondReportRepository.count(),
      
      // Pending reports
      this.bondReportRepository.count({ where: { status: ReportStatus.PENDING } }),
      
      // Trending bonds
      this.bondRepository.count({ where: { is_trending: true } }),
      
      // Total likes across all bonds
      this.bondRepository.query(`
        SELECT COALESCE(SUM(likes_count), 0) as total_likes 
        FROM bonds
      `).then(result => parseInt(result[0]?.total_likes || '0', 10)),
      
      // Unlimited member bonds
      this.bondRepository.count({ where: { is_unlimited_members: true } }),
      
      // Request to join bonds
      this.bondRepository.count({ where: { request_to_join: true } }),
    ]);

    const activeBonds = totalBonds - hiddenBonds;
    const averageMembersPerBond = totalBonds > 0 
      ? Math.round((totalMembers / totalBonds) * 100) / 100 
      : 0;
    const averageLikesPerBond = totalBonds > 0 
      ? Math.round((totalLikes / totalBonds) * 100) / 100 
      : 0;

    const stats: BondStatsDto = {
      total_bonds: totalBonds,
      active_bonds: activeBonds,
      hidden_bonds: hiddenBonds,
      public_bonds: publicBonds,
      private_bonds: privateBonds,
      total_members: totalMembers,
      average_members_per_bond: averageMembersPerBond,
      bonds_last_24h: bondsLast24h,
      bonds_last_7d: bondsLast7d,
      bonds_last_30d: bondsLast30d,
      total_reports: totalReports,
      pending_reports: pendingReports,
      trending_bonds: trendingBonds,
      total_likes: totalLikes,
      average_likes_per_bond: averageLikesPerBond,
      unlimited_member_bonds: unlimitedMemberBonds,
      request_to_join_bonds: requestToJoinBonds,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);
    return stats;
  }

  async getBondAnalytics(): Promise<BondAnalyticsDto> {
    const cacheKey = 'bond:analytics';
    const cached = await this.cacheManager.get<BondAnalyticsDto>(cacheKey);
    if (cached) return cached;

    // Execute all analytics queries in parallel
    const [
      popularLocations,
      engagementMetrics,
      topCreators,
      popularInterests,
      growthMetrics,
      bondTrends,
      memberTrends,
    ] = await Promise.all([
      this.getPopularBondLocations(),
      this.getBondEngagementMetrics(),
      this.getTopBondCreators(),
      this.getPopularBondInterests(),
      this.getBondGrowthMetrics(),
      this.getBondTrends(),
      this.getMemberTrends(),
    ]);

    const analytics: BondAnalyticsDto = {
      popular_locations: popularLocations,
      engagement_metrics: engagementMetrics,
      top_creators: topCreators,
      popular_interests: popularInterests,
      growth_metrics: growthMetrics,
      bond_trends: bondTrends,
      member_trends: memberTrends,
    };

    // Cache for 10 minutes (analytics can be less frequent)
    await this.cacheManager.set(cacheKey, analytics, 600);
    return analytics;
  }

  private async getPopularBondLocations(): Promise<BondLocationAnalyticsDto[]> {
    const result = await this.bondRepository.query(`
      SELECT 
        b.city,
        COUNT(b.id) as bond_count,
        COALESCE(SUM(member_counts.member_count), 0) as total_members,
        COALESCE(AVG(member_counts.member_count), 0) as avg_members
      FROM bonds b
      LEFT JOIN (
        SELECT 
          bond_id, 
          COUNT(user_id) as member_count
        FROM bonds_users 
        GROUP BY bond_id
      ) member_counts ON b.id = member_counts.bond_id
      WHERE b.city IS NOT NULL AND b.city != ''
      GROUP BY b.city
      HAVING COUNT(b.id) >= 1
      ORDER BY bond_count DESC, total_members DESC
      LIMIT 10
    `);

    return result.map((row: any) => ({
      city: row.city,
      bond_count: parseInt(row.bond_count, 10),
      total_members: parseInt(row.total_members, 10),
      avg_members: Math.round(parseFloat(row.avg_members) * 100) / 100,
    }));
  }

  private async getBondEngagementMetrics(): Promise<BondEngagementMetricsDto> {
    const [
      avgLikes,
      avgMembers,
      activityRate,
      avgViewCount,
      popularVisibility,
      reportRate,
      requestToJoinRate,
      unlimitedMembersRate,
    ] = await Promise.all([
      // Average likes per bond
      this.bondRepository.query(`
        SELECT AVG(likes_count) as avg_likes FROM bonds
      `).then(result => parseFloat(result[0]?.avg_likes || '0')),

      // Average members per bond
      this.bondRepository.query(`
        SELECT AVG(member_count) as avg_members
        FROM (
          SELECT COUNT(user_id) as member_count
          FROM bonds_users 
          GROUP BY bond_id
        ) member_counts
      `).then(result => parseFloat(result[0]?.avg_members || '0')),

      // Activity rate (bonds with recent activities)
      Promise.all([
        this.bondRepository.query(`
          SELECT COUNT(DISTINCT ab.bond_id) as active_bonds
          FROM activity_bonds ab
          JOIN activities a ON a.id = ab.activity_id
          WHERE a.start_date >= NOW() - INTERVAL 30 DAY
        `).then(result => parseInt(result[0]?.active_bonds || '0', 10)),
        this.bondRepository.count(),
      ]).then(([activeBonds, totalBonds]) => 
        totalBonds > 0 ? (activeBonds / totalBonds) * 100 : 0
      ),

      // Average view count per bond
      this.bondRepository.query(`
        SELECT AVG(view_count) as avg_view_count FROM bonds
      `).then(result => parseFloat(result[0]?.avg_view_count || '0')),

      // Most popular visibility type
      this.bondRepository.query(`
        SELECT 
          CASE WHEN is_public = 1 THEN 'public' ELSE 'private' END as visibility, 
          COUNT(*) as count
        FROM bonds
        GROUP BY is_public
        ORDER BY count DESC
        LIMIT 1
      `).then(result => result[0]?.visibility || 'public'),

      // Report rate per 100 bonds
      Promise.all([
        this.bondReportRepository.count(),
        this.bondRepository.count(),
      ]).then(([reports, bonds]) => 
        bonds > 0 ? (reports / bonds) * 100 : 0
      ),

      // Request to join rate
      Promise.all([
        this.bondRepository.count({ where: { request_to_join: true } }),
        this.bondRepository.count(),
      ]).then(([requestToJoin, total]) => 
        total > 0 ? (requestToJoin / total) * 100 : 0
      ),

      // Unlimited members rate
      Promise.all([
        this.bondRepository.count({ where: { is_unlimited_members: true } }),
        this.bondRepository.count(),
      ]).then(([unlimited, total]) => 
        total > 0 ? (unlimited / total) * 100 : 0
      ),
    ]);

    return {
      avg_likes_per_bond: Math.round(avgLikes * 100) / 100,
      avg_members_per_bond: Math.round(avgMembers * 100) / 100,
      activity_rate: Math.round(activityRate * 100) / 100,
      avg_view_count: Math.round(avgViewCount * 100) / 100,
      most_popular_visibility: popularVisibility,
      report_rate: Math.round(reportRate * 100) / 100,
      request_to_join_rate: Math.round(requestToJoinRate * 100) / 100,
      unlimited_members_rate: Math.round(unlimitedMembersRate * 100) / 100,
    };
  }

  private async getTopBondCreators(): Promise<BondCreatorAnalyticsDto[]> {
    const result = await this.bondRepository.query(`
      SELECT 
        u.id as creator_id,
        u.full_name as creator_name,
        COUNT(b.id) as bond_count,
        COALESCE(SUM(member_counts.member_count), 0) as total_members,
        COALESCE(AVG(member_counts.member_count), 0) as avg_members,
        COALESCE(SUM(b.likes_count), 0) as total_likes,
        COALESCE(SUM(b.view_count), 0) as total_views
      FROM users u
      JOIN bonds b ON u.id = b.creator_id
      LEFT JOIN (
        SELECT 
          bond_id, 
          COUNT(user_id) as member_count
        FROM bonds_users 
        GROUP BY bond_id
      ) member_counts ON b.id = member_counts.bond_id
      GROUP BY u.id, u.full_name
      HAVING COUNT(b.id) >= 1
      ORDER BY bond_count DESC, total_members DESC
      LIMIT 10
    `);

    return result.map((row: any) => ({
      creator_id: row.creator_id,
      creator_name: row.creator_name || 'Unknown',
      bond_count: parseInt(row.bond_count, 10),
      total_members: parseInt(row.total_members, 10),
      avg_members: Math.round(parseFloat(row.avg_members) * 100) / 100,
      total_likes: parseInt(row.total_likes, 10),
      total_views: parseInt(row.total_views, 10),
    }));
  }

  private async getPopularBondInterests(): Promise<BondInterestAnalyticsDto[]> {
    const result = await this.bondRepository.query(`
      SELECT 
        ui.interest,
        COUNT(DISTINCT bui.bond_id) as bond_count,
        COALESCE(SUM(member_counts.member_count), 0) as total_members,
        COALESCE(AVG(member_counts.member_count), 0) as avg_members
      FROM user_interests ui
      JOIN bonds_user_interests bui ON ui.id = bui.user_interest_id
      LEFT JOIN (
        SELECT 
          bond_id, 
          COUNT(user_id) as member_count
        FROM bonds_users 
        GROUP BY bond_id
      ) member_counts ON bui.bond_id = member_counts.bond_id
      WHERE ui.is_active = 1
      GROUP BY ui.interest
      HAVING COUNT(DISTINCT bui.bond_id) >= 1
      ORDER BY bond_count DESC, total_members DESC
      LIMIT 10
    `);

    return result.map((row: any) => ({
      interest: row.interest,
      bond_count: parseInt(row.bond_count, 10),
      total_members: parseInt(row.total_members, 10),
      avg_members: Math.round(parseFloat(row.avg_members) * 100) / 100,
    }));
  }

  private async getBondGrowthMetrics(): Promise<BondGrowthMetricsDto> {
    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      newBonds7d,
      newBonds30d,
      newMembers7d,
      newMembers30d,
      avgMemberGrowthRate,
    ] = await Promise.all([
      // New bonds in last 7 days
      this.bondRepository.count({ 
        where: { created_at: MoreThanOrEqual(last7d) } 
      }),

      // New bonds in last 30 days
      this.bondRepository.count({ 
        where: { created_at: MoreThanOrEqual(last30d) } 
      }),

      // New members in last 7 days (approximate - would need join timestamps)
      this.bondRepository.query(`
        SELECT COUNT(DISTINCT bu.user_id) as new_members
        FROM bonds_users bu
        JOIN bonds b ON b.id = bu.bond_id
        WHERE b.created_at >= ?
      `, [last7d]).then(result => parseInt(result[0]?.new_members || '0', 10)),

      // New members in last 30 days
      this.bondRepository.query(`
        SELECT COUNT(DISTINCT bu.user_id) as new_members
        FROM bonds_users bu
        JOIN bonds b ON b.id = bu.bond_id
        WHERE b.created_at >= ?
      `, [last30d]).then(result => parseInt(result[0]?.new_members || '0', 10)),

      // Average member growth rate (simplified calculation)
      this.bondRepository.query(`
        SELECT AVG(member_count) as avg_growth
        FROM bonds
        WHERE member_count > 0
      `).then(result => parseFloat(result[0]?.avg_growth || '0')),
    ]);

    return {
      avg_member_growth_rate: Math.round(avgMemberGrowthRate * 100) / 100,
      new_bonds_7d: newBonds7d,
      new_bonds_30d: newBonds30d,
      new_members_7d: newMembers7d,
      new_members_30d: newMembers30d,
    };
  }

  private async getBondTrends(): Promise<{ date: string; count: number }[]> {
    const result = await this.bondRepository.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM bonds
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return result.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));
  }

  private async getMemberTrends(): Promise<{ date: string; count: number }[]> {
    const result = await this.bondRepository.query(`
      SELECT 
        DATE(b.created_at) as date,
        COUNT(DISTINCT bu.user_id) as count
      FROM bonds_users bu
      JOIN bonds b ON b.id = bu.bond_id
      WHERE b.created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(b.created_at)
      ORDER BY date DESC
    `);

    return result.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));
  }

  async advancedSearchBonds(searchDto: AdvancedSearchBondDto): Promise<BondSearchResponseDto> {
    const {
      q,
      name,
      city,
      creator,
      created_from,
      created_to,
      visibility,
      min_members,
      max_members,
      min_likes,
      max_likes,
      min_views,
      is_hidden,
      is_trending,
      has_reports,
      is_unlimited_members,
      request_to_join,
      post_to_story,
      interest_ids,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 20,
    } = searchDto;

    const queryBuilder = this.bondRepository
      .createQueryBuilder('bond')
      .leftJoinAndSelect('bond.creator', 'creator')
      .leftJoin('bonds_users', 'bu', 'bu.bond_id = bond.id')
      .leftJoin('bonds_user_interests', 'bui', 'bui.bond_id = bond.id')
      .leftJoin('user_interests', 'ui', 'ui.id = bui.user_interest_id')
      .leftJoin('bond_reports', 'br', 'br.bond_id = bond.id')
      .addSelect('COUNT(DISTINCT bu.user_id)', 'member_count')
      .groupBy('bond.id, creator.id');

    const filtersApplied: string[] = [];

    // Full-text search across name, description, and city
    if (q) {
      queryBuilder.andWhere(
        '(bond.name LIKE :q OR bond.description LIKE :q OR bond.city LIKE :q)',
        { q: `%${q}%` }
      );
      filtersApplied.push(`text_search: "${q}"`);
    }

    // Name filter
    if (name) {
      queryBuilder.andWhere('bond.name LIKE :name', { name: `%${name}%` });
      filtersApplied.push(`name: "${name}"`);
    }

    // City filter
    if (city) {
      queryBuilder.andWhere('bond.city LIKE :city', { city: `%${city}%` });
      filtersApplied.push(`city: "${city}"`);
    }

    // Creator filter
    if (creator) {
      queryBuilder.andWhere(
        '(creator.full_name LIKE :creator OR creator.user_name LIKE :creator)',
        { creator: `%${creator}%` }
      );
      filtersApplied.push(`creator: "${creator}"`);
    }

    // Date range filters
    if (created_from) {
      queryBuilder.andWhere('bond.created_at >= :created_from', { created_from });
      filtersApplied.push(`created_from: ${created_from}`);
    }

    if (created_to) {
      queryBuilder.andWhere('bond.created_at <= :created_to', { created_to });
      filtersApplied.push(`created_to: ${created_to}`);
    }

    // Visibility filter
    if (visibility !== undefined) {
      const isPublic = visibility === 'public';
      queryBuilder.andWhere('bond.is_public = :is_public', { is_public: isPublic });
      filtersApplied.push(`visibility: ${visibility}`);
    }

    // Member count filters
    if (min_members !== undefined) {
      queryBuilder.having('COUNT(DISTINCT bu.user_id) >= :min_members', { min_members });
      filtersApplied.push(`min_members: ${min_members}`);
    }

    if (max_members !== undefined) {
      queryBuilder.having('COUNT(DISTINCT bu.user_id) <= :max_members', { max_members });
      filtersApplied.push(`max_members: ${max_members}`);
    }

    // Likes filters
    if (min_likes !== undefined) {
      queryBuilder.andWhere('bond.likes_count >= :min_likes', { min_likes });
      filtersApplied.push(`min_likes: ${min_likes}`);
    }

    if (max_likes !== undefined) {
      queryBuilder.andWhere('bond.likes_count <= :max_likes', { max_likes });
      filtersApplied.push(`max_likes: ${max_likes}`);
    }

    // View count filter
    if (min_views !== undefined) {
      queryBuilder.andWhere('bond.view_count >= :min_views', { min_views });
      filtersApplied.push(`min_views: ${min_views}`);
    }

    // Hidden status filter
    // TODO: Temporarily disabled until metadata column is added to database
    // if (is_hidden !== undefined) {
    //   if (is_hidden) {
    //     queryBuilder.andWhere("JSON_EXTRACT(COALESCE(bond.metadata, '{}'), '$.hidden_at') IS NOT NULL");
    //   } else {
    //     queryBuilder.andWhere("JSON_EXTRACT(COALESCE(bond.metadata, '{}'), '$.hidden_at') IS NULL");
    //   }
    //   filtersApplied.push(`is_hidden: ${is_hidden}`);
    // }

    // Trending status filter
    if (is_trending !== undefined) {
      queryBuilder.andWhere('bond.is_trending = :is_trending', { is_trending });
      filtersApplied.push(`is_trending: ${is_trending}`);
    }

    // Reports filter
    if (has_reports !== undefined) {
      if (has_reports) {
        queryBuilder.andWhere('br.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('br.id IS NULL');
      }
      filtersApplied.push(`has_reports: ${has_reports}`);
    }

    // Configuration filters
    if (is_unlimited_members !== undefined) {
      queryBuilder.andWhere('bond.is_unlimited_members = :is_unlimited_members', { is_unlimited_members });
      filtersApplied.push(`is_unlimited_members: ${is_unlimited_members}`);
    }

    if (request_to_join !== undefined) {
      queryBuilder.andWhere('bond.request_to_join = :request_to_join', { request_to_join });
      filtersApplied.push(`request_to_join: ${request_to_join}`);
    }

    if (post_to_story !== undefined) {
      queryBuilder.andWhere('bond.post_to_story = :post_to_story', { post_to_story });
      filtersApplied.push(`post_to_story: ${post_to_story}`);
    }

    // Interest filter
    if (interest_ids) {
      const interestIdArray = interest_ids.split(',').map(id => id.trim());
      queryBuilder.andWhere('ui.id IN (:...interest_ids)', { interest_ids: interestIdArray });
      filtersApplied.push(`interest_ids: ${interest_ids}`);
    }

    // Sorting
    let sortField = 'bond.created_at';
    switch (sort_by) {
      case 'updated_at':
        sortField = 'bond.updated_at';
        break;
      case 'name':
        sortField = 'bond.name';
        break;
      case 'city':
        sortField = 'bond.city';
        break;
      case 'member_count':
        sortField = 'member_count';
        break;
      case 'likes_count':
        sortField = 'bond.likes_count';
        break;
      case 'view_count':
        sortField = 'bond.view_count';
        break;
      default:
        sortField = 'bond.created_at';
    }

    queryBuilder.orderBy(sortField, sort_order as 'ASC' | 'DESC');

    // Get total count for pagination
    const totalQuery = queryBuilder.clone();
    const totalResult = await totalQuery.getRawMany();
    const total = totalResult.length;

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.offset(skip).limit(limit);

    // Execute search query
    const rawResults = await queryBuilder.getRawAndEntities();
    const bonds = rawResults.entities;

    // Enrich bonds with member count and other data
    const enrichedBonds = await Promise.all(
      bonds.map(async (bond, index) => {
        const memberCount = parseInt(rawResults.raw[index]?.member_count || '0', 10);
        
        // Get last few members
        const lastMembers = await this.bondRepository.query(`
          SELECT 
            bu.bond_id as bondId,
            bu.user_id as userId,
            u.full_name as fullName,
            u.user_name as userName,
            u.profile_image as profileImage
          FROM bonds_users bu
          JOIN users u ON u.id = bu.user_id
          WHERE bu.bond_id = ?
          ORDER BY bu.user_id DESC
          LIMIT 5
        `, [bond.id]);

        // Get interests
        const interests = await this.bondRepository.query(`
          SELECT ui.id, ui.interest, ui.is_active, ui.created_at
          FROM user_interests ui
          JOIN bonds_user_interests bui ON ui.id = bui.user_interest_id
          WHERE bui.bond_id = ? AND ui.is_active = 1
        `, [bond.id]);

        return {
          ...bond,
          member_count: memberCount,
          lastMembers,
          userInterests: interests,
          hasJoined: false, // Admin context
          isCoOrganizer: false, // Admin context
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      bonds: enrichedBonds,
      total,
      page,
      limit,
      total_pages: totalPages,
      search_info: {
        query: q,
        filters_applied: filtersApplied,
        sort_by,
        sort_order,
      },
    };
  }

  async getAdminBondsList(listDto: AdminListBondsDto): Promise<AdminListBondsResponseDto> {
    const {
      q,
      name,
      city,
      creator,
      visibility,
      is_trending,
      is_hidden,
      has_reports,
      is_unlimited_members,
      request_to_join,
      min_members,
      max_members,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 20,
    } = listDto;

    const queryBuilder = this.bondRepository
      .createQueryBuilder('bond')
      .leftJoinAndSelect('bond.creator', 'creator')
      .leftJoinAndSelect('bond.userInterests', 'userInterests')
      .leftJoin('bonds_users', 'bu', 'bu.bond_id = bond.id')
      .leftJoin('bond_reports', 'br', 'br.bond_id = bond.id')
      .addSelect('COUNT(DISTINCT bu.user_id)', 'member_count')
      .groupBy('bond.id, creator.id, userInterests.id');

    const filtersApplied: string[] = [];

    // Full-text search
    if (q) {
      queryBuilder.andWhere(
        '(bond.name LIKE :q OR bond.description LIKE :q OR bond.city LIKE :q)',
        { q: `%${q}%` }
      );
      filtersApplied.push(`search: "${q}"`);
    }

    // Individual filters
    if (name) {
      queryBuilder.andWhere('bond.name LIKE :name', { name: `%${name}%` });
      filtersApplied.push(`name: "${name}"`);
    }

    if (city) {
      queryBuilder.andWhere('bond.city LIKE :city', { city: `%${city}%` });
      filtersApplied.push(`city: "${city}"`);
    }

    if (creator) {
      queryBuilder.andWhere(
        '(creator.full_name LIKE :creator OR creator.user_name LIKE :creator)',
        { creator: `%${creator}%` }
      );
      filtersApplied.push(`creator: "${creator}"`);
    }

    if (visibility !== undefined) {
      const isPublic = visibility === 'public';
      queryBuilder.andWhere('bond.is_public = :is_public', { is_public: isPublic });
      filtersApplied.push(`visibility: ${visibility}`);
    }

    if (is_trending !== undefined) {
      queryBuilder.andWhere('bond.is_trending = :is_trending', { is_trending });
      filtersApplied.push(`is_trending: ${is_trending}`);
    }

    if (is_hidden !== undefined) {
      if (is_hidden) {
        queryBuilder.andWhere("JSON_EXTRACT(COALESCE(bond.metadata, '{}'), '$.hidden_at') IS NOT NULL");
      } else {
        queryBuilder.andWhere("JSON_EXTRACT(COALESCE(bond.metadata, '{}'), '$.hidden_at') IS NULL");
      }
      filtersApplied.push(`is_hidden: ${is_hidden}`);
    }

    if (has_reports !== undefined) {
      if (has_reports) {
        queryBuilder.andWhere('br.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('br.id IS NULL');
      }
      filtersApplied.push(`has_reports: ${has_reports}`);
    }

    if (is_unlimited_members !== undefined) {
      queryBuilder.andWhere('bond.is_unlimited_members = :is_unlimited_members', { is_unlimited_members });
      filtersApplied.push(`is_unlimited_members: ${is_unlimited_members}`);
    }

    if (request_to_join !== undefined) {
      queryBuilder.andWhere('bond.request_to_join = :request_to_join', { request_to_join });
      filtersApplied.push(`request_to_join: ${request_to_join}`);
    }

    // Member count filters
    if (min_members !== undefined) {
      queryBuilder.having('COUNT(DISTINCT bu.user_id) >= :min_members', { min_members });
      filtersApplied.push(`min_members: ${min_members}`);
    }

    if (max_members !== undefined) {
      queryBuilder.having('COUNT(DISTINCT bu.user_id) <= :max_members', { max_members });
      filtersApplied.push(`max_members: ${max_members}`);
    }

    // Sorting
    let sortField = 'bond.created_at';
    switch (sort_by) {
      case 'updated_at':
        sortField = 'bond.updated_at';
        break;
      case 'name':
        sortField = 'bond.name';
        break;
      case 'city':
        sortField = 'bond.city';
        break;
      case 'member_count':
        sortField = 'member_count';
        break;
      case 'likes_count':
        sortField = 'bond.likes_count';
        break;
      case 'view_count':
        sortField = 'bond.view_count';
        break;
      default:
        sortField = 'bond.created_at';
    }

    queryBuilder.orderBy(sortField, sort_order as 'ASC' | 'DESC');

    // Get total count
    const totalQuery = queryBuilder.clone();
    const totalResult = await totalQuery.getRawMany();
    const total = totalResult.length;

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.offset(skip).limit(limit);

    // Execute query
    const rawResults = await queryBuilder.getRawAndEntities();
    const bonds = rawResults.entities;

    // Enrich bonds with additional data
    const enrichedBonds = await Promise.all(
      bonds.map(async (bond, index) => {
        const memberCount = parseInt(rawResults.raw[index]?.member_count || '0', 10);
        
        // Get last few members
        const lastMembers = await this.bondRepository.query(`
          SELECT 
            bu.bond_id as bondId,
            bu.user_id as userId,
            u.full_name as fullName,
            u.user_name as userName,
            u.profile_image as profileImage
          FROM bonds_users bu
          JOIN users u ON u.id = bu.user_id
          WHERE bu.bond_id = ?
          ORDER BY bu.user_id DESC
          LIMIT 5
        `, [bond.id]);

        // Get recent activities
        const recentActivities = await this.bondRepository.query(`
          SELECT 
            a.id, a.title, a.description, a.cover_image,
            a.start_date, a.end_date, a.location
          FROM activities a
          JOIN activity_bonds ab ON a.id = ab.activity_id
          WHERE ab.bond_id = ?
          ORDER BY a.start_date DESC
          LIMIT 3
        `, [bond.id]);

        return {
          ...bond,
          member_count: memberCount,
          lastMembers,
          recentActivities,
          hasJoined: false, // Admin context
          isCoOrganizer: false, // Admin context
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      bonds: enrichedBonds,
      total,
      page,
      limit,
      total_pages: totalPages,
      filters_info: {
        applied_filters: filtersApplied,
        sort_by,
        sort_order,
      },
    };
  }

  async getTrendingBonds(page = 1, limit = 20): Promise<AdminListBondsResponseDto> {
    const queryBuilder = this.bondRepository
      .createQueryBuilder('bond')
      .leftJoinAndSelect('bond.creator', 'creator')
      .leftJoinAndSelect('bond.userInterests', 'userInterests')
      .leftJoin('bonds_users', 'bu', 'bu.bond_id = bond.id')
      .addSelect('COUNT(DISTINCT bu.user_id)', 'member_count')
      .where('bond.is_trending = :is_trending', { is_trending: true })
      .groupBy('bond.id, creator.id, userInterests.id')
      .orderBy('bond.likes_count', 'DESC')
      .addOrderBy('member_count', 'DESC')
      .addOrderBy('bond.view_count', 'DESC');

    // Get total count
    const totalQuery = queryBuilder.clone();
    const totalResult = await totalQuery.getRawMany();
    const total = totalResult.length;

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.offset(skip).limit(limit);

    // Execute query
    const rawResults = await queryBuilder.getRawAndEntities();
    const bonds = rawResults.entities;

    // Enrich bonds with additional data
    const enrichedBonds = await Promise.all(
      bonds.map(async (bond, index) => {
        const memberCount = parseInt(rawResults.raw[index]?.member_count || '0', 10);
        
        // Get last few members
        const lastMembers = await this.bondRepository.query(`
          SELECT 
            bu.bond_id as bondId,
            bu.user_id as userId,
            u.full_name as fullName,
            u.user_name as userName,
            u.profile_image as profileImage
          FROM bonds_users bu
          JOIN users u ON u.id = bu.user_id
          WHERE bu.bond_id = ?
          ORDER BY bu.user_id DESC
          LIMIT 5
        `, [bond.id]);

        // Get recent activities
        const recentActivities = await this.bondRepository.query(`
          SELECT 
            a.id, a.title, a.description, a.cover_image,
            a.start_date, a.end_date, a.location
          FROM activities a
          JOIN activity_bonds ab ON a.id = ab.activity_id
          WHERE ab.bond_id = ?
          ORDER BY a.start_date DESC
          LIMIT 3
        `, [bond.id]);

        return {
          ...bond,
          member_count: memberCount,
          lastMembers,
          recentActivities,
          hasJoined: false, // Admin context
          isCoOrganizer: false, // Admin context
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      bonds: enrichedBonds,
      total,
      page,
      limit,
      total_pages: totalPages,
      filters_info: {
        applied_filters: ['is_trending: true', 'is_hidden: false'],
        sort_by: 'engagement_score',
        sort_order: 'DESC',
      },
    };
  }

  async getBondsByCreator(
    userId: string,
    page = 1,
    limit = 20,
    includeHidden = false,
  ): Promise<{
    bonds: any[];
    total: number;
    creator: {
      id: string;
      full_name: string;
      user_name: string;
      email: string;
      profile_image: string;
      member_since: Date | null;
    } | null;
  }> {
    // First, validate that the creator exists
    const creator = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.full_name',
        'user.user_name',
        'user.email',
        'user.profile_image',
        'user.created_at',
      ])
      .where('user.id = :userId', { userId })
      .getOne();

    if (!creator) {
      throw new NotFoundException(`Creator with ID ${userId} not found`);
    }

    const queryBuilder = this.bondRepository
      .createQueryBuilder('bond')
      .leftJoinAndSelect('bond.creator', 'creator')
      .leftJoinAndSelect('bond.userInterests', 'userInterests')
      .leftJoin('bonds_users', 'bu', 'bu.bond_id = bond.id')
      .addSelect('COUNT(DISTINCT bu.user_id)', 'member_count')
      .where('bond.creator_id = :userId', { userId })
      .groupBy('bond.id, creator.id, userInterests.id')
      .orderBy('bond.created_at', 'DESC');

    // Get total count
    const totalQuery = queryBuilder.clone();
    const totalResult = await totalQuery.getRawMany();
    const total = totalResult.length;

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.offset(skip).limit(limit);

    // Execute query
    const rawResults = await queryBuilder.getRawAndEntities();
    const bonds = rawResults.entities;

    // Enrich bonds with additional data
    const enrichedBonds = await Promise.all(
      bonds.map(async (bond, index) => {
        const memberCount = parseInt(rawResults.raw[index]?.member_count || '0', 10);
        
        // Get last few members
        const lastMembers = await this.bondRepository.query(`
          SELECT 
            bu.bond_id as bondId,
            bu.user_id as userId,
            u.full_name as fullName,
            u.user_name as userName,
            u.profile_image as profileImage
          FROM bonds_users bu
          JOIN users u ON u.id = bu.user_id
          WHERE bu.bond_id = ?
          ORDER BY bu.user_id DESC
          LIMIT 5
        `, [bond.id]);

        // Get recent activities
        const recentActivities = await this.bondRepository.query(`
          SELECT 
            a.id, a.title, a.description, a.cover_image,
            a.start_date, a.end_date, a.location
          FROM activities a
          JOIN activity_bonds ab ON a.id = ab.activity_id
          WHERE ab.bond_id = ?
          ORDER BY a.start_date DESC
          LIMIT 3
        `, [bond.id]);

        return {
          ...bond,
          member_count: memberCount,
          lastMembers,
          recentActivities,
          hasJoined: false, // Admin context
          isCoOrganizer: false, // Admin context
        };
      })
    );

    return {
      bonds: enrichedBonds,
      total,
      creator: {
        id: creator.id,
        full_name: creator.full_name,
        user_name: creator.user_name,
        email: creator.email,
        profile_image: creator.profile_image,
        member_since: creator.created_at,
      },
    };
  }

  async getTopBondCreatorsRanked(queryDto: any): Promise<{ creators: any[]; total: number; query_info: any }> {
    const { 
      page = 1, 
      limit = 10, 
      sort_by = 'bond_count', 
      min_bonds = 1, 
      days_back = 0, 
      include_hidden = false 
    } = queryDto;
    
    const skip = (page - 1) * limit;
    
    // Build date filter if days_back is specified
    let dateFilter = '';
    const params: any[] = [];
    
    if (days_back > 0) {
      dateFilter = 'AND b.created_at >= NOW() - INTERVAL ? DAY';
      params.push(days_back);
    }
    
    // Build hidden filter - for bonds we don't have hidden_at, so we'll skip this for now
    // const hiddenFilter = include_hidden ? '' : 'AND JSON_EXTRACT(COALESCE(b.metadata, \'{}\'), \'$.hidden_at\') IS NULL';
    const hiddenFilter = ''; // Skip hidden filter until metadata column is properly implemented
    
    // Build the main query
    const query = `
      SELECT 
        u.id as creator_id,
        u.full_name as creator_name,
        u.user_name,
        u.profile_image,
        u.email,
        u.created_at as member_since,
        COUNT(DISTINCT b.id) as bond_count,
        COALESCE(SUM(member_counts.member_count), 0) as total_members,
        COALESCE(AVG(member_counts.member_count), 0) as avg_members,
        COALESCE(SUM(b.likes_count), 0) as total_likes,
        COALESCE(SUM(b.view_count), 0) as total_views,
        ROUND(
          (COUNT(DISTINCT b.id) * 0.4) + 
          (COALESCE(SUM(member_counts.member_count), 0) * 0.3) + 
          (COALESCE(SUM(b.likes_count), 0) * 0.2) +
          (COALESCE(SUM(b.view_count), 0) * 0.1), 2
        ) as engagement_score
      FROM users u
      JOIN bonds b ON u.id = b.creator_id
      LEFT JOIN (
        SELECT 
          bond_id, 
          COUNT(user_id) as member_count
        FROM bonds_users 
        GROUP BY bond_id
      ) member_counts ON b.id = member_counts.bond_id
      WHERE 1=1 ${dateFilter} ${hiddenFilter}
      GROUP BY u.id, u.full_name, u.user_name, u.profile_image, u.email, u.created_at
      HAVING COUNT(DISTINCT b.id) >= ?
      ORDER BY ${this.getBondCreatorSortField(sort_by)} DESC
      LIMIT ? OFFSET ?
    `;
    
    // Count query for total
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN bonds b ON u.id = b.creator_id
      WHERE 1=1 ${dateFilter} ${hiddenFilter}
      GROUP BY u.id
      HAVING COUNT(DISTINCT b.id) >= ?
    `;
    
    // Add parameters
    const queryParams = [...params, min_bonds, limit, skip];
    const countParams = [...params, min_bonds];
    
    const [creators, countResult] = await Promise.all([
      this.bondRepository.query(query, queryParams),
      this.bondRepository.query(`SELECT COUNT(*) as total FROM (${countQuery}) as subquery`, countParams)
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
      bond_count: parseInt(creator.bond_count, 10),
      total_members: parseInt(creator.total_members, 10),
      avg_members: Math.round(parseFloat(creator.avg_members || '0') * 100) / 100,
      total_likes: parseInt(creator.total_likes, 10),
      total_views: parseInt(creator.total_views, 10),
      engagement_score: parseFloat(creator.engagement_score || '0'),
    }));
    
    return {
      creators: formattedCreators,
      total,
      query_info: {
        page,
        limit,
        sort_by,
        min_bonds,
        days_back,
        include_hidden,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  private getBondCreatorSortField(sortBy: string): string {
    switch (sortBy) {
      case 'bond_count':
        return 'COUNT(DISTINCT b.id)';
      case 'total_members':
        return 'COALESCE(SUM(member_counts.member_count), 0)';
      case 'avg_members':
        return 'COALESCE(AVG(member_counts.member_count), 0)';
      case 'total_likes':
        return 'COALESCE(SUM(b.likes_count), 0)';
      case 'total_views':
        return 'COALESCE(SUM(b.view_count), 0)';
      case 'engagement_score':
        return 'engagement_score';
      default:
        return 'COUNT(DISTINCT b.id)';
    }
  }

  /* ------------------------------------------------------------------ */
  /*  EXISTING PUBLIC METHODS  (unchanged behaviour)                    */
  /* ------------------------------------------------------------------ */
  async findAll(query: { page?: number; limit?: number; userId?: string } = {}): Promise<BondListResponseDto> {
    const startTime = Date.now();
    const { page = 1, limit = 20, userId } = query;
    const cacheKey = `bonds:list:${page}:${limit}:${userId || 'public'}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logQueryPerformance('findAll (cached)', startTime);
      return cached as BondListResponseDto;
    }

    const skip = (page - 1) * limit;
    const [bonds, total] = await this.bondRepository
      .createQueryBuilder('bond')
      .leftJoinAndSelect('bond.creator', 'creator')
      .leftJoinAndSelect('bond.userInterests', 'userInterests')
      .where('bond.is_public = :isPublic', { isPublic: true })
      .orderBy('bond.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const enriched = await this.enrichBondsWithUserData(bonds, userId);
    const transformed = enriched.map((b) => this.transformBondResponse(b, userId));

    const result: BondListResponseDto = {
      code: 1,
      message: 'Bonds retrieved successfully',
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };

    await this.cacheManager.set(cacheKey, result, 120);
    this.logQueryPerformance('findAll', startTime);
    return result;
  }

  async findOne(id: number, userId?: string): Promise<BondDetailResponseDto> {
    const startTime = Date.now();
    const cacheKey = `bond:${id}`;
    let bond: any = await this.cacheManager.get(cacheKey);

    if (!bond) {
      const raw = await this.bondRepository
        .createQueryBuilder('bond')
        .leftJoinAndSelect('bond.creator', 'creator')
        .leftJoinAndSelect('bond.userInterests', 'userInterests')
        .leftJoinAndSelect('bond.co_organizers', 'co_organizers')
        .where('bond.id = :id', { id })
        .getOne();

      if (!raw) return { code: 0, message: 'Bond not found', data: null };

      const enriched = (await this.enrichBondsWithUserData([raw], userId))[0];
      const recent = (await this.loadRecentActivities([id])).get(id) ?? [];
      const isCo = userId ? raw.co_organizers?.some((co: User) => co.id === userId) ?? false : false;

      bond = this.transformBondResponse(enriched, userId, recent, isCo);
      await this.cacheManager.set(cacheKey, bond, 300);
    }

    this.logQueryPerformance('findOne', startTime);
    return { code: 1, message: 'Bond retrieved successfully', data: bond };
  }

    /* ------------------------------------------------------------------ */
  /*  ADMIN – BOND VISIBILITY CONTROL                                  */
  /* ------------------------------------------------------------------ */
  async hideBond(id: number): Promise<void> {
    const bond = await this.bondRepository.findOne({ where: { id } });
    
    if (!bond) {
      throw new NotFoundException(`Bond with ID ${id} not found`);
    }

    // Set hidden_at timestamp in metadata
    const metadata = bond.metadata || {};
    metadata.hidden_at = new Date().toISOString();
    
    bond.metadata = metadata;
    await this.bondRepository.save(bond);
    
    // Invalidate cache
    await this.cacheManager.del(`bond:${id}`);
    
    this.logger.log(`Bond ${id} hidden at ${metadata.hidden_at}`);
  }

  async unhideBond(id: number): Promise<void> {
    const bond = await this.bondRepository.findOne({ where: { id } });
    
    if (!bond) {
      throw new NotFoundException(`Bond with ID ${id} not found`);
    }

    // Remove hidden_at from metadata
    if (bond.metadata && bond.metadata.hidden_at) {
      delete bond.metadata.hidden_at;
      await this.bondRepository.save(bond);
      
      // Invalidate cache
      await this.cacheManager.del(`bond:${id}`);
      
      this.logger.log(`Bond ${id} unhidden`);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  ADMIN – BOND MEMBER MANAGEMENT                                    */
  /* ------------------------------------------------------------------ */
  async getBondMembers(
    bondId: number,
    page = 1,
    limit = 20,
  ): Promise<{
    members: any[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    // First, verify the bond exists
    const bond = await this.bondRepository.findOne({ 
      where: { id: bondId },
      relations: ['co_organizers']
    });
    
    if (!bond) {
      throw new NotFoundException(`Bond with ID ${bondId} not found`);
    }

    const skip = (page - 1) * limit;

    // Get co-organizer IDs for quick lookup
    const coOrganizerIds = new Set(bond.co_organizers?.map(co => co.id) || []);

    // Get total member count
    const totalResult = await this.bondRepository.query(`
      SELECT COUNT(DISTINCT bu.user_id) as total
      FROM bonds_users bu
      WHERE bu.bond_id = ?
    `, [bondId]);
    
    const total = parseInt(totalResult[0]?.total || '0', 10);

    // Get paginated members with details
    const members = await this.bondRepository.query(`
      SELECT 
        u.id,
        u.full_name,
        u.user_name,
        u.email,
        u.profile_image,
        u.created_at as joined_at
      FROM bonds_users bu
      JOIN users u ON u.id = bu.user_id
      WHERE bu.bond_id = ?
      ORDER BY u.full_name ASC
      LIMIT ? OFFSET ?
    `, [bondId, limit, skip]);

    // Add co-organizer flag to each member
    const enrichedMembers = members.map((member: any) => ({
      id: member.id,
      full_name: member.full_name,
      user_name: member.user_name,
      email: member.email,
      profile_image: member.profile_image,
      joined_at: member.joined_at,
      is_co_organizer: coOrganizerIds.has(member.id),
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      members: enrichedMembers,
      total,
      page,
      limit,
      total_pages: totalPages,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  ADMIN – ENHANCED REPORT STATISTICS                                */
  /* ------------------------------------------------------------------ */
  async getBondReportStatistics(): Promise<BondReportStatsDto> {
    const cacheKey = 'bond:report:stats';
    const cached = await this.cacheManager.get<BondReportStatsDto>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for performance
    const [
      totalReports,
      pendingReports,
      reviewedReports,
      resolvedReports,
      dismissedReports,
      reportsLast24h,
      reportsLast7d,
      reportsLast30d,
      mostReportedBondResult,
      mostCommonReasonResult,
    ] = await Promise.all([
      // Total reports
      this.bondReportRepository.count(),

      // Pending reports
      this.bondReportRepository.count({ where: { status: ReportStatus.PENDING } }),

      // Reviewed reports
      this.bondReportRepository.count({ where: { status: ReportStatus.REVIEWED } }),

      // Resolved reports
      this.bondReportRepository.count({ where: { status: ReportStatus.RESOLVED } }),

      // Dismissed reports
      this.bondReportRepository.count({ where: { status: ReportStatus.DISMISSED } }),

      // Reports in last 24 hours
      this.bondReportRepository.count({
        where: {
          created_at: MoreThanOrEqual(last24h),
        },
      }),

      // Reports in last 7 days
      this.bondReportRepository.count({
        where: {
          created_at: MoreThanOrEqual(last7d),
        },
      }),

      // Reports in last 30 days
      this.bondReportRepository.count({
        where: {
          created_at: MoreThanOrEqual(last30d),
        },
      }),

      // Most reported bond
      this.bondReportRepository.query(`
        SELECT 
          br.bond_id,
          b.name,
          COUNT(*) as report_count
        FROM bond_reports br
        JOIN bonds b ON b.id = br.bond_id
        GROUP BY br.bond_id, b.name
        ORDER BY report_count DESC
        LIMIT 1
      `),

      // Most common report reason
      this.bondReportRepository.query(`
        SELECT 
          reason,
          COUNT(*) as count
        FROM bond_reports
        GROUP BY reason
        ORDER BY count DESC
        LIMIT 1
      `),
    ]);

    const mostReportedBond = mostReportedBondResult[0]
      ? {
          bond_id: mostReportedBondResult[0].bond_id,
          name: mostReportedBondResult[0].name,
          report_count: parseInt(mostReportedBondResult[0].report_count, 10),
        }
      : null;

    const mostCommonReason = mostCommonReasonResult[0]?.reason || 'none';

    const stats: BondReportStatsDto = {
      total_reports: totalReports,
      pending_reports: pendingReports,
      reviewed_reports: reviewedReports,
      resolved_reports: resolvedReports,
      dismissed_reports: dismissedReports,
      reports_last_24h: reportsLast24h,
      reports_last_7d: reportsLast7d,
      reports_last_30d: reportsLast30d,
      most_reported_bond: mostReportedBond,
      most_common_reason: mostCommonReason,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);
    return stats;
  }

  async getPendingReports(
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  ): Promise<{
    reports: PendingReportDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const skip = (page - 1) * limit;

    // Determine sort field
    let orderByField = 'br.created_at';
    if (sortBy === 'bond_id') {
      orderByField = 'br.bond_id';
    }

    // Get total count of pending reports
    const totalResult = await this.bondReportRepository.query(`
      SELECT COUNT(*) as total
      FROM bond_reports br
      WHERE br.status = ?
    `, [ReportStatus.PENDING]);

    const total = parseInt(totalResult[0]?.total || '0', 10);

    // Get pending reports with bond and reporter details
    const reports = await this.bondReportRepository.query(`
      SELECT 
        br.id,
        br.bond_id,
        b.name as bond_name,
        br.reporter_id,
        u.full_name as reporter_name,
        br.reason,
        br.description,
        br.created_at,
        br.status
      FROM bond_reports br
      JOIN bonds b ON b.id = br.bond_id
      JOIN users u ON u.id = br.reporter_id
      WHERE br.status = ?
      ORDER BY ${orderByField} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [ReportStatus.PENDING, limit, skip]);

    const formattedReports: PendingReportDto[] = reports.map((report: any) => ({
      id: report.id,
      bond_id: report.bond_id,
      bond_name: report.bond_name,
      reporter_id: report.reporter_id,
      reporter_name: report.reporter_name || 'Unknown',
      reason: report.reason,
      description: report.description,
      created_at: report.created_at,
      status: report.status,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      reports: formattedReports,
      total,
      page,
      limit,
      total_pages: totalPages,
    };
  }

  /* ---------------------------------------------------------- */
  /*  1.  missing controller entry-points                       */
  /* ---------------------------------------------------------- */
  /* ------------------------------------------------------------------ */
/*  ADMIN – list EVERY bond (not only reported ones)                  */
/* ------------------------------------------------------------------ */
async getAllBondsAdmin(page = 1, limit = 20): Promise<{
  bonds: {
    bond_id: number;
    name: string;
    total_reports: number;
    pending_reports: number;
  }[];
  total: number;
}> {
  const skip = (page - 1) * limit;

  /* 1.  get **every** public bond with basic stats */
  const [bonds, total] = await this.bondRepository
    .createQueryBuilder('bond')
    .select(['bond.id', 'bond.name'])
    .where('bond.is_public = :isPublic', { isPublic: true })
    .orderBy('bond.created_at', 'DESC')
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  /* 2.  decorate each bond with report counters */
  const bondIds = bonds.map((b) => b.id);
  const rawStats = await this.bondReportRepository
    .createQueryBuilder('br')
    .select('br.bond_id', 'bond_id')
    .addSelect('COUNT(*)', 'total_reports')
    .addSelect(
      'SUM(CASE WHEN br.status = :pending THEN 1 ELSE 0 END)',
      'pending_reports',
    )
    .where('br.bond_id IN (:...bondIds)', { bondIds })
    .setParameter('pending', ReportStatus.PENDING)
    .groupBy('br.bond_id')
    .getRawMany();

  const statMap = new Map(
    rawStats.map((s) => [s.bond_id, { total: +s.total_reports, pending: +s.pending_reports }]),
  );

  const decorated = bonds.map((b) => ({
    bond_id: b.id,
    name: b.name,
    total_reports: statMap.get(b.id)?.total ?? 0,
    pending_reports: statMap.get(b.id)?.pending ?? 0,
  }));

  return { bonds: decorated, total };
}

/* ------------------------------------------------------------------ */
/*  ADMIN – read full reports for a bond (wrapper with correct name)  */
/* ------------------------------------------------------------------ */
async getBondReports(
  bondId: number,
  viewerId: string | null,
  page = 1,
  limit = 20,
): Promise<{ reports: BondReportResponseDto[]; total: number }> {
  /* reuse the exact same authorisation & collation-safe logic */
  return this.getBondReports(bondId, viewerId, page, limit);
}

  /* ---------------------------------------------------------- */
  /*  2.  missing mail helper                                   */
  /* ---------------------------------------------------------- */
  private async notifyReporterOnStatusChange(
    report: BondReport,
    reviewer: User,
  ) {
    const reporter = await this.userRepository
      .createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.full_name'])
      .where('u.id = :id', { id: report.reporter_id })
      .getOne();

    if (!reporter || !reporter.email) {
      this.logger.warn(`No e-mail for reporter ${report.reporter_id}`);
      return;
    }

    const bond = await this.bondRepository
      .createQueryBuilder('b')
      .select('b.name')
      .where('b.id = :id', { id: report.bond_id })
      .getOne();

    const subject = `Bond report updated – ${report.status}`;
    const html = `
      <!doctype html>
      <html>
        <body style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;padding:20px;">
          <h2 style="color:#6366f1">Hi ${reporter.full_name},</h2>
          <p>Your report for the bond <strong>${bond?.name ?? 'n/a'}</strong>
             has been reviewed by an administrator.</p>
          <p><strong>New status:</strong> ${report.status}</p>
          ${report.review_notes ? `<p><strong>Notes:</strong><br/>${report.review_notes}</p>` : ''}
          <p>Thank you for helping keep our community safe.</p>
        </body>
      </html>`;

    await this.zeptoMailService.sendMail({
      from: {
        address: process.env.MAIL_FROM_ADDRESS!,
        name: process.env.MAIL_FROM_NAME!,
      },
      to: [{ email_address: { address: reporter.email, name: reporter.full_name } }],
      subject,
      htmlbody: html,
      textbody: `Your report for bond ${bond?.name} is now ${report.status}.`,
    });

    this.logger.log(`✅ Reporter ${reporter.email} notified about status ${report.status}`);
  }
}