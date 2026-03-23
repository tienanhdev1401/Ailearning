import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Button, Modal, Form, Spinner } from "react-bootstrap";
import { PlusLg, JournalBookmarkFill, ThreeDotsVertical, Trash, Pencil, BoxArrowInRight } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import notebookService from "../../services/notebookService";
import { ThemeContext } from "../../context/ThemeContext";
import styles from "../styles/NotebookListPage.module.css";

const NotebookListPage = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotebook, setNewNotebook] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const data = await notebookService.getMyNotebooks();
      setNotebooks(data);
    } catch (error) {
      console.error("Failed to fetch notebooks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNotebook.title.trim()) return;
    
    try {
      setSubmitting(true);
      await notebookService.createNotebook(newNotebook.title, newNotebook.description);
      setShowCreateModal(false);
      setNewNotebook({ title: "", description: "" });
      fetchNotebooks();
    } catch (error) {
      console.error("Failed to create notebook:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa sổ tay này?")) return;
    try {
      await notebookService.deleteNotebook(id);
      fetchNotebooks();
    } catch (error) {
      console.error("Failed to delete notebook:", error);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <section className={styles.hero}>
        <Container>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Sổ tay của tôi</h1>
            <p className={styles.heroSubtitle}>
              Tạo và quản lý các bộ từ vựng cá nhân để ôn tập hiệu quả hơn mỗi ngày.
            </p>
            <Button 
              className={styles.createBtn} 
              onClick={() => setShowCreateModal(true)}
            >
              <PlusLg className="me-2" /> Tạo sổ tay mới
            </Button>
          </div>
        </Container>
      </section>

      <Container className="py-5">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : notebooks.length === 0 ? (
          <div className={styles.emptyState}>
            <JournalBookmarkFill size={64} className="mb-4 opacity-50" />
            <h3>Chưa có sổ tay nào</h3>
            <p>Bắt đầu bằng cách tạo sổ tay đầu tiên của bạn để lưu trữ từ vựng.</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Tạo ngay
            </Button>
          </div>
        ) : (
          <Row className="g-4">
            {notebooks.map((notebook) => (
              <Col key={notebook.id} xs={12} md={6} lg={4}>
                <Card 
                  className={styles.notebookCard}
                  onClick={() => navigate(`/notebooks/${notebook.id}`)}
                >
                  <Card.Body>
                    <div className={styles.cardHeader}>
                      <div className={styles.iconBox}>
                        <JournalBookmarkFill />
                      </div>
                      <div className={styles.cardActions}>
                        <Button 
                          variant="link" 
                          className={styles.deleteAction}
                          onClick={(e) => handleDelete(e, notebook.id)}
                        >
                          <Trash size={18} />
                        </Button>
                      </div>
                    </div>
                    <Card.Title className={styles.cardTitle}>{notebook.title}</Card.Title>
                    <Card.Text className={styles.cardDesc}>
                      {notebook.description || "Không có mô tả"}
                    </Card.Text>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardStats}>
                        {notebook.notes?.length || 0} thuật ngữ
                      </span>
                      <BoxArrowInRight className={styles.arrowIcon} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Create Modal */}
      <Modal 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)}
        centered
        contentClassName={isDarkMode ? styles.darkModal : ""}
      >
        <Form onSubmit={handleCreate}>
          <Modal.Header closeButton closeVariant={isDarkMode ? "white" : undefined}>
            <Modal.Title>Tạo sổ tay mới</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên sổ tay</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ví dụ: Tiếng Anh chuyên ngành"
                value={newNotebook.title}
                onChange={(e) => setNewNotebook({ ...newNotebook, title: e.target.value })}
                required
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả (tùy chọn)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Mô tả ngắn gọn về nội dung sổ tay..."
                value={newNotebook.description}
                onChange={(e) => setNewNotebook({ ...newNotebook, description: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting || !newNotebook.title.trim()}
            >
              {submitting ? "Đang tạo..." : "Xác nhận"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default NotebookListPage;
