/**
 * Chuyển chuỗi thời gian SRT "hh:mm:ss,ms" sang giây (number)
 * Ví dụ: "00:01:30,500" => 90.5
 */
export function parseTimeToSeconds(time: string): number {
  const match = time.match(/(\d+):(\d+):(\d+),(\d+)/);
  if (!match) return 0;

  const [, hh, mm, ss, ms] = match.map(Number);
  return hh * 3600 + mm * 60 + ss + ms / 1000;
}


/**
 * Chuyển số giây (number) sang dạng "mm:ss"
 */
export function secondsToMinuteSecond(seconds: number): string {
  const totalSeconds = Math.floor(seconds); 
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  // thêm số 0 nếu < 10
  const mm = minutes.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");

  return `${mm}:${ss}`;
}