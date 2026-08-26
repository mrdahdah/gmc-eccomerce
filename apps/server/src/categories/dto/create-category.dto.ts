import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @Length(2, 60)
  name!: string;

  @ApiPropertyOptional({ description: 'URL slug; derived from the name when omitted', example: 'electronics' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase words separated by hyphens' })
  slug?: string;
}
