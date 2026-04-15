import Hls from "hls.js";
import { useEffect, useRef } from "react";

const HLSPlayer = ({ hlsUrl, fallbackUrl }) => {
    const videoRef = useRef(null);
    const retryCountRef = useRef(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls;

        const initHLS = () => {
            if (!hlsUrl) {
                video.src = fallbackUrl;
                return;
            }

            // Safari
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = hlsUrl;
                return;
            }

            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(hlsUrl);
                hls.attachMedia(video);

                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.warn("HLS error:", data);

                    // 🔥 Retry khi chưa ready (404, network)
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR && retryCountRef.current < 5) {
                        retryCountRef.current++;
                        console.log("Retry HLS:", retryCountRef.current);

                        setTimeout(() => {
                            hls.startLoad();
                        }, 3000);
                    }
                    // ❌ Lỗi nặng → fallback MP4
                    else {
                        console.warn("Fallback MP4");
                        video.src = fallbackUrl;
                    }
                });
            } else {
                video.src = fallbackUrl;
            }
        };

        initHLS();

        return () => {
            if (hls) hls.destroy();
        };
    }, [hlsUrl, fallbackUrl]);

    return (
        <video
            ref={videoRef}
            controls
            width="100%"
            height={400}
        />
    );
};

export default HLSPlayer;