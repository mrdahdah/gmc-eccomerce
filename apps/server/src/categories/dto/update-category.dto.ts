import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

// All fields optional; validation rules are inherited from CreateCategoryDto.
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
