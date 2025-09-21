const attachFileToBody = (fieldName) => (req, res, next) => {
  if (req.file) {
    req.body[fieldName] = req.file;
  }
  next();
};

export default attachFileToBody;
