import Joi from "joi";

const createLessonValidation = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Title không được để trống",
  }),
  video_url: Joi.string().uri().required().messages({
    "string.empty": "Video URL không được để trống",
    "string.uri": "Video URL không hợp lệ",
  }),
  thumbnail_url: Joi.string().uri().required().messages({
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
