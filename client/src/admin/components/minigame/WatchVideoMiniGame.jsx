import React, { useState, useEffect, useRef } from "react";
import { useToast } from "../../../context/ToastContext";
import api from "../../../api/api";
import HLSPlayer from "../../../component/HLSPlayer";

const WatchVideoMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();

  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [hlsUrl, setHlsUrl] = useState(minigame?.resources?.hlsUrl ?? "");
  const [mp4Url, setMp4Url] = useState(minigame?.resources?.fallbackUrl ?? "");
  const [title, setTitle] = useState(minigame?.resources?.title ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 👉 hỗ trợ data cũ (videoUrl)
  useEffect(() => {
    setPrompt(minigame?.prompt ?? "");

    const hls = minigame?.resources?.hlsUrl;
    const mp4 = minigame?.resources?.fallbackUrl;
    const old = minigame?.resources?.videoUrl;

    if (hls || mp4) {
      setHlsUrl(hls ?? "");
      setMp4Url(mp4 ?? "");
    } else if (old) {
      if (old.includes(".m3u8")) {
        setHlsUrl(old);
        setMp4Url("");
      } else {
        setMp4Url(old);
        setHlsUrl("");
      }
    }

    setTitle(minigame?.resources?.title ?? "");
  }, [minigame]);

  // 👉 upload
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
        title: title.trim() || undefined,
      },
    };

    try {
      setSaving(true);
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  if (!minigame) return null;

  return (
    <div className="card" style={{ maxHeight: "74vh", overflow: "auto" }}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <strong>Minigame #{minigame.id}</strong>{" "}
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

        {/* VIDEO */}
        <div className="mb-3">
          <label className="form-label">Video (*)</label>

          <div className="input-group mb-2">
            <input
              className="form-control"
              placeholder="Nhập URL video"
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
              {uploading ? "Đang tải..." : "Tải lên"}
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