import { HttpStatusCode } from "axios";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: any;
}

const verifyTokenAndRole = (allowedRoles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(HttpStatusCode.Unauthorized).json({ message: "Không có token truy cập" });
    }

    try { 
      const user = jwt.verify(token, process.env.ACCESS_SECRET as string);
      req.user = user;

      // Nếu có chỉ định role → kiểm tra
      if (allowedRoles.length > 0 && !allowedRoles.includes((user as any).role)) {
        return res.status(HttpStatusCode.Forbidden).json({ message: "Không có quyền truy cập" });
      }

      next();
    } catch (err) {
      return res.status(HttpStatusCode.Unauthorized).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  };
};

export default verifyTokenAndRole;