import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import fs from 'fs';
import ApiError from '../utils/ApiError';


const errorHandlingMiddleware = (err: ApiError, req: Request, res:Response , next: NextFunction) => {
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

  if (
    err instanceof ValidationError ||
    err instanceof UniqueConstraintError ||
    err instanceof ForeignKeyConstraintError
  ) {
    err.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Nếu có file upload thì xóa khi có lỗi
  const file = (req as any).file;
  if (file && file.path) {
    try {
      fs.unlinkSync(file.path);
      console.log(`🗑️ Đã xóa file ${file.path} vì có lỗi.`);
    } catch (unlinkErr) {
      console.error(`Không thể xóa file ${file.path}:`, unlinkErr);
    }
  }

  const responseError = {
    statusCode: err.statusCode,
    message: err.message || getReasonPhrase(err.statusCode),
    stack: err.stack 
  };

  console.error(responseError);

  res.status(responseError.statusCode).json(responseError);
};

export default errorHandlingMiddleware;
