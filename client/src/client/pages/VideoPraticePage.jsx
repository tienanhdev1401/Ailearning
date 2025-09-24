import React, { useState, useEffect, useRef, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from '../../api/api';

import successSound from "../sounds/success.mp3";


export default function VideoPraticePage() {
  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [revealedMap, setRevealedMap] = useState([]); // array of arrays per segment
  const [typedMap, setTypedMap] = useState([]); // NEW: track words revealed by typing
  const [totalWords, setTotalWords] = useState(0);
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

  const [segmentSuccess, setSegmentSuccess] = useState(false);// kiểm tra segment thành công


  // Convert time string to seconds (for database SRT format)
  const timeToSeconds = (timeStr) => {
    const [time, ms] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  };

  // Normalize words for comparison: lowercase, trim punctuation except internal apostrophes
  const normalizeWord = (w) => {
    if (!w && w !== '') {
      return '';
    }
    // Normalize various apostrophe-like unicode characters to ASCII apostrophe
    const asString = (w || '').toString().trim();
    const unified = asString.replace(/[''`´‛]/g, "'");
    // Keep internal apostrophes (don't -> don't), strip other leading/trailing punctuation
    return unified.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
  };

  // NOTE: previously we had a helper to parse SRT-style times. Server now
  // returns a numeric `second` per segment so front-end seeks directly using
  // `Number(s.second)` and no longer needs SRT parsing here.

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
    if (!lesson || segmentIndex >= lesson.subtitles.length) {
      return;
    }

  const currentSubtitle = lesson.subtitles[segmentIndex];
  const segmentWords = (currentSubtitle.text || '')
        .split(" ")
        .filter((w) => w.length >= 1);
    setWords(segmentWords);

    // ensure revealedMap has an entry for this segment
    setRevealedMap((prev) => {
      const copy = prev ? [...prev] : [];
      if (!copy[segmentIndex]) {
        copy[segmentIndex] = Array(segmentWords.length).fill(false);
      } else if (copy[segmentIndex].length !== segmentWords.length) {
        // adjust length if transcript changed
        const existing = copy[segmentIndex];
        copy[segmentIndex] = existing.concat(Array(Math.max(0, segmentWords.length - existing.length)).fill(false)).slice(0, segmentWords.length);
      }
      return copy;
    });

    // ensure typedMap has an entry for this segment
    setTypedMap((prev) => {
      const copy = prev ? [...prev] : [];
      if (!copy[segmentIndex]) {
        copy[segmentIndex] = Array(segmentWords.length).fill(false);
      } else if (copy[segmentIndex].length !== segmentWords.length) {
        // adjust length if transcript changed
        const existing = copy[segmentIndex];
        copy[segmentIndex] = existing.concat(Array(Math.max(0, segmentWords.length - existing.length)).fill(false)).slice(0, segmentWords.length);
      }
      return copy;
    });

    setInputText("");
    setSegmentSuccess(false);
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
      setYoutubeAPIReady(true);
    };

    return () => {
      if (window.onYouTubeIframeAPIReady) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, []);

  // Fetch lesson data from database (now includes transcript/subtitles)
  useEffect(() => {
    async function fetchLessonData() {
      try {
        setLoading(true);

        // Fetch lesson with subtitles from database
        const lessonRes = await api.get('/lessons/1');
        const lessonData = lessonRes.data.lesson;

        // Convert database subtitles to the format expected by current UI
        // Database has: { id, start_time, end_time, full_text }
        // UI expects: { index, second, text }
        const subtitles = (lessonData.subtitles || []).map((sub, index) => ({
          index: index + 1,
          second: timeToSeconds(sub.start_time), // Convert SRT time to seconds
          text: sub.full_text
        }));

        setLesson({
          id: lessonData.id,
          title: lessonData.title,
          video_url: lessonData.video_url,
          thumbnail_url: lessonData.thumbnail_url,
          subtitles: subtitles
        });

        // compute total words from subtitles text
        const total = subtitles.reduce((sum, s) => sum + (s.text ? s.text.split(' ').filter(w => w.length>0).length : 0), 0);
        setTotalWords(total);
        // initialize revealedMap based on text words
        setRevealedMap(subtitles.map(s => Array((s.text || '').split(' ').filter(w => w.length>0).length).fill(false)));
        // initialize typedMap
        setTypedMap(subtitles.map(s => Array((s.text || '').split(' ').filter(w => w.length>0).length).fill(false)));
      } catch (err) {
        console.error('Lỗi fetch lesson:', err);
        // keep loading false and show error in console; UI already handles empty data
      } finally {
        setLoading(false);
      }
    }
    fetchLessonData();
  }, []);

  useEffect(() => {
  if (lesson && lesson.subtitles.length > 0) {
    updateWordsForSegment(0);
  }
}, [lesson, updateWordsForSegment]);

  useEffect(() => {
    if (!lesson || !lesson.video_url || !youtubeAPIReady) {
      return;
    }

    // Destroy existing player
    if (player) {
      player.destroy();
    }

    // Extract video ID from common YouTube URL formats
    const extractYouTubeId = (url) => {
      if (!url) {
        return null;
      }
      // embed URL
      const embedMatch = url.match(/embed\/([A-Za-z0-9_-]{11})/);
      if (embedMatch) {
        return embedMatch[1];
      }
      // watch?v= URL
      const watchMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
      if (watchMatch) {
        return watchMatch[1];
      }
      // youtu.be short URL
      const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
      if (shortMatch) {
        return shortMatch[1];
      }
      // plain id
      const idMatch = url.match(/^([A-Za-z0-9_-]{11})$/);
      if (idMatch) {
        return idMatch[1];
      }
      return null;
    };

    const videoId = extractYouTubeId(lesson.video_url);
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
            setPlayer(event.target);
          },
          'onStateChange': (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
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
    if (!lesson || !player) {
      return;
    }

    if (currentSegment !== null && currentSegment < lesson.subtitles.length) {
      // upstream provides `second` per segment; use next segment's second as boundary if present
      const nextSeg = lesson.subtitles[currentSegment + 1];
      const endTime = nextSeg ? Number(nextSeg.second) : null;

      if (endTime !== null && currentTime >= endTime && !segmentCompleted) {
        pauseVideo();
        setSegmentCompleted(true);
        setAutoPaused(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, lesson, currentSegment, segmentCompleted, player]);

  // Timer to track video time
  useEffect(() => {
    if (!player || !lesson) {
      return;
    }

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
      // If segment is completed, move to next segment
      continueToNextSegment();
      return;
    }
    // Otherwise, play the video
    playVideo();
  };

  const handleVideoPause = () => {
    pauseVideo();
  };

  const continueToNextSegment = () => {
    if (!lesson) {
      return;
    }
    if (currentSegment < lesson.subtitles.length - 1) {
      const next = currentSegment + 1;
      const start = Number(lesson.subtitles[next].second);
      setCurrentSegment(next);
      updateWordsForSegment(next);
      setSegmentCompleted(false);
      setAutoPaused(false);
      // Seek to the start of the next segment to keep playback aligned
      seekToTime(start);
      playVideo();
    }
  };
  const restartCurrentSegment = () => {
    const currentSubtitle = lesson.subtitles[currentSegment];
    const startTime = Number(currentSubtitle.second);
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
    // Reveal a single word for the current segment by clicking. This is one-way: once
    // revealed by clicking the eye, it stays revealed (per your request).
    setRevealedMap(prev => {
      const copy = prev ? prev.map(arr => [...arr]) : [];
      if (!copy[currentSegment]) {
        copy[currentSegment] = Array(words.length).fill(false);
      }
      if (!copy[currentSegment][index]) {
        copy[currentSegment][index] = true;
      }
      
      // Check if all words are now revealed after this click (both typed and clicked)
      const typedArr = (typedMap && typedMap[currentSegment]) ? typedMap[currentSegment] : Array(words.length).fill(false);
      const allWordsRevealed = copy[currentSegment].length > 0 && 
        copy[currentSegment].every((clicked, i) => clicked || typedArr[i]);
      
      if (allWordsRevealed && !segmentSuccess) {
        // Fill input with the complete sentence
        const full = (lesson?.subtitles?.[currentSegment]?.text) || '';
        setInputText(full);
        
        // Mark segment as completed and successful
        setSegmentSuccess(true);
        setSegmentCompleted(true);
        
        // Play success sound
        try {
          const audio = new Audio(successSound);
          audio.volume = 1;
          audio.play().catch((err) => console.warn("Audio play blocked:", err));
        } catch (err) {
          console.warn("Audio error:", err);
        }
      }
      
      return copy;
    });
  };

  const revealAllCurrentSegment = () => {
    // Reveal the entire current segment, fill the input with the correct
    // sentence, mark segment completed, play success sound, and show congratulations
    setRevealedMap(prev => {
      const copy = prev ? prev.map(arr => [...arr]) : [];
      copy[currentSegment] = Array(words.length).fill(true);
      return copy;
    });
    
    // fill input with whole sentence
    const full = (lesson?.subtitles?.[currentSegment]?.text) || '';
    setInputText(full);
    
    // mark segment completed and successful
    setSegmentCompleted(true);
    setSegmentSuccess(true);
    
    // play success sound like when typing correctly
    try {
      const audio = new Audio(successSound);
      audio.volume = 1;
      audio.play().catch((err) => console.warn("Audio play blocked:", err));
    } catch (err) {
      console.warn("Audio error:", err);
    }
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
    const raw = e.target.value;
    setInputText(raw);
    const tokens = raw.trim().toLowerCase().split(/\s+/).filter(Boolean).map(t => normalizeWord(t));

    // NEW LOGIC: Only consider typing order, ignore clicked reveals for typing validation
    setTypedMap(prev => {
      const copy = prev ? prev.map(arr => [...arr]) : [];
      if (!copy[currentSegment]) {
        copy[currentSegment] = Array(words.length).fill(false);
      }
      
      const typedArray = Array(words.length).fill(false);
      
      // Match tokens against words in strict order - must type all words sequentially
      for (let i = 0; i < Math.min(tokens.length, words.length); i++) {
        const wordNorm = normalizeWord(words[i] || '');
        if (tokens[i] === wordNorm) {
          typedArray[i] = true;
        } else {
          // If current token doesn't match current word position, stop
          break;
        }
      }
      
      copy[currentSegment] = typedArray;

      // Check if all words are completed (either typed or clicked)
      const clickRevealed = (revealedMap && revealedMap[currentSegment]) ? revealedMap[currentSegment] : Array(words.length).fill(false);
      const allWordsRevealed = words.length > 0 && 
        words.every((_, i) => typedArray[i] || clickRevealed[i]);
      
      if (allWordsRevealed && !segmentSuccess) {
        setSegmentSuccess(true);
        setSegmentCompleted(true);
        try {
          const audio = new Audio(successSound);
          audio.volume = 1;
          audio.play().catch((err) => console.warn("Audio play blocked:", err));
        } catch (err) {
          console.warn("Audio error:", err);
        }
      }
      
      return copy;
    });
  };

  // Keep local `revealed` in sync as the union of clicked reveals and typed reveals
  useEffect(() => {
    const clickRevealed = (revealedMap && revealedMap[currentSegment]) ? revealedMap[currentSegment] : Array(words.length).fill(false);
    const typedRevealed = (typedMap && typedMap[currentSegment]) ? typedMap[currentSegment] : Array(words.length).fill(false);
    const combined = clickRevealed.map((clicked, i) => clicked || typedRevealed[i]);
    setRevealed(combined);
  }, [revealedMap, typedMap, currentSegment, words.length]);

  // Overall progress based on total words revealed across all segments
  const revealedCount = revealedMap ? revealedMap.reduce((sum, arr) => sum + (arr ? arr.filter(Boolean).length : 0), 0) : 0;
  const typedCount = typedMap ? typedMap.reduce((sum, arr) => sum + (arr ? arr.filter(Boolean).length : 0), 0) : 0;
  const totalRevealedCount = Math.max(revealedCount, typedCount); // avoid double counting
  const progress = totalWords > 0 ? Math.round((totalRevealedCount / totalWords) * 100) : 0;

  // Compute partial prefix lengths for the current segment based on what the
  // user has typed. This lets us show "ok**" when the user types "ok" for
  // the target word "okay" without fully revealing the word until it's
  // completed or the user clicks to reveal.
  const partialPrefixLengths = (() => {
    try {
      if (!lesson || !lesson.subtitles || !lesson.subtitles[currentSegment]) {
        return [];
      }
      const curWords = (lesson.subtitles[currentSegment].text || '').split(' ').filter(w => w.length > 0);
      const tokens = inputText.trim().toLowerCase().split(/\s+/).filter(Boolean).map(t => normalizeWord(t));

      const prefixLens = Array(curWords.length).fill(0);
      
      // Match tokens against words in strict sequential order
      for (let i = 0; i < curWords.length && i < tokens.length; i++) {
        const wordNorm = normalizeWord(curWords[i] || '');
        const token = tokens[i] || '';

        if (token === wordNorm) {
          // Word is completely typed, no partial prefix needed
        } else if (token.length > 0 && wordNorm.startsWith(token)) {
          prefixLens[i] = token.length;
          break; // Stop at partial match
        } else {
          break;
        }
      }
      return prefixLens;
    } catch (err) {
      return [];
    }
  })();


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
                    {/* time hidden by request */}
                    <div className="small text-primary">
                      {isPlaying ? "▶️ Playing" : "⏸️ Paused"}
                    </div>
                    <div className="small text-info">
                      Current Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
                    </div>
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
                          const newTime = Number(lesson.subtitles[prevSegment].second);
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
                          const newTime = Number(lesson.subtitles[nextSegment].second);
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
                  {segmentCompleted ? (
                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-outline-primary btn-control w-100"
                        onClick={restartCurrentSegment}
                      >
                        <i className="bi bi-arrow-repeat me-2"></i>
                        Phát lại
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary btn-control"
                      onClick={isPlaying ? handleVideoPause : handleVideoPlay}
                    >
                      <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} me-2`}></i>
                      {isPlaying ? 'Pause' : 'Start'}
                    </button>
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
              </div>

              <div className="masked-words-container d-flex flex-wrap gap-3 mb-3">
                {words.map((word, index) => {
                  const prefixLen = partialPrefixLengths[index] || 0;
                  const revealedThis = revealed[index];
                  const display = revealedThis ? word : (prefixLen > 0 ? word.slice(0, prefixLen) + '*'.repeat(Math.max(0, word.length - prefixLen)) : '*'.repeat(word.length));
                  return (
                    <div
                      key={`${currentSegment}-${index}`}
                      className="word-item d-flex flex-column align-items-center"
                    >
                      <div
                        className="eye-icon d-flex align-items-center justify-content-center"
                        style={{
                          cursor: revealed[index] ? 'default' : 'pointer',
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          backgroundColor: revealed[index] ? "#d4edda" : "#f1f3f5", // Green background when revealed
                        }}
                        onClick={() => {
                          if (!revealed[index]) {
                            toggleWord(index);
                          }
                        }}
                      >
                        {revealed[index] ? (
                          // Show green checkmark when revealed
                          <i className="bi bi-check-circle-fill text-success"></i>
                        ) : (
                          <i className={`bi bi-eye`}></i>
                        )}
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
                  <i className="bi bi-info-circle"></i> Các từ được tiết lộ sẽ bị
                  tính là lỗi và ảnh hưởng đến điểm số của bạn.
                </p>
              )}

                <div className="action-buttons d-flex gap-2 mt-3">
                  {!segmentSuccess && (
                    <button
                      className="btn btn-action btn-reveal btn-danger"
                      onClick={revealAllCurrentSegment}
                    >
                      <i className="bi bi-eye-fill me-2"></i>Hiện tất cả từ
                    </button>
                  )}
                  <button
                    className="btn btn-action btn-next btn-primary ms-auto"
                    onClick={() => {
                      // behave like the small skip-forward control: go to next segment and seek
                      if (!lesson) {
                        return;
                      }
                      if (currentSegment < lesson.subtitles.length - 1) {
                        const nextSegment = currentSegment + 1;
                        const newTime = Number(lesson.subtitles[nextSegment].second);
                        seekToTime(newTime);
                        setCurrentSegment(nextSegment);
                        updateWordsForSegment(nextSegment);
                        setSegmentCompleted(false);
                        setAutoPaused(false);
                      }
                    }}
                    disabled={!lesson || currentSegment >= (lesson?.subtitles?.length || 0) - 1}
                  >
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
            key={s.id ?? index}
                        ref={(el) => (segmentRefs.current[index] = el)}
                        className="transcript-item mb-3 p-3 rounded"
                        style={{
                            backgroundColor: index === currentSegment ? "#e3f2fd" : "#fff",
                            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
                            borderLeft: `4px solid ${index === currentSegment ? "#1976d2" : "#0d6efd"}`,
                            cursor: "pointer",
                        }}
            onClick={() => {
              setCurrentSegment(index);
              updateWordsForSegment(index);
              setSegmentCompleted(false);
              setAutoPaused(false);
              const newTime = Number(s.second);
              seekToTime(newTime);
            }}
                        >
                        <div className="transcript-header d-flex justify-content-between mb-2 text-muted">
              <span>#{s.index} {index === currentSegment && "👈 Current"}</span>
                            <i className="bi bi-pencil"></i>
                        </div>
            <div className="transcript-text">
              {(s.text || '').split(' ').filter(w => w.length > 0).map((w, wi, arr) => {
                const clickRevealed = (revealedMap && revealedMap[index]) ? revealedMap[index] : Array(arr.length).fill(false);
                const typedRevealed = (typedMap && typedMap[index]) ? typedMap[index] : Array(arr.length).fill(false);
                const isRevealed = clickRevealed[wi] || typedRevealed[wi];
                // Only apply partial prefix for current segment
                const prefixLen = (index === currentSegment) ? (partialPrefixLengths[wi] || 0) : 0;
                const shown = isRevealed ? w : (prefixLen > 0 ? w.slice(0, prefixLen) + '*'.repeat(Math.max(0, w.length - prefixLen)) : '*'.repeat(w.length));
                return (
                  <span key={wi}>
                    {shown}{wi < arr.length - 1 ? ' ' : ''}
                  </span>
                );
              })}
            </div>
            {/* time hidden by request */}
                        </div>
                    ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}