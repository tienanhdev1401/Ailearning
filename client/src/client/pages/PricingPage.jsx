import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import { Gem, CheckCircleFill, Stars, RocketTakeoff, ShieldCheck, PlayCircleFill, Spellcheck } from "react-bootstrap-icons";
import packageService from "../../services/packageService";
import paymentService from "../../services/paymentService";

const PricingPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await packageService.getAllPackages();
        setPackages(data);
      } catch (err) {
        setError("Không thể tải danh sách gói. Vui lòng thử lại sau.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleBuy = async (packageId) => {
    setProcessingId(packageId);
    try {
      const { url } = await paymentService.createPaymentUrl(packageId);
      window.location.href = url;
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi tạo giao dịch.");
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
    </div>
  );
};

// Dummy component for the icon missing in import
const BagCheckFill = ({ className, size }) => <i className={`bi bi-bag-check-fill ${className}`} style={{ fontSize: size }}></i>;

export default PricingPage;
