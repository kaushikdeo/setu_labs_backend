import os from 'os';
import { UserModel } from '../user/user.model';
import { AuditLogModel } from '../audit/audit.model';
import { OrganizationModel } from '../organization/organization.model';
import { logger } from '../../config/logger';

export interface DashboardStats {
  totalUsers: number;
  totalSites: number;
  securityAlerts24h: number;
  systemLoad: {
    cpuUsage: number;
    memoryUsage: number;
  };
}

export class StatsService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // 1. Total Users
      const totalUsers = await UserModel.countDocuments();

      // 2. Total Sites (For now, we count the organization as 1 site if it exists)
      // In the future, this will count from a Sites collection
      const organization = await OrganizationModel.findOne();
      const totalSites = organization ? 1 : 0;

      // 3. Security Alerts (Failed logins in the last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const securityAlerts24h = await AuditLogModel.countDocuments({
        action: 'auth.login_failed',
        timestamp: { $gte: twentyFourHoursAgo },
      });

      // 4. System Load
      const cpus = os.cpus();
      const loadAvg = os.loadavg()[0]; // 1 minute load average
      const cpuUsage = Math.min(Math.round((loadAvg / cpus.length) * 100), 100);
      
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

      return {
        totalUsers,
        totalSites,
        securityAlerts24h,
        systemLoad: {
          cpuUsage,
          memoryUsage,
        },
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats', { error });
      throw error;
    }
  }
}
