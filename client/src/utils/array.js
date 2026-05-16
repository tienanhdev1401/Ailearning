/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param {Array} array 
 * @returns {Array} A new shuffled array.
 */
export const shuffleArray = (array) => {
  if (!Array.isArray(array)) return [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
