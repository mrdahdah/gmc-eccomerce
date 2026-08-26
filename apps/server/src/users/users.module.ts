import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// PrismaModule is @Global; AuthModule registers the JWT strategy used by JwtAuthGuard.
@Module({ controllers: [UsersController], providers: [UsersService] })
export class UsersModule {}
