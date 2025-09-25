// src/modules/activity/dto/report-activity.dto.ts

import { IsOptional, IsString, MaxLength, IsNotEmpty, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ReportReason, ReportStatus } from '../entities/activity-report.entity';

/* ----------------------------------------------------------- */
/* 1.  JSON body DTO  –– what the service layer consumes       */
/* ----------------------------------------------------------- */
export class ReportActivityDto {
  @ApiProperty({
    description:
      'Reason for reporting the activity. ' +
      'You can send one of the predefined enum values or any custom string.',
    example: ReportReason.INAPPROPRIATE_CONTENT,
  })
  @IsNotEmpty()
  @IsString()
  reason: string; // ← accepts enum value OR free text

  @ApiProperty({
    description: 'Additional details about the report (optional)',
    required: false,
    maxLength: 1000,
    example: 'The activity description contains offensive language',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Additional metadata (screenshots, links, etc.)',
    required: false,
    example: { links: ['https://example.com  '] },
  })
  @IsOptional()
  metadata?: any;

  /* Array of uploaded screenshot URLs (filled by controller) */
  screenshots?: string[];
}

/* ----------------------------------------------------------- */
/* 2.  multipart/form-data DTO  –– what the controller receives*/
/* ----------------------------------------------------------- */
export class ReportActivityFormDto {
  @ApiProperty({
    description:
      'Reason for reporting the activity. ' +
      'You can send one of the predefined enum values or any custom string.',
    example: ReportReason.INAPPROPRIATE_CONTENT,
  })
  @IsNotEmpty()
  @IsString()
  reason: string; // ← accepts enum value OR free text

  @ApiProperty({
    description: 'Additional details about the report (optional)',
    required: false,
    maxLength: 1000,
    example: 'The activity description contains offensive language',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /* Optional JSON string for any extra structured data */
  @ApiProperty({
    description: 'Additional metadata as JSON string (links, etc.)',
    required: false,
    example: '{"links":["https://example.com  "]}',
  })
  @IsOptional()
  @IsString()
  @IsJSON({ message: 'metadata must be a valid JSON string' })
  metadata?: string;

  /* Screenshots uploaded as files */
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Screenshot images (multiple allowed)',
    required: false,
  })
  screenshots?: any[];
}

/* ----------------------------------------------------------- */
/* 3.  Response DTO – exposed to the client                    */
/* ----------------------------------------------------------- */
export class ReportResponseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  activity_id: number;

  @Expose()
  @ApiProperty()
  reporter_id: string;

  @Expose()
  @ApiProperty()
  reason: string;

  @Expose()
  @ApiProperty({ required: false })
  description?: string;

  @Expose()
  @ApiProperty({ enum: ReportStatus })
  status: ReportStatus;

  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty({ required: false })
  review_notes?: string;

  @Expose()
  @ApiProperty({ required: false })
  reviewed_at?: Date;
}