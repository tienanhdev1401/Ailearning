import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Collection, ArrowRight, Lamp, JournalBookmark } from "react-bootstrap-icons";
import api from "../../api/api";
import { ThemeContext } from "../../context/ThemeContext";
import styles from "../styles/FlashcardListPage.module.css";

const FlashcardListPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
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

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>Thư viện Flashcard</h2>
          <p className={styles.heroSubtitle}> Khám phá hàng ngàn thuật ngữ chuyên ngành qua các bộ thẻ học tập sinh động. </p>
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{flashcardSets.length}</span>
              <span className={styles.statLabel}>Bộ thẻ</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>~{flashcardSets.reduce((acc, set) => acc + (set.resources?.cards?.length || 0), 0)}</span>
              <span className={styles.statLabel}>Thuật ngữ</span>
            </div>
          </div>
        </div>
      </section>

      <Container className="py-5">
        {error ? (
          <div className="text-center py-5">
            <h4 className="text-danger">{error}</h4>
            <Button variant="primary" onClick={() => window.location.reload()} className="mt-3">
              Thử lại
            </Button>
          </div>
        ) : flashcardSets.length === 0 ? (
          <div className={styles.emptyState}>
            <JournalBookmark size={60} className="mb-3 text-muted" />
            <h3>Opps! Thư viện đang trống</h3>
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
                  <Card.Body>
                    <div className={styles.cardHeader}>
                      <div className={styles.iconBox}>
                        <Collection size={24} />
                      </div>
                      <span className={styles.termCount}>
                        {set.resources?.cards?.length || 0} thuật ngữ
                      </span>
                    </div>
                    <Card.Title className={styles.cardTitle}>{set.prompt}</Card.Title>
                    <div className={styles.cardFooter}>
                      <span className={styles.learnMore}>Học ngay</span>
                      <ArrowRight className={styles.arrowIcon} />
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
