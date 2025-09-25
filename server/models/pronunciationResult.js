import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Stores pronunciation scoring results fetched via TheFluent API
// Allows marking records as private (only owner can see) or public.
const PronunciationResult = sequelize.define('PronunciationResult', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  post_id: { type: DataTypes.STRING, allowNull: false },
  score_id: { type: DataTypes.STRING, allowNull: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  is_private: { type: DataTypes.BOOLEAN, defaultValue: false },
  post_title: { type: DataTypes.STRING, allowNull: true },
  post_language_id: { type: DataTypes.STRING, allowNull: true },
  post_language_name: { type: DataTypes.STRING, allowNull: true },
  post_content: { type: DataTypes.TEXT, allowNull: true },
  ai_reading: { type: DataTypes.TEXT, allowNull: true },
  overall_points: { type: DataTypes.FLOAT, allowNull: true },
  length_of_recording_in_sec: { type: DataTypes.FLOAT, allowNull: true },
  number_of_recognized_words: { type: DataTypes.INTEGER, allowNull: true },
  number_of_words_in_post: { type: DataTypes.INTEGER, allowNull: true },
  raw_response: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'pronunciation_results',
  timestamps: true,
  underscored: true
});

export default PronunciationResult;
