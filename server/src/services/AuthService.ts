import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { userRepository, UserRepository } from '../repositories/UserRepository';
import { config } from '../config/unifiedConfig';
import { RegisterInput, LoginInput } from '../validators/auth.schema';

export class AuthService {
  constructor(private readonly userRepo: UserRepository) {}

  async register(input: RegisterInput) {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new AppError('DUPLICATE_ENTRY', 409, 'User already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { user, tokens };
  }

  async login(input: LoginInput) {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid credentials');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError('UNAUTHORIZED', 401, 'Account is deactivated');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens,
    };
  }

  async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, config.auth.jwtRefreshSecret) as any;
      const storedToken = await this.userRepo.findRefreshToken(token);

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired refresh token');
      }

      const tokens = await this.generateTokens(decoded.id, decoded.email);
      await this.userRepo.deleteRefreshToken(token);

      return tokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNAUTHORIZED', 401, 'Invalid refresh token');
    }
  }

  async logout(token: string) {
    if (token) {
      try {
        await this.userRepo.deleteRefreshToken(token);
      } catch {
        // Ignore if token doesn't exist
      }
    }
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ id: userId, email }, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiresIn,
    });

    const refreshToken = jwt.sign({ id: userId, email }, config.auth.jwtRefreshSecret, {
      expiresIn: config.auth.jwtRefreshExpiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.userRepo.storeRefreshToken(userId, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService(userRepository);
