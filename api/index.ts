import '../src/config/env';
import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../src/app';
import { connectDatabase } from '../src/config/database';

let isConnected = false;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!isConnected) {
    await connectDatabase();
    isConnected = true;
  }
  return app(req, res);
}
