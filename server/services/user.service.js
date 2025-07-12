const User = require('../models/user');

class UserService {
  // Lấy danh sách tất cả người dùng
  static async getAllUsers() {
    return await User.findAll();
  }

  // Tạo người dùng mới
  static async createUser({ name, email, password, role }) {
    return await User.create({ name, email, password, role,  authProvider: 'local'});
  }

  // Lấy người dùng theo ID
  static async getUserById(id) {
    return await User.findByPk(id);
  }

  // Tìm người dùng theo email
  static async findUserByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  // Cập nhật người dùng
  static async updateUser(id, updateData) {
    const user = await User.findByPk(id);
    if (!user) return null;

    await user.update(updateData);
    return user;
  }

  // Xoá người dùng
  static async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) return null;

    await user.destroy();
    return true;
  }

  // Tìm người dùng theo email
  static async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  // Cập nhật mật khẩu người dùng (có mã hóa)
  static async updatePassword(userId, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) return null;

    await user.update({ password: newPassword });
    return user;
  }
}

module.exports = UserService;