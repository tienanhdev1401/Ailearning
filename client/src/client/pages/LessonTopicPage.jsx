import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const LessonTopiCPage = () => {
  const [activeTab, setActiveTab] = useState('topics');

  const topics = [
    'Movie short clip',
    'Daily English Conversation',
    'Learning resources',
    'Listening Time (Shadowing)',
    'IELTS Listening',
    'US UK songs',
    'TOEIC Listening',
    'Entertainment',
    'BBC learning english',
    'VOA Learning English',
    'Toefl Listening',
    'Science and Facts',
    'Fairy Tales',
    'IPA',
    'News',
    'Vietnam Today',
    'TED',
    'Travel vlog',
    'Animals and wildlife',
    'Business English'
  ];

  const movieClips = [
    {
      id: 1,
      title: "YOUR NAME English Trailer (2016) Anime Movie",
      thumbnail: "https://img.youtube.com/vi/a2GujJZfXpg/mqdefault.jpg",
      duration: "01:47",
      views: "9,228",
      level: "B1",
      source: "Youtube",
      isPro: false
    },
    {
      id: 2,
      title: "KIKI'S DELIVERY SERVICE | Official English Trailer",
      thumbnail: "https://img.youtube.com/vi/4bG17OYs-GA/mqdefault.jpg",
      duration: "00:50",
      views: "21,588",
      level: "B1",
      source: "Youtube",
      isPro: false
    },
    {
      id: 3,
      title: "TOM & JERRY - Official Trailer",
      thumbnail: "https://img.youtube.com/vi/kP9TfCWaQT4/mqdefault.jpg",
      duration: "02:25",
      views: "8,854",
      level: "B2",
      source: "Youtube",
      isPro: true
    },
    {
      id: 4,
      title: "Michael - Official Teaser Trailer (2026) Jaafar...",
      thumbnail: "https://img.youtube.com/vi/K3hqSsqSBEY/mqdefault.jpg",
      duration: "01:13",
      views: "5,891",
      level: "B1",
      source: "Youtube",
      isPro: false
    }
  ];

  // 👉 NEW DAILY ENGLISH CONVERSATION LESSONS
  const dailyConversations = [
    {
      id: 1,
      title: "English Conversation Practice - Shopping",
      thumbnail: "https://img.youtube.com/vi/1j8Z0eEUVxM/mqdefault.jpg",
      duration: "03:45",
      views: "12,528",
      level: "A2",
      source: "Youtube",
      isPro: false
    },
    {
      id: 2,
      title: "Daily English Conversation - At the Restaurant",
      thumbnail: "https://img.youtube.com/vi/ATZlt3-N_A4/mqdefault.jpg",
      duration: "04:33",
      views: "18,901",
      level: "A2",
      source: "Youtube",
      isPro: false
    },
    {
      id: 3,
      title: "Daily Conversation - Talking About Weather",
      thumbnail: "https://img.youtube.com/vi/qJLBQ0uopBQ/mqdefault.jpg",
      duration: "02:18",
      views: "7,442",
      level: "A1",
      source: "Youtube",
      isPro: false
    },
    {
      id: 4,
      title: "English Speaking Practice - Asking for Directions",
      thumbnail: "https://img.youtube.com/vi/84XM5fPOAxw/mqdefault.jpg",
      duration: "05:12",
      views: "11,339",
      level: "A2",
      source: "Youtube",
      isPro: true
    }
  ];

  return (
    <div className="bg-light min-vh-100 px-4 py-4">
      {/* Main Content */}
      <div className="container py-4" style={{ maxWidth: "1350px" }}>
        
        {/* TOPICS */}
        <div className="mb-5">
          <h2 className="mb-4">Tất cả chủ đề</h2>
          <div className="d-flex flex-wrap gap-2">
            {topics.map((topic, index) => (
              <button
                key={index}
                className="btn btn-outline-secondary rounded-pill px-4 py-2"
                style={{fontSize: '14px'}}
              >
                # {topic}
              </button>
            ))}
          </div>
        </div>

        {/* MOVIE SHORT CLIPS */}
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">
              Movie short clip <span className="text-muted fs-6">(125 bài học)</span>
            </h3>
            <a href="#" className="text-decoration-none">Xem tất cả →</a>
          </div>

          <div className="row g-3">
            {movieClips.map((clip) => (
              <div key={clip.id} className="col-12 col-md-6 col-lg-3">
                <div className={`card h-100 shadow-sm position-relative ${clip.isPro ? 'border-warning' : ''}`}>
                  
                  {clip.isPro && (
                    <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2 z-index-1">
                      👑 PRO
                    </span>
                  )}

                  <div className="position-relative">
                    <img
                      src={clip.thumbnail}
                      className="card-img-top"
                      alt={clip.title}
                      style={{height: '180px', objectFit: 'cover'}}
                    />

                    <span className="badge bg-primary position-absolute top-0 end-0 m-2">
                      {clip.level}
                    </span>

                    <div className="position-absolute bottom-0 start-0 m-2 d-flex gap-2">
                      <span className="badge bg-danger">Youtube</span>
                      <span className="badge bg-dark">{clip.duration}</span>
                    </div>

                    <span className="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">
                      🎧 {clip.views}
                    </span>
                  </div>

                  <div className="card-body">
                    <h6 className="card-title mb-3" style={{fontSize: '14px'}}>{clip.title}</h6>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DAILY ENGLISH CONVERSATION */}
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">
              Daily English Conversation <span className="text-muted fs-6">(145 bài học)</span>
            </h3>
            <a href="#" className="text-decoration-none">Xem tất cả →</a>
          </div>

          <div className="row g-3">
            {dailyConversations.map((lesson) => (
              <div key={lesson.id} className="col-12 col-md-6 col-lg-3">
                <div className={`card h-100 shadow-sm position-relative ${lesson.isPro ? 'border-warning' : ''}`}>
                  
                  {lesson.isPro && (
                    <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2">
                      👑 PRO
                    </span>
                  )}

                  <div className="position-relative">
                    <img
                      src={lesson.thumbnail}
                      className="card-img-top"
                      alt={lesson.title}
                      style={{height: '180px', objectFit: 'cover'}}
                    />

                    <span className="badge bg-primary position-absolute top-0 end-0 m-2">
                      {lesson.level}
                    </span>

                    <div className="position-absolute bottom-0 start-0 m-2 d-flex gap-2">
                      <span className="badge bg-danger">{lesson.source}</span>
                      <span className="badge bg-dark">{lesson.duration}</span>
                    </div>

                    <span className="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">
                      🎧 {lesson.views}
                    </span>
                  </div>

                  <div className="card-body">
                    <h6 className="card-title mb-3" style={{fontSize: '14px'}}>
                      {lesson.title}
                    </h6>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style jsx>{`
        .btn-gradient-primary {
          background: linear-gradient(135deg, #00d4ff 0%, #0099ff 50%, #9966ff 100%);
          border: none;
        }
        .btn-gradient-primary:hover {
          opacity: 0.9;
        }
        .z-index-1 { z-index: 1; }
      `}</style>
    </div>
  );
};

export default LessonTopiCPage;
