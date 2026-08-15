import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { userRepository, UserRepository } from '../repositories/UserRepository';
import { config } from '../config/unifiedConfig';
import { RegisterInput, LoginInput } from '../validators/auth.schema';
import { fromJsonArray } from '../utils/jsonArray';

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
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: {
          age: null,
          gender: null,
          heightCm: null,
          weightKg: null,
          activityLevel: 'moderate',
          healthGoal: 'maintain',
          calorieTarget: null,
        },
        preferences: {
          dietaryTypes: [],
          allergies: [],
          restrictedFoods: [],
          cuisinePreferences: [],
          maxPrepTime: null,
          mealsPerDay: 3,
        },
        onboardingComplete: false,
      },
      tokens,
    };
  }

  async login(input: LoginInput) {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError('NOT_FOUND', 401, 'No account found with this email address');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError('INVALID_PASSWORD', 401, 'Invalid password. Please try again.');
    }

    if (!user.isActive) {
      throw new AppError('UNAUTHORIZED', 401, 'This account has been deactivated.');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    const isOnboardingComplete = Boolean(
      user.profile &&
      user.profile.heightCm &&
      user.profile.weightKg
    );

    const parsedPreferences = user.preferences ? {
      ...user.preferences,
      dietaryTypes: fromJsonArray(user.preferences.dietaryTypes),
      allergies: fromJsonArray(user.preferences.allergies),
      restrictedFoods: fromJsonArray(user.preferences.restrictedFoods),
      cuisinePreferences: fromJsonArray(user.preferences.cuisinePreferences),
    } : null;

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: user.profile,
        preferences: parsedPreferences,
        onboardingComplete: isOnboardingComplete,
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
    const tokenId = crypto.randomUUID();

    const accessToken = jwt.sign({ id: userId, email, jti: tokenId }, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiresIn as any,
      issuer: config.auth.jwtIssuer,
      audience: config.auth.jwtAudience,
    });

    const refreshToken = jwt.sign({ id: userId, email, jti: tokenId }, config.auth.jwtRefreshSecret, {
      expiresIn: config.auth.jwtRefreshExpiresIn as any,
      issuer: config.auth.jwtIssuer,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.userRepo.storeRefreshToken(userId, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService(userRepository);
