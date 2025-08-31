const jwt = require("jsonwebtoken");
const User = require("../models/user");

dotenv.config();
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

class AuthService {
  static async authenticateUser(email, password) {
    const user = await User.findOne({ where: { email, password } }); // Nên hash password trong thực tế!
    return user;
  }

  static generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ACCESS_SECRET,
      { expiresIn: "30s" }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role },
      REFRESH_SECRET,
      { expiresIn: "1m" }
    );
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET);
  }

  static async getUserById(id) {
    return await User.findByPk(id, {
      attributes: ["id", "name", "email", "role"],
    });
  }
}

module.exports = AuthService;