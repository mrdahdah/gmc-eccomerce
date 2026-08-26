import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

// PrismaModule is @Global and the JWT passport strategy is registered by AuthModule,
// so this module only needs to declare its own controller, service and RolesGuard.
@Module({ controllers: [CategoriesController], providers: [CategoriesService, RolesGuard] })
export class CategoriesModule {}
