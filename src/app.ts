import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { requestLogger } from './middlewares/request-logger.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { authenticate } from './middlewares/auth.middleware';
import userRoutes from './modules/user/user.route';
import authRoutes from './modules/auth/auth.route';
import organizationRoutes from './modules/organization/organization.route';
import statsRoutes from './modules/stats/stats.route';
import customerRoutes from './modules/customer/customer.route';
import { equipmentRoutes } from './modules/equipment/equipment.route';
import { instrumentRoutes } from './modules/instrument/instrument.route';
import visitRoutes from './modules/visit/visit.route';
import testTypeRoutes from './modules/test-type/test-type.route';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/test-types', testTypeRoutes);

app.use(errorHandler);

export default app;
