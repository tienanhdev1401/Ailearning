const User = require('../models/user');

class UserService {
  static async getAllUsers() {
    return await User.findAll();
  }

  static async createUser({ name, email }) {
    return await User.create({ name, email });
  }

  static async getUserById(id) {
    return await User.findByPk(id);
  }
}

module.exports = UserService; 