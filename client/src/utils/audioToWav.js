/**
 * Convert an arbitrary audio Blob (e.g. webm/opus from MediaRecorder) into a
 * 16 kHz mono 16-bit PCM WAV File. Done entirely in the browser using
 * AudioContext + OfflineAudioContext so the backend never has to touch raw
 * webm or rely on ffmpeg.
 */

const TARGET_SAMPLE_RATE = 16000;

const decodeBlob = async (audioContext, blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  // Some browsers reject the buffer object directly; clone for safety.
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(
      arrayBuffer.slice(0),
      (decoded) => resolve(decoded),
      (error) => reject(error || new Error("decodeAudioData failed"))
    );
  });
};

const downmixToMono = (audioBuffer) => {
  const channelCount = audioBuffer.numberOfChannels;
  if (channelCount === 1) {
    return audioBuffer.getChannelData(0);
  }
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let channel = 0; channel < channelCount; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      mono[i] += data[i] / channelCount;
    }
  }
  return mono;
};

const resampleMono = async (monoFloat, sourceRate, targetRate) => {
  if (sourceRate === targetRate) {
    return monoFloat;
  }
  const duration = monoFloat.length / sourceRate;
  const targetLength = Math.max(1, Math.round(duration * targetRate));

  const OfflineCtx =
    window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineCtx) {
    throw new Error("OfflineAudioContext is not supported in this browser");
  }

  const offline = new OfflineCtx(1, targetLength, targetRate);
  const buffer = offline.createBuffer(1, monoFloat.length, sourceRate);
  buffer.copyToChannel(monoFloat, 0, 0);

  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0);

  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
};

const encodeWav = (samples, sampleRate) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
};

/**
 * @param {Blob} blob source audio (any decodable format)
 * @param {string} [filename]
 * @returns {Promise<File>} 16 kHz mono 16-bit PCM WAV file
 */
export async function convertBlobToWav16k(blob, filename = "recording.wav") {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("AudioContext is not supported in this browser");
  }

  const audioContext = new AudioCtx();
  try {
    const decoded = await decodeBlob(audioContext, blob);
    const mono = downmixToMono(decoded);
    const resampled = await resampleMono(
      mono,
      decoded.sampleRate,
      TARGET_SAMPLE_RATE
    );
    const wavBlob = encodeWav(resampled, TARGET_SAMPLE_RATE);
    return new File([wavBlob], filename, { type: "audio/wav" });
  } finally {
    if (typeof audioContext.close === "function") {
      audioContext.close().catch(() => undefined);
    }
  }
}

export default convertBlobToWav16k;
