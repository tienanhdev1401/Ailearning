const userService = require('../services/user.service');

class UserController {
  static async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      return res.status(200).json({ success: true, data: users, message: 'Lấy danh sách user thành công' });
    } catch (error) {
      console.error('Error getting all users:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách user' });
    }
  }

  static async createUser(req, res) {
    try {
      const { name, email } = req.body;
      const user = await userService.createUser({ name, email });
      return res.status(201).json({ success: true, data: user, message: 'Tạo user thành công' });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ success: false, message: 'Lỗi tạo user' });
    }
  }

  static async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
      return res.status(200).json({ success: true, data: user, message: 'Lấy user thành công' });
    } catch (error) {
      console.error('Error getting user by id:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy user' });
    }
  }
}

module.exports = UserController;