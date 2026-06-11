import { UserRole } from '../modules/user/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        organizationId: string;
        customerId?: string;
      };
    }
  }
}

export {};
