import React, { useState, useEffect, useContext } from "react";
import { Container, Card, Form, InputGroup, Button, Spinner, Modal } from "react-bootstrap";
import {
  FiSearch,
  FiTrash2,
  FiBookOpen,
  FiPlay,
  FiPlus,
  FiArrowLeft,
  FiZap,
  FiVolume2,
} from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import notebookService from "../../services/notebookService";
import vocabNoteService from "../../services/vocabNoteService";
import { ThemeContext } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { speak } from "../../utils/tts";
import styles from "../styles/NotebookDetail.module.css";

const VocabNotebookPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  useContext(ThemeContext);
  const toast = useToast();

  const [notebook, setNotebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({ term: "", definition: "", phonetic: "", partOfSpeech: "" });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-lookup when user stops typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (newCard.term.trim() && !newCard.definition.trim()) {
        handleLookup();
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [newCard.term]);

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCard.term.trim() || !newCard.definition.trim()) return;
    try {
      setSubmitting(true);
      // Update this call to include new fields
      await notebookService.addCard(
        id, 
        newCard.term, 
        newCard.definition, 
        "Cá nhân", // source
        newCard.phonetic, 
        newCard.partOfSpeech
      );
      setNewCard({ term: "", definition: "", phonetic: "", partOfSpeech: "" });
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
      const word = newCard.term.trim();

      // 1. Fetch Dictionary Info (Phonetic & Part of Speech)
      const dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      
      // 2. Fetch Translation (Google Translate API)
      const transPromise = fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`);

      const [dictRes, transRes] = await Promise.all([dictPromise, transPromise]);
      
      let phonetic = "";
      let partOfSpeech = "";
      let translation = "";

      if (dictRes.ok) {
        const dictData = await dictRes.json();
        if (Array.isArray(dictData) && dictData.length > 0) {
          const entry = dictData[0];
          phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find(p => p.text)?.text) || "";
          partOfSpeech = entry.meanings?.[0]?.partOfSpeech || "";
        }
      }

      if (transRes.ok) {
        const transData = await transRes.json();
        if (Array.isArray(transData) && transData[0] && transData[0][0]) {
          translation = transData[0][0][0];
        }
      }

      setNewCard(prev => ({
        ...prev,
        phonetic: phonetic || prev.phonetic,
        partOfSpeech: partOfSpeech || prev.partOfSpeech,
        definition: translation || prev.definition
      }));

      if (translation) toast.success("Đã hoàn thành tra cứu!");

    } catch (error) {
      console.error("Lookup failed:", error);
      toast.error("Không thể lấy dữ liệu tra cứu.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleConfirmDelete = async (card) => {
    const isConfirmed = await toast.confirm(
      `Bạn có chắc muốn xóa "${card.term}" khỏi sổ tay này?`,
      {
        title: "Xác nhận xóa từ",
        type: "danger",
        confirmText: "Xóa",
        cancelText: "Hủy",
      }
    );

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

  const filteredNotes =
    notebook?.notes?.filter(
      (note) =>
        note.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.definition.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (loading) {
    return (
      <div className={`${styles.pageWrapper} ${styles.loadingWrapper}`}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <Container>
          <Button className={styles.backBtn} onClick={() => navigate("/notebooks")}>
            <FiArrowLeft size={16} /> Quay lại danh sách
          </Button>

          <div className={styles.headerContent}>
            <div className={styles.headerMain}>
              <h1 className={styles.title}>{notebook.title}</h1>
              <p className={styles.description}>
                {notebook.description || "Danh sách từ vựng cá nhân"}
              </p>
            </div>
            <div className={styles.headerActions}>
              <Button
                className={styles.studyBtn}
                disabled={filteredNotes.length === 0}
                onClick={() => navigate(`/flashcards/notebook/${id}`)}
              >
                <FiPlay size={16} /> Học ngay
              </Button>
              <Button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
                <FiPlus size={16} /> Thêm từ
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-5">
        <div className={styles.searchSection}>
          <InputGroup className={styles.searchBar}>
            <InputGroup.Text>
              <FiSearch size={16} />
            </InputGroup.Text>
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
            <div className={styles.emptyIcon}>
              <FiBookOpen size={26} />
            </div>
            <h5 style={{ color: "var(--pp-text-strong)", margin: 0 }}>
              {searchTerm ? "Không tìm thấy kết quả phù hợp" : "Sổ tay chưa có từ nào"}
            </h5>
            <p>
              {searchTerm
                ? "Thử với từ khoá khác hoặc thêm từ mới."
                : "Bấm \"Thêm từ\" để bắt đầu xây dựng kho từ vựng của bạn."}
            </p>
          </div>
        ) : (
          <div className={styles.termGrid}>
            {filteredNotes.map((note) => (
              <Card key={note.id} className={styles.termCard}>
                <Card.Body>
                  <div className={styles.cardMain}>
                    <div className={styles.termContent}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h3 className={styles.termTitle} style={{ margin: 0 }}>{note.term}</h3>
                        <button 
                          className="btn btn-link p-0 text-primary" 
                          onClick={() => speak(note.term, "en")}
                        >
                          <FiVolume2 size={18} />
                        </button>
                      </div>
                      
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {note.phonetic && <span className={styles.phoneticTag}>{note.phonetic}</span>}
                        {note.partOfSpeech && <span className={styles.typeTag}>{note.partOfSpeech}</span>}
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <p className={styles.termDef} style={{ margin: 0 }}>{note.definition}</p>
                        <button 
                          className="btn btn-link p-0 text-secondary" 
                          onClick={() => speak(note.definition, "vi")}
                        >
                          <FiVolume2 size={16} />
                        </button>
                      </div>
                    </div>
                    <Button
                      className={styles.deleteBtn}
                      onClick={() => handleConfirmDelete(note)}
                      title="Xóa từ"
                    >
                      <FiTrash2 size={16} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Container>

      {/* Add Card Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        centered
        contentClassName={styles.modal}
      >
        <Form onSubmit={handleAddCard}>
          <Modal.Header closeButton closeVariant="white">
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
                  onBlur={() => { if(newCard.term) handleLookup(); }}
                  required
                  autoFocus
                />
                <Button
                  variant="outline-secondary"
                  onClick={handleLookup}
                  disabled={lookupLoading || !newCard.term.trim()}
                  title="Gợi ý nghĩa từ điển"
                >
                  {lookupLoading ? <Spinner size="sm" animation="border" /> : <FiZap size={16} />}
                </Button>
              </InputGroup>
            </Form.Group>

            <div className="row g-2 mb-3">
              <Form.Group className="col-md-7">
                <Form.Label>Phiên âm</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="/.../"
                  value={newCard.phonetic}
                  onChange={(e) => setNewCard({ ...newCard, phonetic: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="col-md-5">
                <Form.Label>Loại từ</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="n, v, adj..."
                  value={newCard.partOfSpeech}
                  onChange={(e) => setNewCard({ ...newCard, partOfSpeech: e.target.value })}
                />
              </Form.Group>
            </div>

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
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button className={styles.studyBtn} type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu lại"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default VocabNotebookPage;
