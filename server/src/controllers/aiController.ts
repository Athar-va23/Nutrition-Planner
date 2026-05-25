import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { LLMService } from '../services/ai/llmService';

const llmService = new LLMService();

export class AIController extends BaseController {
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, history } = req.body;
      const userId = (req as any).user.id;
      
      const response = await llmService.chat(userId, message, history);
      this.handleSuccess(res, { response });
    } catch (error) {
      this.handleError(error, res, 'aiChat');
    }
  }

  async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const result = await llmService.generateInsights(userId);
      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(error, res, 'aiInsights');
    }
  }
}

export const aiController = new AIController();
