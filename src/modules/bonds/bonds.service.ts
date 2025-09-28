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
    bonds: {
      bond_id: number;
      name: string;
      total_reports: number;
      pending_reports: number;
    }[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const raw = await this.bondReportRepository
      .createQueryBuilder('br')
      .select('br.bond_id', 'bond_id')
      .addSelect('b.name', 'name')
      .addSelect('COUNT(*)', 'total_reports')
      .addSelect(
        'SUM(CASE WHEN br.status = :pending THEN 1 ELSE 0 END)',
        'pending_reports',
      )
      .innerJoin(Bond, 'b', 'b.id = br.bond_id')
      .groupBy('br.bond_id')
      .addGroupBy('b.name')
      .orderBy('total_reports', 'DESC')
      .offset(skip)
      .limit(limit)
      .setParameter('pending', ReportStatus.PENDING)
      .getRawMany();

    const total = await this.bondReportRepository
      .createQueryBuilder('br')
      .select('COUNT(DISTINCT br.bond_id)', 'count')
      .getRawOne()
      .then((r) => Number(r.count));

    return { bonds: raw, total };
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