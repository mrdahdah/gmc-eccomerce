import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

// PrismaModule + CloudinaryModule are @Global; AuthModule registers the JWT strategy.
@Module({ controllers: [ProductsController], providers: [ProductsService, RolesGuard] })
export class ProductsModule {}
