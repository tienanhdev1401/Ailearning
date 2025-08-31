const { HttpStatusCode } = require("axios");
const AuthService = require("../services/auth.service");

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await AuthService.authenticateUser(email, password);
      if (!user) {
        return res.status(HttpStatusCode.Unauthorized).json({ message: "Sai tài khoản hoặc mật khẩu" });
      }

      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
      });

      res.status(HttpStatusCode.Ok).json({ accessToken });
    } catch (error) {
      res.status(HttpStatusCode.InternalServerError).json({ message: "Lỗi server khi đăng nhập", error: error.message });
    }
  }

  static async refreshToken(req, res) {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(HttpStatusCode.Unauthorized).json({ message: "Không có refresh token" });

    try {
      const payload = AuthService.verifyRefreshToken(token);
      const accessToken = AuthService.generateAccessToken(payload);
      res.json({ accessToken });
    } catch (err) {
      return res.status(HttpStatusCode.Unauthorized).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }
  }

  static logout(req, res) {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(204);

    res.clearCookie("refreshToken");
    res.sendStatus(HttpStatusCode.Ok).json({ message: "Logout thành công" });
  }

  static async getMe(req, res) {
    try {
      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        return res.status(HttpStatusCode.NotFound).json({ message: "Không tìm thấy người dùng" });
      }

      res.status(HttpStatusCode.Ok).json(user);
    } catch (error) {
      res.status(HttpStatusCode.InternalServerError).json({ message: "Lỗi server khi lấy thông tin người dùng", error: error.message });
    }
  }
}

module.exports = AuthController;
