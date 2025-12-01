import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const KnowLevelPage = () => {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const options = [
    { 
      icon: "https://media.istockphoto.com/id/952586008/vi/vec-to/b%C3%A0n-tay-hi%E1%BB%83n-th%E1%BB%8B-bi%E1%BB%83u-t%C6%B0%E1%BB%A3ng-like-l%C3%A0m-c%E1%BB%AD-ch%E1%BB%89-gi%C6%A1-ng%C3%B3n-tay-c%C3%A1i-l%C3%AAn.jpg?s=612x612&w=0&k=20&c=rl8M0gFtsIibQN-OmT5QMhMAm0MCAlqRjUsS1y7Mdvg=",
      label: "I Know My Level",
      description: "Select it now"
    },
    { 
      icon: "https://media.istockphoto.com/id/1234998829/vi/vec-to/bi%E1%BB%83u-t%C6%B0%E1%BB%A3ng-bi%E1%BB%83u-t%C6%B0%E1%BB%A3ng-k%C3%ADnh-l%C3%BAp-t%C3%ACm-ki%E1%BA%BFm.jpg?s=612x612&w=0&k=20&c=vSEydjLw6JTPpHMzP4HKPn01G4rSgp_zBAufrI628MY=",
      label: "I need help to know level",
      description: "Answer a few questions to find your level"
    }
  ];

  const handleSelect = (index) => {
    setSelected(index);
  };

  const handleContinue = () => {
    if (selected === 0) {
      navigate("/welcome/level");
    } else if (selected === 1) {
      navigate("/welcome/placement");
    }
  };


  return (
    <div className="min-vh-100 bg-white text-dark" data-bs-theme="light">
      <div
        className="container text-center py-5"
        style={{ maxWidth: "700px", position: "relative" }}
      >
      {/* Nút quay lại góc trên bên trái */}
      <button
        onClick={() => navigate("/welcome/topic")}
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
          style={{ width: "80%" }}
        ></div>
      </div>

      {/* Tiêu đề */}
      <h3 className="fw-bold mb-2">Do you already know your level?</h3>
      <p className="text-muted mb-4">
        We'll match you to the right lessons
      </p>

      {/* Danh sách lựa chọn */}
      <div className="d-flex flex-column gap-3 mb-4">
        {options.map((option, index) => (
          <button
            key={index}
            className={`btn d-flex align-items-start border rounded-4 py-3 px-4 ${
              selected === index ? "border-primary bg-light shadow-sm" : ""
            }`}
            onClick={() => handleSelect(index)}
          >
            {/* Icon */}
            <div className="flex-shrink-0 me-3">
              <img 
                src={option.icon} 
                alt={option.label} 
                style={{ 
                  width: "60px", 
                  height: "60px", 
                  objectFit: "cover",
                  borderRadius: "8px"
                }} 
              />
            </div>
            
            {/* Text content - cùng thụt lề */}
            <div className="flex-grow-1 text-start">
              <div className="fw-semibold fs-5 mb-1">
                {option.label}
              </div>
              <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>


      {/* Nút Continue */}
        <div className="mt-5">
          <button
            className="btn btn-primary px-4 py-2 rounded-pill fw-semibold"
            disabled={selected === null}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowLevelPage;