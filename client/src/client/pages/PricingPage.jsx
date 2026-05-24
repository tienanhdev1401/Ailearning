import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner, Modal } from "react-bootstrap";
import {
  FiCheck,
  FiZap,
  FiCpu,
  FiMap,
  FiPlayCircle,
  FiEdit3,
  FiAward,
  FiInfo,
  FiAlertTriangle,
  FiXCircle,
  FiStar,
  FiShield,
} from "react-icons/fi";
import packageService from "../../services/packageService";
import paymentService from "../../services/paymentService";
import subscriptionService from "../../services/subscriptionService";
import { ThemeContext } from "../../context/ThemeContext";
import styles from "../styles/PricingPage.module.css";

const GROUP_META = {
  AI_CONVERSATION: {
    label: "Gói AI Conversation",
    icon: <FiCpu size={20} />,
  },
  ROADMAP_UNLOCK: {
    label: "Gói Mở khóa Lộ trình",
    icon: <FiMap size={20} />,
  },
  VIDEO_LESSON: {
    label: "Gói Video Khóa học",
    icon: <FiPlayCircle size={20} />,
  },
  GRAMMAR_CHECKER: {
    label: "Gói Kiểm tra Ngữ pháp",
    icon: <FiEdit3 size={20} />,
  },
};

const formatVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const PricingPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [aiMultiplier, setAiMultiplier] = useState(1);
  const [grammarMultiplier, setGrammarMultiplier] = useState(1);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    type: "confirm",
    title: "",
    message: "",
    onConfirm: null,
  });

  // ThemeContext is consumed so [data-theme] body attr drives CSS-variable swaps.
  useContext(ThemeContext);

  const showModal = (type, title, message, onConfirm = null) =>
    setModalConfig({ show: true, type, title, message, onConfirm });

  const handleCloseModal = () =>
    setModalConfig((prev) => ({ ...prev, show: false }));

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const [packagesData, subsData] = await Promise.all([
          packageService.getAllPackages(),
          subscriptionService.getMySubscriptions(),
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

  const getGenericPackageName = (type) => {
    if (type === "AI_CONVERSATION") return "AI Conversation";
    if (type === "GRAMMAR_CHECKER") return "Grammar Checker";
    return type || "dịch vụ";
  };

  const handleBuy = (packageId, multiplier = 1) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;

    const activeSub = userSubscriptions.find(
      (sub) =>
        sub.package?.type === pkg.type &&
        (!sub.endDate || new Date(sub.endDate) > new Date())
    );

    if (activeSub) {
      showModal(
        "confirm",
        "Xác nhận gia hạn",
        `Bạn đang có gói "${getGenericPackageName(activeSub.package?.type)}" vẫn còn hiệu lực. Bạn có chắc chắn muốn mua thêm để gia hạn tiếp không?`,
        () => executePurchase(packageId, multiplier)
      );
    } else {
      executePurchase(packageId, multiplier);
    }
  };

  const executePurchase = async (packageId, multiplier = 1) => {
    setProcessingId(packageId);
    try {
      const { url } = await paymentService.createPaymentUrl(packageId, multiplier);
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
      <div className={styles.loading}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Group packages by type
  const grouped = packages.reduce((acc, pkg) => {
    if (!acc[pkg.type]) acc[pkg.type] = [];
    acc[pkg.type].push(pkg);
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <Container>
        {/* Hero */}
        <header className={styles.hero}>
          <span className={styles.eyebrow}>
            <FiZap size={13} /> Nâng cấp tài khoản
          </span>
          <h1 className={styles.title}>
            Mở khóa sức mạnh{" "}
            <span className={styles.titleAccent}>AelanG PRO</span>
          </h1>
          <p className={styles.subtitle}>
            Học tập không giới hạn cùng AI, mở khóa lộ trình chuyên sâu và nâng tầm
            kỹ năng tiếng Anh của bạn.
          </p>
        </header>

        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Packages */}
        {Object.entries(grouped).map(([type, group]) => {
          const meta = GROUP_META[type] || { label: type, icon: <FiStar /> };
          // Mark the middle (or first) package of each group as "popular"
          const featuredIndex = group.length >= 3 ? 1 : 0;

          return (
            <section key={type} className={styles.group}>
              <div className={styles.groupHeader}>
                <div className={styles.groupIcon}>{meta.icon}</div>
                <h2 className={styles.groupTitle}>{meta.label}</h2>
                <span className={styles.groupCount}>
                  {group.length} gói có sẵn
                </span>
              </div>

              <Row className="g-4">
                {group.map((pkg, idx) => {
                  const featured = idx === featuredIndex && group.length > 1;
                  const isPro = pkg.name.toLowerCase().includes("pro");
                  const currentMultiplier = type === "AI_CONVERSATION" ? aiMultiplier : grammarMultiplier;
                  const setMultiplier = type === "AI_CONVERSATION" ? setAiMultiplier : setGrammarMultiplier;

                  return (
                    <Col key={pkg.id} md={6} lg={4}>
                      <article
                        className={`${styles.card} ${featured ? styles.cardFeatured : ""} ${isPro ? styles.cardPro : ""}`}
                      >
                        {isPro && (
                          <div className={styles.multiplierPillContainer}>
                            <div className={styles.multiplierPill}>
                              {[1, 5, 20].map(m => (
                                <button
                                  key={m}
                                  className={`${styles.pillOption} ${currentMultiplier === m ? styles.pillOptionActive : ""}`}
                                  onClick={() => setMultiplier(m)}
                                >
                                  {m}x
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {featured && (
                          <span className={styles.popularBadge}>
                            <FiStar size={11} /> Phổ biến nhất
                          </span>
                        )}

                        <h3 className={styles.cardName}>{pkg.name}</h3>
                        <p className={styles.cardDesc}>
                          {pkg.description ||
                            "Tận hưởng các tính năng cao cấp từ AelanG để tăng tốc quá trình học tập của bạn."}
                        </p>

                        <div className={styles.priceBlock}>
                          <span className={styles.price}>
                            {formatVND(isPro ? pkg.price * currentMultiplier : pkg.price)}
                          </span>
                          <span className={styles.priceUnit}>
                            / {pkg.durationInDays ? `${pkg.durationInDays} ngày` : "Vĩnh viễn"}
                          </span>
                        </div>

                        <ul className={styles.featureList}>
                          {(type === "AI_CONVERSATION" || type === "GRAMMAR_CHECKER") && (
                            <li className={styles.featureItem}>
                              <span className={styles.featureCheck}>
                                <FiCheck />
                              </span>
                              <span>
                                <strong>
                                  {isPro
                                    ? ((pkg.aiConversationCredits || pkg.grammarCheckerCredits) * currentMultiplier).toLocaleString()
                                    : (pkg.aiConversationCredits || pkg.grammarCheckerCredits || 0).toLocaleString()
                                  }
                                </strong> lượt {type === "AI_CONVERSATION" ? "AI" : "Grammar"} / tháng
                              </span>
                            </li>
                          )}
                          <li className={styles.featureItem}>
                            <span className={styles.featureCheck}>
                              <FiCheck />
                            </span>
                            <span>
                              {pkg.durationInDays
                                ? `Hiệu lực ${pkg.durationInDays} ngày kể từ khi kích hoạt`
                                : "Sở hữu trọn đời, không phát sinh phí gia hạn"}
                            </span>
                          </li>
                          <li className={styles.featureItem}>
                            <span className={styles.featureCheck}>
                              <FiCheck />
                            </span>
                            <span>Hỗ trợ kỹ thuật ưu tiên 24/7</span>
                          </li>
                        </ul>

                        <button
                          className={styles.cta}
                          onClick={() => handleBuy(pkg.id, isPro ? currentMultiplier : 1)}
                          disabled={processingId === pkg.id}
                        >
                          {processingId === pkg.id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <>
                              <FiZap size={15} />
                              {type === "ROADMAP_UNLOCK"
                                ? "Mua ngay"
                                : isPro
                                  ? `Nâng cấp Pro x${currentMultiplier}`
                                  : "Nâng cấp"
                              }
                            </>
                          )}
                        </button>
                      </article>
                    </Col>
                  );
                })}
              </Row>
            </section>
          );
        })}

        {/* Benefits */}
        <section className={styles.benefits}>
          <Row className="g-4">
            <Col md={4}>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  <FiCpu size={22} />
                </div>
                <h5 className={styles.benefitTitle}>AI Tutor thông minh</h5>
                <p className={styles.benefitDesc}>
                  Luyện nói và giao tiếp với trí tuệ nhân tạo mọi lúc, mọi nơi.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  <FiMap size={22} />
                </div>
                <h5 className={styles.benefitTitle}>Lộ trình chuyên sâu</h5>
                <p className={styles.benefitDesc}>
                  Các khóa học được thiết kế chuyên biệt giúp bạn đạt mục tiêu nhanh nhất.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  <FiShield size={22} />
                </div>
                <h5 className={styles.benefitTitle}>Bảo mật & ổn định</h5>
                <p className={styles.benefitDesc}>
                  Thanh toán an toàn, dữ liệu mã hoá và truy cập 24/7 không gián đoạn.
                </p>
              </div>
            </Col>
          </Row>
        </section>
      </Container>

      {/* Modal */}
      <Modal
        show={modalConfig.show}
        onHide={handleCloseModal}
        centered
        contentClassName={styles.modalContent}
      >
        <Modal.Body className="text-center py-4">
          <div
            className={`${styles.modalIcon} ${modalConfig.type === "confirm"
                ? styles.modalIconWarning
                : modalConfig.type === "error"
                  ? styles.modalIconError
                  : styles.modalIconInfo
              }`}
          >
            {modalConfig.type === "confirm" && <FiAlertTriangle size={28} />}
            {modalConfig.type === "error" && <FiXCircle size={28} />}
            {modalConfig.type === "info" && <FiInfo size={28} />}
          </div>
          <h4 className={styles.modalTitle}>{modalConfig.title}</h4>
          <p className={`${styles.modalMessage} mt-2 mb-0`}>{modalConfig.message}</p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center pb-4">
          {modalConfig.type === "confirm" ? (
            <>
              <button className={styles.modalBtn} onClick={handleCloseModal}>
                Hủy bỏ
              </button>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={() => {
                  handleCloseModal();
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
              >
                <FiAward size={15} style={{ marginRight: 6 }} />
                Tiếp tục thanh toán
              </button>
            </>
          ) : (
            <button
              className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
              onClick={handleCloseModal}
            >
              Đóng
            </button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PricingPage;
