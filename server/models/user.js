const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Cho phép null
      validate: {
        // Password bắt buộc nếu authProvider là 'local'
        passwordRequiredIfLocal(value) {
          if (this.authProvider === 'local' && !value) {
            throw new Error('Password là bắt buộc khi đăng nhập bằng phương thức local');
          }
        },
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
      validate: {
        isIn: [["admin", "user"]],
      },
    },
    authProvider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "local", // hoặc 'google', 'facebook', ...
      validate: {
        isIn: [["local", "google"]],
      },
    },
  },
  {
    tableName: "users",
    timestamps: false,
  }
);

module.exports = User;