import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Bond } from './entities/bond.entity';
import { BondReport, ReportStatus } from './entities/bond-report.entity';
import { BondReportResponseDto, ReviewReportFormDto } from './dto/report-bond.dto';
import { User } from '../user/entities/user.entity';
import { ZeptomailApiService } from '../../third-party/zeptomail-api/zeptomail-api.service';

@Injectable()
export class BondsService {
  private readonly logger = new Logger(BondsService.name);

  constructor(
    @InjectRepository(Bond)
    private readonly bondRepository: Repository<Bond>,
    @InjectRepository(BondReport)
    private readonly bondReportRepository: Repository<BondReport>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly zeptoMailService: ZeptomailApiService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  ADMIN: list every bond that has been reported at least once       */
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

  /* ------------------------------------------------------------------ */
  /*  ADMIN: read full reports for a bond                               */
  /* ------------------------------------------------------------------ */
  async getBondReports(
    bondId: number,
    userId: string | null,
    page = 1,
    limit = 20,
  ): Promise<{ reports: BondReportResponseDto[]; total: number }> {
    const bond = await this.bondRepository.findOne({
      where: { id: bondId },
      relations: ['creator', 'co_organizers'],
    });

    if (!bond) throw new NotFoundException(`Bond with ID ${bondId} not found`);

    const isAdmin = userId === null;
    const isCreator = bond.creator?.id === userId;
    const isCoOrg = bond.co_organizers?.some((co) => co.id === userId);

    if (!isAdmin && !isCreator && !isCoOrg) {
      throw new ForbiddenException('Only bond organisers can view reports');
    }

    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      this.bondReportRepository.find({
        where: { bond_id: bondId },
        order: { created_at: 'DESC' },
        skip,
        take: limit,
      }),
      this.bondReportRepository.count({ where: { bond_id: bondId } }),
    ]);

    const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
    const reporters = reporterIds.length
      ? await this.userRepository.findByIds(reporterIds)
      : [];

    const reporterMap = new Map(reporters.map((r) => [r.id, r]));

    (reports as any).forEach((r: any) => (r.reporter = reporterMap.get(r.reporter_id) || null));

    const dto: BondReportResponseDto[] = reports.map((r) => ({
      id: r.id,
      bond_id: r.bond_id,
      reporter_id: r.reporter_id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
    }));

    return { reports: dto, total };
  }

  /* ------------------------------------------------------------------ */
  /*  ADMIN: review / update a bond report                              */
  /* ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ */
  /*  REPORT STATS (admin)                                              */
  /* ------------------------------------------------------------------ */
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
  /*  EMAIL HELPER                                                      */
  /* ------------------------------------------------------------------ */
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