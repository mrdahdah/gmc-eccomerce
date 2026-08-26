import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

// User self-service routes. Distinct from the admin surface (/admin/*):
// any authenticated CUSTOMER or ADMIN can read/patch their own profile here.
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  me(@Req() req: any) {
    return this.users.getMe(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  updateMe(@Req() req: any, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(req.user.id, dto);
  }
}
