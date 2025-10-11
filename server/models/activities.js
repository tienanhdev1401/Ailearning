import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Day from "./day.js";
import UserProgress from "./userProgress.js";

const Activities = sequelize.define(
  "Activities",
  {
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_progress_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      onDelete: "CASCADE",
    },
    day_id: {
      type: DataTypes.STRING,
      allowNull: true,
      onDelete: "CASCADE",
    },
    skill: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    point_of_ac: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { 
        min: 0,
        isInt: true 
      },
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { 
        min: 1,
        isInt: true 
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resources: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    time_spent: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
      validate: { 
        min: 0,
        isInt: true 
      },
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "activities",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Quan hệ N-1 với Day
Activities.belongsTo(Day, { foreignKey: "day_id", as: "day" });

// Quan hệ N-1 với UserProgress
Activities.belongsTo(UserProgress, { foreignKey: "user_progress_id", as: "user_progress" });

export default Activities;
