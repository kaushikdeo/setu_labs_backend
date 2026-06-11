import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { AppError } from '../../utils/app-error';

const userService = new UserService();

export class UserController {
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.getUserById(req.params.id, req.user!.organizationId);
      if (!user) {
        throw new AppError(404, 'User not found');
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.getAllUsers(req.user!.organizationId);
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.createUser(req.body, req.user!.organizationId);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateRole(
        req.params.id,
        req.body.role,
        req.user!.organizationId,
      );
      if (!user) throw new AppError(404, 'User not found');
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateStatus(
        req.params.id,
        req.body.isActive,
        req.user!.organizationId,
      );
      if (!user) throw new AppError(404, 'User not found');
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
}
