import React, { useState, useEffect, useRef, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from '../../api/api';
import successSound from "../sounds/success.mp3";

export default function VideoPraticePage() {
  // Core state
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Video state
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [youtubeAPIReady, setYoutubeAPIReady] = useState(false);
  
  // Segment state
  const [currentSegment, setCurrentSegment] = useState(0);
  const [segmentCompleted, setSegmentCompleted] = useState(false);
  const [segmentSuccess, setSegmentSuccess] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  
  // Word tracking
  const [words, setWords] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [revealedMap, setRevealedMap] = useState([]);
  const [typedMap, setTypedMap] = useState([]);
  const [inputText, setInputText] = useState("");
  
  const segmentRefs = useRef([]);

  // Utility functions
  const timeToSeconds = (timeStr) => {
    const [time, ms] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  };

  const normalizeWord = (w) => {
    if (!w && w !== '') return '';
    const asString = (w || '').toString().trim();
    const unified = asString.replace(/[''`´‛]/g, "'");
    return unified.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
  };

  const playSuccessSound = () => {
    try {
      const audio = new Audio(successSound);
      audio.volume = 1;
      audio.play().catch(err => console.warn("Audio play blocked:", err));
    } catch (err) {
      console.warn("Audio error:", err);
    }
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const patterns = [
      /embed\/([A-Za-z0-9_-]{11})/,
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /^([A-Za-z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Update words for current segment
  const updateWordsForSegment = useCallback((segmentIndex) => {
    if (!lesson || segmentIndex >= lesson.subtitles.length) return;

    const currentSubtitle = lesson.subtitles[segmentIndex];
    const segmentWords = (currentSubtitle.text || '').split(" ").filter(w => w.length >= 1);
    setWords(segmentWords);

    // Initialize maps for this segment
    setRevealedMap(prev => {
      const copy = [...(prev || [])];
      if (!copy[segmentIndex] || copy[segmentIndex].length !== segmentWords.length) {
        copy[segmentIndex] = Array(segmentWords.length).fill(false);
      }
      setRevealed(copy[segmentIndex]);
      return copy;
    });

    setTypedMap(prev => {
      const copy = [...(prev || [])];
      if (!copy[segmentIndex] || copy[segmentIndex].length !== segmentWords.length) {
        copy[segmentIndex] = Array(segmentWords.length).fill(false);
      }
      return copy;
    });

    setInputText("");
    setSegmentSuccess(false);
  }, [lesson]);

  // Load YouTube API
  useEffect(() => {
    if (window.YT?.Player) {
      setYoutubeAPIReady(true);
      return;
    }

    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const checkAPI = setInterval(() => {
        if (window.YT?.Player) {
          setYoutubeAPIReady(true);
          clearInterval(checkAPI);
        }
      }, 100);
      return () => clearInterval(checkAPI);
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);

    window.onYouTubeIframeAPIReady = () => setYoutubeAPIReady(true);
    return () => delete window.onYouTubeIframeAPIReady;
  }, []);

  // Fetch lesson data
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
          subtitles: subtitles
        });

        // Initialize maps
        setRevealedMap(subtitles.map(s => 
          Array((s.text || '').split(' ').filter(w => w.length > 0).length).fill(false)
        ));
        setTypedMap(subtitles.map(s => 
          Array((s.text || '').split(' ').filter(w => w.length > 0).length).fill(false)
        ));
      } catch (err) {
        console.error('Lỗi fetch lesson:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLessonData();
  }, []);

  // Initialize first segment
  useEffect(() => {
    if (lesson?.subtitles?.length > 0) {
      updateWordsForSegment(0);
    }
  }, [lesson, updateWordsForSegment]);

  // Initialize YouTube player
  useEffect(() => {
    if (!lesson?.video_url || !youtubeAPIReady) return;

    if (player) player.destroy();

    const videoId = extractYouTubeId(lesson.video_url);
    if (!videoId) {
      console.error('Invalid video URL:', lesson.video_url);
      return;
    }

    try {
      new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          cc_load_policy: 0
        },
        events: {
          onReady: (event) => setPlayer(event.target),
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
          onError: (event) => console.error('YouTube player error:', event.data)
        }
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
    }
  }, [lesson, youtubeAPIReady, player]);

  // Auto-pause at segment end
  useEffect(() => {
    if (!lesson || !player || currentSegment >= lesson.subtitles.length) return;

    const nextSeg = lesson.subtitles[currentSegment + 1];
    const endTime = nextSeg ? Number(nextSeg.second) : null;

    if (endTime && currentTime >= endTime && !segmentCompleted) {
      player.pauseVideo();
      setSegmentCompleted(true);
      setAutoPaused(true);
    }
  }, [currentTime, lesson, currentSegment, segmentCompleted, player]);

  // Video time tracking
  useEffect(() => {
    if (!player || !lesson) return;

    const timer = setInterval(() => {
      if (player?.getCurrentTime) {
        setCurrentTime(player.getCurrentTime());
      }
    }, 100);

    return () => clearInterval(timer);
  }, [player, lesson]);

  // Auto-scroll to current segment
  useEffect(() => {
    segmentRefs.current[currentSegment]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [currentSegment]);

  // Video control functions
  const seekToSegment = (segmentIndex) => {
    if (!lesson || segmentIndex < 0 || segmentIndex >= lesson.subtitles.length) return;
    
    const startTime = Number(lesson.subtitles[segmentIndex].second);
    player?.seekTo(startTime, true);
    setCurrentSegment(segmentIndex);
    updateWordsForSegment(segmentIndex);
    setSegmentCompleted(false);
    setAutoPaused(false);
  };

  const handleVideoPlay = () => {
    if (segmentCompleted && currentSegment < lesson.subtitles.length - 1) {
      seekToSegment(currentSegment + 1);
    }
    player?.playVideo();
  };

  const restartCurrentSegment = () => {
    seekToSegment(currentSegment);
    player?.playVideo();
  };

  // Word reveal functions
  const toggleWord = (index) => {
    if (revealed[index]) return;

    setRevealedMap(prev => {
      const copy = prev.map(arr => [...arr]);
      copy[currentSegment][index] = true;
      setRevealed(copy[currentSegment]);
      
      // Check if all words revealed
      const typedArr = typedMap[currentSegment] || Array(words.length).fill(false);
      const allRevealed = copy[currentSegment].every((clicked, i) => clicked || typedArr[i]);
      
      if (allRevealed && !segmentSuccess) {
        setInputText(lesson?.subtitles?.[currentSegment]?.text || '');
        setSegmentSuccess(true);
        setSegmentCompleted(true);
        playSuccessSound();
      }
      
      return copy;
    });
  };

  const revealAllCurrentSegment = () => {
    setRevealedMap(prev => {
      const copy = prev.map(arr => [...arr]);
      copy[currentSegment] = Array(words.length).fill(true);
      setRevealed(copy[currentSegment]);
      return copy;
    });
    
    setInputText(lesson?.subtitles?.[currentSegment]?.text || '');
    setSegmentCompleted(true);
    setSegmentSuccess(true);
    playSuccessSound();
  };

  // Input handling
  const handleInputChange = (e) => {
    const raw = e.target.value;
    setInputText(raw);
    
    const tokens = raw.trim().toLowerCase().split(/\s+/).filter(Boolean).map(normalizeWord);

    setTypedMap(prev => {
      const copy = prev.map(arr => [...arr]);
      const typedArray = Array(words.length).fill(false);
      
      // Match tokens sequentially
      for (let i = 0; i < Math.min(tokens.length, words.length); i++) {
        const wordNorm = normalizeWord(words[i] || '');
        if (tokens[i] === wordNorm) {
          typedArray[i] = true;
        } else {
          break;
        }
      }
      
      copy[currentSegment] = typedArray;
      
      // Update revealed state
      const clickRevealed = revealedMap[currentSegment] || Array(words.length).fill(false);
      const combined = clickRevealed.map((clicked, i) => clicked || typedArray[i]);
      setRevealed(combined);
      
      // Check completion
      const allRevealed = words.length > 0 && words.every((_, i) => typedArray[i] || clickRevealed[i]);
      if (allRevealed && !segmentSuccess) {
        setSegmentSuccess(true);
        setSegmentCompleted(true);
        playSuccessSound();
      }
      
      return copy;
    });
  };

  // Calculate partial prefix lengths for typing hints
  const partialPrefixLengths = (() => {
    if (!lesson?.subtitles?.[currentSegment]) return [];
    
    const curWords = (lesson.subtitles[currentSegment].text || '').split(' ').filter(w => w.length > 0);
    const tokens = inputText.trim().toLowerCase().split(/\s+/).filter(Boolean).map(normalizeWord);
    const prefixLens = Array(curWords.length).fill(0);
    
    for (let i = 0; i < curWords.length && i < tokens.length; i++) {
      const wordNorm = normalizeWord(curWords[i] || '');
      const token = tokens[i] || '';

      if (token === wordNorm) {
        continue;
      } else if (token.length > 0 && wordNorm.startsWith(token)) {
        prefixLens[i] = token.length;
        break;
      } else {
        break;
      }
    }
    return prefixLens;
  })();

  // Calculate progress
  const totalWords = lesson ? lesson.subtitles.reduce((sum, s) => 
    sum + (s.text ? s.text.split(' ').filter(w => w.length > 0).length : 0), 0
  ) : 0;
  
  const revealedCount = revealedMap.reduce((sum, arr) => 
    sum + (arr ? arr.filter(Boolean).length : 0), 0
  );
  const typedCount = typedMap.reduce((sum, arr) => 
    sum + (arr ? arr.filter(Boolean).length : 0), 0
  );
  const progress = totalWords > 0 ? Math.round((Math.max(revealedCount, typedCount) / totalWords) * 100) : 0;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }}>
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
          <li className="breadcrumb-item active">{lesson?.title || "Loading..."}</li>
        </ol>
      </nav>

      <div className="row">
        {/* Video Section */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{lesson?.title || "Đang tải..."}</h5>

              {/* Video Player */}
              <div className="video-container position-relative">
                <div style={{ position: "relative", paddingTop: "56.25%", backgroundColor: "#000" }}>
                  {lesson && (
                    <div id="youtube-player" style={{
                      position: "absolute", top: 0, left: 0,
                      width: "100%", height: "100%", borderRadius: 8
                    }}></div>
                  )}
                </div>
              </div>

              {/* Video Info */}
              <div className="time-display text-center mt-2 text-muted">
                {lesson && (
                  <div>
                    <div>Segment {currentSegment + 1} of {lesson.subtitles.length}</div>
                    <div className="small text-primary">
                      {isPlaying ? "▶️ Playing" : "⏸️ Paused"}
                    </div>
                    <div className="small text-info">
                      Current Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="controls mt-3">
                <div className="d-grid gap-2">
                  <div className="btn-group">
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => seekToSegment(currentSegment - 1)}
                      disabled={currentSegment === 0}
                    >
                      <i className="bi bi-skip-backward"></i>
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => seekToSegment(currentSegment + 1)}
                      disabled={!lesson || currentSegment >= lesson.subtitles.length - 1}
                    >
                      <i className="bi bi-skip-forward"></i>
                    </button>
                  </div>
                  
                  {segmentCompleted ? (
                    <button className="btn btn-outline-primary" onClick={restartCurrentSegment}>
                      <i className="bi bi-arrow-repeat me-2"></i>Phát lại
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={isPlaying ? () => player?.pauseVideo() : handleVideoPlay}
                    >
                      <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} me-2`}></i>
                      {isPlaying ? 'Pause' : 'Start'}
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => {
                      player?.seekTo(0, true);
                      seekToSegment(0);
                      player?.pauseVideo();
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
                className="form-control"
                placeholder="Gõ câu trả lời của bạn ở đây..."
                style={{ minHeight: 150, borderRadius: 8, padding: 15, resize: "vertical" }}
                value={inputText}
                onChange={handleInputChange}
              />

              <div className="d-flex justify-content-between align-items-center mt-3 mb-2 pb-2 border-bottom">
                <h6 className="mb-0">Các từ bị ẩn</h6>
              </div>

              {/* Masked Words */}
              <div className="d-flex flex-wrap gap-3 mb-3">
                {words.map((word, index) => {
                  const prefixLen = partialPrefixLengths[index] || 0;
                  const isRevealed = revealed[index];
                  const display = isRevealed ? word : 
                    (prefixLen > 0 ? word.slice(0, prefixLen) + '*'.repeat(Math.max(0, word.length - prefixLen)) : 
                     '*'.repeat(word.length));

                  return (
                    <div key={`${currentSegment}-${index}`} className="d-flex flex-column align-items-center">
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          cursor: isRevealed ? 'default' : 'pointer',
                          width: 30, height: 30, borderRadius: "50%",
                          backgroundColor: isRevealed ? "#d4edda" : "#f1f3f5"
                        }}
                        onClick={() => toggleWord(index)}
                      >
                        {isRevealed ? 
                          <i className="bi bi-check-circle-fill text-success"></i> :
                          <i className="bi bi-eye"></i>
                        }
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          padding: "8px 15px",
                          backgroundColor: isRevealed ? "#d1e7ff" : "#fff",
                          border: "1px solid #dee2e6",
                          borderRadius: 20,
                          minWidth: 80,
                          textAlign: "center"
                        }}
                      >
                        {display}
                      </div>
                    </div>
                  );
                })}
              </div>

              {segmentSuccess ? (
                <div className="alert alert-success text-center mb-3">
                  🎉 Bạn đã nhập chính xác toàn bộ từ trong segment này!
                </div>
              ) : (
                <p className="text-muted small">
                  <i className="bi bi-info-circle"></i> Các từ được tiết lộ sẽ bị tính là lỗi và ảnh hưởng đến điểm số của bạn.
                </p>
              )}

              <div className="d-flex gap-2 mt-3">
                {!segmentSuccess && (
                  <button className="btn btn-danger" onClick={revealAllCurrentSegment}>
                    <i className="bi bi-eye-fill me-2"></i>Hiện tất cả từ
                  </button>
                )}
                <button
                  className="btn btn-primary ms-auto"
                  onClick={() => seekToSegment(currentSegment + 1)}
                  disabled={!lesson || currentSegment >= (lesson?.subtitles?.length || 0) - 1}
                >
                  Tiếp theo <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Sidebar */}
        <div className="col-lg-3">
          <div className="sidebar p-3 bg-light rounded">
            <h5>Bản chép</h5>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">Tiến độ: {progress}%</span>
            </div>

            <div className="mb-3" style={{ height: 8, background: "#e9ecef", borderRadius: 4 }}>
              <div
                className="bg-primary"
                style={{ width: `${progress}%`, height: "100%" }}
              />
            </div>

            <div style={{ maxHeight: 450, overflowY: "auto" }}>
              {lesson?.subtitles.map((s, index) => (
                <div
                  key={s.id ?? index}
                  ref={(el) => (segmentRefs.current[index] = el)}
                  className="mb-3 p-3 rounded"
                  style={{
                    backgroundColor: index === currentSegment ? "#e3f2fd" : "#fff",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
                    borderLeft: `4px solid ${index === currentSegment ? "#1976d2" : "#0d6efd"}`,
                    cursor: "pointer"
                  }}
                  onClick={() => seekToSegment(index)}
                >
                  <div className="d-flex justify-content-between mb-2 text-muted">
                    <span>#{s.index} {index === currentSegment && "👈 Current"}</span>
                    <i className="bi bi-pencil"></i>
                  </div>
                  <div>
                    {(s.text || '').split(' ').filter(w => w.length > 0).map((w, wi, arr) => {
                      const clickRevealed = revealedMap[index] || Array(arr.length).fill(false);
                      const typedRevealed = typedMap[index] || Array(arr.length).fill(false);
                      const isRevealed = clickRevealed[wi] || typedRevealed[wi];
                      const prefixLen = (index === currentSegment) ? (partialPrefixLengths[wi] || 0) : 0;
                      const shown = isRevealed ? w : 
                        (prefixLen > 0 ? w.slice(0, prefixLen) + '*'.repeat(Math.max(0, w.length - prefixLen)) : 
                         '*'.repeat(w.length));
                      
                      return (
                        <span key={wi}>
                          {shown}{wi < arr.length - 1 ? ' ' : ''}
                        </span>
                      );
                    })}
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