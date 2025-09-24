import axios from 'axios';
import ApiError from '../utils/ApiError.js';
import { HttpStatusCode } from 'axios';

class TranscriptService {
  /**
   * Fetch transcript from external provider using server-side API key
   * Returns array of { start_time, end_time, full_text }
   */
 static async fetchTranscript(urlOrId, lang = 'en') {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new ApiError(
        HttpStatusCode.InternalServerError,
        'YOUTUBE_API_KEY not configured in environment',
        'MISSING_API_KEY'
      );
    }

    const url = urlOrId.includes('youtube') ? urlOrId : `https://youtu.be/${urlOrId}`;

    const resp = await axios.get('https://api.supadata.ai/v1/transcript', {
      params: { url, lang },
      headers: { 'x-api-key': apiKey },
      timeout: 15000,
    });

    if (!resp.data || !Array.isArray(resp.data.content)) {
      throw new ApiError(
        HttpStatusCode.BadGateway,
        'Invalid transcript response from upstream',
        'UPSTREAM_ERROR'
      );
    }

    // helper: làm sạch + phát hiện frame nhạc
    const cleanText = (t) => {
      if (!t) return '';
      let s = String(t);

      // bỏ ký tự nốt nhạc
      s = s.replace(/♪/g, '');

      // bỏ các tag [Music]/(Music)/{Music}... (không phân biệt hoa thường)
      s = s.replace(/\[[^\]]*music[^\]]*\]/ig, '');
      s = s.replace(/\([^\)]*music[^\)]*\)/ig, '');
      s = s.replace(/\{[^}]*music[^}]*\}/ig, '');

      // nếu còn đúng từ "music" đứng riêng -> bỏ
      s = s.replace(/\bmusic\b/ig, '');

      // gọn khoảng trắng & xuống dòng thừa
      s = s.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').trim();

      return s;
    };

    // helper: khung thời gian -> giây làm tròn xuống
    const startSecond = (offsetMs) => Math.floor((Number(offsetMs) || 0) / 1000);

    // 1) chuyển đổi, làm sạch
    let items = resp.data.content.map((entry) => {
      const startMs = Number(entry.offset) || 0;
      const endMs = (Number(entry.offset) || 0) + (Number(entry.duration) || 0); // << SỬA BUG
      const cleaned = cleanText(entry.text || '');

      return {
        startMs,
        endMs,
        second: startSecond(startMs),
        text: cleaned,
        rawText: entry.text || '',
        lang: entry.lang || 'en',
      };
    });

    // 2) loại bỏ frame nhạc/rỗng
    items = items.filter((it) => it.text && it.text.trim().length > 0);

    // 3) đánh lại index và trả đúng format bạn yêu cầu
    const output = items.map((it, i) => ({
      index: i + 1,          // frame # sau khi lọc
      second: it.second,     // giây bắt đầu (floor)
      text: it.text,         // nội dung frame
      // nếu muốn giữ để seek chính xác, bạn có thể trả thêm:
      // startMs: it.startMs, endMs: it.endMs
    }));

    return output;
  } catch (err) {
    if (err.response) {
      throw new ApiError(
        err.response.status,
        `Upstream error: ${err.response.statusText}`,
        'UPSTREAM_ERROR'
      );
    }
    if (err.code === 'ECONNABORTED') {
      throw new ApiError(
        HttpStatusCode.GatewayTimeout,
        'Upstream request timed out',
        'UPSTREAM_TIMEOUT'
      );
    }
    throw err;
  }
}
}

export default TranscriptService;