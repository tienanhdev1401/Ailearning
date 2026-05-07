import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FiLayers, FiArrowRight, FiBookOpen } from "react-icons/fi";
import api from "../../api/api";
import { ThemeContext } from "../../context/ThemeContext";
import styles from "../styles/FlashcardListPage.module.css";

const FlashcardListPage = () => {
  const navigate = useNavigate();
  useContext(ThemeContext);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        setLoading(true);
        const res = await api.get("/minigames", { params: { type: "flip_card" } });
        setFlashcardSets(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách flashcard:", err);
        setError("Không thể tải danh sách bộ thẻ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thư viện bộ thẻ...</p>
      </div>
    );
  }

  const totalTerms = flashcardSets.reduce(
    (acc, set) => acc + (set.resources?.cards?.length || 0),
    0
  );

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Thư viện Flashcard</h1>
          <p className={styles.heroSubtitle}>
            Khám phá hàng ngàn thuật ngữ chuyên ngành qua các bộ thẻ học tập sinh động.
          </p>
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{flashcardSets.length}</span>
              <span className={styles.statLabel}>Bộ thẻ</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>~{totalTerms}</span>
              <span className={styles.statLabel}>Thuật ngữ</span>
            </div>
          </div>
        </div>
      </section>

      <Container className="py-5">
        {error ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiBookOpen size={32} />
            </div>
            <h3>{error}</h3>
            <p>Vui lòng kiểm tra kết nối và thử lại.</p>
            <button className={styles.retryBtn} onClick={() => window.location.reload()}>
              Thử lại
            </button>
          </div>
        ) : flashcardSets.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiBookOpen size={32} />
            </div>
            <h3>Thư viện đang trống</h3>
            <p>Hiện chưa có bộ thẻ học tập nào được tạo. Hãy quay lại sau nhé!</p>
          </div>
        ) : (
          <Row className="g-4">
            {flashcardSets.map((set) => (
              <Col key={set.id} xs={12} md={6} lg={4}>
                <Card
                  className={styles.setCard}
                  onClick={() => navigate(`/flashcards/${set.id}`)}
                >
                  <Card.Body className="p-4">
                    <div className={styles.cardHeader}>
                      <div className={styles.iconBox}>
                        <FiLayers size={20} />
                      </div>
                      <span className={styles.termCount}>
                        {set.resources?.cards?.length || 0} thuật ngữ
                      </span>
                    </div>
                    <Card.Title className={styles.cardTitle}>{set.prompt}</Card.Title>
                    <div className={styles.cardFooter}>
                      <span className={styles.learnMore}>Học ngay</span>
                      <FiArrowRight className={styles.arrowIcon} size={18} />
                    </div>
                  </Card.Body>
                  <div className={styles.cardDecoration}></div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default FlashcardListPage;
