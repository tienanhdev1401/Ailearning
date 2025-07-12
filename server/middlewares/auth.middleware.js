const jwt = require("jsonwebtoken");
const ACCESS_SECRET = "access_secret";

const verifyTokenAndRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Không có token truy cập" });
    }

    try {
      const user = jwt.verify(token, ACCESS_SECRET);
      req.user = user;

      // Nếu có chỉ định role → kiểm tra
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Không có quyền truy cập" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  };
};

module.exports = verifyTokenAndRole;