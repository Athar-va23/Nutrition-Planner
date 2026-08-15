import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { authService, AuthService } from '../services/AuthService';
import { loginSchema, registerSchema, refreshTokenSchema } from '../validators/auth.schema';

// Auth Controller handles authentication endpoints
export class AuthController extends BaseController {
  constructor(private readonly service: AuthService) {
    super();
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.parse(req.body);
      const result = await this.service.register(input);
      this.handleSuccess(res, result, 201);
    } catch (error) {
      this.handleError(error, res, 'register');
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await this.service.login(input);
      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(error, res, 'login');
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await this.service.refresh(refreshToken);
      this.handleSuccess(res, { tokens });
    } catch (error) {
      this.handleError(error, res, 'refresh');
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      await this.service.logout(refreshToken);
      this.handleSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      this.handleError(error, res, 'logout');
    }
  }
}

export const authController = new AuthController(authService);
