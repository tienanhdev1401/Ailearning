import React, { useMemo } from "react";
import styles from "../../styles/MiniGameWatchVideo.module.css";
import HLSPlayer from "../../../component/HLSPlayer";

const MiniGameWatchVideo = ({ data, onNext }) => {

  const { hlsUrl, mp4Url, title } = useMemo(() => {
    const hls = data?.resources?.hlsUrl || "";
    const mp4 = data?.resources?.fallbackUrl || "";
    const old = data?.resources?.videoUrl || "";

    // 👉 ưu tiên prompt > resources.title > fallback
    const videoTitle =
      data?.resources?.title ||
      data?.prompt ||
      "Video Luyện Tập";

    // 👉 support data cũ
    if (!hls && !mp4 && old) {
      if (old.includes(".m3u8")) {
        return {
          hlsUrl: old,
          mp4Url: "",
          title: videoTitle,
        };
      } else {
        return {
          hlsUrl: "",
          mp4Url: old,
          title: videoTitle,
        };
      }
    }

    return {
      hlsUrl: hls,
      mp4Url: mp4,
      title: videoTitle,
    };
  }, [data]);

  return (
    <div className={styles.videoContainer}>
      <header className={styles.videoHeader}>
        <h2 className={styles.videoTitle}>
          {title}
        </h2>
      </header>

      <section className={styles.playerWrapper}>
        {(hlsUrl || mp4Url) ? (
          <HLSPlayer
            hlsUrl={hlsUrl}
            fallbackUrl={mp4Url}
          />
        ) : (
          <div>Không có video</div>
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