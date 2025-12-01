import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const FindLevelPage = () => {
  const navigate = useNavigate();

  const handleFindLevel = () => {
    navigate("/welcome/placement/test");
  };

  return (
    <div className="min-vh-100 bg-white text-dark" data-bs-theme="light">
      <div
        className="container text-center py-5"
        style={{ maxWidth: "700px", position: "relative" }}
      >
      {/* Nút quay lại góc trên bên trái */}
      <button
        onClick={() => navigate("/welcome/proficiency")}
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

      {/* Icon trung tâm bằng hình ảnh */}
      <div className="mb-4">
        <div
          className="mx-auto d-flex align-items-center justify-content-center"
          style={{ width: "120px", height: "120px", marginTop: "60px" }}
        >
          <img
            src="https://play-lh.googleusercontent.com/UcrL77TkeiK9Orb6hAA1pmDDag-hwPEEzG2S-FQR54M6TjbJ1ZA796fzzinwDzSYyw=s248-rw"
            alt="Find Level Icon"
            style={{ width: "120px", height: "120px", objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Tiêu đề chính */}
      <h2 className="fw-bold mb-3">
        Let's find the right place to start your language-learning journey
      </h2>

      {/* Mô tả phụ */}
      <p className="text-muted mb-4 fs-5">
        The questions should take 5 minutes or less.
      </p>

      <div className="text-center mt-5">
        <button
          className="btn btn-primary py-3 rounded-4 fw-bold fs-5"
          style={{ width: "200px" }} // chiều rộng tùy chỉnh
          onClick={handleFindLevel}
        >
          Find my level
        </button>
      </div>
      </div>
    </div>
  );
};

export default FindLevelPage;
