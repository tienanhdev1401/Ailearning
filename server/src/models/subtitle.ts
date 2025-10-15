import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Lesson from "./lesson.js";

const Subtitle = sequelize.define(
  "Subtitle",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: "CASCADE",
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    end_time: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    full_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
  },
  {
    tableName: "subtitles",
    timestamps: false,
  }
);


export default Subtitle;
