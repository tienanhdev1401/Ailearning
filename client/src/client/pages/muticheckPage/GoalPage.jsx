import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const GoalPage = () => {
  const [selected, setSelected] = useState(() => {
    const storedGoal = sessionStorage.getItem("goal");
    return storedGoal ? JSON.parse(storedGoal) : null;
  });
  const navigate = useNavigate();

  const goals = [
    { time: "5 minutes / day", label: "Casual" },
    { time: "10 minutes / day", label: "Regular" },
    { time: "15 minutes / day", label: "Serious" },
    { time: "25 minutes / day", label: "Intense" },
  ];

  const handleSelect = (goal) => {
    setSelected(goal);
  };

  const handleCommit = () => {
    if (selected) {
      navigate("/welcome/topic");
    }
  };

  // 🔥 Lưu giá trị thực của goal (object) vào sessionStorage
  useEffect(() => {
    if (selected) {
      sessionStorage.setItem("goal", JSON.stringify(selected));
    }
  }, [selected]);

  return (
    <div className="min-vh-100 bg-white text-dark" data-bs-theme="light">
      <div
        className="container text-center py-5"
        style={{ maxWidth: "600px", position: "relative" }}
      >
      {/* Nút quay lại */}
      <button
        onClick={() => navigate("/welcome/reason")}
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
      <div className="progress mb-5" style={{ height: "8px" }}>
        <div
          className="progress-bar bg-success"
          role="progressbar"
          style={{ width: "40%" }}
        ></div>
      </div>

      <h3 className="fw-bold mb-2">Set a daily study goal</h3>
      <p className="text-muted mb-4">
        Create a learning habit to improve your English.
      </p>

      <div className="mb-4">
        <img
          src="https://img.pikbest.com/png-images/qiantu/dart-target-icon-design_2688549.png!sw800"
          alt="Target icon"
          style={{ width: "6rem", height: "auto" }}
        />
      </div>

      {/* Danh sách lựa chọn */}
      <div className="d-flex flex-column gap-3">
        {goals.map((goal, index) => (
          <button
            key={index}
            className={`btn d-flex justify-content-between align-items-center border rounded-4 py-3 px-4 ${
              selected?.label === goal.label
                ? "border-primary bg-light shadow-sm"
                : ""
            }`}
            onClick={() => handleSelect(goal)}
          >
            <span className="fw-semibold">{goal.time}</span>
            <span className="text-muted">{goal.label}</span>
          </button>
        ))}
      </div>

        <div className="mt-5">
          <button
            className="btn btn-primary px-4 py-2 rounded-pill fw-semibold"
            disabled={!selected}
            onClick={handleCommit}
          >
            Commit to daily goal
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalPage;
