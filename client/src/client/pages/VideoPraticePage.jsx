import React, { useState, useEffect, useRef ,useCallback} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from '../../api/api';

export default function VideoPraticePage() {
  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [allRevealed, setAllRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
//   const [videoStartTime, setVideoStartTime] = useState(null);
  const [intervalId] = useState(null);
  const [player, setPlayer] = useState(null);
  const [segmentCompleted, setSegmentCompleted] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [youtubeAPIReady, setYoutubeAPIReady] = useState(false); // Thêm state này

  const segmentRefs = useRef([]);

  const [inputText, setInputText] = useState("");

  // Convert time string to seconds
  const timeToSeconds = (timeStr) => {
    const [time, ms] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  };

//   const getCurrentSegment = (time) => {
//     if (!lesson) return null;

//     for (let i = 0; i < lesson.subtitles.length; i++) {
//       const subtitle = lesson.subtitles[i];
//       const startTime = timeToSeconds(subtitle.start_time);
//       const endTime = timeToSeconds(subtitle.end_time);

//       if (time >= startTime && time <= endTime) {
//         return i;
//       }
//     }

//     for (let i = 0; i < lesson.subtitles.length; i++) {
//       const startTime = timeToSeconds(lesson.subtitles[i].start_time);
//       if (time < startTime) {
//         return i;
//       }
//     }

//     return null;
//   };

  // Update words based on current segment
  const updateWordsForSegment = useCallback((segmentIndex) => {
    if (!lesson || segmentIndex >= lesson.subtitles.length) return;

    const currentSubtitle = lesson.subtitles[segmentIndex];
    const segmentWords = currentSubtitle.full_text
        .split(" ")
        .filter((w) => w.length >= 1);

    console.log(segmentWords);
    setWords(segmentWords);
    setRevealed(Array(segmentWords.length).fill(false));
    setAllRevealed(false);
    }, [lesson]);

  // Load YouTube API - Cải thiện loading logic
  useEffect(() => {
    // Kiểm tra nếu API đã được tải
    if (window.YT && window.YT.Player) {
      setYoutubeAPIReady(true);
      return;
    }

    // Kiểm tra nếu script đã được thêm
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      // Script đã tồn tại, chờ API ready
      const checkAPI = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setYoutubeAPIReady(true);
          clearInterval(checkAPI);
        }
      }, 100);
      return () => clearInterval(checkAPI);
    }

    // Thêm script mới
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Set up callback
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API Ready');
      setYoutubeAPIReady(true);
    };

    return () => {
      if (window.onYouTubeIframeAPIReady) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, []);

  // Fetch lesson data
  useEffect(() => {
    async function fetchLesson() {
      try {
        setLoading(true);
        const res = await api.get("/lessons/16");
        setLesson(res.data.lesson);
      } catch (err) {
        console.error("Lỗi fetch lesson:", err);
        throw new Error("Không thể tải bài học: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, []);

  useEffect(() => {
  if (lesson && lesson.subtitles.length > 0) {
    updateWordsForSegment(0);
  }
}, [lesson, updateWordsForSegment]);

  // Initialize YouTube player - Chỉ khi cả lesson và API đều sẵn sàng
  useEffect(() => {
    if (!lesson || !lesson.video_url || !youtubeAPIReady) {
      console.log('Waiting for:', { 
        lesson: !!lesson, 
        video_url: !!lesson?.video_url, 
        youtubeAPIReady 
      });
      return;
    }

    // Destroy existing player
    if (player) {
      player.destroy();
    }

    // Extract video ID
    const videoId = lesson.video_url.split('embed/')[1]?.split('?')[0];
    if (!videoId) {
      console.error('Invalid video URL:', lesson.video_url);
      return;
    }

    try {
        // eslint-disable-next-line no-unused-vars
        const newPlayer = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          'playsinline': 1,
          'controls': 0,
          'disablekb': 1,
          'modestbranding': 1,
          'rel': 0,
          'showinfo': 0,
          'fs': 0,
          'cc_load_policy': 0
        },
        events: {
          'onReady': (event) => {
            console.log('Player ready');
            setPlayer(event.target);
          },
          'onStateChange': (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            else if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          },
          'onError': (event) => {
            console.error('YouTube player error:', event.data);
          }
        }
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, youtubeAPIReady]); // Thêm youtubeAPIReady vào dependency

  // Auto-pause at segment end
  useEffect(() => {
    if (!lesson || !player) return;

    if (currentSegment !== null && currentSegment < lesson.subtitles.length) {
      const currentSubtitle = lesson.subtitles[currentSegment];
      const endTime = timeToSeconds(currentSubtitle.end_time);

      if (currentTime >= endTime && !segmentCompleted) {
        pauseVideo();
        setSegmentCompleted(true);
        setAutoPaused(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, lesson, currentSegment, segmentCompleted, player]);

  // Timer to track video time
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

  // Video control functions
  const handleVideoPlay = () => {
    if (segmentCompleted) {
      continueToNextSegment();
      setTimeout(() => {
        playVideo();
      }, 100);
    } else {
      playVideo();
    }
    setAutoPaused(false);
  };

  const handleVideoPause = () => {
    pauseVideo();
  };

  const continueToNextSegment = () => {
    if (!lesson) return;
    if (currentSegment < lesson.subtitles.length - 1) {
      const nextSegment = currentSegment + 1;
      
      const startTime = timeToSeconds(lesson.subtitles[nextSegment].start_time);
      seekToTime(startTime);
      
      setTimeout(() => {
        setCurrentSegment(nextSegment);
        updateWordsForSegment(nextSegment);
        setSegmentCompleted(false);
        setAutoPaused(false);
      }, 100);
    }
  };

  const restartCurrentSegment = () => {
    const currentSubtitle = lesson.subtitles[currentSegment];
    const startTime = timeToSeconds(currentSubtitle.start_time);
    seekToTime(startTime);
    setSegmentCompleted(false);
    setAutoPaused(false);
    playVideo();
  };

  const seekToTime = (timeInSeconds) => {
    if (player) {
      player.seekTo(timeInSeconds, true);
    }
  };

  const playVideo = () => {
    if (player) {
      player.playVideo();
    }
  };

  const pauseVideo = () => {
    if (player) {
      player.pauseVideo();
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const toggleWord = (index) => {
    setRevealed((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const toggleAllWords = () => {
    const newState = !allRevealed;
    setAllRevealed(newState);
    setRevealed(Array(words.length).fill(newState));
  };

  useEffect(() => {
    if (segmentRefs.current[currentSegment]) {
        segmentRefs.current[currentSegment].scrollIntoView({
        behavior: "smooth",
        block: "nearest", // scroll sao cho segment hiện tại vừa vặn trong view
        });
    }
    }, [currentSegment]);

    const handleInputChange = (e) => {
        const text = e.target.value.trim().toLowerCase();
        setInputText(e.target.value);

        setRevealed((prev) => {
            const newRevealed = [...prev];

            // Lặp qua các từ theo thứ tự
            for (let i = 0; i < words.length; i++) {
            if (!newRevealed[i]) {
                // Nếu từ tiếp theo chưa reveal và người dùng gõ đúng
                if (text.endsWith(words[i].toLowerCase())) {
                newRevealed[i] = true;
                }
                // Chỉ kiểm tra từ đầu tiên chưa reveal
                break;
            }
            }

            return newRevealed;
        });
        };

  const progress = lesson
    ? Math.round(
        (revealed.filter(r => r).length / words.length) * 100
      )
    : 0;

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div
          className="spinner-border text-primary"
          style={{ width: "4rem", height: "4rem" }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "1400px", padding: "20px" }}>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">Topics</li>
          <li className="breadcrumb-item">Movie short clip</li>
          <li className="breadcrumb-item active">
            {lesson ? lesson.title : "Loading..."}
          </li>
        </ol>
      </nav>

      <div className="row">
        {/* Video Section */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{lesson?.title || "Đang tải..."}</h5>

              {/* Video iframe */}
              <div className="video-container position-relative">
                <div
                  style={{
                    position: "relative",
                    paddingTop: "56.25%",
                    backgroundColor: "#000",
                  }}
                >
                  {lesson && (
                    <div id="youtube-player" style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      borderRadius: 8,
                    }}></div>
                  )}
                </div>
              </div>

              <div className="time-display text-center mt-2 text-muted">
                {lesson ? (
                  <div>
                    <div>Segment {currentSegment + 1} of {lesson.subtitles.length}</div>
                    <div className="small">
                      {lesson.subtitles[currentSegment]?.start_time} - {lesson.subtitles[currentSegment]?.end_time}
                    </div>
                    <div className="small text-primary">
                      {isPlaying ? "▶️ Playing" : "⏸️ Paused"}
                    </div>
                    <div className="small text-info">
                      Current Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
                    </div>
                    {segmentCompleted && (
                      <div className="alert alert-warning mt-2 py-2">
                        <i className="bi bi-pause-circle me-2"></i>
                        Segment hoàn thành! Hãy nhập từ bị ẩn trước khi tiếp tục.
                      </div>
                    )}
                    {autoPaused && !segmentCompleted && (
                      <div className="alert alert-info mt-2 py-2">
                        <i className="bi bi-info-circle me-2"></i>
                        Video đã dừng để bạn có thể nhập từ.
                      </div>
                    )}
                  </div>
                ) : "Loading"}
              </div>

              <div className="controls mt-3">
                <div className="d-grid gap-2">
                  <div className="btn-group" role="group">
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        if (currentSegment > 0) {
                          const prevSegment = currentSegment - 1;
                          const newTime = timeToSeconds(lesson.subtitles[prevSegment].start_time);
                          seekToTime(newTime);
                          setCurrentSegment(prevSegment);
                          updateWordsForSegment(prevSegment);
                          setSegmentCompleted(false);
                          setAutoPaused(false);
                        }
                      }}
                      disabled={currentSegment === 0}
                    >
                      <i className="bi bi-skip-backward"></i>
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        if (currentSegment < lesson.subtitles.length - 1) {
                          const nextSegment = currentSegment + 1;
                          const newTime = timeToSeconds(lesson.subtitles[nextSegment].start_time);
                          seekToTime(newTime);
                          setCurrentSegment(nextSegment);
                          updateWordsForSegment(nextSegment);
                          setSegmentCompleted(false);
                          setAutoPaused(false);
                        }
                      }}
                      disabled={currentSegment >= lesson.subtitles.length - 1}
                    >
                      <i className="bi bi-skip-forward"></i>
                    </button>
                  </div>
                  {!segmentCompleted ? (
                    <button 
                      className="btn btn-primary btn-control"
                      onClick={isPlaying ? handleVideoPause : handleVideoPlay}
                    >
                      <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} me-2`}></i>
                      {isPlaying ? 'Pause' : 'Start'}
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-success btn-control"
                        onClick={continueToNextSegment}
                        disabled={currentSegment >= lesson.subtitles.length - 1}
                      >
                        <i className="bi bi-arrow-right me-2"></i>
                        Tiếp theo
                      </button>
                      <button 
                        className="btn btn-warning btn-control"
                        onClick={restartCurrentSegment}
                      >
                        <i className="bi bi-arrow-repeat me-2"></i>
                        Phát lại
                      </button>
                    </div>
                  )}
                  <button 
                    className="btn btn-outline-primary btn-control"
                    onClick={() => {
                      seekToTime(0);
                      setCurrentSegment(0);
                      updateWordsForSegment(0);
                      pauseVideo();
                      setSegmentCompleted(false);
                      setAutoPaused(false);
                    }}
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>Bắt đầu lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transcription Section */}
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Chép chính tả</h5>
              <p className="text-muted">Gõ những gì bạn nghe được:</p>
              <textarea
                className="form-control transcription-area"
                placeholder="Gõ câu trả lời của bạn ở đây..."
                style={{
                    minHeight: 150,
                    borderRadius: 8,
                    padding: 15,
                    resize: "vertical",
                }}
                value={inputText}
                onChange={(e) => handleInputChange(e)}
                ></textarea>

              <div className="masked-words-header d-flex justify-content-between align-items-center mt-3 mb-2 pb-2 border-bottom">
                <h6 className="mb-0">Các từ bị ẩn</h6>
                <div
                  className="eye-icon d-flex align-items-center justify-content-center"
                  style={{
                    cursor: "pointer",
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    backgroundColor: "#f1f3f5",
                  }}
                  onClick={toggleAllWords}
                >
                  <i
                    className={`bi ${allRevealed ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </div>
              </div>

              <div className="masked-words-container d-flex flex-wrap gap-3 mb-3">
                {words.map((word, index) => (
                  <div
                    key={index}
                    className="word-item d-flex flex-column align-items-center"
                  >
                    <div
                      className="eye-icon d-flex align-items-center justify-content-center"
                      style={{
                        cursor: "pointer",
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        backgroundColor: "#f1f3f5",
                      }}
                      onClick={() => toggleWord(index)}
                    >
                      <i
                        className={`bi ${
                          revealed[index] ? "bi-eye-slash" : "bi-eye"
                        }`}
                      ></i>
                    </div>
                    <div
                      className={`word-chip mt-1 ${
                        revealed[index] ? "revealed" : ""
                      }`}
                      style={{
                        padding: "8px 15px",
                        backgroundColor: revealed[index] ? "#d1e7ff" : "#fff",
                        border: "1px solid #dee2e6",
                        borderRadius: 20,
                        minWidth: 80,
                        textAlign: "center",
                      }}
                    >
                      {revealed[index] ? word : "*".repeat(word.length)}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-muted small">
                <i className="bi bi-info-circle"></i> Các từ được tiết lộ sẽ bị
                tính là lỗi và ảnh hưởng đến điểm số của bạn.
              </p>

              <div className="action-buttons d-flex gap-2 mt-3">
                <button
                  className="btn btn-action btn-reveal btn-danger"
                  onClick={toggleAllWords}
                >
                  <i className="bi bi-eye-fill me-2"></i>Hiện tất cả từ
                </button>
                <button className="btn btn-action btn-next btn-primary ms-auto">
                  Tiếp theo <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Section */}
        <div className="col-lg-3">
          <div className="sidebar p-3 bg-light rounded">
            <h5>Bản chép</h5>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">Tiến độ: {progress}%</span>
              <div className="btn-group">
                <button className="btn btn-sm btn-outline-secondary">
                  <i className="bi bi-eye-slash"></i>
                </button>
                <button className="btn btn-sm btn-outline-secondary">
                  <i className="bi bi-keyboard"></i>
                </button>
              </div>
            </div>

            <div
              className="progress-container mb-3"
              style={{
                height: 8,
                background: "#e9ecef",
                borderRadius: 4,
              }}
            >
              <div
                className="progress-bar bg-primary"
                style={{ width: `${progress}%`, height: "100%" }}
              ></div>
            </div>

            <div className="transcript-list" style={{ maxHeight: 450, overflowY: "auto" }}>
                {lesson &&
                    lesson.subtitles.map((s, index) => (
                        <div
                        key={s.id}
                        ref={(el) => (segmentRefs.current[index] = el)}
                        className="transcript-item mb-3 p-3 rounded"
                        style={{
                            backgroundColor: index === currentSegment ? "#e3f2fd" : "#fff",
                            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
                            borderLeft: `4px solid ${index === currentSegment ? "#1976d2" : "#0d6efd"}`,
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            const newTime = timeToSeconds(s.start_time);
                            seekToTime(newTime);
                            setCurrentSegment(index);
                            updateWordsForSegment(index);
                            setSegmentCompleted(false);
                            setAutoPaused(false);
                        }}
                        >
                        <div className="transcript-header d-flex justify-content-between mb-2 text-muted">
                            <span>#{s.id} {index === currentSegment && "👈 Current"}</span>
                            <i className="bi bi-pencil"></i>
                        </div>
                        <div className="transcript-text">{s.full_text}</div>
                        <div className="small text-muted mt-1">
                            {s.start_time} - {s.end_time}
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
