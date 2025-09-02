import { HttpStatusCode } from "axios";
import jwt from "jsonwebtoken";

const verifyTokenAndRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(StatusCode.Unauthorized).json({ message: "Không có token truy cập" });
    }

    try {
      const user = jwt.verify(token, process.env.ACCESS_SECRET);
      req.user = user;

      // Nếu có chỉ định role → kiểm tra
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(HttpStatusCode.Forbidden).json({ message: "Không có quyền truy cập" });
      }

      next();
    } catch (err) {
      return res.status(HttpStatusCode.Unauthorized).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  };
};

export default verifyTokenAndRole;