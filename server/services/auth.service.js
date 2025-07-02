const jwt = require('jsonwebtoken');
const ACCESS_SECRET_KEY = 'your_access_secret_key'; // Nên dùng biến môi trường
const REFRESH_SECRET_KEY = 'your_refresh_secret_key'; // Nên dùng biến môi trường
// const User = require('../models/user'); // Nếu có model User

class AuthService {
  static async login(email, password) {
    // TODO: Kiểm tra email, password với DB
    // Ví dụ cứng:
    if (email === 'test@gmail.com' && password === '123456') {
      const user = { id: 1, email };
      // Access token có thời gian sống ngắn
      const accessToken = jwt.sign(user, ACCESS_SECRET_KEY, { expiresIn: '15m' });
      // Refresh token có thời gian sống dài
      const refreshToken = jwt.sign(user, REFRESH_SECRET_KEY, { expiresIn: '7d' });
      return { accessToken, refreshToken };
    }
    // Nếu sai trả về null
    return { accessToken: null, refreshToken: null };
  }
}

module.exports = AuthService;