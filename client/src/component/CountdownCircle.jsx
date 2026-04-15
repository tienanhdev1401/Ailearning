import React from "react";

const CountdownCircle = ({ daysRemaining, totalDays, size = 60 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;

  const isPermanent = !totalDays;
  const percentage = isPermanent ? 100 : Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="5"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={daysRemaining < 7 && !isPermanent ? "#f72585" : "#4361ee"}
          strokeWidth="5"
          fill="transparent"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease",
            strokeLinecap: "round"
          }}
        />
      </svg>
      <div style={{ position: "absolute", fontSize: "12px", fontWeight: "700", color: "#1e293b", textAlign: "center" }}>
        {isPermanent ? "∞" : daysRemaining}
        {!isPermanent && <div style={{ fontSize: "8px", fontWeight: "400" }}>Ngày</div>}
      </div>
    </div>
  );
};

export default CountdownCircle;
