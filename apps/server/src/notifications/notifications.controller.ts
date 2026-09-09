import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { BroadcastDto, SubscribeDto, UnsubscribeDto } from './dto/subscribe.dto';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

/**
 * The VAPID public key is, by design, handed to every browser that wants to
 * subscribe — it lives on its own unguarded controller so the blanket
 * `JwtAuthGuard` on {@link NotificationsController} stays a blanket.
 */
@ApiTags('notifications')
@Controller('notifications')
export class PushPublicController {
  constructor(private readonly push: PushService) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'VAPID public key the browser needs to subscribe' })
  vapidPublicKey() {
    return { publicKey: this.push.publicKey, enabled: this.push.isEnabled };
  }
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (newest first, paginated)' })
  list(@Req() req: any, @Query() query: ListNotificationsDto) {
    return this.notifications.list(req.user.id, query.skip, query.take);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'How many of my notifications are unread' })
  unreadCount(@Req() req: any) {
    return this.notifications.unreadCount(req.user.id);
  }

  @Get('subscribe')
  @ApiOperation({ summary: 'How many browsers I have subscribed to push' })
  async subscriptionCount(@Req() req: any) {
    return { devices: await this.push.countFor(req.user.id) };
  }

  @Post('subscribe')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register this browser for web push' })
  subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    return this.push.subscribe(
      req.user.id,
      { endpoint: dto.endpoint, keys: dto.keys },
      dto.userAgent,
    );
  }

  @Delete('subscribe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stop web push for this browser' })
  unsubscribe(@Req() req: any, @Body() dto: UnsubscribeDto) {
    return this.push.unsubscribe(req.user.id, dto.endpoint);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Admin: push an announcement to every subscribed device' })
  broadcast(@Body() dto: BroadcastDto) {
    return this.push.sendToAll({ title: dto.title, message: dto.message, url: dto.url });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one of my notifications as read' })
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notifications.markRead(req.user.id, id);
  }
}
