import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Form, InputGroup, Button, Spinner, Modal } from "react-bootstrap";
import { Search, Trash, JournalText, PlayFill, PlusLg, ArrowLeft, LightbulbFill } from "react-bootstrap-icons";
import { useParams, useNavigate } from "react-router-dom";
import notebookService from "../../services/notebookService";
import vocabNoteService from "../../services/vocabNoteService";
import { ThemeContext } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import styles from "../styles/NotebookDetail.module.css";

const VocabNotebookPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const toast = useToast();
  
  const [notebook, setNotebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({ term: "", definition: "" });
  const [submitting, setSubmitting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchNotebook = async () => {
    try {
      setLoading(true);
      const data = await notebookService.getNotebookById(id);
      setNotebook(data);
    } catch (error) {
      console.error("Failed to fetch notebook:", error);
      navigate("/notebooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebook();
  }, [id]);

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCard.term.trim() || !newCard.definition.trim()) return;
    try {
      setSubmitting(true);
      await notebookService.addCard(id, newCard.term, newCard.definition);
      setNewCard({ term: "", definition: "" });
      setShowAddModal(false);
      toast.success("Đã thêm từ mới thành công!");
      fetchNotebook();
    } catch (error) {
      console.error("Failed to add card:", error);
      const message = error.response?.data?.message || "Đã có lỗi xảy ra khi thêm từ.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async () => {
    if (!newCard.term.trim()) return;
    try {
      setLookupLoading(true);
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${newCard.term.trim()}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();

      const entry = data[0]?.meanings[0]?.definitions[0];
      const definition = entry?.definition;
      const example = entry?.example;

      if (definition) {
        let finalDef = definition;
        if (example) {
          finalDef += `\n(Ví dụ: ${example})`;
        }
        setNewCard(prev => ({ ...prev, definition: finalDef }));
      }
    } catch (error) {
      console.error("Dictionary lookup failed:", error);
      toast.warning("Không tìm thấy định nghĩa cho từ này.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleConfirmDelete = async (card) => {
    const isConfirmed = await toast.confirm(`Bạn có chắc muốn xóa "${card.term}" khỏi sổ tay này?`, {
      title: "Xác nhận xóa từ",
      type: "danger",
      confirmText: "Xóa",
      cancelText: "Hủy"
    });

    if (!isConfirmed) return;

    try {
      await vocabNoteService.deleteNote(card.id);
      toast.info(`Đã xóa "${card.term}"`);
      fetchNotebook();
    } catch (error) {
      console.error("Failed to delete card:", error);
      toast.error("Không thể xóa từ này. Vui lòng thử lại.");
    }
  };

  const filteredNotes = notebook?.notes?.filter(note =>
    note.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.definition.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <Container>
          <Button
            variant="link"
            className={styles.backBtn}
            onClick={() => navigate("/notebooks")}
          >
            <ArrowLeft className="me-2" /> Quay lại danh sách
          </Button>

          <div className={styles.headerContent}>
            <div className={styles.headerMain}>
              <h1 className={styles.title}>{notebook.title}</h1>
              <p className={styles.description}>{notebook.description || "Danh sách từ vựng cá nhân"}</p>
            </div>
            <div className={styles.headerActions}>
              <Button
                variant="primary"
                className={styles.studyBtn}
                disabled={filteredNotes.length === 0}
                onClick={() => navigate(`/flashcards/notebook/${id}`)}
              >
                <PlayFill size={20} className="me-2" /> Học ngay
              </Button>
              <Button
                variant="outline-primary"
                className={styles.addBtn}
                onClick={() => setShowAddModal(true)}
              >
                <PlusLg className="me-2" /> Thêm từ
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-5">
        <div className={styles.searchSection}>
          <InputGroup className={styles.searchBar}>
            <InputGroup.Text><Search /></InputGroup.Text>
            <Form.Control
              placeholder="Tìm kiếm trong sổ tay..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <span className={styles.countText}>{filteredNotes.length} thuật ngữ</span>
        </div>

        {filteredNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <JournalText size={48} className="mb-3 opacity-50" />
            <p>Không có từ vựng nào trong danh sách này.</p>
          </div>
        ) : (
          <div className={styles.termGrid}>
            {filteredNotes.map((note) => (
              <Card key={note.id} className={styles.termCard}>
                <Card.Body>
                  <div className={styles.cardMain}>
                    <div className={styles.termContent}>
                      <h3 className={styles.termTitle}>{note.term}</h3>
                      <p className={styles.termDef}>{note.definition}</p>
                    </div>
                    <Button
                      variant="link"
                      className={styles.deleteBtn}
                      onClick={() => handleConfirmDelete(note)}
                    >
                      <Trash />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Container>

      {/* Add Card Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Form onSubmit={handleAddCard}>
          <Modal.Header closeButton>
            <Modal.Title>Thêm thuật ngữ mới</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Thuật ngữ (Tiếng Anh)</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Ví dụ: Hello"
                  value={newCard.term}
                  onChange={(e) => setNewCard({ ...newCard, term: e.target.value })}
                  required
                  autoFocus
                />
                <Button
                  variant="outline-secondary"
                  onClick={handleLookup}
                  disabled={lookupLoading || !newCard.term.trim()}
                  title="Gợi ý nghĩa từ điển"
                >
                  {lookupLoading ? <Spinner size="sm" animation="border" /> : <LightbulbFill />}
                </Button>
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Định nghĩa</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Ví dụ: Xin chào"
                value={newCard.definition}
                onChange={(e) => setNewCard({ ...newCard, definition: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu lại"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default VocabNotebookPage;
