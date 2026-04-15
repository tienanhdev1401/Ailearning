import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircleFill, XCircleFill, ArrowLeft, BagCheckFill } from "react-bootstrap-icons";
import { Container, Card, Button, Row, Col } from "react-bootstrap";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const responseCode = searchParams.get("vnp_ResponseCode");
  const isSuccess = responseCode === "00";

  const amount = searchParams.get("vnp_Amount");
  const txnRef = searchParams.get("vnp_TxnRef");
  const orderInfo = decodeURIComponent(searchParams.get("vnp_OrderInfo") || "");
  const payDate = searchParams.get("vnp_PayDate");

  const formatAmount = (amt) => {
    if (!amt) return "0 ₫";
    const value = parseInt(amt) / 100;
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  // Format date (YYYYMMDDHHmmss)
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 14) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-5 text-center">
                <div className="mb-4">
                  {isSuccess ? (
                    <CheckCircleFill className="text-success" style={{ fontSize: "5rem" }} />
                  ) : (
                    <XCircleFill className="text-danger" style={{ fontSize: "5rem" }} />
                  )}
                </div>

                <h2 className={`mb-3 fw-bold ${isSuccess ? "text-success" : "text-danger"}`}>
                  {isSuccess ? "Thanh Toán Thành Công!" : "Thanh Toán Thất Bại"}
                </h2>

                <p className="text-muted mb-4 lead">
                  {isSuccess
                    ? "Cảm ơn bạn đã tin dùng Ailearning. Tài khoản của bạn đã được cập nhật gói dịch vụ mới."
                    : "Giao dịch không thành công hoặc đã bị hủy. Vui lòng thử lại sau."}
                </p>

                <div className="text-start mb-4 p-4 rounded-3 bg-white border">
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">Mã giao dịch:</Col>
                    <Col xs={7} className="fw-bold text-end text-break">{txnRef || "N/A"}</Col>
                  </Row>
                  <hr className="my-2 opacity-10" />
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">Số tiền:</Col>
                    <Col xs={7} className="fw-bold text-end text-primary">{formatAmount(amount)}</Col>
                  </Row>
                  <hr className="my-2 opacity-10" />
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">Nội dung:</Col>
                    <Col xs={7} className="text-end small">{orderInfo || "N/A"}</Col>
                  </Row>
                  <hr className="my-2 opacity-10" />
                  <Row>
                    <Col xs={5} className="text-muted">Thời gian:</Col>
                    <Col xs={7} className="text-end">{formatDate(payDate)}</Col>
                  </Row>
                </div>

                <div className="d-grid gap-2">
                  <Button
                    variant={isSuccess ? "success" : "danger"}
                    size="lg"
                    className="fw-bold py-3"
                    onClick={() => navigate("/")}
                  >
                    <ArrowLeft className="me-2" /> Quay về Trang chủ
                  </Button>
                  {isSuccess && (
                    <Button
                      variant="outline-primary"
                      size="lg"
                      className="fw-bold py-3"
                      onClick={() => navigate("/profile")}
                    >
                      <BagCheckFill className="me-2" /> Xem các gói đã mua
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PaymentSuccessPage;
