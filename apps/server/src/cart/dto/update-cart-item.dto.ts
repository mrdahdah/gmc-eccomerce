import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New absolute quantity for the line', minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;
}
