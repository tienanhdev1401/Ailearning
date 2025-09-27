import React, { useState, useEffect, useRef, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import RecordRTC from "recordrtc";
import api from '../../api/api';

import successSound from "../sounds/success.mp3";

export default function SpeakingVideoPraticePage() {
  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [revealedMap, setRevealedMap] = useState([]);
  const [typedMap, setTypedMap] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const [segmentCompleted, setSegmentCompleted] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [youtubeAPIReady, setYoutubeAPIReady] = useState(false);

  // recording states
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [apiResult, setApiResult] = useState(null); // store API JSON result
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  // store last recording blob + object URL so we can play it later
  const [lastRecording, setLastRecording] = useState(null); // { blob, url }

  const segmentRefs = useRef([]);
  const [segmentSuccess, setSegmentSuccess] = useState(false);

  const timeToSeconds = (timeStr) => {
    const [time, ms] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  };

  // Update words when segment changes
  const updateWordsForSegment = useCallback((segmentIndex) => {
    if (!lesson || segmentIndex >= lesson.subtitles.length) return;
    const currentSubtitle = lesson.subtitles[segmentIndex];
    const segmentWords = (currentSubtitle.text || '').split(" ").filter(w => w.length >= 1);
    setWords(segmentWords);

    setRevealedMap(prev => {
      const copy = prev ? [...prev] : [];
      if (!copy[segmentIndex]) copy[segmentIndex] = Array(segmentWords.length).fill(false);
      else if (copy[segmentIndex].length !== segmentWords.length) {
        const existing = copy[segmentIndex];
        copy[segmentIndex] = existing.concat(Array(Math.max(0, segmentWords.length - existing.length)).fill(false)).slice(0, segmentWords.length);
      }
      return copy;
    });

    setTypedMap(prev => {
      const copy = prev ? [...prev] : [];
      if (!copy[segmentIndex]) copy[segmentIndex] = Array(segmentWords.length).fill(false);
      else if (copy[segmentIndex].length !== segmentWords.length) {
        const existing = copy[segmentIndex];
        copy[segmentIndex] = existing.concat(Array(Math.max(0, segmentWords.length - existing.length)).fill(false)).slice(0, segmentWords.length);
      }
      return copy;
    });

    // clear previous apiResult when switching segment
    setApiResult(null);
    setSegmentSuccess(false);
  }, [lesson]);

  // YouTube API loader (unchanged)
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYoutubeAPIReady(true);
      return;
    }
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const checkAPI = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setYoutubeAPIReady(true);
          clearInterval(checkAPI);
        }
      }, 100);
      return () => clearInterval(checkAPI);
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => setYoutubeAPIReady(true);
    return () => { if (window.onYouTubeIframeAPIReady) delete window.onYouTubeIframeAPIReady; };
  }, []);

  // Fetch lesson (unchanged except set state)
  useEffect(() => {
    async function fetchLessonData() {
      try {
        setLoading(true);
        const lessonRes = await api.get('/lessons/1');
        const lessonData = lessonRes.data.lesson;
        const subtitles = (lessonData.subtitles || []).map((sub, index) => ({
          index: index + 1,
          second: timeToSeconds(sub.start_time),
          text: sub.full_text
        }));
        setLesson({
          id: lessonData.id,
          title: lessonData.title,
          video_url: lessonData.video_url,
          thumbnail_url: lessonData.thumbnail_url,
          subtitles
        });
        const total = subtitles.reduce((sum, s) => sum + (s.text ? s.text.split(' ').filter(w => w.length>0).length : 0), 0);
        setTotalWords(total);
        setRevealedMap(subtitles.map(s => Array((s.text || '').split(' ').filter(w => w.length>0).length).fill(false)));
        setTypedMap(subtitles.map(s => Array((s.text || '').split(' ').filter(w => w.length>0).length).fill(false)));
      } catch (err) {
        console.error('Lỗi fetch lesson:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLessonData();
  }, []);

  useEffect(() => { if (lesson && lesson.subtitles.length > 0) updateWordsForSegment(0); }, [lesson, updateWordsForSegment]);

  // YouTube player init (unchanged)
  useEffect(() => {
    if (!lesson || !lesson.video_url || !youtubeAPIReady) return;
    if (player) player.destroy();
    const extractYouTubeId = (url) => {
      if (!url) return null;
      const embedMatch = url.match(/embed\/([A-Za-z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
      const watchMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
      if (watchMatch) return watchMatch[1];
      const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
      if (shortMatch) return shortMatch[1];
      const idMatch = url.match(/^([A-Za-z0-9_-]{11})$/);
      if (idMatch) return idMatch[1];
      return null;
    };
    const videoId = extractYouTubeId(lesson.video_url);
    if (!videoId) { console.error('Invalid video URL:', lesson.video_url); return; }
    try {
      const newPlayer = new window.YT.Player('youtube-player', {
        height: '100%', width: '100%', videoId,
        playerVars: { 'playsinline':1,'controls':0,'disablekb':1,'modestbranding':1,'rel':0,'showinfo':0,'fs':0,'cc_load_policy':0 },
        events: {
          'onReady': (event) => setPlayer(event.target),
          'onStateChange': (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            else if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          },
          'onError': (event) => console.error('YouTube player error:', event.data)
        }
      });
    } catch (error) { console.error('Error creating YouTube player:', error); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, youtubeAPIReady]);

  // Auto-pause and timer (unchanged)
  useEffect(() => {
    if (!lesson || !player) return;
    if (currentSegment !== null && currentSegment < lesson.subtitles.length) {
      const nextSeg = lesson.subtitles[currentSegment + 1];
      const endTime = nextSeg ? Number(nextSeg.second) : null;
      if (endTime !== null && currentTime >= endTime && !segmentCompleted) {
        pauseVideo();
        setSegmentCompleted(true);
        setAutoPaused(true);
      }
    }
  }, [currentTime, lesson, currentSegment, segmentCompleted, player]);

  useEffect(() => {
    if (!player || !lesson) return;
    const timer = setInterval(() => {
      if (player && player.getCurrentTime) {
        const time = player.getCurrentTime();
        setCurrentTime(time);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [player, lesson]);

  const handleVideoPlay = () => {
    if (segmentCompleted) { continueToNextSegment(); return; }
    playVideo();
  };
  const handleVideoPause = () => pauseVideo();
  const continueToNextSegment = () => {
    if (!lesson) return;
    if (currentSegment < lesson.subtitles.length - 1) {
      const next = currentSegment + 1;
      const start = Number(lesson.subtitles[next].second);
      setCurrentSegment(next);
      updateWordsForSegment(next);
      setSegmentCompleted(false); setAutoPaused(false);
      seekToTime(start); playVideo();
    }
  };
  const restartCurrentSegment = () => {
    const currentSubtitle = lesson.subtitles[currentSegment];
    const startTime = Number(currentSubtitle.second);
    seekToTime(startTime); setSegmentCompleted(false); setAutoPaused(false); playVideo();
  };
  const seekToTime = (t) => { if (player) player.seekTo(t, true); };
  const playVideo = () => { if (player) player.playVideo(); };
  const pauseVideo = () => { if (player) player.pauseVideo(); };

  // cleanup on unmount: stop stream, destroy recorder, revoke object URL
  useEffect(() => {
    return () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      } catch (e) {}
      try {
        recorderRef.current && recorderRef.current.destroy && recorderRef.current.destroy();
      } catch (e) {}
      if (lastRecording && lastRecording.url) {
        URL.revokeObjectURL(lastRecording.url);
      }
    };
    // intentionally include lastRecording in deps to revoke on change is handled elsewhere
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (segmentRefs.current[currentSegment]) {
      segmentRefs.current[currentSegment].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentSegment]);

  // Progress
  const revealedCount = revealedMap ? revealedMap.reduce((sum, arr) => sum + (arr ? arr.filter(Boolean).length : 0), 0) : 0;
  const typedCount = typedMap ? typedMap.reduce((sum, arr) => sum + (arr ? arr.filter(Boolean).length : 0), 0) : 0;
  const totalRevealedCount = Math.max(revealedCount, typedCount);
  const progress = totalWords > 0 ? Math.round((totalRevealedCount / totalWords) * 100) : 0;

  // === Recording logic using RecordRTC (WAV 16k mono) ===
  const startRecording = async () => {
    try {
      // reset previous API result
      setApiResult(null);

      // If there's an existing object URL for lastRecording, revoke it because we will replace it soon
      if (lastRecording && lastRecording.url) {
        try { URL.revokeObjectURL(lastRecording.url); } catch (e) {}
        setLastRecording(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: RecordRTC.StereoAudioRecorder,
        desiredSampRate: 16000,       // sample rate requested
        numberOfAudioChannels: 1,     // mono
        bufferSize: 16384
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Không thể truy cập micro:", err);
      alert("Không thể truy cập micro. Vui lòng kiểm tra quyền trình duyệt.");
    }
  };

  const stopAndSendRecording = async () => {
    if (!recorderRef.current) return;
    setIsRecording(false);
    setSending(true);
    try {
      await new Promise((resolve) => {
        recorderRef.current.stopRecording(() => {
          resolve();
        });
      });

      const blob = recorderRef.current.getBlob();
      if (!blob) throw new Error("Không lấy được blob ghi âm.");

      // create object URL for playback and store blob+url in state
      const url = URL.createObjectURL(blob);
      // revoke previous if any (already handled in startRecording but keep safe)
      if (lastRecording && lastRecording.url) {
        try { URL.revokeObjectURL(lastRecording.url); } catch(e) {}
      }
      setLastRecording({ blob, url });

      // prepare form and send to server
      const formData = new FormData();
      formData.append("audio", blob, "recording.wav");
      const currentText = lesson?.subtitles?.[currentSegment]?.text || "";
      formData.append("text", currentText);

      try {
        const response = await fetch("http://localhost:5005/score", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setApiResult(data);
        console.log(data);

        const allGood = (data.words || []).every(w => w.label === 1);
        setSegmentSuccess(allGood);
        if (allGood) {
          try { new Audio(successSound).play(); } catch (e) {}
        }
      } catch (err) {
        console.error("Lỗi khi gọi API:", err);
        alert("Lỗi khi gửi audio lên server.");
      }
    } catch (err) {
      console.error("Lỗi stopRecording:", err);
    } finally {
      setSending(false);
      // stop tracks to free mic, but keep lastRecording blob for playback
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      } catch (e) {}

      // destroy the recorder object but DO NOT revoke lastRecording blob/url here
      try { recorderRef.current && recorderRef.current.destroy && recorderRef.current.destroy(); } catch(e){}

      recorderRef.current = null;
      streamRef.current = null;
    }
  };

  const handleRecordButton = async () => {
    if (isRecording) {
      await stopAndSendRecording();
    } else {
      await startRecording();
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // helper to render colored words using apiResult if available
  const renderSegmentText = () => {
    const segmentText = lesson.subtitles[currentSegment].text || "";
    const originalWords = segmentText.split(" ").filter(w => w.length > 0);

    if (apiResult && Array.isArray(apiResult.words) && apiResult.words.length > 0) {
      // API returns words in order — map them
      return apiResult.words.map((w, i) => {
        const color = w.label === 1 ? "#198754" : (w.label === 2 ? "#f59e0b" : "#dc3545"); // green, yellow, red
        return (
          <span key={i} style={{ color, fontWeight: 600, marginRight: 4 }}>
            {w.word}
          </span>
        );
      });
    }

    // fallback: show original text uncolored
    return originalWords.map((w, i) => <span key={i}>{w}{i < originalWords.length - 1 ? ' ' : ''}</span>);
  };

  // playback lastRecording (only plays the latest saved blob)
  const playLastRecording = () => {
    if (lastRecording && lastRecording.url) {
      const a = new Audio(lastRecording.url);
      a.play();
      // optional: revoke after playback ended (if you want to free memory immediately)
      // a.onended = () => { URL.revokeObjectURL(lastRecording.url); setLastRecording(null); };
    } else {
      alert("Chưa có bản ghi");
    }
  };

  return (
    <div className="container" style={{ maxWidth: "1400px", padding: "20px 100px" }}>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">Topics</li>
          <li className="breadcrumb-item">Movie short clip</li>
          <li className="breadcrumb-item active">{lesson ? lesson.title : "Loading..."}</li>
        </ol>
      </nav>

      <div className="row">
        {/* Video Section */}
        <div className="col-lg-8" style={{ maxHeight: 580, overflowY: "auto" }}>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{lesson?.title || "Đang tải..."}</h5>

              {/* Video iframe */}
              <div className="video-container position-relative">
                <div style={{ position: "relative", paddingTop: "50%", backgroundColor: "#000" }}>
                  {lesson && (<div id="youtube-player" style={{ position: "absolute", top:0, left:0, width:"100%", height:"100%", borderRadius:8 }}></div>)}
                </div>
              </div>

              <div className="time-display text-center mt-2 text-muted">
                {lesson ? (
                  <div>
                    <div>Segment {currentSegment + 1} of {lesson.subtitles.length}</div>
                    <div className="small text-primary">{isPlaying ? "▶️ Playing" : "⏸️ Paused"}</div>
                    <div className="small text-info">Current Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}</div>
                    {autoPaused && !segmentCompleted && (
                      <div className="alert alert-info mt-2 py-2">
                        <i className="bi bi-info-circle me-2"></i>Video đã dừng để bạn có thể nhập từ.
                      </div>
                    )}
                  </div>
                ) : "Loading"}
              </div>

              <div className="controls mt-3">
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  <div className="btn-group" role="group">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => {
                      if (currentSegment > 0) {
                        const prevSegment = currentSegment - 1;
                        const newTime = Number(lesson.subtitles[prevSegment].second);
                        seekToTime(newTime);
                        setCurrentSegment(prevSegment);
                        updateWordsForSegment(prevSegment);
                        setSegmentCompleted(false); setAutoPaused(false);
                      }
                    }} disabled={currentSegment === 0}>
                      <i className="bi bi-skip-backward"></i>
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => {
                      if (currentSegment < lesson.subtitles.length - 1) {
                        const nextSegment = currentSegment + 1;
                        const newTime = Number(lesson.subtitles[nextSegment].second);
                        seekToTime(newTime);
                        setCurrentSegment(nextSegment);
                        updateWordsForSegment(nextSegment);
                        setSegmentCompleted(false); setAutoPaused(false);
                      }
                    }} disabled={currentSegment >= lesson.subtitles.length - 1}>
                      <i className="bi bi-skip-forward"></i>
                    </button>
                  </div>

                  {segmentCompleted ? (
                    <div className="d-grid gap-2">
                      <button className="btn btn-outline-primary btn-control w-100" onClick={restartCurrentSegment}>
                        <i className="bi bi-arrow-repeat me-2"></i>Phát lại
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-control" onClick={isPlaying ? handleVideoPause : handleVideoPlay}>
                      <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} me-2`}></i>{isPlaying ? 'Pause' : 'Start'}
                    </button>
                  )}

                  <button className="btn btn-outline-primary btn-control" onClick={() => {
                    seekToTime(0);
                    setCurrentSegment(0);
                    updateWordsForSegment(0);
                    pauseVideo();
                    setSegmentCompleted(false);
                    setAutoPaused(false);
                  }}>
                    <i className="bi bi-arrow-repeat me-2"></i>Bắt đầu lại
                  </button>
                </div>

                {/* Subtitle + Phonetic + Buttons */}
                <div className="segment-display mt-3 text-center">
                  {lesson?.subtitles?.length > 0 && (
                    <>
                        <div style={{ textAlign: "center", width: "100%", position: "relative", overflow: "visible" }}>
                            {/* inline-block để nội dung được căn giữa, và làm container relative cho score */}
                            <div style={{ display: "inline-block", position: "relative" }}>
                                <div className="fw-bold fs-5">
                                {renderSegmentText()}
                                </div>

                                {/* Điểm segment - nửa vòng tròn, đổi màu theo score */}
                                {apiResult && typeof apiResult.overall_score === "number" && (() => {
                                    const score = apiResult.overall_score;
                                    let bgColor = "#e9f5ff";
                                    let borderColor = "#007bff";
                                    let textColor = "#007bff";

                                    if (score < 40) { // dưới 40% => đỏ
                                        bgColor = "#ffe5e5";
                                        borderColor = "#dc3545";
                                        textColor = "#dc3545";
                                    } else if (score >= 40 && score < 80) { // 40%-79% => vàng
                                        bgColor = "#fff8e1";
                                        borderColor = "#ffc107";
                                        textColor = "#856404";
                                    } else if (score >= 80 && score < 100) { // 80%-99% => xanh biển
                                        bgColor = "#e7f3ff";
                                        borderColor = "#0d6efd";
                                        textColor = "#0d6efd";
                                    } else if (score === 100) { // 100% => xanh lá
                                        bgColor = "#e8f5e9";
                                        borderColor = "#28a745";
                                        textColor = "#28a745";
                                    }

                                    return (
                                        <span
                                            style={{
                                                position: "absolute",
                                                left: "100%",
                                                top: "50%",
                                                transform: "translate(8px, -50%)",
                                                width: "50px",
                                                height: "25px",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                borderTopLeftRadius: "50px",
                                                borderTopRightRadius: "50px",
                                                backgroundColor: bgColor,
                                                border: `2px solid ${borderColor}`,
                                                borderBottom: "none",
                                                color: textColor,
                                                fontWeight: "bold",
                                                fontSize: "1.05rem",
                                                zIndex: 20,
                                                whiteSpace: "nowrap"
                                            }}
                                        >
                                            {score}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Hiển thị IPA của từng từ nếu có kết quả API */}
                        {apiResult && Array.isArray(apiResult.words) && (
                        <div className="d-flex justify-content-center align-items-center gap-3 my-3">
                            <div className="d-flex flex-column">
                            {apiResult.words?.map((w, i) => (
                                <div
                                key={i}
                                className="d-flex justify-content-center align-items-center my-1 text-center"
                                style={{ gap: "1rem" }}
                                >
                                <div className="text-muted">
                                    <strong>{w.word}</strong>
                                </div>
                                <div>
                                    <span className="badge bg-light text-dark me-2">
                                    🎯 IPA của bạn {w.predicted_ipa}
                                    </span>
                                    <span className="badge bg-light text-dark">
                                    🎤 IPA của từ {w.target_ipa}
                                    </span>
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                        )}

                        {/* Buttons */}
                        <div className="d-flex justify-content-center gap-2 mt-3">
                        <button className="btn btn-outline-secondary btn-sm" onClick={playLastRecording} disabled={!lastRecording}>
                            <i className="bi bi-play-circle me-2"></i>Phát lại ghi âm
                        </button>

                        <button className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} btn-sm`} onClick={handleRecordButton} disabled={sending}>
                            <i className={`bi ${isRecording ? 'bi-stop-fill' : 'bi-mic-fill'} me-2`}></i>
                            {sending ? 'Đang gửi...' : (isRecording ? 'Dừng & Gửi' : 'Ghi âm')}
                        </button>
                        </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Section */}
        <div className="col-lg-4">
          <div className="sidebar p-3 bg-light rounded">
            <h5>Bản chép</h5>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">Tiến độ: {progress}%</span>
              <div className="btn-group">
                <button className="btn btn-sm btn-outline-secondary"><i className="bi bi-eye-slash"></i></button>
                <button className="btn btn-sm btn-outline-secondary"><i className="bi bi-keyboard"></i></button>
              </div>
            </div>

            <div className="progress-container mb-3" style={{ height: 8, background: "#e9ecef", borderRadius: 4 }}>
              <div className="progress-bar bg-primary" style={{ width: `${progress}%`, height: "100%" }}></div>
            </div>

            <div className="transcript-list" style={{ maxHeight: 450, overflowY: "auto" }}>
              {lesson && lesson.subtitles.map((s, index) => (
                <div key={s.id ?? index} ref={(el) => (segmentRefs.current[index] = el)}
                     className="transcript-item mb-3 p-3 rounded"
                     style={{
                       backgroundColor: index === currentSegment ? "#e3f2fd" : "#fff",
                       boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
                       borderLeft: `4px solid ${index === currentSegment ? "#1976d2" : "#0d6efd"}`,
                       cursor: "pointer"
                     }}
                     onClick={() => {
                       setCurrentSegment(index);
                       updateWordsForSegment(index);
                       setSegmentCompleted(false); setAutoPaused(false);
                       const newTime = Number(s.second);
                       seekToTime(newTime);
                     }}>
                  <div className="transcript-header d-flex justify-content-between mb-2 text-muted">
                    <span>#{s.index} {index === currentSegment && "👈 Current"}</span>
                    <i className="bi bi-pencil"></i>
                  </div>
                  <div className="transcript-text">
                    {(s.text || '').split(' ').filter(w => w.length > 0).map((w, wi, arr) => (
                      <span key={wi}>{w}{wi < arr.length - 1 ? ' ' : ''}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
