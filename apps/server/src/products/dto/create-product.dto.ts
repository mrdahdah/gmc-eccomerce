import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Headphones' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 2000)
  description!: string;

  @ApiProperty({ description: 'Price in dollars', example: 89.99 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiProperty({ description: 'Category id' })
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional({ description: 'Image as a remote URL or base64 data URI; normalised via Cloudinary' })
  @IsOptional()
  @IsString()
  image?: string;
}
