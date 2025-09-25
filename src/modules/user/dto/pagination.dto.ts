// src/modules/user/dto/pagination.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString } from 'class-validator'; // Use IsInt and Min
import { Transform } from 'class-transformer'; // Import Transform

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // --- Extremely Defensive Transformation ---
    // 1. Handle explicit undefined/null
    if (value === undefined || value === null) {
      return undefined;
    }
    // 2. Convert to string (handles numbers, strings, arrays etc.)
    let stringValue: string;
    if (Array.isArray(value)) {
      // If somehow an array is passed (e.g., ?page=1&page=2), take the first element
      stringValue = String(value[0]);
    } else {
      stringValue = String(value);
    }
    // 3. Trim whitespace
    stringValue = stringValue.trim();
    // 4. Check for empty string after trimming
    if (stringValue === '') {
      return undefined;
    }
    // 5. Attempt number conversion
    const parsedNumber = Number(stringValue);
    // 6. Validate: Must be an integer, finite, and >= 1
    //    If valid, return it. Otherwise, return undefined to let @IsOptional handle it.
    //    This pre-empts validation errors.
    if (Number.isInteger(parsedNumber) && isFinite(parsedNumber) && parsedNumber >= 1) {
      return parsedNumber;
    }
    // If it's not a valid positive integer, return undefined
    return undefined;
    // --- End Defensive Transformation ---
  })
  // Validators now just double-check the @Transform result
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than or equal to 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // --- Extremely Defensive Transformation ---
    if (value === undefined || value === null) {
      return undefined;
    }
    let stringValue: string;
    if (Array.isArray(value)) {
      stringValue = String(value[0]);
    } else {
      stringValue = String(value);
    }
    stringValue = stringValue.trim();
    if (stringValue === '') {
      return undefined;
    }
    const parsedNumber = Number(stringValue);
    // Validate: Must be an integer, finite, >= 1, and <= 100
    if (Number.isInteger(parsedNumber) && isFinite(parsedNumber) && parsedNumber >= 1 && parsedNumber <= 100) {
      return parsedNumber;
    }
    return undefined;
    // --- End Defensive Transformation ---
  })
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be greater than or equal to 1' })
  // Note: You might want a Max validator too, but we handle it in transform and controller
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by user interest IDs (comma-separated UUIDs)',
    example: '0269b73c-a473-4efb-9992-6dd22c438f50,06d95652-fbd9-4a65-9d57-8bbb1d82b57b',
    type: String,
  })
  @IsOptional()
  @IsString()
  interest_ids?: string;
}