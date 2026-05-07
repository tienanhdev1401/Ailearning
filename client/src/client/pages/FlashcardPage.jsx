import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Nav, Button, Spinner } from "react-bootstrap";
import {
  FiArrowLeft,
  FiLayers,
  FiGrid,
  FiCheckSquare,
  FiEdit3,
} from "react-icons/fi";
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
  useContext(ThemeContext);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const tabs = [
    { id: "flashcards", label: "Thẻ ghi nhớ", icon: <FiLayers size={16} /> },
    { id: "learn", label: "Trắc nghiệm", icon: <FiCheckSquare size={16} /> },
    { id: "write", label: "Học viết", icon: <FiEdit3 size={16} /> },
    { id: "match", label: "Ghép thẻ", icon: <FiGrid size={16} /> },
  ];

  return (
    <div className={styles.pageWrapper}>
      <Container className="py-4">
        {/* Header Section */}
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <FiArrowLeft size={16} />
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
            {tabs.map((tab) => (
              <Nav.Item key={tab.id}>
                <Nav.Link
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={styles.navLink}
                >
                  {tab.icon} {tab.label}
                </Nav.Link>
              </Nav.Item>
            ))}
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
