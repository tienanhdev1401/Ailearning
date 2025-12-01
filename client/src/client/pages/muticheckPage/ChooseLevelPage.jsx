import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const ChooseLevelPage = () => {
  const levels = [
    { icon: "🪴", label: "Beginner A1" },
    { icon: "🌿", label: "Elementary A2" },
    { icon: "🌱", label: "Intermediate B1" },
    { icon: "🌳", label: "Upper Intermediate B2" },
    { icon: "🌸", label: "Advanced C1" },
    { icon: "🌟", label: "Proficient C2" }
  ];

  // Lấy lại giá trị level từ sessionStorage nếu có
  const [selected, setSelected] = useState(() => {
    const saved = sessionStorage.getItem("level");
    if (saved) {
      return levels.findIndex((l) => l.label === saved);
    }
    return null;
  });

  const navigate = useNavigate();

  // Khi chọn level, lưu tên (label) vào sessionStorage
  const handleSelect = (index) => {
    setSelected(index);
    sessionStorage.setItem("level", levels[index].label);
  };

  // Gửi dữ liệu khi nhấn Finish
  const handleFinish = async () => {
    const reason = sessionStorage.getItem("reason");
    const goal = sessionStorage.getItem("goal");
    const proficiency = sessionStorage.getItem("proficiency");
    const level = sessionStorage.getItem("level");

    const confirmData = {
      reason,
      goal,
      proficiency,
      level
    };

    try {
      const response = await api.post("/confirm/", confirmData);
      console.log("Gửi dữ liệu thành công:", response.data);
      alert("Cảm ơn bạn đã dành thời gian xác thực!");
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu:", error);
    }

    // Xóa sessionStorage và quay về trang chủ
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-vh-100 bg-white text-dark" data-bs-theme="light">
      <div
        className="container text-center py-5"
        style={{
          maxWidth: "700px",
          position: "relative"
        }}
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
          zIndex: 1000
        }}
      >
        <i className="bi bi-arrow-left fs-4 text-primary"></i>
      </button>

      {/* Thanh tiến trình */}
      <div className="progress mb-5" style={{ height: "8px" }}>
        <div
          className="progress-bar bg-success"
          role="progressbar"
          style={{ width: "100%" }}
        ></div>
      </div>

      {/* Tiêu đề */}
      <h3 className="fw-bold mb-2">Choose your level</h3>
      <p className="text-muted mb-4">
        We’ll match you to the right lessons
      </p>

      {/* Danh sách lựa chọn */}
      <div className="d-flex flex-column gap-3">
        {levels.map((level, index) => (
          <button
            key={index}
            className={`btn d-flex align-items-center border rounded-4 py-3 px-4 justify-content-start gap-3 ${
              selected === index ? "border-primary bg-light shadow-sm" : ""
            }`}
            onClick={() => handleSelect(index)}
          >
            <span style={{ fontSize: "1.8rem" }}>{level.icon}</span>
            <span className="fw-semibold fs-5">{level.label}</span>
          </button>
        ))}
      </div>

        {/* Nút Finish */}
        <div className="mt-5">
          <button
            className="btn btn-primary px-5 py-2 rounded-pill fw-semibold"
            disabled={selected === null}
            onClick={handleFinish}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseLevelPage;


