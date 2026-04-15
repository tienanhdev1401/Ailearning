import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Nav, Button, Spinner } from "react-bootstrap";
import { ArrowLeft, Collection, Grid, PencilSquare } from "react-bootstrap-icons";
import api from "../../api/api";
import notebookService from "../../services/notebookService";
import { ThemeContext } from "../../context/ThemeContext";
import styles from "../styles/FlashcardPage.module.css";

import FlashcardPlayer from "../components/Flashcard/FlashcardPlayer";
import MatchingGame from "../components/Flashcard/MatchingGame";
import ABCDGame from "../components/Flashcard/ABCDGame";
import WritingGame from "../components/Flashcard/WritingGame";
import TermList from "../components/Flashcard/TermList";

const FlashcardPage = () => {
  const { minigameId, type, id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("flashcards"); // flashcards | match | learn | write

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        if (type === "notebook") {
          const data = await notebookService.getNotebookById(id);
          // Transform notebook data to match minigame resource structure
          setGameData({
            prompt: data.title,
            resources: {
              cards: data.notes || []
            }
          });
        } else {
          const res = await api.get(`/minigames/${minigameId}`);
          setGameData(res.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu flashcard:", err);
        setError("Không thể tải dữ liệu bài học. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (minigameId || (type && id)) {
      fetchGameData();
    }
  }, [minigameId]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <Container className="py-5 text-center">
        <h3 className="text-danger">{error || "Không tìm thấy dữ liệu."}</h3>
        <Button variant="primary" onClick={() => navigate(-1)} className="mt-3">
          Quay lại
        </Button>
      </Container>
    );
  }

  const cards = gameData.resources?.cards || [];
  const title = gameData.prompt || "Bộ thẻ học tập";

  return (
    <div className={`${styles.pageWrapper} ${isDarkMode ? styles.dark : ""}`}>
      <Container className="py-4">
        {/* Header Section */}
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{cards.length} thuật ngữ</p>
          </div>
          <div className={styles.headerSpace}></div>
        </header>

        {/* Navigation Tabs */}
        <div className={styles.navWrapper}>
          <Nav variant="pills" className={styles.customNav}>
            <Nav.Item>
              <Nav.Link
                active={activeTab === "flashcards"}
                onClick={() => setActiveTab("flashcards")}
                className={styles.navLink}
              >
                <Collection className="me-2" /> Thẻ ghi nhớ
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === "learn"}
                onClick={() => setActiveTab("learn")}
                className={styles.navLink}
              >
                <PencilSquare className="me-2" /> Trắc nghiệm
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === "write"}
                onClick={() => setActiveTab("write")}
                className={styles.navLink}
              >
                <PencilSquare className="me-2" /> Học viết
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === "match"}
                onClick={() => setActiveTab("match")}
                className={styles.navLink}
              >
                <Grid className="me-2" /> Ghép thẻ
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        {/* Main Content Area */}
        <main className={styles.mainContent}>
          {activeTab === "flashcards" && <FlashcardPlayer cards={cards} />}
          {activeTab === "learn" && <ABCDGame cards={cards} />}
          {activeTab === "write" && <WritingGame cards={cards} />}
          {activeTab === "match" && <MatchingGame cards={cards} />}
        </main>

        {/* Term List Section (Only visible in flashcards mode or always?) */}
        {activeTab === "flashcards" && (
          <section className={styles.termListSection}>
            <TermList cards={cards} />
          </section>
        )}
      </Container>
    </div>
  );
};

export default FlashcardPage;
