import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from './organization.service';
import { auditService } from '../audit/audit.service';

const organizationService = new OrganizationService();

export class OrganizationController {
  getOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await organizationService.getOrganization(req.user!.organizationId);
      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await organizationService.updateOrganization(
        req.user!.organizationId,
        req.body,
        req.user!.id,
      );
      await auditService.logEvent('org.update', req, req.user!.id, {
        updatedFields: Object.keys(req.body),
      });
      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };
}
