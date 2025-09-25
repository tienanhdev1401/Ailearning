// controllers/pronunciation.controller.js
import { HttpStatusCode } from "axios";
import theFluentApiService from "../services/pronunciation.service.js";
import ApiError from "../utils/ApiError.js";

class PronunciationController {
  // Minimal one-shot: { text, audioUrl }
  static async score(req, res, next) {
    try {
      const { text, audioUrl } = req.body;
      if (!process.env.RAPIDAPI_KEY) {
        throw new ApiError(HttpStatusCode.InternalServerError, 'Thiếu RAPIDAPI_KEY (RapidAPI) trong server environment');
      }

      const postResult = await theFluentApiService.createPost(text); // { post_id, raw }
      const postId = postResult?.post_id;
      if (!postId) {
        console.error('[PronunciationController][score] Missing post_id. Raw post response:', postResult?.raw);
        throw new ApiError(HttpStatusCode.InternalServerError, 'Không lấy được post_id từ TheFluent API');
      }

  const rawScore = await theFluentApiService.scorePost(postId, audioUrl);
      const parsed = theFluentApiService.parseScoreArray(rawScore);
      // Fallback: if overall_result_data empty but we have word_result_data, build a minimal summary
      let overall = parsed.overall_result_data;
      if (!overall || Object.keys(overall).length === 0) {
        if (parsed.word_result_data.length > 0) {
          const points = parsed.word_result_data.map(w => Number(w.points) || 0);
          const avg = points.length ? Math.round(points.reduce((a,b)=>a+b,0) / points.length) : 0;
          overall = {
            overall_points: avg,
            number_of_recognized_words: parsed.word_result_data.length,
            number_of_words_in_post: parsed.word_result_data.length,
            generated_summary: 'Synthetic overall score (fallback – API missing overall_result_data).'
          };
        } else {
          overall = {};
        }
      }

      res.status(HttpStatusCode.Ok).json({
        success: true,
        post_id: postId,
        score: {
          provided_data: parsed.provided_data,
          overall_result_data: overall,
          word_result_data: parsed.word_result_data.map(w => ({
            word: w.word || w.Word,
            points: Number(w.points),
            speed: w.speed || 'not_available'
          }))
        },
        source: 'rapidapi',
        post_raw: postResult.raw
      });
    } catch (err) {
      next(err);
    }
  }
}

export default PronunciationController;
