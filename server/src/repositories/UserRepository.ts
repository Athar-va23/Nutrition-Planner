import { prisma } from '../utils/dbCheck';
import { User, RefreshToken } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        preferences: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        preferences: true,
      },
    });
  }

  async create(data: { email: string; passwordHash: string; firstName: string; lastName: string }) {
    return prisma.user.create({
      data: {
        ...data,
        profile: {
          create: {
            activityLevel: 'moderate',
            healthGoal: 'maintain',
          },
        },
        preferences: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }

  async storeRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({ where: { token } });
  }

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.delete({ where: { token } });
  }

  async deleteUserRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  }
}

export const userRepository = new UserRepository();
