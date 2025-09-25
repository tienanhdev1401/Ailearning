// helpers/phoneticHelper.js
import axios from "axios";

const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en";

// Cache kết quả phiên âm trong bộ nhớ (giảm số lần gọi API)
const phoneticCache = new Map();

export async function phoneticText(text) {
  const words = text.split(/\s+/);
  const cleanWords = words.map(w => w.replace(/[^a-zA-Z']/g, "")).filter(Boolean);

  const results = await Promise.all(cleanWords.map(async (word) => {
    const lowerWord = word.toLowerCase();

    // 1️⃣ Nếu đã có trong cache → trả về ngay
    if (phoneticCache.has(lowerWord)) {
      return phoneticCache.get(lowerWord);
    }

    // 2️⃣ Nếu chưa có → gọi API
    try {
      const res = await axios.get(`${DICTIONARY_API}/${lowerWord}`);
      const entry = res.data[0];
      const phonetic = entry?.phonetics?.find(p => p.text)?.text || word;

      phoneticCache.set(lowerWord, phonetic); // Lưu vào cache
      return phonetic;
    } catch {
      phoneticCache.set(lowerWord, word); // Cache luôn từ gốc để không gọi lại lần sau
      return word;
    }
  }));

  return results.join(" ");
}
