import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import USER_ROLE  from "../enums/userRole.enum.js";
import AUTH_PROVIDER  from "../enums/authProvider.enum.js";

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
          if (this.authProvider === AUTH_PROVIDER.LOCAL && !value) {
            throw new Error('Password là bắt buộc khi đăng nhập bằng phương thức local');
          }
        },
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: USER_ROLE.USER,
      validate: {
        isIn: [Object.values(USER_ROLE)],
      },
    },
    authProvider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: AUTH_PROVIDER.LOCAL,
      validate: {
        isIn: [Object.values(AUTH_PROVIDER)], 
      },
    },
  },
  {
    tableName: "users",
    timestamps: false,
  }
);

export default User;