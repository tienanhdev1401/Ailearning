import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal } from "react-bootstrap";
import { Gem, CheckCircleFill, Stars, RocketTakeoff, PlayCircleFill, Spellcheck, ExclamationTriangleFill, InfoCircleFill, XCircleFill } from "react-bootstrap-icons";
import packageService from "../../services/packageService";
import paymentService from "../../services/paymentService";
import subscriptionService from "../../services/subscriptionService";
import { ThemeContext } from "../../context/ThemeContext";

const PricingPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    type: "confirm",
    title: "",
    message: "",
    onConfirm: null,
  });

  const { isDarkMode } = useContext(ThemeContext);

  const theme = {
    pageBg: isDarkMode ? "#0f1117" : "#f8f9fa",
    cardBg: isDarkMode ? "#1a1d2e" : "#ffffff",
    cardBorder: isDarkMode ? "#2a2d3e" : "transparent",
    titleColor: isDarkMode ? "#ffffff" : "#212529",
    textColor: isDarkMode ? "#adb5bd" : "#6c757d",
    featureIconBg: isDarkMode ? "#2a2d3e" : "#ffffff",
    listItemColor: isDarkMode ? "#dee2e6" : "#212529",
  };

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
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: theme.pageBg }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="py-5 min-vh-100" style={{ background: theme.pageBg }}>
      <Container>
        <div className="text-center mb-5 mt-4">
          <Badge bg="primary" className="px-3 py-2 mb-3 rounded-pill">
            Nâng cấp tài khoản
          </Badge>
          <h1 className="display-4 fw-bold" style={{ color: theme.titleColor }}>Mở khóa sức mạnh Ailearning PRO</h1>
          <p className="lead mx-auto" style={{ maxWidth: "700px", color: theme.textColor }}>
            Học tập không giới hạn với sự hỗ trợ của AI, mở khóa những lộ trình chuyên sâu và nâng tầm kỹ năng tiếng Anh của bạn.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

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
              <h2 className="h3 fw-bold mb-0" style={{ color: theme.titleColor }}>
                {type === "AI_CONVERSATION" && "Gói AI Conversation"}
                {type === "ROADMAP_UNLOCK" && "Gói Mở khóa Lộ trình"}
                {type === "VIDEO_LESSON" && "Gói Video Khóa học"}
                {type === "GRAMMAR_CHECKER" && "Gói Kiểm tra Ngữ pháp"}
              </h2>
            </div>

            <Row className="g-4">
              {group.map((pkg) => (
                <Col key={pkg.id} md={6} lg={4}>
                  <Card
                    className="h-100 shadow-sm rounded-4 overflow-hidden position-relative"
                    style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
                  >
                    <Card.Body className="p-4 d-flex flex-column">
                      <Card.Title className="h4 fw-bold mb-3" style={{ color: theme.titleColor }}>{pkg.name}</Card.Title>
                      <Card.Text className="small mb-4" style={{ minHeight: "3rem", color: theme.textColor }}>
                        {pkg.description || "Tận hưởng các tính năng cao cấp từ Ailearning để tăng tốc quá trình học tập của bạn."}
                      </Card.Text>

                      <div className="mb-4 mt-auto">
                        <span className="h2 fw-bold text-primary mb-0">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pkg.price)}
                        </span>
                        {pkg.durationInDays && (
                          <span className="ms-2" style={{ color: theme.textColor }}>/ {pkg.durationInDays} ngày</span>
                        )}
                        {!pkg.durationInDays && (
                          <span className="ms-2" style={{ color: theme.textColor }}>/ Vĩnh viễn</span>
                        )}
                      </div>

                      <ul className="list-unstyled mb-4">
                        <li className="mb-2 d-flex align-items-center">
                          <CheckCircleFill className="text-success me-2 flex-shrink-0" size={16} />
                          <span className="small" style={{ color: theme.listItemColor }}>Kích hoạt {pkg.name}</span>
                        </li>
                        <li className="mb-2 d-flex align-items-center">
                          <CheckCircleFill className="text-success me-2 flex-shrink-0" size={16} />
                          <span className="small" style={{ color: theme.listItemColor }}>{pkg.durationInDays ? `Hiệu lực ${pkg.durationInDays} ngày` : "Sở hữu trọn đời"}</span>
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
                <div className="rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px", background: theme.featureIconBg }}>
                  <Stars className="text-primary" size={24} />
                </div>
                <h5 className="fw-bold" style={{ color: theme.titleColor }}>AI Tutor Thông Minh</h5>
                <p className="small" style={{ color: theme.textColor }}>Luyện nói và giao tiếp với trí tuệ nhân tạo mọi lúc, mọi nơi.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-3">
                <div className="rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px", background: theme.featureIconBg }}>
                  <RocketTakeoff className="text-primary" size={24} />
                </div>
                <h5 className="fw-bold" style={{ color: theme.titleColor }}>Lộ trình Chuyên Sâu</h5>
                <p className="small" style={{ color: theme.textColor }}>Các khóa học được thiết kế chuyên biệt để bạn đạt mục tiêu nhanh nhất.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-3">
                <div className="rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px", background: theme.featureIconBg }}>
                  <BagCheckFill className="text-primary" size={24} />
                </div>
                <h5 className="fw-bold" style={{ color: theme.titleColor }}>Mở Khóa Vĩnh Viễn</h5>
                <p className="small" style={{ color: theme.textColor }}>Mua một lần, sở hữu mãi mãi cho các lộ trình học tập cụ thể.</p>
              </div>
            </Col>
          </Row>
        </section>
      </Container>

      <Modal show={modalConfig.show} onHide={handleCloseModal} centered>
        <Modal.Header closeButton={modalConfig.type !== "confirm"} className="border-0 pb-0" style={{ background: theme.cardBg }}>
          <Modal.Title className="fw-bold" style={{ color: theme.titleColor }}>{modalConfig.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4" style={{ background: theme.cardBg }}>
          <div className="mb-3">
            {modalConfig.type === "confirm" && <ExclamationTriangleFill size={64} className="text-warning" />}
            {modalConfig.type === "error" && <XCircleFill size={64} className="text-danger" />}
            {modalConfig.type === "info" && <InfoCircleFill size={64} className="text-primary" />}
          </div>
          <p className="fs-5 px-3" style={{ color: theme.textColor }}>{modalConfig.message}</p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-center pb-4" style={{ background: theme.cardBg }}>
          {modalConfig.type === "confirm" ? (
            <>
              <Button variant="secondary" onClick={handleCloseModal} className="rounded-pill px-4 fw-bold me-2">
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

const BagCheckFill = ({ className, size }) => <i className={`bi bi-bag-check-fill ${className}`} style={{ fontSize: size }}></i>;

export default PricingPage;
