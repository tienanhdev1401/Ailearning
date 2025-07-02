const authService = require('../services/auth.service');
const jwt = require('jsonwebtoken');

// Các secret key này phải khớp với trong auth.service.js
const ACCESS_SECRET_KEY = 'your_access_secret_key';
const REFRESH_SECRET_KEY = 'your_refresh_secret_key';

class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken } = await authService.login(email, password);

      if (!accessToken || !refreshToken) {
        return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
      }

      // 1. Gửi refreshToken dưới dạng httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Chỉ true khi có HTTPS
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
      });

      // 2. Gửi accessToken trong body của response
      res.json({ accessToken });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
  }

  static async refreshToken(req, res) {
    // Lấy refreshToken từ httpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Không tìm thấy refresh token' });
    }

    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);
      
      const userPayload = { id: decoded.id, email: decoded.email };
      const newAccessToken = jwt.sign(userPayload, ACCESS_SECRET_KEY, { expiresIn: '15m' });

      res.json({ accessToken: newAccessToken });
    } catch (err) {
      // Nếu refresh token không hợp lệ, xóa cookie cũ để tránh lỗi lặp lại
      res.clearCookie('refreshToken');
      return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }
  }

  static async logout(req, res) {
    // Xóa httpOnly cookie chứa refresh token
    res.clearCookie('refreshToken');
    res.json({ message: 'Đã đăng xuất thành công' });
  }
}

module.exports = AuthController;