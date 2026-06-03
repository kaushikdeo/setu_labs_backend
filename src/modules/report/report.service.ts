import { Types } from 'mongoose';
import { ReportModel, IReport, ReportStatus } from './report.model';
import { VisitModel, VisitStatus } from '../visit/visit.model';
import { VisitTaskModel } from '../visit/visit-task.model';
import { TaskTestResultModel } from '../test-result/test-result.model';
import { CustomerModel } from '../customer/customer.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';
import { UserRole } from '../user/user.model';

export class ReportService {
  async createReport(visitId: string, userId: string): Promise<IReport> {
    const visit = await VisitModel.findById(visitId);
    if (!visit) throw new AppError(404, 'Visit not found');
    if (visit.status !== VisitStatus.COMPLETED) {
      throw new AppError(400, 'Report can only be created for completed visits');
    }

    const existing = await ReportModel.findOne({ visitId: new Types.ObjectId(visitId) });
    if (existing) throw new AppError(409, 'A report already exists for this visit');

    const report = await ReportModel.create({
      visitId: new Types.ObjectId(visitId),
      customerId: visit.customerId,
      title: `Report - ${visit.srNumber ?? visit.code}`,
      status: ReportStatus.DRAFT,
      createdBy: userId,
      approvalHistory: [],
    });

    logger.info('Report created', { reportId: report._id, visitId, createdBy: userId });
    return report;
  }

  async getAllReports(
    callerRole: UserRole,
    _callerUserId: string,
    callerCustomerId?: string,
    filters: any = {},
  ): Promise<any[]> {
    const matchStage: any = {};

    if (callerRole === UserRole.CUSTOMER) {
      if (!callerCustomerId) throw new AppError(403, 'Customer account not linked to a customer record');
      matchStage.customerId = new Types.ObjectId(callerCustomerId);
    } else {
      if (filters.customerId) matchStage.customerId = new Types.ObjectId(filters.customerId);
    }

    if (filters.status) matchStage.status = filters.status;

    return ReportModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'visits',
          localField: 'visitId',
          foreignField: '_id',
          as: 'visit',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          title: 1,
          status: 1,
          submittedForApprovalAt: 1,
          approvedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          visitId: 1,
          customerId: 1,
          visit: {
            $arrayElemAt: [
              {
                $map: {
                  input: '$visit',
                  as: 'v',
                  in: { id: '$$v._id', code: '$$v.code', srNumber: '$$v.srNumber', type: '$$v.type', scheduledDate: '$$v.scheduledDate', completedDate: '$$v.completedDate' },
                },
              },
              0,
            ],
          },
          customer: {
            $arrayElemAt: [
              { $map: { input: '$customer', as: 'c', in: { id: '$$c._id', name: '$$c.name', code: '$$c.code' } } },
              0,
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
  }

  async getReportById(
    id: string,
    callerRole: UserRole,
    callerCustomerId?: string,
  ): Promise<any> {
    const report = await ReportModel.findById(id).lean();
    if (!report) throw new AppError(404, 'Report not found');

    if (callerRole === UserRole.CUSTOMER) {
      if (!callerCustomerId || report.customerId.toString() !== callerCustomerId) {
        throw new AppError(403, 'Access denied');
      }
    }

    const [visit, customer, tasks] = await Promise.all([
      VisitModel.findById(report.visitId).lean(),
      CustomerModel.findById(report.customerId).lean(),
      VisitTaskModel.find({ visitId: report.visitId })
        .populate('equipmentId', 'name code serialNumber')
        .lean(),
    ]);

    const taskIds = tasks.map((t) => t._id);
    const testResults = await TaskTestResultModel.find({ visitTaskId: { $in: taskIds } }).lean();

    const resultsByTask = new Map<string, typeof testResults>();
    for (const r of testResults) {
      const key = r.visitTaskId.toString();
      if (!resultsByTask.has(key)) resultsByTask.set(key, []);
      resultsByTask.get(key)!.push(r);
    }

    const tasksSummary = tasks.map((t) => {
      const equipment = t.equipmentId as any;
      return {
        id: (t._id as Types.ObjectId).toString(),
        area: t.area,
        status: t.status,
        completedAt: t.completedAt,
        equipment: equipment
          ? { id: equipment._id?.toString(), name: equipment.name, code: equipment.code, serialNumber: equipment.serialNumber }
          : null,
        testResults: (resultsByTask.get((t._id as Types.ObjectId).toString()) ?? []).map((r) => ({
          id: (r._id as Types.ObjectId).toString(),
          reportNumber: r.reportNumber,
          result: r.result,
          conclusion: r.conclusion,
          completedAt: r.completedAt,
        })),
      };
    });

    return {
      id: (report._id as Types.ObjectId).toString(),
      visitId: report.visitId,
      customerId: report.customerId,
      title: report.title,
      status: report.status,
      submittedForApprovalAt: report.submittedForApprovalAt,
      submittedBy: report.submittedBy,
      approvedAt: report.approvedAt,
      approvedBy: report.approvedBy,
      approvalHistory: report.approvalHistory,
      createdAt: (report as any).createdAt,
      updatedAt: (report as any).updatedAt,
      visit: visit
        ? {
            id: (visit._id as Types.ObjectId).toString(),
            code: visit.code,
            srNumber: visit.srNumber,
            type: visit.type,
            scheduledDate: visit.scheduledDate,
            completedDate: visit.completedDate,
            notes: visit.notes,
          }
        : null,
      customer: customer
        ? { id: (customer._id as Types.ObjectId).toString(), name: (customer as any).name, code: (customer as any).code }
        : null,
      tasks: tasksSummary,
    };
  }

  async submitForApproval(id: string, userId: string, comment?: string): Promise<IReport> {
    const report = await ReportModel.findById(id);
    if (!report) throw new AppError(404, 'Report not found');
    if (
      report.status !== ReportStatus.DRAFT &&
      report.status !== ReportStatus.REJECTED &&
      report.status !== ReportStatus.CHANGES_REQUESTED
    ) {
      throw new AppError(400, 'Only draft, rejected, or changes_requested reports can be submitted for approval');
    }

    const now = new Date();
    const action =
      report.status === ReportStatus.DRAFT ? 'submitted' : 'resubmitted';
    report.status = ReportStatus.PENDING_APPROVAL;
    report.submittedForApprovalAt = now;
    report.submittedBy = userId;
    report.approvalHistory.push({ action, comment, performedBy: userId, performedAt: now });

    await report.save();
    logger.info('Report submitted for approval', { reportId: id, submittedBy: userId });
    return report;
  }

  async approveReport(
    id: string,
    userId: string,
    callerCustomerId: string,
    comment?: string,
  ): Promise<IReport> {
    const report = await ReportModel.findById(id);
    if (!report) throw new AppError(404, 'Report not found');
    if (report.customerId.toString() !== callerCustomerId) throw new AppError(403, 'Access denied');
    if (report.status !== ReportStatus.PENDING_APPROVAL) {
      throw new AppError(400, 'Only pending_approval reports can be approved');
    }

    const now = new Date();
    report.status = ReportStatus.APPROVED;
    report.approvedAt = now;
    report.approvedBy = userId;
    report.approvalHistory.push({ action: 'approved', comment, performedBy: userId, performedAt: now });

    await report.save();
    logger.info('Report approved', { reportId: id, approvedBy: userId });
    return report;
  }

  async rejectReport(
    id: string,
    userId: string,
    callerCustomerId: string,
    comment: string,
  ): Promise<IReport> {
    const report = await ReportModel.findById(id);
    if (!report) throw new AppError(404, 'Report not found');
    if (report.customerId.toString() !== callerCustomerId) throw new AppError(403, 'Access denied');
    if (report.status !== ReportStatus.PENDING_APPROVAL) {
      throw new AppError(400, 'Only pending_approval reports can be rejected');
    }

    const now = new Date();
    report.status = ReportStatus.REJECTED;
    report.approvalHistory.push({ action: 'rejected', comment, performedBy: userId, performedAt: now });

    await report.save();
    logger.info('Report rejected', { reportId: id, rejectedBy: userId });
    return report;
  }

  async requestChanges(
    id: string,
    userId: string,
    callerRole: UserRole,
    callerCustomerId: string | undefined,
    comment: string,
  ): Promise<IReport> {
    const report = await ReportModel.findById(id);
    if (!report) throw new AppError(404, 'Report not found');
    if (callerRole === UserRole.CUSTOMER) {
      if (!callerCustomerId || report.customerId.toString() !== callerCustomerId) {
        throw new AppError(403, 'Access denied');
      }
    }
    if (
      report.status !== ReportStatus.PENDING_APPROVAL &&
      report.status !== ReportStatus.APPROVED
    ) {
      throw new AppError(400, 'Only pending_approval or approved reports can have changes requested');
    }

    const now = new Date();
    const wasApproved = report.status === ReportStatus.APPROVED;
    report.status = ReportStatus.CHANGES_REQUESTED;
    if (wasApproved) {
      report.approvedAt = undefined;
      report.approvedBy = undefined;
    }
    report.approvalHistory.push({ action: 'changes_requested', comment, performedBy: userId, performedAt: now });

    await report.save();
    logger.info('Report changes requested', { reportId: id, requestedBy: userId, wasApproved });
    return report;
  }

  async getReportByVisitId(visitId: string): Promise<IReport | null> {
    return ReportModel.findOne({ visitId: new Types.ObjectId(visitId) });
  }

  async getAllResultsForDownload(
    reportId: string,
    callerRole: UserRole,
    callerCustomerId?: string,
  ): Promise<any[]> {
    const report = await ReportModel.findById(reportId).lean();
    if (!report) throw new AppError(404, 'Report not found');

    if (callerRole === UserRole.CUSTOMER) {
      if (!callerCustomerId || report.customerId.toString() !== callerCustomerId) {
        throw new AppError(403, 'Access denied');
      }
    }

    const tasks = await VisitTaskModel.find({ visitId: report.visitId }).select('_id').lean();
    const taskIds = tasks.map((t) => t._id);

    const results = await TaskTestResultModel.aggregate([
      { $match: { visitTaskId: { $in: taskIds } } },
      { $lookup: { from: 'testtypes', localField: 'testTypeId', foreignField: '_id', as: 'testType' } },
      {
        $lookup: {
          from: 'masterinstruments',
          localField: 'instrumentId',
          foreignField: '_id',
          as: 'instrument',
        },
      },
      { $lookup: { from: 'visittasks', localField: 'visitTaskId', foreignField: '_id', as: 'task' } },
      {
        $project: {
          id: '$_id',
          _id: 0,
          visitTaskId: 1,
          reportNumber: 1,
          readings: 1,
          calculatedValues: 1,
          result: 1,
          conclusion: 1,
          testPerformedBy: 1,
          witness: 1,
          visualInspection: 1,
          completedAt: 1,
          testType: { $arrayElemAt: ['$testType', 0] },
          instrument: {
            $arrayElemAt: [
              {
                $map: {
                  input: '$instrument',
                  as: 'i',
                  in: {
                    id: '$$i._id',
                    name: '$$i.name',
                    code: '$$i.code',
                    make: '$$i.make',
                    model: '$$i.model',
                    serialNumber: '$$i.serialNumber',
                    lastCalibrationDate: '$$i.lastCalibrationDate',
                    calibrationDueDate: '$$i.calibrationDueDate',
                  },
                },
              },
              0,
            ],
          },
          task: { $arrayElemAt: ['$task', 0] },
        },
      },
      { $sort: { completedAt: 1 } },
    ]);

    return results;
  }

  async getTestResultForReport(
    reportId: string,
    resultId: string,
    callerRole: UserRole,
    callerCustomerId?: string,
  ): Promise<any> {
    const report = await ReportModel.findById(reportId).lean();
    if (!report) throw new AppError(404, 'Report not found');

    if (callerRole === UserRole.CUSTOMER) {
      if (!callerCustomerId || report.customerId.toString() !== callerCustomerId) {
        throw new AppError(403, 'Access denied');
      }
    }

    // Verify ownership: the result's task must belong to this report's visit
    const ownerCheck = await TaskTestResultModel.findById(resultId).select('visitTaskId').lean();
    if (!ownerCheck) throw new AppError(404, 'Test result not found');

    const task = await VisitTaskModel.findById(ownerCheck.visitTaskId).select('visitId').lean();
    if (!task || task.visitId.toString() !== report.visitId.toString()) {
      throw new AppError(403, 'Test result does not belong to this report');
    }

    // Use the same aggregation pipeline as TestResultService.getById for identical response shape
    const results = await TaskTestResultModel.aggregate([
      { $match: { _id: new Types.ObjectId(resultId) } },
      { $lookup: { from: 'testtypes', localField: 'testTypeId', foreignField: '_id', as: 'testType' } },
      {
        $lookup: {
          from: 'masterinstruments',
          localField: 'instrumentId',
          foreignField: '_id',
          as: 'instrument',
        },
      },
      { $lookup: { from: 'visittasks', localField: 'visitTaskId', foreignField: '_id', as: 'task' } },
      {
        $project: {
          id: '$_id',
          _id: 0,
          visitTaskId: 1,
          testTypeId: 1,
          instrumentId: 1,
          reportNumber: 1,
          readings: 1,
          calculatedValues: 1,
          result: 1,
          conclusion: 1,
          testPerformedBy: 1,
          witness: 1,
          visualInspection: 1,
          createdBy: 1,
          completedAt: 1,
          createdAt: 1,
          testType: { $arrayElemAt: ['$testType', 0] },
          instrument: {
            $arrayElemAt: [
              {
                $map: {
                  input: '$instrument',
                  as: 'i',
                  in: {
                    id: '$$i._id',
                    name: '$$i.name',
                    code: '$$i.code',
                    make: '$$i.make',
                    model: '$$i.model',
                    serialNumber: '$$i.serialNumber',
                    lastCalibrationDate: '$$i.lastCalibrationDate',
                    calibrationDueDate: '$$i.calibrationDueDate',
                  },
                },
              },
              0,
            ],
          },
          task: { $arrayElemAt: ['$task', 0] },
        },
      },
    ]);

    if (!results.length) throw new AppError(404, 'Test result not found');
    return results[0];
  }
}
