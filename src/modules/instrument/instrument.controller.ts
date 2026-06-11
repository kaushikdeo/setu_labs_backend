import { Request, Response, NextFunction } from 'express';
import { InstrumentService } from './instrument.service';
import { auditService } from '../audit/audit.service';

const instrumentService = new InstrumentService();

export class InstrumentController {
  createInstrument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instrument = await instrumentService.createInstrument(req.body, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('instrument.create', req, req.user!.id, {
        instrumentId: instrument._id,
        name: instrument.name,
      });
      res.status(201).json({ success: true, data: instrument });
    } catch (error) {
      next(error);
    }
  };

  getAllInstruments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instruments = await instrumentService.getAllInstruments(req.user!.organizationId!);
      res.status(200).json({ success: true, data: instruments });
    } catch (error) {
      next(error);
    }
  };

  getInstrumentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instrument = await instrumentService.getInstrumentById(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data: instrument });
    } catch (error) {
      next(error);
    }
  };

  updateInstrument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instrument = await instrumentService.updateInstrument(req.params.id, req.body, req.user!.id, req.user!.organizationId!);
      await auditService.logEvent('instrument.update', req, req.user!.id, {
        instrumentId: instrument._id,
        updatedFields: Object.keys(req.body),
      });
      res.status(200).json({ success: true, data: instrument });
    } catch (error) {
      next(error);
    }
  };

  validateInstrument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isValid = await instrumentService.isInstrumentValid(req.params.id, req.user!.organizationId!);
      res.status(200).json({ success: true, data: { isValid } });
    } catch (error) {
      next(error);
    }
  };
}
