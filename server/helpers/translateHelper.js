import { translate } from '@vitalets/google-translate-api';

export async function translateText(text) {
  try {
    const res = await translate(text, { to: 'vi' });
    return res.text;
  } catch (err) {
    console.error("Lỗi dịch:", err);
    throw err;
  }
}
