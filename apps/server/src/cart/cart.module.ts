import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

// PrismaModule is @Global and AuthModule registers the JWT strategy used by JwtAuthGuard.
@Module({ controllers: [CartController], providers: [CartService] })
export class CartModule {}
