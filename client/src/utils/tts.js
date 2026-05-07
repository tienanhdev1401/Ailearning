const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

let currentAudio = null;

/**
 * Plays text-to-speech using the backend edge-tts service.
 * @param {string} text - The text to speak.
 * @param {string} lang - 'en' or 'vi'.
 * @param {string} gender - 'female' or 'male'.
 */
export const speak = async (text, lang = "en", gender = "female") => {
  if (!text) return;

  // Stop current audio if playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Map language and gender to edge-tts voices
  let voice = "en-US-AriaNeural"; // Default English Female
  if (lang === "vi") {
    voice = gender === "male" ? "vi-VN-NamMinhNeural" : "vi-VN-HoaiMyNeural";
  } else if (lang === "en") {
    voice = gender === "male" ? "en-US-GuyNeural" : "en-US-AriaNeural";
  }

  const url = `${API_URL}/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;

  try {
    const audio = new Audio(url);
    currentAudio = audio;
    await audio.play();
  } catch (error) {
    console.error("Error playing TTS:", error);
    
    // Fallback to browser's SpeechSynthesis if backend fails
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "vi" ? "vi-VN" : "en-US";
    window.speechSynthesis.speak(utterance);
  }
};
