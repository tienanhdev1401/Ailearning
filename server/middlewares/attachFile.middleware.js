const attachFileToBody = (fieldName) => (req, res, next) => {
  const file = req.file;

  if (file) {
    req.body[fieldName] = file;
  }

  next();
};

export default attachFileToBody;
