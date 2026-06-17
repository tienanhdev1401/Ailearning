import React, { useState, useEffect, useRef } from "react";
import { useToast } from "../../../context/ToastContext";
import api from "../../../api/api";
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

const WatchVideoMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();

  // "upload" | "youtube"
  const [videoMode, setVideoMode] = useState("upload");

  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [hlsUrl, setHlsUrl] = useState(minigame?.resources?.hlsUrl ?? "");
  const [mp4Url, setMp4Url] = useState(minigame?.resources?.fallbackUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(minigame?.resources?.youtubeUrl ?? "");
  const [title, setTitle] = useState(minigame?.resources?.title ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 👉 khởi tạo mode dựa vào data hiện có
  useEffect(() => {
    setPrompt(minigame?.prompt ?? "");

    const hls = minigame?.resources?.hlsUrl;
    const mp4 = minigame?.resources?.fallbackUrl;
    const yt  = minigame?.resources?.youtubeUrl;
    const old = minigame?.resources?.videoUrl;

    if (yt) {
      setYoutubeUrl(yt);
      setHlsUrl("");
      setMp4Url("");
      setVideoMode("youtube");
    } else if (hls || mp4) {
      setHlsUrl(hls ?? "");
      setMp4Url(mp4 ?? "");
      setYoutubeUrl("");
      setVideoMode("upload");
    } else if (old) {
      if (old.includes(".m3u8")) {
        setHlsUrl(old);
        setMp4Url("");
      } else {
        setMp4Url(old);
        setHlsUrl("");
      }
      setYoutubeUrl("");
      setVideoMode("upload");
    }

    setTitle(minigame?.resources?.title ?? "");
  }, [minigame]);

  // 👉 upload video file
  const handleUploadVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.warning("Vui lòng chọn file video hợp lệ");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    try {
      setUploading(true);

      const res = await api.post("/uploads/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data) {
        const hls = res.data.hlsUrl?.replace("http://", "https://") || "";
        const mp4 = res.data.fallbackUrl || "";

        setHlsUrl(hls);
        setMp4Url(mp4);

        toast.success("Tải video thành công");
      }
    } catch (err) {
      console.error(err);
      toast.error("Tải video thất bại");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 👉 save
  const handleSave = async () => {
    if (!prompt.trim()) {
      toast.warning("Prompt không được rỗng");
      return;
    }

    if (videoMode === "youtube") {
      const ytId = extractYoutubeId(youtubeUrl);
      if (!ytId) {
        toast.warning("YouTube URL không hợp lệ. Ví dụ: https://youtu.be/abc123");
        return;
      }

      const payload = {
        type: minigame?.type ?? "watch_video",
        prompt: prompt.trim(),
        resources: {
          youtubeUrl: youtubeUrl.trim(),
          ...(title.trim() ? { title: title.trim() } : {}),
        },
      };

      console.log("[WatchVideo Admin] Save YouTube payload:", payload);

      try {
        setSaving(true);
        await onSave(payload);
      } finally {
        setSaving(false);
      }
    } else {
      if (!hlsUrl && !mp4Url) {
        toast.warning("Video không được rỗng");
        return;
      }

      const payload = {
        type: minigame?.type ?? "watch_video",
        prompt: prompt.trim(),
        resources: {
          hlsUrl: hlsUrl || undefined,
          fallbackUrl: mp4Url || undefined,
          youtubeUrl: undefined,
          title: title.trim() || undefined,
        },
      };

      try {
        setSaving(true);
        await onSave(payload);
      } finally {
        setSaving(false);
      }
    }
  };

  if (!minigame) return null;

  const ytId = extractYoutubeId(youtubeUrl);

  return (
    <div className="card" style={{ maxHeight: "80vh", overflow: "auto" }}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <strong>Minigame</strong>{" "}
          <span className="text-muted">({minigame.type})</span>
        </div>
        <div>
          {onDelete && (
            <button className="btn btn-sm btn-danger me-2" onClick={onDelete}>
              Xóa
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* PROMPT */}
        <div className="mb-3">
          <label className="form-label">Prompt</label>
          <input
            className="form-control"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* TITLE */}
        <div className="mb-3">
          <label className="form-label">Tiêu đề video (Tùy chọn)</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* VIDEO SOURCE TABS */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Nguồn video (*)</label>

          {/* Tab switcher */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${videoMode === "upload" ? "active" : ""}`}
                onClick={() => setVideoMode("upload")}
              >
                📁 Upload / URL video
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${videoMode === "youtube" ? "active" : ""}`}
                onClick={() => setVideoMode("youtube")}
              >
                🎬 YouTube URL
              </button>
            </li>
          </ul>

          {/* === Tab: Upload / URL === */}
          {videoMode === "upload" && (
            <>
              <div className="input-group mb-2">
                <input
                  className="form-control"
                  placeholder="Nhập URL video (.m3u8 hoặc .mp4)"
                  value={hlsUrl || mp4Url || ""}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (!value) {
                      setHlsUrl("");
                      setMp4Url("");
                      return;
                    }
                    if (value.endsWith(".m3u8")) {
                      setHlsUrl(value);
                      setMp4Url("");
                    } else {
                      setMp4Url(value);
                      setHlsUrl("");
                    }
                  }}
                />

                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Đang tải..." : "📤 Tải lên"}
                </button>

                <input
                  type="file"
                  accept="video/*"
                  className="d-none"
                  ref={fileInputRef}
                  onChange={handleUploadVideo}
                />
              </div>

              {(hlsUrl || mp4Url) && (
                <div className="mt-2">
                  <HLSPlayer hlsUrl={hlsUrl} fallbackUrl={mp4Url} />
                </div>
              )}
            </>
          )}

          {/* === Tab: YouTube === */}
          {videoMode === "youtube" && (
            <>
              <div className="input-group mb-2">
                <span className="input-group-text">🔗</span>
                <input
                  className="form-control"
                  placeholder="Dán link YouTube vào đây (https://youtu.be/... hoặc https://www.youtube.com/watch?v=...)"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
              </div>

              {/* Preview */}
              {ytId ? (
                <div
                  style={{
                    position: "relative",
                    paddingBottom: "56.25%",
                    height: 0,
                    borderRadius: "10px",
                    overflow: "hidden",
                    marginTop: 8,
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title="YouTube preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
              ) : youtubeUrl ? (
                <p className="text-danger mt-1" style={{ fontSize: "0.875rem" }}>
                  ⚠️ URL chưa đúng định dạng YouTube. Thử: <code>https://youtu.be/abc123</code>
                </p>
              ) : (
                <p className="text-muted mt-1" style={{ fontSize: "0.875rem" }}>
                  Paste link YouTube để xem preview ngay tại đây.
                </p>
              )}
            </>
          )}
        </div>

        <hr />

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatchVideoMiniGame;