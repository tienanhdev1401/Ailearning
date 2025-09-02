import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';

const errorHandlingMiddleware = (err, req, res, next) => {
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

  if (
    err instanceof ValidationError ||
    err instanceof UniqueConstraintError ||
    err instanceof ForeignKeyConstraintError
  ) {
    err.statusCode = StatusCodes.BAD_REQUEST;
  }

  const responseError = {
    statusCode: err.statusCode,
    message: err.message || getReasonPhrase(err.statusCode),
    // stack: err.stack => chỉ rõ lỗi sai nằm ở đâu
  };

  console.error(responseError);

  res.status(responseError.statusCode).json(responseError);
};

export default errorHandlingMiddleware;
