import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, CartModule, NotificationsModule] })
export class AppModule {}
