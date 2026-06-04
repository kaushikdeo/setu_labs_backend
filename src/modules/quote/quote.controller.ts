import { Request, Response, NextFunction } from 'express';
import { ListQuotesFilters, quoteService } from './quote.service';
import { QuoteStatus } from './quote.model';

function parseFilters(query: Request['query']): ListQuotesFilters {
  const f: ListQuotesFilters = {};
  if (typeof query.opportunityId === 'string') f.opportunityId = query.opportunityId;
  if (typeof query.status === 'string') f.status = (query.status as QuoteStatus) || '';
  if (typeof query.ownerUserId === 'string') f.ownerUserId = query.ownerUserId;
  return f;
}

export class QuoteController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.list(parseFilters(req.query));
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  pendingApprovals = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.pendingApprovals();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.create(req.body, req.user!.id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.update(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  addLineItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.addLineItem(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateLineItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.updateLineItem(req.params.id, req.params.lineId, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  removeLineItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.removeLineItem(req.params.id, req.params.lineId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  reorderLineItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.reorderLineItems(req.params.id, req.body.orderedIds);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  submitForReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.submitForReview(req.params.id, req.body?.note, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  technicalAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.technicalAction(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  managerAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.managerAction(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  generatePdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.generatePdf(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  send = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.send(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  revise = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.reviseFrom(req.params.id, req.user!.id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  accept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.accept(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await quoteService.reject(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await quoteService.remove(req.params.id);
      res.status(200).json({ success: true, message: 'Quote deleted' });
    } catch (err) {
      next(err);
    }
  };
}
