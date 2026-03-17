import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button, Spinner, Modal } from 'react-bootstrap';
import { Search, Trash, Book } from 'react-bootstrap-icons';
import vocabNoteService from '../../services/vocabNoteService';
import { ThemeContext } from '../../context/ThemeContext';

const VocabNotebookPage = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const fetchNotes = async (pageNum, append = false) => {
    try {
      setLoading(true);
      const res = await vocabNoteService.getMyNotes(pageNum, 20);
      if (append) {
        setNotes(prev => [...prev, ...res.data]);
      } else {
        setNotes(res.data);
      }
      setHasMore(res.data.length === 20); // Assuming limit is 20
    } catch (error) {
      console.error("Lỗi khi tải sổ tay:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(1, false);
  }, []);

  const confirmDelete = (note) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!noteToDelete) return;
    const id = noteToDelete.id;
    try {
      await vocabNoteService.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      setToastMessage({ type: 'success', text: 'Đã xóa từ vựng thành công!' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error("Lỗi khi xóa từ:", error);
      setToastMessage({ type: 'error', text: 'Đã có lỗi xảy ra khi xóa từ.' });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setShowDeleteModal(false);
      setNoteToDelete(null);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotes(nextPage, true);
  };

  const filteredNotes = notes.filter(note =>
    note.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="py-5" style={{ minHeight: '80vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className={`fw-bold ${isDarkMode ? 'text-light' : 'text-dark'}`}>
          <Book className="me-2" /> Sổ Tay Từ Vựng
        </h2>
      </div>

      {toastMessage && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: toastMessage.type === 'success' ? '#28a745' : '#dc3545', color: 'white',
          padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease-in-out'
        }}>
          {toastMessage.text}
        </div>
      )}

      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text className={isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-white'}>
              <Search />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm từ vựng hoặc ý nghĩa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
              style={{ boxShadow: 'none' }}
            />
          </InputGroup>
        </Col>
      </Row>

      {loading && page === 1 ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant={isDarkMode ? "light" : "primary"} />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className={`text-center py-5 ${isDarkMode ? 'text-secondary' : 'text-muted'}`}>
          {searchTerm ? 'Không tìm thấy từ vựng nào phù hợp.' : 'Sổ tay của bạn hiện đang trống.'}
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredNotes.map(note => (
            <Col key={note.id}>
              <Card className={`h-100 shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className={`fs-4 fw-bold mb-0 ${isDarkMode ? 'text-info' : 'text-primary'}`}>
                      {note.term}
                    </Card.Title>
                    <Button
                      variant="link"
                      className="text-danger p-0"
                      onClick={() => confirmDelete(note)}
                      title="Xóa khỏi sổ tay"
                    >
                      <Trash size={20} />
                    </Button>
                  </div>
                  <Card.Text className={`fs-5 ${isDarkMode ? 'text-light' : 'text-dark'}`}>
                    {note.definition}
                  </Card.Text>
                </Card.Body>
                {note.source && (
                  <Card.Footer className={`${isDarkMode ? 'bg-dark border-secondary text-secondary' : 'bg-light text-muted'} small`}>
                    Nguồn: {note.source}
                  </Card.Footer>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {hasMore && !searchTerm && notes.length > 0 && (
        <div className="text-center mt-4">
          <Button
            variant={isDarkMode ? "outline-light" : "outline-primary"}
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            Tải thêm
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        contentClassName={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
      >
        <Modal.Header closeButton closeVariant={isDarkMode ? 'white' : undefined} className={isDarkMode ? 'border-secondary' : ''}>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa từ vựng <strong className="text-danger">{noteToDelete?.term}</strong> khỏi sổ tay?
        </Modal.Body>
        <Modal.Footer className={isDarkMode ? 'border-secondary' : ''}>
          <Button variant={isDarkMode ? "outline-light" : "secondary"} onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={executeDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default VocabNotebookPage;
