import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** The authenticated user's own profile (password hash stripped). */
  async getMe(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.safe(user);
  }

  async updateMe(id: string, dto: UpdateMeDto) {
    const data: { firstName?: string; lastName?: string } = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    const user = await this.prisma.user.update({ where: { id }, data });
    return this.safe(user);
  }

  private safe(user: { passwordHash: string } & Record<string, unknown>) {
    const { passwordHash: _omit, ...rest } = user;
    return rest;
  }
}
