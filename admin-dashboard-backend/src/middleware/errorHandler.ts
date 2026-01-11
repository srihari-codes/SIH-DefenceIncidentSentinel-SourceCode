import { NextFunction, Request, Response } from 'express';

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
};
