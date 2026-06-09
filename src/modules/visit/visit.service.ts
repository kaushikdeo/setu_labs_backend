import { Types } from 'mongoose';
import { VisitModel, IVisit, VisitStatus, VisitType } from './visit.model';
import { VisitTaskModel, IVisitTask, TaskStatus } from './visit-task.model';
import { MasterInstrumentModel, InstrumentStatus } from '../instrument/instrument.model';
import { EquipmentModel } from '../equipment/equipment.model';
import { CustomerModel } from '../customer/customer.model';
import { OrganizationModel, SrCounterScope } from '../organization/organization.model';
import { TestTypeModel } from '../test-type/test-type.model';
import { TaskTestResultModel } from '../test-result/test-result.model';
import { srCounterService } from '../sr-counter/sr-counter.service';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

async function buildCounterKey(
  scope: SrCounterScope,
  year: number,
  customerId: string,
  visitType: VisitType,
  suffix?: string,
): Promise<string> {
  const parts: string[] = [];
  if (scope === SrCounterScope.PER_YEAR) {
    parts.push(String(year));
  } else if (scope === SrCounterScope.PER_YEAR_CUSTOMER) {
    parts.push(String(year), customerId);
  } else {
    parts.push(String(year), customerId, visitType === VisitType.VALIDATION ? 'VALI' : 'CALI');
  }
  if (suffix) parts.push(suffix);
  return parts.join(':');
}

function padSeq(n: number): string {
  return String(n).padStart(2, '0');
}

async function resolveEquipmentForTask(
  visitId: string,
  taskId: string,
  equipmentId: string,
  area?: string,
): Promise<{ equipmentId: Types.ObjectId; area?: string }> {
  const equipment = await EquipmentModel.findById(equipmentId).lean();
  if (!equipment) throw new AppError(404, 'Equipment not found');

  const duplicate = await VisitTaskModel.findOne({
    visitId,
    equipmentId,
    _id: { $ne: taskId },
  }).lean();
  if (duplicate) {
    throw new AppError(409, 'This equipment is already assigned to another task on this visit');
  }

  let resolvedArea = area?.trim();
  if (!resolvedArea) {
    resolvedArea = equipment.area?.trim() || equipment.name;
  }

  return {
    equipmentId: new Types.ObjectId(equipmentId),
    area: resolvedArea,
  };
}

export class VisitService {
  async getAllVisits(filters: any = {}): Promise<any[]> {
    const matchStage: any = {};
    if (filters.status) matchStage.status = filters.status;
    if (filters.type) matchStage.type = filters.type;
    if (filters.assignedEngineerId) {
      matchStage.assignedEngineerId = new Types.ObjectId(filters.assignedEngineerId);
    }

    return VisitModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'sites',
          localField: 'siteId',
          foreignField: '_id',
          as: 'site',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedEngineerId',
          foreignField: '_id',
          as: 'engineer',
        },
      },
      {
        $lookup: {
          from: 'visittasks',
          let: { visitId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$visitId', '$$visitId'] } } },
            {
              $lookup: {
                from: 'taskTestResults',
                localField: '_id',
                foreignField: 'visitTaskId',
                as: 'results',
                pipeline: [{ $limit: 1 }],
              },
            },
            { $match: { 'results.0': { $exists: true } } },
          ],
          as: 'tasksWithResults',
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          code: 1,
          srNumber: 1,
          type: 1,
          scheduledDate: 1,
          validationDate: 1,
          dueDate: 1,
          completedDate: 1,
          status: 1,
          notes: 1,
          createdBy: 1,
          createdAt: 1,
          hasTestResults: { $gt: [{ $size: '$tasksWithResults' }, 0] },
          customer: { $arrayElemAt: [{ $map: { input: '$customer', as: 'c', in: { id: '$$c._id', name: '$$c.name', code: '$$c.code' } } }, 0] },
          site: { $arrayElemAt: [{ $map: { input: '$site', as: 's', in: { id: '$$s._id', name: '$$s.name', addressLine1: '$$s.addressLine1', addressLine2: '$$s.addressLine2', city: '$$s.city', state: '$$s.state', country: '$$s.country', pincode: '$$s.pincode' } } }, 0] },
          engineer: { $arrayElemAt: [{ $map: { input: '$engineer', as: 'e', in: { id: '$$e._id', name: '$$e.name', email: '$$e.email' } } }, 0] },
        },
      },
      { $sort: { scheduledDate: -1, createdAt: -1 } },
    ]);
  }

  async getVisitById(id: string): Promise<any> {
    const visits = await VisitModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'sites',
          localField: 'siteId',
          foreignField: '_id',
          as: 'site',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedEngineerId',
          foreignField: '_id',
          as: 'engineer',
        },
      },
      {
        $lookup: {
          from: 'visittasks',
          let: { visitId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$visitId', '$$visitId'] } } },
            {
              $lookup: {
                from: 'taskTestResults',
                localField: '_id',
                foreignField: 'visitTaskId',
                as: 'results',
                pipeline: [{ $limit: 1 }],
              },
            },
            { $match: { 'results.0': { $exists: true } } },
          ],
          as: 'tasksWithResults',
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          code: 1,
          srNumber: 1,
          type: 1,
          scheduledDate: 1,
          validationDate: 1,
          dueDate: 1,
          completedDate: 1,
          status: 1,
          notes: 1,
          createdBy: 1,
          createdAt: 1,
          customerId: 1,
          siteId: 1,
          assignedEngineerId: 1,
          hasTestResults: { $gt: [{ $size: '$tasksWithResults' }, 0] },
          customer: { $arrayElemAt: [{ $map: { input: '$customer', as: 'c', in: { id: '$$c._id', name: '$$c.name', code: '$$c.code' } } }, 0] },
          site: { $arrayElemAt: [{ $map: { input: '$site', as: 's', in: { id: '$$s._id', name: '$$s.name', addressLine1: '$$s.addressLine1', addressLine2: '$$s.addressLine2', city: '$$s.city', state: '$$s.state', country: '$$s.country', pincode: '$$s.pincode' } } }, 0] },
          engineer: { $arrayElemAt: [{ $map: { input: '$engineer', as: 'e', in: { id: '$$e._id', name: '$$e.name', email: '$$e.email' } } }, 0] },
        },
      },
    ]);

    if (!visits.length) {
      throw new AppError(404, 'Visit not found');
    }
    return visits[0];
  }

  async createVisit(data: Partial<IVisit>, userId: string): Promise<IVisit> {
    const code = `VISIT-${Date.now()}`;

    let srNumber: string | undefined;
    try {
      const [org, customer] = await Promise.all([
        OrganizationModel.findOne().lean(),
        CustomerModel.findById(data.customerId).lean(),
      ]);

      if (org && customer) {
        const orgAbbr = org.abbreviation ?? '';
        const custAbbr = (customer as any).abbreviation ?? '';
        const typeSegment = data.type === VisitType.VALIDATION ? 'VALI' : 'CALI';
        const year = new Date().getFullYear();
        const scope: SrCounterScope = org.srCounterScope ?? SrCounterScope.PER_YEAR;
        const key = await buildCounterKey(scope, year, (data.customerId as Types.ObjectId).toString(), data.type as VisitType);
        const seq = await srCounterService.nextSequence(key);
        const parts = [orgAbbr, custAbbr, typeSegment, String(year), padSeq(seq)].filter(Boolean);
        srNumber = parts.join('/');
      }
    } catch (err) {
      logger.warn('SR number generation failed, proceeding without it', { err });
    }

    const visit = await VisitModel.create({
      ...data,
      code,
      srNumber,
      createdBy: userId,
    });
    logger.info('Visit created', { visitId: visit._id, srNumber, createdBy: userId });
    return visit;
  }

  async updateVisit(id: string, data: Partial<IVisit>, userId: string): Promise<IVisit> {
    const existing = await VisitModel.findById(id);
    if (!existing) throw new AppError(404, 'Visit not found');

    const { _id, id: _, __v, createdAt, updatedAt, createdBy, ...updateData } = data as any;

    if (updateData.validationDate !== undefined) {
      if (
        existing.status !== VisitStatus.IN_PROGRESS &&
        existing.status !== VisitStatus.SCHEDULED
      ) {
        throw new AppError(400, 'Validation date cannot be changed on a completed or cancelled visit');
      }
      if (existing.status === VisitStatus.SCHEDULED) {
        throw new AppError(400, 'Use start service request to set the initial validation date');
      }
    }

    if (updateData.dueDate !== undefined) {
      if (existing.status !== VisitStatus.IN_PROGRESS) {
        throw new AppError(400, 'Due date can only be changed on an in-progress visit');
      }
      if (updateData.dueDate === null) {
        const visit = await VisitModel.findByIdAndUpdate(
          id,
          { $unset: { dueDate: 1 } },
          { new: true },
        );
        if (!visit) throw new AppError(404, 'Visit not found');
        logger.info('Visit due date cleared', { visitId: id, updatedBy: userId });
        return visit;
      }
    }

    const visit = await VisitModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!visit) throw new AppError(404, 'Visit not found');
    logger.info('Visit updated', { visitId: id, updatedBy: userId });
    return visit;
  }

  async startVisit(
    visitId: string,
    validationDate: Date,
    userId: string,
    dueDate?: Date,
  ): Promise<IVisit> {
    const visit = await VisitModel.findById(visitId);
    if (!visit) throw new AppError(404, 'Visit not found');

    const startPayload: Partial<IVisit> = { validationDate };
    if (dueDate) startPayload.dueDate = dueDate;

    if (visit.status === VisitStatus.SCHEDULED) {
      const taskCount = await VisitTaskModel.countDocuments({ visitId });
      if (taskCount === 0) {
        throw new AppError(400, 'Add at least one equipment task before starting the service request');
      }

      const updated = await VisitModel.findByIdAndUpdate(
        visitId,
        {
          ...startPayload,
          status: VisitStatus.IN_PROGRESS,
        },
        { new: true },
      );
      if (!updated) throw new AppError(404, 'Visit not found');
      logger.info('Visit started', { visitId, validationDate, dueDate, startedBy: userId });
      return updated;
    }

    if (visit.status === VisitStatus.IN_PROGRESS && !visit.validationDate) {
      const updated = await VisitModel.findByIdAndUpdate(
        visitId,
        startPayload,
        { new: true },
      );
      if (!updated) throw new AppError(404, 'Visit not found');
      logger.info('Visit validation date set', { visitId, validationDate, dueDate, setBy: userId });
      return updated;
    }

    if (visit.status === VisitStatus.IN_PROGRESS && visit.validationDate) {
      throw new AppError(400, 'Validation date is already set for this service request');
    }

    throw new AppError(400, 'Cannot set validation date on a completed or cancelled visit');
  }

  async deleteVisit(id: string, userId: string): Promise<void> {
    const visit = await VisitModel.findById(id);
    if (!visit) throw new AppError(404, 'Visit not found');

    const taskIds = await VisitTaskModel.find({ visitId: id }, '_id').lean().then((docs) => docs.map((d) => d._id));
    if (taskIds.length > 0) {
      const resultCount = await TaskTestResultModel.countDocuments({ visitTaskId: { $in: taskIds } });
      if (resultCount > 0) {
        throw new AppError(409, 'Cannot delete: test data has already been recorded for this service request');
      }
      await VisitTaskModel.deleteMany({ visitId: id });
    }

    await VisitModel.findByIdAndDelete(id);
    logger.info('Visit deleted', { visitId: id, deletedBy: userId });
  }

  async getTasksByVisit(visitId: string): Promise<any[]> {
    return VisitTaskModel.aggregate([
      { $match: { visitId: new Types.ObjectId(visitId) } },
      {
        $lookup: {
          from: 'equipment',
          localField: 'equipmentId',
          foreignField: '_id',
          as: 'equipment',
        },
      },
      {
        $lookup: {
          from: 'masterinstruments',
          localField: 'instrumentId',
          foreignField: '_id',
          as: 'instrument',
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          visitId: 1,
          equipmentId: 1,
          instrumentId: 1,
          area: 1,
          testPerformedBy: 1,
          witness: 1,
          visualInspection: 1,
          testCondition: 1,
          observations: 1,
          remarks: 1,
          status: 1,
          completedAt: 1,
          createdBy: 1,
          createdAt: 1,
          plannedTests: 1,
          equipment: { $arrayElemAt: [{ $map: { input: '$equipment', as: 'e', in: { id: '$$e._id', name: '$$e.name', code: '$$e.code', serialNumber: '$$e.serialNumber', make: '$$e.make', model: '$$e.model', area: '$$e.area' } } }, 0] },
          instrument: { $arrayElemAt: [{ $map: { input: '$instrument', as: 'i', in: { id: '$$i._id', name: '$$i.name', code: '$$i.code', calibrationDueDate: '$$i.calibrationDueDate', status: '$$i.status' } } }, 0] },
        },
      },
      { $sort: { createdAt: 1 } },
    ]);
  }

  async addTask(visitId: string, data: Partial<IVisitTask>, userId: string): Promise<IVisitTask> {
    const visit = await VisitModel.findById(visitId);
    if (!visit) throw new AppError(404, 'Visit not found');
    if (visit.status === VisitStatus.COMPLETED || visit.status === VisitStatus.CANCELLED) {
      throw new AppError(400, 'Cannot add tasks to a completed or cancelled visit');
    }

    let plannedTests = (data.plannedTests as any[]) ?? [];

    if (plannedTests.length > 0) {
      try {
        const [org, customer] = await Promise.all([
          OrganizationModel.findOne().lean(),
          CustomerModel.findById(visit.customerId).lean(),
        ]);

        if (org && customer) {
          const orgAbbr = org.abbreviation ?? '';
          const custAbbr = (customer as any).abbreviation ?? '';
          const typeSegment = visit.type === VisitType.VALIDATION ? 'VALI' : 'CALI';
          const year = new Date().getFullYear();
          const scope: SrCounterScope = org.srCounterScope ?? SrCounterScope.PER_YEAR;

          plannedTests = await Promise.all(
            plannedTests.map(async (pt) => {
              try {
                const testType = await TestTypeModel.findById(pt.testTypeId).lean();
                const testAbbr = testType?.abbreviation ?? '';
                const key = await buildCounterKey(scope, year, visit.customerId.toString(), visit.type, testAbbr || undefined);
                const seq = await srCounterService.nextSequence(key);
                const parts = [orgAbbr, custAbbr, typeSegment, testAbbr, String(year), padSeq(seq)].filter(Boolean);
                return { ...pt, srNumber: parts.join('/') };
              } catch {
                return pt;
              }
            }),
          );
        }
      } catch (err) {
        logger.warn('Test SR number generation failed, proceeding without it', { err });
      }
    }

    let instrumentId = data.instrumentId;
    if (!instrumentId && plannedTests.length > 0) {
      const first = plannedTests.find((pt) => pt.instrumentId);
      if (first?.instrumentId) instrumentId = first.instrumentId;
    }

    let area = data.area?.trim();
    if (!area && data.equipmentId) {
      const equipment = await EquipmentModel.findById(data.equipmentId).lean();
      if (equipment) {
        area = equipment.area?.trim() || equipment.name;
      }
    }

    const task = await VisitTaskModel.create({
      ...data,
      instrumentId,
      area,
      plannedTests,
      visitId,
      createdBy: userId,
    });
    logger.info('Visit task added', { taskId: task._id, visitId, createdBy: userId });
    return task;
  }

  async updateTask(visitId: string, taskId: string, data: Partial<IVisitTask>, userId: string): Promise<IVisitTask> {
    const existing = await VisitTaskModel.findOne({ _id: taskId, visitId });
    if (!existing) throw new AppError(404, 'Task not found');
    if (
      existing.status !== TaskStatus.PENDING &&
      existing.status !== TaskStatus.IN_PROGRESS
    ) {
      throw new AppError(400, 'Cannot update equipment on a completed or failed task');
    }

    const { _id, id: _, __v, createdAt, updatedAt, createdBy, ...updateData } = data as any;

    if (updateData.equipmentId) {
      const resolved = await resolveEquipmentForTask(
        visitId,
        taskId,
        updateData.equipmentId,
        updateData.area,
      );
      updateData.equipmentId = resolved.equipmentId;
      updateData.area = resolved.area;
    } else if (updateData.area !== undefined) {
      updateData.area = updateData.area?.trim() || undefined;
    }

    const task = await VisitTaskModel.findOneAndUpdate(
      { _id: taskId, visitId },
      updateData,
      { new: true },
    );
    if (!task) throw new AppError(404, 'Task not found');
    logger.info('Visit task updated', { taskId, visitId, updatedBy: userId });
    return task;
  }

  async startTask(visitId: string, taskId: string, data: Partial<IVisitTask>, userId: string): Promise<IVisitTask> {
    const task = await VisitTaskModel.findOne({ _id: taskId, visitId });
    if (!task) throw new AppError(404, 'Task not found');
    if (task.status !== TaskStatus.PENDING) {
      throw new AppError(400, 'Task is not in pending state');
    }

    const { _id, id: _, __v, createdAt, updatedAt, createdBy, status, ...setupData } = data as any;

    if (setupData.instrumentId === '') delete setupData.instrumentId;

    if (setupData.equipmentId) {
      const resolved = await resolveEquipmentForTask(
        visitId,
        taskId,
        setupData.equipmentId,
        setupData.area,
      );
      setupData.equipmentId = resolved.equipmentId;
      setupData.area = resolved.area;
    } else if (setupData.area !== undefined) {
      setupData.area = setupData.area?.trim() || undefined;
    }

    const instrumentId = setupData.instrumentId || task.instrumentId;
    if (instrumentId) {
      const instrument = await MasterInstrumentModel.findById(instrumentId);
      if (!instrument) throw new AppError(404, 'Selected instrument not found');

      const now = new Date();
      if (instrument.calibrationDueDate < now || instrument.status !== InstrumentStatus.ACTIVE) {
        if (instrument.status !== InstrumentStatus.EXPIRED) {
          instrument.status = InstrumentStatus.EXPIRED;
          await instrument.save();
        }
        throw new AppError(403, `Cannot start task: instrument "${instrument.name}" calibration has expired (due: ${instrument.calibrationDueDate.toISOString().split('T')[0]})`);
      }
    }

    const updated = await VisitTaskModel.findByIdAndUpdate(
      taskId,
      { ...setupData, status: TaskStatus.IN_PROGRESS },
      { new: true },
    );
    if (!updated) throw new AppError(404, 'Task not found');

    // Transition visit to in_progress if still scheduled
    await VisitModel.findOneAndUpdate(
      { _id: visitId, status: VisitStatus.SCHEDULED },
      { status: VisitStatus.IN_PROGRESS },
    );

    logger.info('Visit task started', { taskId, visitId, startedBy: userId });
    return updated;
  }

  async completeTask(visitId: string, taskId: string, data: Partial<IVisitTask>, userId: string): Promise<IVisitTask> {
    const task = await VisitTaskModel.findOne({ _id: taskId, visitId });
    if (!task) throw new AppError(404, 'Task not found');
    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new AppError(400, 'Task must be in progress before completing');
    }

    const { _id, id: _, __v, createdAt, updatedAt, createdBy, ...updateData } = data as any;
    const updated = await VisitTaskModel.findByIdAndUpdate(
      taskId,
      { ...updateData, status: TaskStatus.COMPLETED, completedAt: new Date() },
      { new: true },
    );
    if (!updated) throw new AppError(404, 'Task not found');

    // Auto-complete visit if all tasks are done
    const pendingTasks = await VisitTaskModel.countDocuments({
      visitId,
      status: { $in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
    });
    if (pendingTasks === 0) {
      await VisitModel.findByIdAndUpdate(visitId, {
        status: VisitStatus.COMPLETED,
        completedDate: new Date(),
      });
    }

    logger.info('Visit task completed', { taskId, visitId, completedBy: userId });
    return updated;
  }
}
