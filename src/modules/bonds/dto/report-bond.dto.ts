// src/modules/bonds/dto/report-bond.dto.ts
import { IsOptional, IsString, MaxLength, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportReason, ReportStatus } from '../entities/bond-report.entity';

/* ---------- JSON body DTO (service layer) ---------- */
export class ReportBondDto {
  @ApiProperty({
    description:
      'Reason for reporting the bond. ' +
      'You can send one of the predefined enum values or any custom string.',
    example: ReportReason.INAPPROPRIATE_CONTENT,
  })
  @IsNotEmpty()
  @IsString()
  reason: string; // ← enum OR free text

  @ApiProperty({ required: false, description: 'Additional details' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    required: false,
    description: 'JSON metadata (links, etc.) – must be valid JSON string',
    example: '{"links":["https://example.com"]}',
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}

/* ---------- multipart/form-data DTO (controller layer) ---------- */
export class ReportBondFormDto extends ReportBondDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
  })
  screenshots?: any; // <-- was Express.Multer.File[]
}

/* ---------- Response DTO ---------- */
export class BondReportResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() bond_id: number;
  @ApiProperty() reporter_id: string;
  @ApiProperty() reason: string; // returned as plain string
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ enum: ReportStatus }) status: ReportStatus;
  @ApiProperty() created_at: Date;
  @ApiProperty({ required: false }) reviewed_at?: Date;
}




/* ---------------------------------------------------------- */
/*  DTO used by PATCH /api/bonds/admin/reports/{reportId}     */
/* ---------------------------------------------------------- */
export class ReviewReportDto {
  @ApiProperty({
    description: 'New status to set',
    enum: ReportStatus,               // ← Swagger lists all four values
    example: ReportStatus.RESOLVED,
  })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiProperty({
    description: 'Optional review notes',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}


export class ReviewReportFormDto {
  @ApiProperty({
    description: 'New status to set',
    enum: ReportStatus,
    example: ReportStatus.RESOLVED,
  })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiProperty({
    type: 'string',          // <- plain text
    required: false,
    description: 'Optional review notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}