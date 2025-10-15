import axios, { AxiosInstance } from "axios";
import ApiError from "../utils/ApiError";

class TheFluentApiService {
  private http: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
  private host: string;

  constructor() {
    this.baseUrl = process.env.RAPIDAPI_BASE_URL || "";
    this.apiKey = process.env.RAPIDAPI_KEY || "";
    this.host = process.env.RAPIDAPI_HOST || "";

    if (!this.baseUrl) {
      console.warn("[TheFluentApiService] Thiếu RAPIDAPI_BASE_URL (vd: https://thefluentme.p.rapidapi.com/api/v1)");
    }
    if (!this.apiKey) {
      console.warn("[TheFluentApiService] Thiếu RAPIDAPI_KEY");
    }
    if (!this.host) {
      console.warn("[TheFluentApiService] Thiếu RAPIDAPI_HOST (vd: thefluentme.p.rapidapi.com)");
    }

    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "X-RapidAPI-Key": this.apiKey,
        "X-RapidAPI-Host": this.host,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  // 🟢 Gửi nội dung để tạo post
  async createPost(content: string): Promise<{ post_id: string | undefined; raw: any }> {
    const body = {
      post_language_id: "22", // English mặc định
      post_title: (content || "").slice(0, 60) || "Title",
      post_content: content,
    };

    try {
      const response = await this.http.post("/post", body, { validateStatus: () => true });
      const { data, status, headers } = response;

      // Nếu RapidAPI trả về HTML thay vì JSON
      if (typeof data === "string" && /<\s*html/i.test(data)) {
        const snippet = data.slice(0, 300).replace(/\n+/g, " ");
        console.error("[TheFluentApiService][createPost] Nhận HTML thay vì JSON", {
          status,
          contentType: headers["content-type"],
          snippet,
        });
        throw new ApiError(401, "RapidAPI trả về HTML (key sai hoặc gói chưa kích hoạt).");
      }

      // Xử lý tìm post_id
      let postId = data?.post_id || data?.id || data?.postId;
      if (!postId && typeof data === "object") {
        for (const key of Object.keys(data)) {
          const nested = (data as any)[key];
          if (nested && typeof nested === "object") {
            postId = nested.post_id || nested.id || nested.postId;
            if (postId) break;
          }
        }
      }

      if (!postId) {
        if (data && data.message === "API doesn't exists") {
          console.error("[TheFluentApiService][createPost] Endpoint không tồn tại. Kiểm tra RAPIDAPI_HOST hoặc URL.", {
            baseURL: this.baseUrl,
            host: this.host,
          });
        } else {
          console.error("[TheFluentApiService][createPost] Phản hồi không hợp lệ, thiếu post_id. Dữ liệu gốc:", data);
        }
      }

      return { post_id: postId, raw: data };
    } catch (err: any) {
      this._handleAxiosError(err, "Không tạo được post ở TheFluent API");
      throw err;
    }
  }

  // 🟢 Gửi audio để chấm điểm
  async scorePost(postId: string | number, audioUrl: string): Promise<any> {
    try {
      const url = `/score/${postId}?scale=90`;
      const { data } = await this.http.post(url, { audio_provided: audioUrl });
      return data;
    } catch (err: any) {
      this._handleAxiosError(err, "Không chấm điểm được phát âm từ TheFluent API");
      throw err;
    }
  }

  // 🟢 Phân tích dữ liệu trả về từ API
  parseScoreArray(raw: any): { provided_data: any; overall_result_data: any; word_result_data: any[] } {
    if (!Array.isArray(raw)) {
      return { provided_data: {}, overall_result_data: {}, word_result_data: [] };
    }

    const find = (key: string) => raw.find((o: any) => Object.prototype.hasOwnProperty.call(o, key))?.[key];
    const providedArr = find("provided_data") || [];
    const overallArr = find("overall_result_data") || [];
    const wordArr = find("word_result_data") || [];

    return {
      provided_data: providedArr[0] || {},
      overall_result_data: overallArr[0] || {},
      word_result_data: wordArr,
    };
  }

  // 🟢 Xử lý lỗi axios
  private _handleAxiosError(err: any, fallbackMessage: string): never {
    if (err.response) {
      const upstreamMessage =
        typeof err.response.data === "string"
          ? err.response.data
          : err.response.data?.message;
      throw new ApiError(err.response.status, upstreamMessage || fallbackMessage);
    } else if (err.request) {
      throw new ApiError(503, "Không kết nối được tới TheFluent API");
    } else {
      throw new ApiError(500, fallbackMessage);
    }
  }
}

export default new TheFluentApiService();
