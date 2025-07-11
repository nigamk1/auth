import { Request, Response, NextFunction } from 'express';
import RealTimeSocketHandler from '../api/realtime/socketHandler';

// Extend Express Request to include socket handler
declare global {
  namespace Express {
    interface Request {
      socketHandler?: RealTimeSocketHandler;
    }
  }
}

let socketHandlerInstance: RealTimeSocketHandler | null = null;

export const setSocketHandler = (handler: RealTimeSocketHandler) => {
  socketHandlerInstance = handler;
};

export const injectSocketHandler = (req: Request, res: Response, next: NextFunction) => {
  req.socketHandler = socketHandlerInstance || undefined;
  next();
};

export const getSocketHandler = (): RealTimeSocketHandler | null => {
  return socketHandlerInstance;
};
