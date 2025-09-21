import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import fs from 'fs';


const errorHandlingMiddleware = (err, req, res, next) => {
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

  if (
    err instanceof ValidationError ||
    err instanceof UniqueConstraintError ||
    err instanceof ForeignKeyConstraintError
  ) {
    err.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Nếu có file upload thì xóa khi có lỗi
  if (req.file && req.file.path) {
    try {
      fs.unlinkSync(req.file.path);
      console.log(`Đã xóa file ${req.file.path} vì có lỗi.`);
    } catch (unlinkErr) {
      console.error(`Không thể xóa file ${req.file.path}:`, unlinkErr);
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
