import { Request, Response, NextFunction } from "express";

const attachFileToBody = (fieldName: string) => (req: Request, res: Response, next: NextFunction) => {
  const file = (req as any).file;

  if (file) {
    req.body[fieldName] = file;
  }

  next();
};

export default attachFileToBody;
