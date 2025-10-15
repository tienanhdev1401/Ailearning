import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import USER_ROLE from '../enums/userRole.enum.js';
import AUTH_PROVIDER from '../enums/authProvider.enum.js';

class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string | null;
  declare role: string;
  declare authProvider: string;
}

User.init(
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
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        passwordRequiredIfLocal(this: User, value: string | null) {
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
      validate: { isIn: [Object.values(USER_ROLE)] },
    },
    authProvider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: AUTH_PROVIDER.LOCAL,
      validate: { isIn: [Object.values(AUTH_PROVIDER)] },
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: false,
  }
);

export default User;
