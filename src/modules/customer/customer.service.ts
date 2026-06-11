import { CustomerModel, ICustomer } from './customer.model';
import { SiteModel, ISite } from './site.model';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';
import { orgFilter } from '../../utils/tenant';

export class CustomerService {
  async createCustomer(data: Partial<ICustomer>, userId: string, organizationId: string): Promise<ICustomer> {
    const code = data.code || `CUST-${Date.now()}`;

    const existing = await CustomerModel.findOne({ code, ...orgFilter(organizationId) });
    if (existing) {
      throw new AppError(400, 'Customer with this code already exists');
    }

    const customer = await CustomerModel.create({
      ...data,
      code,
      ...orgFilter(organizationId),
      createdBy: userId,
    });

    logger.info('Customer created', { customerId: customer._id, createdBy: userId });
    return customer;
  }

  async getAllCustomers(organizationId: string): Promise<any[]> {
    return CustomerModel.aggregate([
      { $match: orgFilter(organizationId) },
      {
        $lookup: {
          from: 'sites',
          localField: '_id',
          foreignField: 'customerId',
          as: 'sites',
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          name: 1,
          code: 1,
          industryType: 1,
          status: 1,
          primaryContactName: 1,
          primaryContactEmail: 1,
          primaryContactPhone: 1,
          address: 1,
          city: 1,
          state: 1,
          country: 1,
          pincode: 1,
          siteCount: { $size: '$sites' },
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
  }

  async getCustomerById(id: string, organizationId: string): Promise<ICustomer> {
    const customer = await CustomerModel.findOne({ _id: id, ...orgFilter(organizationId) });
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    return customer;
  }

  async updateCustomer(id: string, data: Partial<ICustomer>, userId: string, organizationId: string): Promise<ICustomer> {
    const { _id, id: _, __v, createdAt, updatedAt, createdBy, siteCount, ...updateData } = data as any;
    const customer = await CustomerModel.findOneAndUpdate({ _id: id, ...orgFilter(organizationId) }, updateData, { new: true });
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    logger.info('Customer updated', { customerId: id, updatedBy: userId });
    return customer;
  }

  async createSite(customerId: string, data: Partial<ISite>, userId: string, organizationId: string): Promise<ISite> {
    await this.getCustomerById(customerId, organizationId);

    const code = data.code || `SITE-${Date.now()}`;

    const existing = await SiteModel.findOne({ customerId, code, ...orgFilter(organizationId) });
    if (existing) {
      throw new AppError(400, 'Site with this code already exists for this customer');
    }

    const site = await SiteModel.create({
      ...data,
      code,
      customerId,
      ...orgFilter(organizationId),
      createdBy: userId,
    });

    logger.info('Site created', { siteId: site._id, customerId, createdBy: userId });
    return site;
  }

  async getSitesByCustomer(customerId: string, organizationId: string): Promise<ISite[]> {
    await this.getCustomerById(customerId, organizationId);
    return SiteModel.find({ customerId, ...orgFilter(organizationId) }).sort({ createdAt: -1 });
  }

  async updateSite(siteId: string, data: Partial<ISite>, userId: string, organizationId: string): Promise<ISite> {
    const site = await SiteModel.findOneAndUpdate({ _id: siteId, ...orgFilter(organizationId) }, data, { new: true });
    if (!site) {
      throw new AppError(404, 'Site not found');
    }
    logger.info('Site updated', { siteId, updatedBy: userId });
    return site;
  }

  async deleteSite(siteId: string, userId: string, organizationId: string): Promise<void> {
    const site = await SiteModel.findOneAndUpdate({ _id: siteId, ...orgFilter(organizationId) }, { isActive: false }, { new: true });
    if (!site) {
      throw new AppError(404, 'Site not found');
    }
    logger.info('Site deactivated', { siteId, updatedBy: userId });
  }
}
