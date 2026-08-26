// apps/server/src/auth/admin.controller.ts
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // PUBLIC (only for admins to login)
  @Post('auth/login')
  @ApiOperation({ summary: 'Admin login' })
  adminLogin(@Body() body: { email: string; password: string }) {
    return this.adminService.adminLogin(body.email, body.password);
  }

  // PROTECTED: only an existing ADMIN may mint another admin. (Was public — a
  // privilege-escalation hole, since adminRegister hard-codes role = ADMIN.)
  // The first admin comes from the seed script.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new admin (admin only)' })
  adminRegister(@Body() body: { firstName: string; lastName: string; email: string; password: string }) {
    return this.adminService.adminRegister(body);
  }

  // PROTECTED (requires ADMIN role)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // PROTECTED (requires ADMIN role)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}