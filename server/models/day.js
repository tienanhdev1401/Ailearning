import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Roadmap from "./roadmap.js";
import Activities from "./activities.js";

const Day = sequelize.define(
  "Day",
  {
    day_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    roadmap_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: "CASCADE",
    },
    day_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { 
        min: 1,
        isInt: true 
      },
    },
    theme: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    condition: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { 
        min: 0,
        isInt: true 
      },
    },
  },
  {
    tableName: "days",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Quan hệ N-1 với Roadmap
Day.belongsTo(Roadmap, { foreignKey: "roadmap_id", as: "roadmap" });

// Quan hệ 1-N với Activities
Day.hasMany(Activities, { foreignKey: "day_id", as: "activities" });

export default Day;
