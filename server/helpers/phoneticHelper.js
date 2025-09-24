import cmudict from "cmudict";

const dict = cmudict;

export function phoneticWord(word) {
  try {
    const upperWord = word.toUpperCase();
    return dict[upperWord] ? dict[upperWord][0].join(" ") : word;
  } catch (err) {
    console.error("Lỗi phiên âm từ:", word, err);
    throw err;
  }
}

export function phoneticSentence(sentence) {
  try {
    return sentence.split(/\s+/).map(phoneticWord).join(" ");
  } catch (err) {
    console.error("Lỗi phiên âm câu:", sentence, err);
    throw err;
  }
}
