import { Response } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export abstract class BaseController {
  protected handleSuccess(res: Response, data: any, status: number = 200): void {
    res.status(status).json({
      success: true,
      data,
    });
  }

  protected handleError(error: any, res: Response, context: string): void {
    logger.error(`Error in ${context}:`, error);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}
