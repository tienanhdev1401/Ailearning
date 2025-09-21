import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Subtitle from "./subtitle.js";


const Lesson = sequelize.define(
  "Lesson",
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
    video_url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, isUrl: true },
    },
    thumbnail_url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, isUrl: true },
    },
  },
  {
    tableName: "lessons",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

// Quan hệ 1-N
Lesson.hasMany(Subtitle, { foreignKey: "lesson_id", as: "subtitles" });

export default Lesson;
