import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service';
import { auditService } from '../audit/audit.service';

const customerService = new CustomerService();

export class CustomerController {
  createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customerService.createCustomer(req.body, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('customer.create', req, req.user!.id, {
        customerId: customer._id,
        name: customer.name,
      });
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  };

  getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customers = await customerService.getAllCustomers(req.user!.organizationId!);
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  };

  getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customerService.getCustomerById(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  };

  updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('customer.update', req, req.user!.id, {
        customerId: customer._id,
        updatedFields: Object.keys(req.body),
      });
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  };

  createSite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const site = await customerService.createSite(req.params.id, req.body, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('site.create', req, req.user!.id, {
        siteId: site._id,
        customerId: req.params.id,
        name: site.name,
      });
      res.status(201).json({ success: true, data: site });
    } catch (error) {
      next(error);
    }
  };

  getSitesByCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sites = await customerService.getSitesByCustomer(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data: sites });
    } catch (error) {
      next(error);
    }
  };

  updateSite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const site = await customerService.updateSite(req.params.siteId, req.body, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('site.update', req, req.user!.id, {
        siteId: site._id,
        updatedFields: Object.keys(req.body),
      });
      res.status(200).json({ success: true, data: site });
    } catch (error) {
      next(error);
    }
  };

  deleteSite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerService.deleteSite(req.params.siteId, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('site.deactivate', req, req.user!.id, {
        siteId: req.params.siteId,
      });
      res.status(200).json({ success: true, message: 'Site deactivated successfully' });
    } catch (error) {
      next(error);
    }
  };
}
