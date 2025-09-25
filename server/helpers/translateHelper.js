// helpers/translateHelper.js
import axios from "axios";

const GOOGLE_TRANSLATE_API = "https://translate.googleapis.com/translate_a/single";

export async function translateText(text) {
  try {
    const res = await axios.get(GOOGLE_TRANSLATE_API, {
      params: {
        client: "gtx",  // sử dụng client gtx (free)
        sl: "en",       // nguồn tiếng Anh
        tl: "vi",       // dịch sang tiếng Việt
        dt: "t",        // chỉ lấy phần dịch
        q: text,
      },
    });

    return res.data[0].map((item) => item[0]).join("");
  } catch (err) {
    console.error("Lỗi dịch văn bản:", err.message);
    return text; // trả về text gốc nếu dịch lỗi
  }
}
