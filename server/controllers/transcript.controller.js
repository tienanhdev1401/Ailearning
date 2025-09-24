import TranscriptService from '../services/transcript.service.js';
import ApiError from '../utils/ApiError.js';
import { HttpStatusCode } from 'axios';

class TranscriptController {
  static async getTranscript(req, res, next) {
    try {
      const { url, lang = 'en' } = req.query;
      if (!url) {
        throw new ApiError(HttpStatusCode.BadRequest, 'Missing url query parameter', 'MISSING_URL');
      }

      const transcript = await TranscriptService.fetchTranscript(url, lang);
      res.status(HttpStatusCode.Ok).json({ transcript });
    } catch (err) {
      next(err);
    }
  }
}

export default TranscriptController;