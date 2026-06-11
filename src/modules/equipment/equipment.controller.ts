import { Request, Response, NextFunction } from 'express';
import { EquipmentService } from './equipment.service';
import { auditService } from '../audit/audit.service';

const equipmentService = new EquipmentService();

export class EquipmentController {
  createEquipment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const equipment = await equipmentService.createEquipment(req.body, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('equipment.create', req, req.user!.id, {
        equipmentId: equipment._id,
        name: equipment.name,
      });
      res.status(201).json({ success: true, data: equipment });
    } catch (error) {
      next(error);
    }
  };

  getAllEquipment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const equipment = await equipmentService.getAllEquipment(req.query, req.user!.organizationId!);
      res.status(200).json({ success: true, data: equipment });
    } catch (error) {
      next(error);
    }
  };

  getEquipmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const equipment = await equipmentService.getEquipmentById(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data: equipment });
    } catch (error) {
      next(error);
    }
  };

  updateEquipment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const equipment = await equipmentService.updateEquipment(req.params.id, req.body, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('equipment.update', req, req.user!.id, {
        equipmentId: equipment._id,
        updatedFields: Object.keys(req.body),
      });
      res.status(200).json({ success: true, data: equipment });
    } catch (error) {
      next(error);
    }
  };

  deleteEquipment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await equipmentService.deleteEquipment(req.params.id, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('equipment.delete', req, req.user!.id, {
        equipmentId: req.params.id,
      });
      res.status(200).json({ success: true, message: 'Equipment deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
