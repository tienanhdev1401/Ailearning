import React, { useState } from "react";
import ReasonCard from "../../components/ReasonCard";
import { Container, ProgressBar, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function ReasonPage() {
  const [selected, setSelected] = useState("Challenge myself");
   const navigate = useNavigate();

  const reasons = [
    { icon: "🤝", text: "Work" },
    { icon: "📘", text: "School" },
    { icon: "✈️", text: "Travel" },
    { icon: "🖼️", text: "Culture" },
    { icon: "🙌", text: "Family & community" },
    { icon: "💪", text: "Challenge myself" },
    { icon: "💭", text: "Other" },
  ];

  return (
    <Container
      fluid
      className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-white text-center"
    >
      <div className="w-100" style={{ maxWidth: "700px" }}>
        {/* Thanh tiến trình */}
        <ProgressBar
          now={20}
          className="mb-4"
          style={{ height: "6px", borderRadius: "5px" }}
          variant="success"
        />

        {/* Tiêu đề */}
        <h3 className="fw-semibold mb-2">
          Hi <span className="text-primary fw-bold">Phan Hùng Anh</span>, why are you learning English?
        </h3>
        <p className="text-secondary mb-4">
          Help us tailor your learning experience.
        </p>

        {/* Danh sách lựa chọn */}
        <Row xs={1} md={2} className="g-3 mb-4">
          {reasons.map((r) => (
            <Col key={r.text}>
              <ReasonCard
                icon={r.icon}
                text={r.text}
                selected={selected === r.text}
                onClick={() => setSelected(r.text)}
              />
            </Col>
          ))}
        </Row>

        {/* Nút Continue */}
        <Button
          variant="primary"
          className="px-5 py-2 rounded-pill fw-semibold"
          size="lg"
          onClick={() => {navigate("/welcome/goal");}}
        >
          Continue
        </Button>
      </div>
    </Container>
  );
}
