import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { auditService } from '../audit/audit.service';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

const reportService = new ReportService();

function fireAudit(fn: () => Promise<any>): void {
  fn().catch((err) => logger.warn('Audit log failed (non-fatal)', { error: err?.message }));
}

export class ReportController {
  createReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportService.createReport(req.body.visitId, req.user!.id);
      res.status(201).json({ success: true, data: report });
      fireAudit(() => auditService.logEvent('report.create', req, req.user!.id, {
        reportId: report._id,
        visitId: req.body.visitId,
      }));
    } catch (error) {
      next(error);
    }
  };

  getAllReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reports = await reportService.getAllReports(
        req.user!.role,
        req.user!.id,
        req.user!.customerId,
        req.query,
      );
      res.status(200).json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  };

  getReportById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportService.getReportById(
        req.params.id,
        req.user!.role,
        req.user!.customerId,
      );
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };

  submitForApproval = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportService.submitForApproval(
        req.params.id,
        req.user!.id,
        req.body.comment,
      );
      res.status(200).json({ success: true, data: report });
      fireAudit(() => auditService.logEvent('report.submit', req, req.user!.id, { reportId: req.params.id }));
    } catch (error) {
      next(error);
    }
  };

  approveReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.customerId) {
        return next(new AppError(403, 'Customer account not linked'));
      }
      const report = await reportService.approveReport(
        req.params.id,
        req.user!.id,
        req.user!.customerId,
        req.body.comment,
      );
      res.status(200).json({ success: true, data: report });
      fireAudit(() => auditService.logEvent('report.approve', req, req.user!.id, { reportId: req.params.id }));
    } catch (error) {
      next(error);
    }
  };

  rejectReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.customerId) {
        return next(new AppError(403, 'Customer account not linked'));
      }
      const report = await reportService.rejectReport(
        req.params.id,
        req.user!.id,
        req.user!.customerId,
        req.body.comment,
      );
      res.status(200).json({ success: true, data: report });
      fireAudit(() => auditService.logEvent('report.reject', req, req.user!.id, { reportId: req.params.id }));
    } catch (error) {
      next(error);
    }
  };

  getReportByVisitId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportService.getReportByVisitId(req.params.visitId);
      res.status(200).json({ success: true, data: report ?? null });
    } catch (error) {
      next(error);
    }
  };

  requestChanges = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.customerId) {
        return next(new AppError(403, 'Customer account not linked'));
      }
      const report = await reportService.requestChanges(
        req.params.id,
        req.user!.id,
        req.user!.customerId,
        req.body.comment,
      );
      res.status(200).json({ success: true, data: report });
      fireAudit(() => auditService.logEvent('report.request_changes', req, req.user!.id, {
        reportId: req.params.id,
        comment: req.body.comment,
      }));
    } catch (error) {
      next(error);
    }
  };

  getAllResultsForDownload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await reportService.getAllResultsForDownload(
        req.params.id,
        req.user!.role,
        req.user!.customerId,
      );
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  };

  getTestResultForReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await reportService.getTestResultForReport(
        req.params.id,
        req.params.resultId,
        req.user!.role,
        req.user!.customerId,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
