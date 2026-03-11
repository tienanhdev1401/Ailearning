import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal } from "react-bootstrap";
import { Gem, CheckCircleFill, Stars, RocketTakeoff, ShieldCheck, PlayCircleFill, Spellcheck, ExclamationTriangleFill, InfoCircleFill, XCircleFill } from "react-bootstrap-icons";
import packageService from "../../services/packageService";
import paymentService from "../../services/paymentService";
import subscriptionService from "../../services/subscriptionService";

const PricingPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    type: "confirm", // 'confirm' | 'error' | 'info'
    title: "",
    message: "",
    onConfirm: null,
  });

  const showModal = (type, title, message, onConfirm = null) => {
    setModalConfig({ show: true, type, title, message, onConfirm });
  };

  const handleCloseModal = () => {
    setModalConfig(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const [packagesData, subsData] = await Promise.all([
          packageService.getAllPackages(),
          subscriptionService.getMySubscriptions()
        ]);
        setPackages(packagesData);
        setUserSubscriptions(subsData);
      } catch (err) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleBuy = async (packageId) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;

    // Kiểm tra xem người dùng đã có gói cùng loại đang còn hạn không
    const activeSub = userSubscriptions.find(sub =>
      sub.package?.type === pkg.type &&
      (!sub.endDate || new Date(sub.endDate) > new Date())
    );

    if (activeSub) {
      showModal(
        "confirm",
        "Xác nhận gia hạn",
        `Bạn đang có gói "${activeSub.package?.name}" vẫn còn hiệu lực. Bạn có chắc chắn muốn mua thêm để gia hạn tiếp không?`,
        () => executePurchase(packageId)
      );
    } else {
      executePurchase(packageId);
    }
  };

  const executePurchase = async (packageId) => {
    setProcessingId(packageId);
    try {
      const { url } = await paymentService.createPaymentUrl(packageId);
      window.location.href = url;
    } catch (err) {
      const msg = err.response?.data?.message || "Có lỗi xảy ra khi tạo giao dịch.";
      showModal("error", "Lỗi thanh toán", msg);
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="bg-light py-5 min-vh-100">
      <Container>
        <div className="text-center mb-5 mt-4">
          <Badge bg="primary" className="px-3 py-2 mb-3 rounded-pill">
            Nâng cấp tài khoản
          </Badge>
          <h1 className="display-4 fw-bold text-dark">Mở khóa sức mạnh Ailearning PRO</h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: "700px" }}>
            Học tập không giới hạn với sự hỗ trợ của AI, mở khóa những lộ trình chuyên sâu và nâng tầm kỹ năng tiếng Anh của bạn.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Group packages by type */}
        {Object.entries(
          packages.reduce((acc, pkg) => {
            if (!acc[pkg.type]) acc[pkg.type] = [];
            acc[pkg.type].push(pkg);
            return acc;
          }, {})
        ).map(([type, group]) => (
          <div key={type} className="mb-5">
            <div className="d-flex align-items-center mb-4">
              <div className="bg-primary text-white rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px" }}>
                {type === "AI_CONVERSATION" && <Stars size={24} />}
                {type === "ROADMAP_UNLOCK" && <RocketTakeoff size={24} />}
                {type === "VIDEO_LESSON" && <PlayCircleFill size={24} />}
                {type === "GRAMMAR_CHECKER" && <Spellcheck size={24} />}
              </div>
              <h2 className="h3 fw-bold mb-0">
                {type === "AI_CONVERSATION" && "Gói AI Conversation"}
                {type === "ROADMAP_UNLOCK" && "Gói Mở khóa Lộ trình"}
                {type === "VIDEO_LESSON" && "Gói Video Khóa học"}
                {type === "GRAMMAR_CHECKER" && "Gói Kiểm tra Ngữ pháp"}
              </h2>
            </div>

            <Row className="g-4">
              {group.map((pkg) => (
                <Col key={pkg.id} md={6} lg={4}>
                  <Card className="h-100 shadow-sm border-0 rounded-4 overflow-hidden position-relative">
                    <Card.Body className="p-4 d-flex flex-column">
                      <Card.Title className="h4 fw-bold mb-3">{pkg.name}</Card.Title>
                      <Card.Text className="text-muted small mb-4" style={{ minHeight: "3rem" }}>
                        {pkg.description || "Tận hưởng các tính năng cao cấp từ Ailearning để tăng tốc quá trình học tập của bạn."}
                      </Card.Text>

                      <div className="mb-4 mt-auto">
                        <span className="h2 fw-bold text-primary mb-0">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pkg.price)}
                        </span>
                        {pkg.durationInDays && (
                          <span className="text-muted ms-2">/ {pkg.durationInDays} ngày</span>
                        )}
                        {!pkg.durationInDays && (
                          <span className="text-muted ms-2">/ Vĩnh viễn</span>
                        )}
                      </div>

                      <ul className="list-unstyled mb-4">
                        <li className="mb-2 d-flex align-items-center">
                          <CheckCircleFill className="text-success me-2 flex-shrink-0" size={16} />
                          <span className="small">Kích hoạt {pkg.name}</span>
                        </li>
                        <li className="mb-2 d-flex align-items-center">
                          <CheckCircleFill className="text-success me-2 flex-shrink-0" size={16} />
                          <span className="small">{pkg.durationInDays ? `Hiệu lực ${pkg.durationInDays} ngày` : "Sở hữu trọn đời"}</span>
                        </li>
                      </ul>

                      <Button
                        variant="outline-primary"
                        className="rounded-pill fw-bold"
                        onClick={() => handleBuy(pkg.id)}
                        disabled={processingId === pkg.id}
                      >
                        {processingId === pkg.id ? (
                          <Spinner animation="border" size="sm" className="me-2" />
                        ) : (
                          <Gem className="me-2" />
                        )}
                        Mua ngay
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))}

        <section className="mt-5 pt-5">
          <Row className="text-center g-4">
            <Col md={4}>
              <div className="p-3">
                <div className="bg-white rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <Stars className="text-primary" size={24} />
                </div>
                <h5 className="fw-bold">AI Tutor Thông Minh</h5>
                <p className="text-muted small">Luyện nói và giao tiếp với trí tuệ nhân tạo mọi lúc, mọi nơi.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-3">
                <div className="bg-white rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <RocketTakeoff className="text-primary" size={24} />
                </div>
                <h5 className="fw-bold">Lộ trình Chuyên Sâu</h5>
                <p className="text-muted small">Các khóa học được thiết kế chuyên biệt để bạn đạt mục tiêu nhanh nhất.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-3">
                <div className="bg-white rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <BagCheckFill className="text-primary" size={24} />
                </div>
                <h5 className="fw-bold">Mở Khóa Vĩnh Viễn</h5>
                <p className="text-muted small">Mua một lần, sở hữu mãi mãi cho các lộ trình học tập cụ thể.</p>
              </div>
            </Col>
          </Row>
        </section>
      </Container>
      <Modal show={modalConfig.show} onHide={handleCloseModal} centered className="border-0">
        <Modal.Header closeButton={modalConfig.type !== "confirm"} className="border-0 pb-0">
          <Modal.Title className="fw-bold">{modalConfig.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            {modalConfig.type === "confirm" && <ExclamationTriangleFill size={64} className="text-warning" />}
            {modalConfig.type === "error" && <XCircleFill size={64} className="text-danger" />}
            {modalConfig.type === "info" && <InfoCircleFill size={64} className="text-primary" />}
          </div>
          <p className="fs-5 text-muted px-3">{modalConfig.message}</p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-center pb-4">
          {modalConfig.type === "confirm" ? (
            <>
              <Button variant="light" onClick={handleCloseModal} className="rounded-pill px-4 fw-bold me-2">
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleCloseModal();
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
                className="rounded-pill px-4 fw-bold"
              >
                Tiếp tục thanh toán
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={handleCloseModal} className="rounded-pill px-5 fw-bold">
              Đóng
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Dummy component for the icon missing in import
const BagCheckFill = ({ className, size }) => <i className={`bi bi-bag-check-fill ${className}`} style={{ fontSize: size }}></i>;

export default PricingPage;
