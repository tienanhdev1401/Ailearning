import React from "react";
import { Button } from "react-bootstrap";

const ActivityContent = ({ activity, onNext }) => {
  return (
    <div className="container mt-4">
      <h4 className="fw-bold">📘 Activity {activity.id}</h4>
      <div
        className="border rounded p-3 mt-3"
        dangerouslySetInnerHTML={{ __html: activity.content }}
      ></div>
      <div className="text-center mt-4">
        <Button variant="success" onClick={onNext}>
          Tiếp tục ➡️
        </Button>
      </div>
    </div>
  );
};

export default ActivityContent;
