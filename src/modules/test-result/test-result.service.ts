import { Types } from 'mongoose';
import { TaskTestResultModel, ITaskTestResult } from './test-result.model';
import { TestTypeModel } from '../test-type/test-type.model';
import { VisitTaskModel } from '../visit/visit-task.model';
import { VisitModel } from '../visit/visit.model';
import { ReportModel, ReportStatus } from '../report/report.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';
import { orgFilter } from '../../utils/tenant';
import { calculate as calcAirVelocity } from './calculations/air-velocity-acph-pao';
import { calculate as calcParticleCount } from './calculations/particle-count';
import { calculate as calcHepaFilter } from './calculations/hepa-filter-integrity';
import { calculate as calcRecoveryTest } from './calculations/recovery-test';

type CalcFn = (readings: any, thresholds: Record<string, any>, testType?: any) => {
  calculatedValues: Record<string, any>;
  result: 'Pass' | 'Fail';
  conclusion: string;
};

const calcRegistry: Record<string, CalcFn> = {
  air_velocity_acph_pao: calcAirVelocity,
  particle_count: calcParticleCount,
  hepa_filter_integrity: calcHepaFilter,
  recovery_test: calcRecoveryTest,
};

function runCalculation(
  calcFn: CalcFn,
  readings: any,
  thresholds: Record<string, any>,
  testType?: any,
): { calculatedValues: Record<string, any>; result: 'Pass' | 'Fail'; conclusion: string } {
  if (Array.isArray(readings.occupancyGroups) && readings.occupancyGroups.length > 0) {
    const groups = readings.occupancyGroups.map((group: any) => {
      const groupReadings = { ...readings, ...group };
      delete groupReadings.occupancyGroups;
      const r = calcFn(groupReadings, thresholds, testType);
      return { label: group.label, ...r };
    });
    const result: 'Pass' | 'Fail' = groups.some((g: any) => g.result === 'Fail') ? 'Fail' : 'Pass';
    return {
      calculatedValues: { occupancyGroups: groups },
      result,
      conclusion: groups.map((g: any) => `${g.label}: ${g.conclusion}`).join(' | '),
    };
  }
  return calcFn(readings, thresholds, testType);
}

async function generateReportNumber(visitTaskId: string, organizationId: string): Promise<string> {
  const task = await VisitTaskModel.findOne({ _id: visitTaskId, ...orgFilter(organizationId) }).populate({
    path: 'visitId',
    populate: { path: 'customerId', model: 'Customer', select: 'code' },
  });
  if (!task) throw new AppError(404, 'Task not found');

  const visit = await VisitModel.findOne({ _id: task.visitId, ...orgFilter(organizationId) }).populate('customerId');
  const customerCode = (visit as any)?.customerId?.code ?? 'UNK';
  const year = new Date().getFullYear();
  const count = await TaskTestResultModel.countDocuments(orgFilter(organizationId));
  const seq = String(count + 1).padStart(3, '0');
  return `SETU/${customerCode}/VAL/${year}/${seq}`;
}

export class TestResultService {
  async getByTask(visitTaskId: string, organizationId: string): Promise<any[]> {
    const task = await VisitTaskModel.findOne({ _id: visitTaskId, ...orgFilter(organizationId) });
    if (!task) throw new AppError(404, 'Task not found');

    return TaskTestResultModel.aggregate([
      { $match: { visitTaskId: new Types.ObjectId(visitTaskId), ...orgFilter(organizationId) } },
      {
        $lookup: {
          from: 'testtypes',
          localField: 'testTypeId',
          foreignField: '_id',
          as: 'testType',
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
          environmentalConditions: 1,
          createdBy: 1,
          completedAt: 1,
          createdAt: 1,
          testType: { $arrayElemAt: [{ $map: { input: '$testType', as: 't', in: { id: '$$t._id', code: '$$t.code', name: '$$t.name' } } }, 0] },
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
        },
      },
      { $sort: { createdAt: 1 } },
    ]);
  }

  async getById(id: string, organizationId: string): Promise<any> {
    const results = await TaskTestResultModel.aggregate([
      { $match: { _id: new Types.ObjectId(id), ...orgFilter(organizationId) } },
      {
        $lookup: {
          from: 'testtypes',
          localField: 'testTypeId',
          foreignField: '_id',
          as: 'testType',
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
        $lookup: {
          from: 'visittasks',
          localField: 'visitTaskId',
          foreignField: '_id',
          as: 'task',
        },
      },
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
          environmentalConditions: 1,
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

  async create(
    visitTaskId: string,
    data: {
      testTypeId: string;
      instrumentId: string;
      testPerformedBy?: string;
      witness?: string;
      visualInspection?: string;
      environmentalConditions?: Record<string, any>;
      readings: Record<string, any>;
    },
    userId: string,
    organizationId: string,
  ): Promise<ITaskTestResult> {
    const task = await VisitTaskModel.findOne({ _id: visitTaskId, ...orgFilter(organizationId) });
    if (!task) throw new AppError(404, 'Task not found');

    const testType = await TestTypeModel.findOne({ _id: data.testTypeId, ...orgFilter(organizationId) });
    if (!testType) throw new AppError(404, 'Test type not found');

    const calcFn = calcRegistry[testType.calculationKey];
    if (!calcFn) throw new AppError(500, `No calculation function for key: ${testType.calculationKey}`);

    const { calculatedValues, result, conclusion } = runCalculation(
      calcFn,
      data.readings,
      testType.acceptanceCriteria.thresholds,
      testType,
    );

    const reportNumber = await generateReportNumber(visitTaskId, organizationId);

    const testResult = await TaskTestResultModel.create({
      visitTaskId,
      testTypeId: data.testTypeId,
      instrumentId: data.instrumentId,
      reportNumber,
      testPerformedBy: data.testPerformedBy,
      witness: data.witness,
      visualInspection: data.visualInspection,
      environmentalConditions: data.environmentalConditions,
      readings: data.readings,
      calculatedValues,
      result,
      conclusion,
      ...orgFilter(organizationId),
      createdBy: userId,
      completedAt: new Date(),
    });

    const taskDoc = await VisitTaskModel.findOne({ _id: visitTaskId, ...orgFilter(organizationId) });
    if (taskDoc) {
      const pt = taskDoc.plannedTests.find(
        (p) => p.testTypeId.toString() === data.testTypeId,
      );
      if (pt) {
        pt.status = 'completed';
        taskDoc.markModified('plannedTests');
        await taskDoc.save();
      }
    }

    return testResult;
  }

  async update(
    resultId: string,
    data: {
      testPerformedBy?: string;
      witness?: string;
      visualInspection?: string;
      environmentalConditions?: Record<string, any>;
      readings: Record<string, any>;
    },
    userId: string,
    organizationId: string,
  ): Promise<ITaskTestResult> {
    const existing = await TaskTestResultModel.findOne({ _id: resultId, ...orgFilter(organizationId) });
    if (!existing) throw new AppError(404, 'Test result not found');

    const task = await VisitTaskModel.findOne({ _id: existing.visitTaskId, ...orgFilter(organizationId) });
    if (!task) throw new AppError(404, 'Task not found');

    const report = await ReportModel.findOne({ visitId: task.visitId, ...orgFilter(organizationId) });
    if (report && report.status === ReportStatus.APPROVED) {
      throw new AppError(
        409,
        'Report is approved. Revert to changes_requested before editing test results.',
      );
    }

    const testType = await TestTypeModel.findOne({ _id: existing.testTypeId, ...orgFilter(organizationId) });
    if (!testType) throw new AppError(404, 'Test type not found');

    const calcFn = calcRegistry[testType.calculationKey];
    if (!calcFn) throw new AppError(500, `No calculation function for key: ${testType.calculationKey}`);

    const { calculatedValues, result, conclusion } = runCalculation(
      calcFn,
      data.readings,
      testType.acceptanceCriteria.thresholds,
      testType,
    );

    const updated = await TaskTestResultModel.findOneAndUpdate(
      { _id: resultId, ...orgFilter(organizationId) },
      {
        readings: data.readings,
        testPerformedBy: data.testPerformedBy,
        witness: data.witness,
        visualInspection: data.visualInspection,
        environmentalConditions: data.environmentalConditions,
        calculatedValues,
        result,
        conclusion,
      },
      { new: true },
    );

    logger.info('Test result updated', { resultId, result, updatedBy: userId });
    return updated!;
  }

  async recalculate(resultId: string, userId: string, organizationId: string): Promise<ITaskTestResult> {
    const existing = await TaskTestResultModel.findOne({ _id: resultId, ...orgFilter(organizationId) });
    if (!existing) throw new AppError(404, 'Test result not found');

    const testType = await TestTypeModel.findOne({ _id: existing.testTypeId, ...orgFilter(organizationId) });
    if (!testType) throw new AppError(404, 'Test type not found');

    const calcFn = calcRegistry[testType.calculationKey];
    if (!calcFn) throw new AppError(500, `No calculation function for key: ${testType.calculationKey}`);

    const { calculatedValues, result, conclusion } = runCalculation(
      calcFn,
      existing.readings,
      testType.acceptanceCriteria.thresholds,
      testType,
    );

    const updated = await TaskTestResultModel.findOneAndUpdate(
      { _id: resultId, ...orgFilter(organizationId) },
      { calculatedValues, result, conclusion },
      { new: true },
    );

    logger.info('Test result recalculated', { resultId, result, updatedBy: userId });
    return updated!;
  }
}
