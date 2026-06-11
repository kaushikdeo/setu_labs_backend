import os from 'os';
import { UserModel } from '../user/user.model';
import { AuditLogModel } from '../audit/audit.model';
import { SiteModel } from '../customer/site.model';
import { logger } from '../../config/logger';
import { orgFilter } from '../../utils/tenant';

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
  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    try {
      const totalUsers = await UserModel.countDocuments(orgFilter(organizationId));

      const totalSites = await SiteModel.countDocuments({ isActive: true, ...orgFilter(organizationId) });

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const securityAlerts24h = await AuditLogModel.countDocuments({
        action: 'auth.login_failed',
        timestamp: { $gte: twentyFourHoursAgo },
        ...orgFilter(organizationId),
      });

      const cpus = os.cpus();
      const loadAvg = os.loadavg()[0];
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
