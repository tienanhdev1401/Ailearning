const UserService = require("../services/user.service");

class UserController {
  // Lấy danh sách tất cả người dùng
  static async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng", error: error.message });
    }
  }

  // Lấy người dùng theo ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy người dùng", error: error.message });
    }
  }

  // Tạo người dùng mới
  static async createUser(req, res) {
    try {
      const {name, email, password, role } = req.body;

      console.log(req.body);

      // Kiểm tra trùng email
      const existingUser = await UserService.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }

      const newUser = await UserService.createUser({ name, email, password, role });
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi tạo người dùng", error: error.message });
    }
  }

  // Cập nhật người dùng
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { email, role } = req.body;

      const updatedUser = await UserService.updateUser(id, { email, role });
      if (!updatedUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng để cập nhật" });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi cập nhật người dùng", error: error.message });
    }
  }

  // Xoá người dùng
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const deleted = await UserService.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy người dùng để xoá" });
      }

      res.json({ message: "Xoá người dùng thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xoá người dùng", error: error.message });
    }
  }
}

module.exports = UserController;
