import React from "react";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Gem, RocketTakeoff, ClockHistory } from "react-bootstrap-icons";

const VipModal = ({ show, onHide, title = "Mở khóa lộ trình", message }) => {
  const navigate = useNavigate();

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center py-4">
        <div className="mb-4">
          <div 
            className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: "80px", height: "80px" }}
          >
            <RocketTakeoff size={40} />
          </div>
        </div>
        <h4 className="fw-bold mb-3">Bạn đã hoàn thành phần học thử!</h4>
        <p className="text-muted px-3 mb-4">
          {message || "Hiện tại bạn đã đạt giới hạn của số ngày học miễn phí cho lộ trình này. Hãy mở khóa trọn bộ để tiếp tục hành trình chinh phục tiếng Anh nhé."}
        </p>
        
        <div className="d-flex flex-column gap-2 px-4">
          <Button 
            variant="primary" 
            size="lg" 
            className="rounded-pill fw-bold"
            onClick={() => {
              onHide();
              navigate("/pricing");
            }}
          >
            <Gem className="me-2" /> Mua gói để mở khóa
          </Button>
          <Button 
            variant="light" 
            className="rounded-pill fw-bold"
            onClick={onHide}
          >
            Để sau
          </Button>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 justify-content-center pt-0 pb-4">
        <div className="text-muted small d-flex align-items-center">
          <ClockHistory className="me-1" /> Thanh toán một lần, sử dụng mãi mãi
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default VipModal;
