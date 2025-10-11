import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Day from "./day.js";

const Roadmap = sequelize.define(
  "Roadmap",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    level: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { 
        notEmpty: true,
        isIn: [['beginner', 'intermediate', 'advanced']]
      },
    },
  },
  {
    tableName: "roadmaps",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Quan hệ 1-N với Day
Roadmap.hasMany(Day, { foreignKey: "roadmap_id", as: "days" });

export default Roadmap;
