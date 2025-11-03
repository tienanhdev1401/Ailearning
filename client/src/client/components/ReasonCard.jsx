import React from "react";
import { Card } from "react-bootstrap";

export default function ReasonCard({ icon, text, selected, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={`p-3 mb-3 d-flex flex-row align-items-center justify-content-between border-2 rounded-4 shadow-sm ${
        selected ? "border-primary bg-light" : "border-light"
      }`}
      style={{ cursor: "pointer", transition: "0.2s all" }}
    >
      <div className="d-flex align-items-center gap-3">
        <span style={{ fontSize: "1.8rem" }}>{icon}</span>
        <span className="fw-medium">{text}</span>
      </div>
      {selected && <span className="text-primary fw-bold">✔</span>}
    </Card>
  );
}
