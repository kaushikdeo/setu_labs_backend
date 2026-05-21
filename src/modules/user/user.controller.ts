import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { AppError } from '../../utils/app-error';

const userService = new UserService();

export class UserController {
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        throw new AppError(404, 'User not found');
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateRole(req.params.id, req.body.role);
      if (!user) throw new AppError(404, 'User not found');
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateStatus(req.params.id, req.body.isActive);
      if (!user) throw new AppError(404, 'User not found');
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
}
