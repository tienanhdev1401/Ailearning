import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.js";
import Roadmap from "./roadmap.js";
import Day from "./day.js";
import Activities from "./activities.js";

const UserProgress = sequelize.define(
  "UserProgress",
  {
    progress_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: "CASCADE",
    },
    roadmap_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      onDelete: "CASCADE",
    },
    day_id: {
      type: DataTypes.STRING,
      allowNull: true,
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "user_progress",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Quan hệ N-1 với User
UserProgress.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Quan hệ N-1 với Roadmap
UserProgress.belongsTo(Roadmap, { foreignKey: "roadmap_id", as: "roadmap" });

// Quan hệ N-1 với Day
UserProgress.belongsTo(Day, { foreignKey: "day_id", as: "day" });

// Quan hệ 1-N với Activities
UserProgress.hasMany(Activities, { foreignKey: "user_progress_id", as: "activities" });

export default UserProgress;
