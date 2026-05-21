import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { auditService } from '../audit/audit.service';

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      await auditService.logEvent('auth.register', req, result.user.id, {
        email: result.user.email,
      });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      await auditService.logEvent('auth.login', req, result.user.id, { email: result.user.email });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      await auditService.logEvent('auth.login_failed', req, null, { email: req.body.email });
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await authService.refresh(req.body.refreshToken);
      res.status(200).json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.user!.id);
      await auditService.logEvent('auth.logout', req, req.user!.id);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  getActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const isAdminOrAuditor = ['super_admin', 'auditor'].includes(user.role);
      
      // If admin/auditor, fetch all logs (pass null as userId)
      // Otherwise, fetch only their own logs
      const activity = await auditService.getRecentActivity(isAdminOrAuditor ? null : user.id);
      
      res.status(200).json({ success: true, data: activity });
    } catch (error) {
      next(error);
    }
  };
}
