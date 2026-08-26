import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'Product id to add' })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ description: 'Quantity to add (defaults to 1)', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  quantity?: number;
}
