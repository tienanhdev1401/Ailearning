import React, { useMemo } from "react";
import styles from "../../styles/MiniGameWatchVideo.module.css";
import HLSPlayer from "../../../component/HLSPlayer";

// 🔧 Trích xuất YouTube video ID từ nhiều dạng URL
const extractYoutubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
};

const MiniGameWatchVideo = ({ data, onNext }) => {

  const { hlsUrl, mp4Url, youtubeId, title } = useMemo(() => {
    const hls  = data?.resources?.hlsUrl     || "";
    const mp4  = data?.resources?.fallbackUrl || "";
    const yt   = data?.resources?.youtubeUrl  || "";
    const old  = data?.resources?.videoUrl    || "";

    // 🐛 Debug: log resources để kiểm tra
    console.log("[WatchVideo] resources:", data?.resources);

    const videoTitle =
      data?.resources?.title ||
      data?.prompt ||
      "Video Luyện Tập";

    // 🎬 YouTube mode — có youtubeUrl
    if (yt) {
      const id = extractYoutubeId(yt);
      console.log("[WatchVideo] YouTube mode, id:", id);
      return { hlsUrl: "", mp4Url: "", youtubeId: id, title: videoTitle };
    }

    // 🎬 Fallback: hlsUrl/fallbackUrl chứa youtube link (trường hợp nhầm field)
    const ytFromHls = extractYoutubeId(hls);
    if (ytFromHls) {
      console.log("[WatchVideo] YouTube detected in hlsUrl:", ytFromHls);
      return { hlsUrl: "", mp4Url: "", youtubeId: ytFromHls, title: videoTitle };
    }
    const ytFromMp4 = extractYoutubeId(mp4);
    if (ytFromMp4) {
      console.log("[WatchVideo] YouTube detected in fallbackUrl:", ytFromMp4);
      return { hlsUrl: "", mp4Url: "", youtubeId: ytFromMp4, title: videoTitle };
    }

    // 👉 support data cũ (videoUrl)
    if (!hls && !mp4 && old) {
      const ytFromOld = extractYoutubeId(old);
      if (ytFromOld) return { hlsUrl: "", mp4Url: "", youtubeId: ytFromOld, title: videoTitle };
      if (old.includes(".m3u8")) {
        return { hlsUrl: old, mp4Url: "", youtubeId: null, title: videoTitle };
      } else {
        return { hlsUrl: "", mp4Url: old, youtubeId: null, title: videoTitle };
      }
    }

    return { hlsUrl: hls, mp4Url: mp4, youtubeId: null, title: videoTitle };
  }, [data]);

  return (
    <div className={styles.videoContainer}>
      <header className={styles.videoHeader}>
        <h2 className={styles.videoTitle}>
          {title}
        </h2>
      </header>

      <section className={styles.playerWrapper}>
        {youtubeId ? (
          /* ── YouTube embed ── */
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (hlsUrl || mp4Url) ? (
          /* ── HLS / MP4 player ── */
          <HLSPlayer
            hlsUrl={hlsUrl}
            fallbackUrl={mp4Url}
          />
        ) : (
          <div className={styles.noVideo}>Không có video</div>
        )}
      </section>

      <footer className={styles.videoFooter}>
        <button
          className={styles.nextButton}
          onClick={onNext}
        >
          Hoàn thành
        </button>
      </footer>
    </div>
  );
};

export default MiniGameWatchVideo;