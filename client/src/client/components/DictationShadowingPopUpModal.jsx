import React from "react";
import { useNavigate } from "react-router-dom";

const DictationShadowingPopUpModal = ({ lesson, onClose }) => {
  const navigate = useNavigate();

  if (!lesson) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}
    >
      <div
        className="bg-body text-body p-4 rounded shadow-lg position-relative"
        style={{ width: "430px", height: "350px" }}
      >
        {/* ICON CLOSE (X) */}
        <button
          onClick={onClose}
          className="position-absolute top-0 end-0 m-3 btn-close"
          style={{
            cursor: "pointer",
          }}
        >
        </button>

        <h2
          className="text-center fw-bold mb-2"
          style={{ fontSize: "26px" }}   // tăng từ mặc định → 26px
        >
          Chọn chế độ học
        </h2>

        <p
          className="text-center text-muted mb-4"
          style={{ fontSize: "18px" }}   // tăng từ 14–16px → 18px
        >
          Chọn chế độ học phù hợp với bạn nhất
        </p>


        <div className="d-flex justify-content-between gap-3">
          {/* MODE: DICTATION */}
          <div
            className="border rounded p-3 text-center flex-fill shadow-sm bg-body-secondary bg-opacity-50"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/video/${lesson.id}`)}
          >
            <img
              src="/assets/gif/penguin.gif"
              alt="Dictation"
              style={{ width: "145px", height: "145px" }}
            />
            <div className="mt-2 fw-semibold">Nghe – Viết chính tả</div>
          </div>

          {/* MODE: SHADOWING */}
          <div
            className="border rounded p-3 text-center flex-fill shadow-sm bg-body-secondary bg-opacity-50"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/speak/${lesson.id}`)}
          >
            <img
              src="/assets/gif/penguin2.gif"
              alt="Shadowing"
              style={{ width: "145px", height: "145px" }}
            />
            <div className="mt-2 fw-semibold">Bắt chước phát âm</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DictationShadowingPopUpModal;
