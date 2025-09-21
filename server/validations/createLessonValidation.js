import Joi from "joi";

const createLessonValidation = Joi.object({
  title: Joi.string().required()
  .example("Princess Mononoke Scene 1")
  .messages({
    "string.empty": "Title không được để trống",
  }),
  video_url: Joi.string().uri().required()
  .example("https://www.youtube.com/embed/vf6c6n35wr4?si=C87wihFh8Gk29MvZ")
  .messages({
    "string.empty": "Video URL không được để trống",
    "string.uri": "Video URL không hợp lệ",
  }),
  thumbnail_url: Joi.string().uri().required()
  .example("https://example.com/images/mononoke-thumb.jpg")
  .messages({
    "string.empty": "Thumbnail URL không được để trống",
    "string.uri": "Thumbnail URL không hợp lệ",
  }),
  srt_file: Joi.object().required().custom((file, helpers) => {
    if (!file.originalname || !file.originalname.endsWith(".srt")) {
      return helpers.message("File phải có định dạng .srt");
    }
    return file;
  }).messages({
    "any.required": "File SRT là bắt buộc",
  }),
});

export default createLessonValidation;
