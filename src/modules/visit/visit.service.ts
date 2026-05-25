import { Types } from 'mongoose';
import { VisitModel, IVisit, VisitStatus } from './visit.model';
import { VisitTaskModel, IVisitTask, TaskStatus } from './visit-task.model';
import { MasterInstrumentModel, InstrumentStatus } from '../instrument/instrument.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

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
        $project: {
          id: '$_id',
          _id: 0,
          code: 1,
          type: 1,
          scheduledDate: 1,
          completedDate: 1,
          status: 1,
          notes: 1,
          createdBy: 1,
          createdAt: 1,
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
        $project: {
          id: '$_id',
          _id: 0,
          code: 1,
          type: 1,
          scheduledDate: 1,
          completedDate: 1,
          status: 1,
          notes: 1,
          createdBy: 1,
          createdAt: 1,
          customerId: 1,
          siteId: 1,
          assignedEngineerId: 1,
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
    const visit = await VisitModel.create({
      ...data,
      code,
      createdBy: userId,
    });
    logger.info('Visit created', { visitId: visit._id, createdBy: userId });
    return visit;
  }

  async updateVisit(id: string, data: Partial<IVisit>, userId: string): Promise<IVisit> {
    const { _id, id: _, __v, createdAt, updatedAt, createdBy, ...updateData } = data as any;
    const visit = await VisitModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!visit) throw new AppError(404, 'Visit not found');
    logger.info('Visit updated', { visitId: id, updatedBy: userId });
    return visit;
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
          equipment: { $arrayElemAt: [{ $map: { input: '$equipment', as: 'e', in: { id: '$$e._id', name: '$$e.name', code: '$$e.code', serialNumber: '$$e.serialNumber', make: '$$e.make', model: '$$e.model' } } }, 0] },
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

    const task = await VisitTaskModel.create({
      ...data,
      visitId,
      createdBy: userId,
    });
    logger.info('Visit task added', { taskId: task._id, visitId, createdBy: userId });
    return task;
  }

  async updateTask(visitId: string, taskId: string, data: Partial<IVisitTask>, userId: string): Promise<IVisitTask> {
    const { _id, id: _, __v, createdAt, updatedAt, createdBy, ...updateData } = data as any;
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
