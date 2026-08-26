import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

function makePrisma(user: any) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockImplementation(({ data }: any) => ({ ...user, ...data })),
    },
  } as unknown as PrismaService;
}

describe('UsersService', () => {
  it('returns the current user without the password hash', async () => {
    const service = new UsersService(
      makePrisma({ id: 'u1', email: 'a@b.co', firstName: 'A', lastName: 'B', role: 'CUSTOMER', passwordHash: 'secret' }),
    );

    const me = await service.getMe('u1');

    expect(me).toMatchObject({ id: 'u1', email: 'a@b.co', role: 'CUSTOMER' });
    expect((me as any).passwordHash).toBeUndefined();
  });

  it('throws 404 when the user no longer exists', async () => {
    const service = new UsersService(makePrisma(null));
    await expect(service.getMe('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
