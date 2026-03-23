import React, { useState, useEffect, useContext } from "react";
import { Modal, Button, ListGroup, Spinner, Form } from "react-bootstrap";
import { JournalPlus, CheckCircleFill, PlusLg } from "react-bootstrap-icons";
import notebookService from "../../../services/notebookService";
import { ThemeContext } from "../../../context/ThemeContext";
import { useToast } from "../../../context/ToastContext";

const SaveToNotebookModal = ({ show, onHide, term, definition }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const toast = useToast();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (show) {
      fetchNotebooks();
    }
  }, [show]);

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

  const handleSave = async (notebookId) => {
    try {
      setSavingId(notebookId);
      await notebookService.addCard(notebookId, term, definition);
      setSavedIds(prev => new Set([...prev, notebookId]));
      toast.success(`Đã lưu "${term}" vào sổ tay!`);
    } catch (error) {
      console.error("Failed to save to notebook:", error);
      const message = error.response?.data?.message || "Đã có lỗi xảy ra khi lưu vào sổ tay.";
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateAndSave = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setLoading(true);
      const newNb = await notebookService.createNotebook(newTitle);
      await handleSave(newNb.id);
      setShowCreate(false);
      setNewTitle("");
      toast.success(`Đã tạo sổ tay "${newTitle}" và lưu từ!`);
      fetchNotebooks();
    } catch (error) {
      console.error("Failed to create and save:", error);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      contentClassName={isDarkMode ? "bg-dark text-light border-secondary" : ""}
    >
      <Modal.Header closeButton closeVariant={isDarkMode ? "white" : undefined}>
        <Modal.Title className="fs-5">Lưu vào sổ tay</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="p-3 border-bottom border-secondary opacity-75">
          <small>Đang lưu: <b>{term}</b></small>
        </div>

        {loading && notebooks.length === 0 ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        ) : (
          <ListGroup variant="flush">
            {notebooks.map(nb => (
              <ListGroup.Item
                key={nb.id}
                action
                className={`d-flex justify-content-between align-items-center py-3 ${isDarkMode ? "bg-dark text-light border-secondary" : ""}`}
                onClick={() => !savedIds.has(nb.id) && handleSave(nb.id)}
                disabled={savingId === nb.id || savedIds.has(nb.id)}
              >
                <div className="d-flex align-items-center">
                  <JournalPlus className="me-3 text-primary" size={20} />
                  <span>{nb.title}</span>
                </div>
                {savedIds.has(nb.id) ? (
                  <CheckCircleFill className="text-success" />
                ) : savingId === nb.id ? (
                  <Spinner animation="border" size="sm" />
                ) : null}
              </ListGroup.Item>
            ))}

            {showCreate ? (
              <ListGroup.Item className={isDarkMode ? "bg-dark border-secondary" : ""}>
                <Form onSubmit={handleCreateAndSave} className="d-flex gap-2 py-2">
                  <Form.Control
                    size="sm"
                    placeholder="Tên sổ tay mới..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus
                    className={isDarkMode ? "bg-secondary text-light border-0" : ""}
                  />
                  <Button size="sm" type="submit" variant="primary">Lưu</Button>
                  <Button size="sm" variant="link" className="text-secondary p-0" onClick={() => setShowCreate(false)}>Hủy</Button>
                </Form>
              </ListGroup.Item>
            ) : (
              <ListGroup.Item
                action
                className={`text-primary py-3 ${isDarkMode ? "bg-dark border-secondary" : ""}`}
                onClick={() => setShowCreate(true)}
              >
                <PlusLg className="me-3" /> Tạo sổ tay mới và lưu
              </ListGroup.Item>
            )}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant={isDarkMode ? "outline-light" : "secondary"} onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SaveToNotebookModal;
