import React, { useState } from "react";
import { Container, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function TopicPage() {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const allTopics = [
    { icon: "🌍", text: "Travel" },
    { icon: "💼", text: "Business" },
    { icon: "🏠", text: "Daily Life" },
    { icon: "🎬", text: "Entertainment" },
    { icon: "💻", text: "Technology" },
    { icon: "🏫", text: "Education" },
    { icon: "💬", text: "Communication" },
    { icon: "❤️", text: "Relationships" },
    { icon: "🍽️", text: "Food & Cooking" },
    { icon: "⚽", text: "Sports" },
    { icon: "🎵", text: "Music" },
    { icon: "📚", text: "Reading" },
    { icon: "🌿", text: "Health & Wellness" },
    { icon: "🎨", text: "Art & Culture" },
    { icon: "🧠", text: "Science" },
    { icon: "🏙️", text: "Lifestyle" },
    { icon: "🧳", text: "Adventure" },
    { icon: "🐾", text: "Animals" },
    { icon: "🌦️", text: "Nature" },
    { icon: "💰", text: "Finance" },
  ];

  const topics = showMore ? allTopics : allTopics.slice(0, 8);

  const handleSelect = (text) => {
    setSelectedTopics((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    );
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-white text-center"
    >
      <div className="container text-center py-5" style={{ maxWidth: "600px", position: "relative" }}>
        {/* Icon quay lại góc trên màn hình */}
        <button
          onClick={() => navigate("/welcome/goal")}
          className="btn btn-light border position-fixed"
          style={{
            top: "20px",
            left: "20px",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          <i className="bi bi-arrow-left fs-4 text-primary"></i>
        </button>

        {/* Thanh tiến trình */}
        <div className="progress mb-5" style={{ height: "8px"}}>
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{ width: "60%" }}
          ></div>
        </div>

        {/* Tiêu đề */}
        <h3 className="fw-semibold mb-2">
          What topics are you interested in?
        </h3>
        <p className="text-secondary mb-4">
          Choose the topics you want to focus on.
        </p>

        {/* Danh sách lựa chọn */}
        <Row xs={1} md={2} className="g-3 mb-4">
          {topics.map((t) => (
            <Col key={t.text}>
              <div
                onClick={() => handleSelect(t.text)}
                className={`topic-card border rounded-4 p-3 d-flex flex-column align-items-center justify-content-center h-100 ${
                  selectedTopics.includes(t.text)
                    ? "border-primary bg-light shadow-sm"
                    : ""
                }`}
                style={{
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    transform: selectedTopics.includes(t.text)
                      ? "scale(1.1)"
                      : "scale(1)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  {t.icon}
                </div>
                <div className="fw-semibold mt-2">{t.text}</div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Nút Show more / Show less */}
        <button
          className="btn-show-more"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? " ▲ " : "Show more ▼"}
        </button>

        {/* Nút Continue */}
        <div className="mt-4">
          <Button
            variant="primary"
            className="px-5 py-2 rounded-pill fw-semibold"
            size="lg"
            disabled={selectedTopics.length === 0}
            onClick={() => navigate("/welcome/proficiency")}
          >
            Continue
          </Button>
        </div>
      </div>

      {/* CSS nội tuyến */}
      <style>
        {`
          .topic-card:hover {
            transform: translateY(-5px);
            background-color: #f9fafb;
            box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
          }

          .btn-show-more {
            background: none;
            border: none;
            color: #0d6efd;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-show-more:hover {
            text-decoration: underline;
            transform: translateY(-2px);
          }
        `}
      </style>
    </Container>
  );
}
