/* -------------------------------------------------
 *  USER SERVICE – ADMIN-ONLY (absolute minimum)
 * ------------------------------------------------- */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';

import { User } from './entities/user.entity';
import { NotificationPreferences } from './entities/notification-preferences.entity';
import { Country } from './entities/country.entity';
import { UserReport } from './entities/user-report.entity';
import { UserReportResponseDto } from './dto/user-report-response.dto';
import { plainToInstance } from 'class-transformer';

/* --------------  HELPERS -------------- */
export function toUserResponseDto(user: User, enrichedData?: any) {
  const out: any = { ...user };
  out.country = user.country ? { id: user.country.id, name: user.country.name } : null;
  
  // Add enriched data if provided
  if (enrichedData) {
    out.followers_count = enrichedData.followers_count || 0;
    out.following_count = enrichedData.following_count || 0;
    out.bonds_count = enrichedData.bonds_count || 0;
    out.activities_count = enrichedData.activities_count || 0;
  }
  
  // Remove sensitive fields
  delete out.password;
  delete out.otp_email;
  delete out.otp_phone;
  delete out.latitude;
  delete out.longitude;
  delete out.social_id;
  delete out.social_type;
  delete out.deleted_at;
  
  return out;
}

/* --------------  SERVICE -------------- */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,

    @InjectRepository(NotificationPreferences)
    private readonly notificationPreferencesRepository: Repository<NotificationPreferences>,

    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,

    @InjectRepository(UserReport)
    private readonly userReportRepository: Repository<UserReport>,
  ) {}

  /* ----------  ADMIN END-POINTS  ---------- */

  async findAll(query: any) {
    const { page = 1, limit = 10, search, email_verified, phone_verified, notification } = query;

    const where: any = {};
    if (email_verified !== undefined) where.email_verified = email_verified;
    if (phone_verified !== undefined) where.phone_verified = phone_verified;
    if (notification !== undefined) where.notification = notification;

    const options: FindManyOptions<User> = {
      relations: ['country'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      where,
    };

    if (search?.trim()) {
      options.where = [
        { ...where, full_name: Like(`%${search.trim()}%`) },
        { ...where, user_name: Like(`%${search.trim()}%`) },
        { ...where, email: Like(`%${search.trim()}%`) },
      ];
    }

    const [users, total] = await this.repository.findAndCount(options);
    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map(toUserResponseDto),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.repository.findOne({ where: { id }, relations: ['country'] });
    if (!user) throw new BadRequestException('User not found');
    
    // Get enriched data (counts)
    const enrichedData = await this.getEnrichedUserData(id);
    
    return toUserResponseDto(user, enrichedData);
  }

  private async getEnrichedUserData(userId: string) {
    const [followersCount, followingCount, bondsCount, activitiesCount] = await Promise.all([
      // Followers count
      this.repository.query(
        `SELECT COUNT(*) as count FROM follows WHERE following_id = ?`,
        [userId]
      ).then(result => parseInt(result[0]?.count || '0', 10)),
      
      // Following count
      this.repository.query(
        `SELECT COUNT(*) as count FROM follows WHERE follower_id = ?`,
        [userId]
      ).then(result => parseInt(result[0]?.count || '0', 10)),
      
      // Bonds count (bonds user is member of)
      this.repository.query(
        `SELECT COUNT(*) as count FROM bonds_users WHERE user_id = ?`,
        [userId]
      ).then(result => parseInt(result[0]?.count || '0', 10)),
      
      // Activities count (activities user is participating in)
      this.repository.query(
        `SELECT COUNT(DISTINCT activity_id) as count FROM (
           SELECT activity_id FROM activity_participants WHERE user_id = ?
           UNION
           SELECT activity_id FROM activity_co_organizers WHERE user_id = ?
           UNION
           SELECT id as activity_id FROM activities WHERE creator_id = ?
         ) AS user_activities`,
        [userId, userId, userId]
      ).then(result => parseInt(result[0]?.count || '0', 10)),
    ]);

    return {
      followers_count: followersCount,
      following_count: followingCount,
      bonds_count: bondsCount,
      activities_count: activitiesCount,
    };
  }

  async remove(id: string) {
    await this.repository.delete(id);
    return { message: 'User removed' };
  }

  /* ----------  ANALYTICS  ---------- */

  async getUsersOverview(params: { period: 'daily' | 'weekly' | 'monthly' }) {
    const { period } = params;
    const intervals = this.buildIntervals(new Date(), period);

    const [signUps, active, churned] = await Promise.all([
      this.getSignUpsPerInterval(intervals),
      this.getActivePerInterval(intervals),
      this.getChurnedPerInterval(intervals),
    ]);

    return { signUps, active, churned };
  }

  async getUsersDemography() {
    const [age, gender, countries] = await Promise.all([
      this.getAgeBuckets(),
      this.getGenderSplit(),
      this.getTopCountries(),
    ]);
    return { age, gender, countries };
  }

  async getVerificationFunnel() {
    const total = await this.repository.count();
    const emailVer = await this.repository.count({ where: { email_verified: true } });
    const phoneVer = await this.repository.count({ where: { phone_verified: true } });
    const bothVer = await this.repository.count({ where: { email_verified: true, phone_verified: true } });

    return {
      total,
      email_verified: { count: emailVer, percentage: Math.round((emailVer / total) * 100) },
      phone_verified: { count: phoneVer, percentage: Math.round((phoneVer / total) * 100) },
      both_verified: { count: bothVer, percentage: Math.round((bothVer / total) * 100) },
    };
  }

  async getTotalUsers(): Promise<number> {
    return this.repository.count();
  }

  /* ----------  USER REPORTS  ---------- */

  async getUserReports(
    page = 1,
    limit = 20,
    status?: string,
    reason?: string,
  ): Promise<{
    reports: UserReportResponseDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;

    // Get reports with user details
    const [reports, total] = await this.userReportRepository.findAndCount({
      where,
      relations: ['reported_user', 'reporter'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    // Transform to DTO with cleaned user data
    const transformedReports = reports.map((report) => {
      const dto: any = plainToInstance(UserReportResponseDto, report, {
        excludeExtraneousValues: true,
      });

      // Clean up user data - remove sensitive fields
      if (report.reported_user) {
        dto.reported_user = {
          id: report.reported_user.id,
          full_name: report.reported_user.full_name,
          user_name: report.reported_user.user_name,
          email: report.reported_user.email,
          profile_image: report.reported_user.profile_image,
        };
      }

      if (report.reporter) {
        dto.reporter = {
          id: report.reporter.id,
          full_name: report.reporter.full_name,
          user_name: report.reporter.user_name,
          email: report.reporter.email,
          profile_image: report.reporter.profile_image,
        };
      }

      return dto;
    });

    const total_pages = Math.ceil(total / limit);

    return {
      reports: transformedReports,
      total,
      page,
      limit,
      total_pages,
    };
  }

  /* -------------------------------------------------
   *  PRIVATE HELPERS
   * ------------------------------------------------- */
  private buildIntervals(ref: Date, period: 'daily' | 'weekly' | 'monthly') {
    const days = period === 'daily' ? 30 : period === 'weekly' ? 12 : 12;
    const intervals: { start: Date; end: Date; label: string }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      let start = new Date(ref);
      let end = new Date(ref);
      if (period === 'daily') {
        start.setDate(ref.getDate() - i);
        end.setDate(ref.getDate() - i + 1);
        intervals.push({ start, end, label: start.toISOString().slice(0, 10) });
      } else if (period === 'weekly') {
        start.setDate(ref.getDate() - i * 7);
        end.setDate(ref.getDate() - (i - 1) * 7);
        intervals.push({ start, end, label: `W${this.getWeek(start)}` });
      } else {
        start = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
        end = new Date(ref.getFullYear(), ref.getMonth() - i + 1, 1);
        intervals.push({ start, end, label: start.toISOString().slice(0, 7) });
      }
    }
    return intervals;
  }

  private async getSignUpsPerInterval(intervals: { start: Date; end: Date; label: string }[]) {
    return Promise.all(
      intervals.map(async ({ start, end, label }) => {
        const cnt = await this.repository
          .createQueryBuilder('u')
          .select('COUNT(*)', 'cnt')
          .where('u.created_at >= :start', { start })
          .andWhere('u.created_at < :end', { end })
          .getRawOne()
          .then((r) => Number(r.cnt));
        return { label, count: cnt };
      }),
    );
  }

  private async getActivePerInterval(intervals: { start: Date; end: Date; label: string }[]) {
    /* same as sign-ups – proxy */
    return this.getSignUpsPerInterval(intervals);
  }

  private async getChurnedPerInterval(intervals: { start: Date; end: Date; label: string }[]) {
    return Promise.all(
      intervals.map(async ({ start, end, label }) => {
        const cnt = await this.repository
          .createQueryBuilder('u')
          .select('COUNT(*)', 'cnt')
          .where('u.notification = 0')
          .andWhere('u.created_at >= :start', { start })
          .andWhere('u.created_at < :end', { end })
          .getRawOne()
          .then((r) => Number(r.cnt));
        return { label, count: cnt };
      }),
    );
  }

  private async getAgeBuckets() {
    const sql = `
      SELECT
        CASE
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) <= 18 THEN '≤18'
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 19 AND 25 THEN '19-25'
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 26 AND 35 THEN '26-35'
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 36 AND 45 THEN '36-45'
          WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
          ELSE '60+'
        END AS bucket,
        COUNT(*) as count
      FROM users u
      WHERE u.dob IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket`;
    return this.repository.query(sql);
  }

  private async getGenderSplit() {
    const sql = `
      SELECT COALESCE(u.gender, 'unknown') AS gender, COUNT(*) as count
      FROM users u
      GROUP BY gender`;
    return this.repository.query(sql);
  }

  private async getTopCountries() {
    const sql = `
      SELECT c.name AS country, COUNT(*) as count
      FROM users u
      LEFT JOIN countries c ON c.id = u.country_id
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 10`;
    return this.repository.query(sql);
  }

  private getWeek(d: Date): number {
    const target = new Date(d.valueOf());
    const dayNr = (d.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    return Math.ceil((firstThursday - target.valueOf()) / 604800000) + 1;
  }
}