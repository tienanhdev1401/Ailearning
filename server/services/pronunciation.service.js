// services/pronunciation.service.js
import axios from "axios";
import ApiError from "../utils/ApiError.js";

// RapidAPI-only service (English language_id=22)
class TheFluentApiService {
  constructor() {
    this.baseUrl = process.env.RAPIDAPI_BASE_URL; // Must include full path e.g. https://thefluentme.p.rapidapi.com/api/v1
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.host = process.env.RAPIDAPI_HOST; // Provide explicitly; no auto-derivation

    if (!this.baseUrl) {
      console.warn('[TheFluentApiService] Missing RAPIDAPI_BASE_URL (ví dụ: https://thefluentme.p.rapidapi.com/api/v1)');
    }
    if (!this.apiKey) {
      console.warn('[TheFluentApiService] Missing RAPIDAPI_KEY');
    }
    if (!this.host) {
      console.warn('[TheFluentApiService] Missing RAPIDAPI_HOST (ví dụ: thefluentme.p.rapidapi.com)');
    }

    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-RapidAPI-Key': this.apiKey || '',
        'X-RapidAPI-Host': this.host || '',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async createPost(content) {
    const body = {
      post_language_id: '22', // English default
      post_title: (content || '').slice(0, 60) || 'Title',
      post_content: content
    };
    try {
  const response = await this.http.post('/post', body, { validateStatus: () => true });
      const { data, status, headers } = response;
      // Detect HTML
      if (typeof data === 'string' && /<\s*html/i.test(data)) {
        const snippet = data.slice(0, 300).replace(/\n+/g, ' ');
        console.error('[TheFluentApiService][createPost] Received HTML instead of JSON', {
          status,
          contentType: headers['content-type'],
          snippet
        });
        throw new ApiError(401, 'RapidAPI trả về HTML (key sai hoặc gói chưa kích hoạt).');
      }
      // Some safety: handle alternative shapes
      let postId = data?.post_id || data?.id || data?.postId;
      if (!postId && typeof data === 'object') {
        // Try nested search
        for (const k of Object.keys(data)) {
          if (data[k] && typeof data[k] === 'object') {
            postId = data[k].post_id || data[k].id || data[k].postId;
            if (postId) {
              break;
            }
          }
        }
      }
      if (!postId) {
        if (data && data.message === "API doesn't exists") {
          console.error('[TheFluentApiService][createPost] Endpoint not found. Check RAPIDAPI_HOST or base URL.', { baseURL: this.baseUrl, host: this.host });
        } else {
          console.error('[TheFluentApiService][createPost] Unexpected response, missing post_id. Raw:', data);
        }
      }
      return { post_id: postId, raw: data };
    } catch (err) {
      this._handleAxiosError(err, 'Không tạo được post ở TheFluent API');
    }
  }

  async scorePost(postId, audioUrl) {
    try {
      const url = `/score/${postId}?scale=90`;
      const { data } = await this.http.post(url, { audio_provided: audioUrl });
      return data; // Expect array
    } catch (err) {
      this._handleAxiosError(err, 'Không chấm điểm được phát âm từ TheFluent API');
    }
  }

  parseScoreArray(raw) {
    if (!Array.isArray(raw)) {
      return { provided_data: {}, overall_result_data: {}, word_result_data: [] };
    }
    const find = (key) => raw.find(o => Object.prototype.hasOwnProperty.call(o, key))?.[key];
    const providedArr = find('provided_data') || [];
    const overallArr = find('overall_result_data') || [];
    const wordArr = find('word_result_data') || [];
    return {
      provided_data: providedArr[0] || {},
      overall_result_data: overallArr[0] || {},
      word_result_data: wordArr
    };
  }

  _handleAxiosError(err, fallbackMessage) {
    if (err.response) {
      const upstreamMessage = typeof err.response.data === 'string' ? err.response.data : err.response.data?.message;
      throw new ApiError(err.response.status, upstreamMessage || fallbackMessage);
    } else if (err.request) {
      throw new ApiError(503, 'Không kết nối được tới TheFluent API');
    } else {
      throw new ApiError(500, fallbackMessage);
    }
  }
}

export default new TheFluentApiService();
